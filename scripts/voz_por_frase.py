# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "soundfile", "praat-parselmouth"]
# ///
"""Narração frase a frase com controle máximo de entonação (Fish Audio).

Gera N candidatos de cada frase do roteiro, confere cada um às cegas (Whisper) e mede o tom no fim da frase
(Praat), escolhe o melhor de cada frase e monta a narração inteira com pausas planejadas e volume igualado.
Serve para quando a voz "se perde" no bloco: cada frase é julgada sozinha.

  uv run scripts/voz_por_frase.py <id> <voice_id> <rotulo> [--n 3] [--temperatura 0.55] [--top-p 0.7]
        [--roteiros roteiros/roteiros.json] [--campo falas] [--modelo s2.1-pro-free]
        [--pausa 0.30] [--pausa-fala 0.42] [--pausa-curta 0.20] [--mais 8:5,11:6]

Saída: voz/<id>/frases/<rotulo>/<k>-<n>.mp3 (candidatos), voz/<id>/<rotulo>-frases.wav (montada),
voz/<id>/<rotulo>-frases.relatorio.json (escolha e medidas de cada frase), voz/<id>/texto.txt.
Regras de tom: afirmação termina descendo; pergunta de sim/não termina subindo; pergunta com "quem/onde/..."
termina descendo. Frases curtas em sequência ("Outra cor. Outro estilo.") usam a pausa curta.
--mais k:n gera mais candidatos só nas frases k (as outras reaproveitam os já gerados).
A chave vem de FISH_API_KEY no ambiente ou no .env.
"""
import argparse
import importlib.util
import json
import os
import re
import subprocess
import sys
import urllib.request

import numpy as np
import soundfile as sf

AQUI = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("voz_avaliar", os.path.join(AQUI, "voz_avaliar.py"))
VA = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(VA)
SR = 48000


def chave():
    if os.environ.get("FISH_API_KEY"):
        return os.environ["FISH_API_KEY"].strip()
    if os.path.exists(".env"):
        m = re.search(r"^FISH_API_KEY=(.+)$", open(".env").read(), re.M)
        if m and m.group(1).strip():
            return m.group(1).strip().strip("\"'")
    sys.exit("Falta FISH_API_KEY no .env (veja .env.example).")


def fish(texto, voz, modelo, temp, top_p, saida, key):
    corpo = json.dumps({"text": texto, "reference_id": voz, "format": "mp3", "mp3_bitrate": 192, "normalize": True,
                        "latency": "normal", "temperature": temp, "top_p": top_p}).encode()
    req = urllib.request.Request("https://api.fish.audio/v1/tts", data=corpo, method="POST", headers={
        "Authorization": f"Bearer {key}", "Content-Type": "application/json", "model": modelo})
    with urllib.request.urlopen(req, timeout=180) as r:
        open(saida, "wb").write(r.read())
    wav = saida[:-4] + ".wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", saida, "-ar", str(SR), "-ac", "1", wav], check=True)
    return wav


def aparar(a, limiar_db=-42, folga=0.03):
    """Tira o silêncio do começo e do fim, mantendo uma folga curta."""
    win = int(0.01 * SR)
    env = np.array([np.sqrt(np.mean(a[i:i + win] ** 2) + 1e-12) for i in range(0, max(1, len(a) - win), win)])
    db = 20 * np.log10(env + 1e-12)
    voz = np.where(db > limiar_db)[0]
    if not len(voz):
        return a
    i0 = max(0, voz[0] * win - int(folga * SR))
    i1 = min(len(a), (voz[-1] + 1) * win + int(folga * 2 * SR))
    return a[i0:i1]


def nivelar(a, alvo_db=-20):
    rms = np.sqrt(np.mean(a ** 2) + 1e-12)
    return a * (10 ** (alvo_db / 20) / rms)


def julgar(wav, frase):
    VA.whisper(wav)
    r = VA.avaliar(wav, frase)
    inc = r["frases"][-1]["inclinacao_st_s"] if r["frases"] else None
    ok = r["frases"][-1]["ok"] if r["frases"] else False
    pergunta = frase.strip().endswith("?") and not " ".join(VA.norm(frase)).startswith(VA.WH)
    # nota da frase: fidelidade manda; depois o fim de frase (quanto mais claro o contorno, melhor); depois expressão
    nota = (r["fiel"] ** 4) * 70 + (15 if ok else 0)
    if inc is not None:
        nota += min(8, max(0, (inc if pergunta else -inc) * 0.8))   # bônus pelo contorno nítido (desce ou sobe)
    nota += min(r["expr_st"] / 3.5, 1) * 5 + (2 if r["fim_limpo"] else 0)
    return {"wav": wav, "nota": round(nota, 1), "fiel": r["fiel"], "fim_st_s": inc, "fim_ok": ok,
            "expr_st": r["expr_st"], "faltou": r["faltou"], "sobrou": r["sobrou"]}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("id"); ap.add_argument("voz"); ap.add_argument("rotulo")
    ap.add_argument("--n", type=int, default=3)
    ap.add_argument("--temperatura", type=float, default=0.55)
    ap.add_argument("--top-p", type=float, default=0.7)
    ap.add_argument("--roteiros", default="roteiros/roteiros.json")
    ap.add_argument("--campo", default="falas")
    ap.add_argument("--modelo", default="s2.1-pro-free")
    ap.add_argument("--pausa", type=float, default=0.30, help="entre frases da mesma fala")
    ap.add_argument("--pausa-fala", type=float, default=0.42, help="entre falas")
    ap.add_argument("--pausa-curta", type=float, default=0.20, help="entre frases curtas em sequência (<= 3 palavras)")
    ap.add_argument("--mais", default="", help="ex.: 8:5,11:6")
    a = ap.parse_args()
    mais = {int(x.split(":")[0]): int(x.split(":")[1]) for x in a.mais.split(",") if x}

    rot = json.load(open(a.roteiros))
    c = next((x for x in rot["criativos"] if x["id"] == a.id), None) or sys.exit(f"criativo {a.id} não está no roteiro")
    falas = [rot["cta_fala"] if f == "CTA" else f for f in (c.get(a.campo) or c["falas"])]
    key = chave()
    pasta = os.path.join("voz", a.id)
    cand_dir = os.path.join(pasta, "frases", a.rotulo)
    os.makedirs(cand_dir, exist_ok=True)
    open(os.path.join(pasta, "texto.txt"), "w").write(" ".join(falas) + "\n")

    itens, k = [], 0
    for fi, fala in enumerate(falas):
        for si, frase in enumerate(VA.frases(fala)):
            k += 1
            cands = []
            for n in range(1, mais.get(k, a.n) + 1):
                mp3 = os.path.join(cand_dir, f"{k:02d}-{n}.mp3")
                wav = mp3[:-4] + ".wav"
                if not os.path.exists(wav):
                    fish(frase, a.voz, a.modelo, a.temperatura, a.top_p, mp3, key)
                cands.append(julgar(wav, frase))
            cands.sort(key=lambda x: -x["nota"])
            melhor = cands[0]
            curta = len(VA.norm(frase)) <= 3
            itens.append({"k": k, "fala": fi, "frase": frase, "curta": curta, "escolha": melhor, "candidatos": cands})
            alerta = "" if melhor["fiel"] >= 0.99 and melhor["fim_ok"] else "  <- confira"
            print(f"{k:02d} {frase[:52]:52s} nota {melhor['nota']:5.1f} fiel {melhor['fiel']:.2f} "
                  f"fim {melhor['fim_st_s']} st/s{alerta}", flush=True)

    partes = []
    for i, it in enumerate(itens):
        x, sr = sf.read(it["escolha"]["wav"])
        x = x.mean(axis=1) if x.ndim > 1 else x
        partes.append(nivelar(aparar(x)))
        if i + 1 < len(itens):
            prox = itens[i + 1]
            p = a.pausa_curta if (it["curta"] and prox["curta"]) else (a.pausa if prox["fala"] == it["fala"] else a.pausa_fala)
            partes.append(np.zeros(int(p * SR)))
    final = np.concatenate([np.zeros(int(0.12 * SR))] + partes + [np.zeros(int(0.3 * SR))])
    final = final / max(1e-9, np.max(np.abs(final))) * 0.89
    saida = os.path.join(pasta, f"{a.rotulo}-frases.wav")
    sf.write(saida, final, SR)
    json.dump(itens, open(saida[:-4] + ".relatorio.json", "w"), ensure_ascii=False, indent=1)
    print(f"ok {saida} ({len(final) / SR:.2f} s). Confira com: uv run scripts/voz_avaliar.py {pasta}")


if __name__ == "__main__":
    main()
