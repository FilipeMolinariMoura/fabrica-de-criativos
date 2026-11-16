# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "soundfile"]
# ///
"""Trilha musical gerada por IA (ElevenLabs Music) e alinhada à fala do filme.

A trilha sintetizada (scripts/trilha.py) é grátis e casa sozinha com a fala; esta é a alternativa paga, com
música produzida de verdade. A API não respeita os tempos pedidos com precisão, então o trabalho tem duas
partes: gerar algumas tomadas e ALINHAR a escolhida, medindo no áudio onde a música "cai".

  uv run scripts/trilha_eleven.py gerar   <pasta-do-filme> [--tomadas 2] [--semente 7] [--dry-run]
  uv run scripts/trilha_eleven.py alinhar <pasta-do-filme> <tomada.raw.wav> [--lufs -19] [--max-esticar 0.08]
        [--virada-de 1.2] [--virada-ate 5.0] [--final-de -11.2] [--final-ate -2.7]

gerar    lê <filme>/musica.json (plano de composição: estilos globais e seções com duração) e grava
         <filme>/audio/musica-<n>.mp3 e .raw.wav. Não é determinístico: guarde a tomada escolhida.
alinhar  lê <filme>/trilha.json (dur, reveal, cta), acha na tomada a virada (maior salto de energia no começo)
         e o impacto final (maior salto perto do fim), e leva a virada para `reveal` e o impacto para `cta`,
         esticando o tempo de cada trecho sem mudar o tom. Se algum trecho precisar esticar mais que
         --max-esticar, usa um esticamento único (virada no lugar, fim da música no fim do filme) e avisa
         onde o impacto final caiu. Normaliza o volume e grava <filme>/audio/music.wav, pronto para a mixagem
         (scripts/finalizar3d.sh <filme> audio  ou  mix.mjs).

Plano (<filme>/musica.json): {"positive_global_styles": [...], "negative_global_styles": [...],
  "sections": [{"section_name": "Intro", "positive_local_styles": [...], "negative_local_styles": [...],
                "duration_ms": 3000, "lines": []}, ...]}   (cada seção tem no mínimo 3000 ms)
A chave vem de ELEVENLABS_API_KEY (ambiente ou .env). Exige plano pago; confira os termos de uso comercial.
Quem aprova a música é o ouvido: a medição só garante que a virada e o final caem na fala.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request

import numpy as np
import soundfile as sf

SR = 48000


def chave():
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"].strip()
    if os.path.exists(".env"):
        m = re.search(r"^ELEVENLABS_API_KEY=(\S+)\s*$", open(".env").read(), re.M)
        if m:
            return m.group(1).strip("\"'")
    sys.exit("Falta ELEVENLABS_API_KEY no ambiente ou no .env (veja .env.example).")


def gerar(a):
    plano_arq = os.path.join(a.filme, "musica.json")
    if not os.path.exists(plano_arq):
        sys.exit(f"faltou {plano_arq} (o plano de composição; veja o cabeçalho deste script)")
    plano = json.load(open(plano_arq))
    plano = {k: plano[k] for k in ("positive_global_styles", "negative_global_styles", "sections")}
    os.makedirs(os.path.join(a.filme, "audio"), exist_ok=True)
    for n in range(1, a.tomadas + 1):
        corpo = {"composition_plan": plano, "model_id": "music_v1", "seed": a.semente + n - 1}
        if a.dry_run:
            print(json.dumps(corpo, ensure_ascii=False)[:600], "...")
            continue
        req = urllib.request.Request("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",
                                     data=json.dumps(corpo).encode(), method="POST",
                                     headers={"xi-api-key": chave(), "Content-Type": "application/json"})
        try:
            dados = urllib.request.urlopen(req, timeout=600).read()
        except urllib.error.HTTPError as e:
            sys.exit(f"ElevenLabs Music {e.code}: {e.read().decode()[:300]}")
        mp3 = os.path.join(a.filme, "audio", f"musica-{n}.mp3")
        open(mp3, "wb").write(dados)
        raw = mp3[:-4] + ".raw.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-ar", str(SR), "-ac", "2", raw], check=True)
        print("ok", raw)
    print("próximo passo: ouça as tomadas e rode  alinhar <filme> <tomada.raw.wav>")


def envelope(x, sr):
    m = x.mean(axis=1)
    w = int(0.05 * sr)
    h = w // 5
    e = np.array([np.sqrt(np.mean(m[i:i + w] ** 2) + 1e-12) for i in range(0, len(m) - w, h)])
    return np.arange(len(e)) * h / sr, 20 * np.log10(e + 1e-9)


def maior_salto(t, db, de, ate):
    """Instante em que a energia mais sobe em relação aos 150 ms anteriores, dentro da janela."""
    salto = np.array([db[i] - db[i - 15:i].mean() if i >= 15 else -99.0 for i in range(len(db))])
    i = int(np.argmax(np.where((t > de) & (t < ate), salto, -99.0)))
    return float(t[i]), float(salto[i])


def trecho(src, de, ate, alvo, saida):
    fator = (ate - de) / alvo
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{de:.4f}", "-to", f"{ate:.4f}", "-i", src,
                    "-af", f"atempo={fator:.5f}", "-ar", str(SR), "-ac", "2", saida], check=True)
    return fator


def alinhar(a):
    tr = json.load(open(os.path.join(a.filme, "trilha.json")))
    dur, reveal, cta = float(tr["dur"]), float(tr["reveal"]), float(tr["cta"])
    x, sr = sf.read(a.tomada, always_2d=True)
    fim = len(x) / sr
    t, db = envelope(x, sr)
    tv, jv = maior_salto(t, db, a.virada_de, a.virada_ate)
    tf, jf = maior_salto(t, db, fim + a.final_de, fim + a.final_ate)
    f1, f2 = (tf - tv) / (cta - reveal), (fim - tf) / (dur - cta)
    pasta = os.path.join(a.filme, "audio")
    p1, p2 = os.path.join(pasta, "_t1.wav"), os.path.join(pasta, "_t2.wav")
    if max(abs(f1 - 1), abs(f2 - 1)) <= a.max_esticar:
        trecho(a.tomada, tv, tf, cta - reveal, p1)
        trecho(a.tomada, tf, fim, dur - cta, p2)
        partes = [sf.read(p1, always_2d=True)[0], sf.read(p2, always_2d=True)[0]]
        modo = f"dois trechos (esticou {f1:.3f} e {f2:.3f}); impacto final em {cta:.2f} s"
    else:
        fu = trecho(a.tomada, tv, fim, dur - reveal, p1)
        partes = [sf.read(p1, always_2d=True)[0]]
        modo = (f"esticamento único {fu:.3f} (os trechos pediam {f1:.3f} e {f2:.3f}); "
                f"impacto final caiu em {reveal + (tf - tv) / fu:.2f} s, e o cta é {cta:.2f} s")
    ini = x[max(0, int((tv - reveal) * sr)):int(tv * sr)]
    if len(ini) < int(reveal * sr):
        ini = np.concatenate([np.zeros((int(reveal * sr) - len(ini), 2)), ini])
    y = np.concatenate([ini] + partes)
    n = int(dur * sr)
    y = y[:n] if len(y) >= n else np.concatenate([y, np.zeros((n - len(y), 2))])
    fo, fi = int(0.25 * sr), int(0.03 * sr)
    y[-fo:] *= np.linspace(1, 0, fo)[:, None]
    y[:fi] *= np.linspace(0, 1, fi)[:, None]
    tmp = os.path.join(pasta, "_alinhada.wav")
    sf.write(tmp, y, sr)
    saida = os.path.join(pasta, "music.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"loudnorm=I={a.lufs}:TP=-2:LRA=14:linear=true",
                    "-ar", str(SR), "-ac", "2", saida], check=True)
    for p in (p1, p2, tmp):
        if os.path.exists(p):
            os.remove(p)
    print(f"virada medida em {tv:.2f} s (+{jv:.0f} dB) -> {reveal:.2f} s | impacto final medido em {tf:.2f} s (+{jf:.0f} dB)")
    print(modo)
    if jv < 6:
        print("atenção: a virada desta tomada é fraca (salto menor que 6 dB); o impacto vai depender dos efeitos.")
    print(f"ok {saida} ({dur:.2f} s, {a.lufs} LUFS). Agora refaça a mixagem e ouça.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("gerar")
    g.add_argument("filme")
    g.add_argument("--tomadas", type=int, default=2)
    g.add_argument("--semente", type=int, default=7)
    g.add_argument("--dry-run", action="store_true")
    g.set_defaults(f=gerar)
    al = sub.add_parser("alinhar")
    al.add_argument("filme")
    al.add_argument("tomada")
    al.add_argument("--lufs", type=float, default=-19)
    al.add_argument("--max-esticar", type=float, default=0.08)
    al.add_argument("--virada-de", type=float, default=1.2)
    al.add_argument("--virada-ate", type=float, default=5.0)
    al.add_argument("--final-de", type=float, default=-11.2, help="início da janela do impacto final, em s a partir do fim")
    al.add_argument("--final-ate", type=float, default=-2.7, help="fim da janela do impacto final, em s a partir do fim")
    al.set_defaults(f=alinhar)
    a = ap.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
