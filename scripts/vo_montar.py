# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "soundfile"]
# ///
"""Prepara a narração escolhida para um filme: trata o áudio, acelera de leve e marca cada palavra no tempo.

uso: uv run scripts/vo_montar.py <pasta-do-filme> <voz/id/tomada.wav> [--tempo 1.07] [--lead 0.12] [--pausa-max 0.55]
                                 [--modelo-whisper NOME]

  --tempo      acelera a fala sem mudar o tom (atempo do ffmpeg). 1.0 = como foi gravada.
  --lead       silêncio antes da primeira palavra (s)
  --pausa-max  pausas internas maiores que isso são encurtadas (ritmo de anúncio pede fala corrida)

Lê   voz/<id>/texto.txt (a grafia certa das palavras) ao lado da tomada.
Grava <filme>/audio/vo.wav (48 kHz, estéreo, 24 bits) e <filme>/vo.json:
  {"words": [{"w": "Sua", "t0": .., "t1": ..}], "frases": [{"texto": .., "t0": .., "t1": .., "words": [i0, i1]}], "dur": ..}
As palavras vêm do roteiro; o tempo vem do Whisper (mlx_whisper ou openai-whisper), alinhado por sequência.
No film.js, S.loadVO() + S.wt(VO, 'palavra') prendem cada cena a uma palavra da narração.
"""
import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata

import numpy as np
import soundfile as sf

SR = 48000
HOMO = {"1": "um", "2": "dois", "3": "tres", "10": "dez", "20": "vinte", "30": "trinta", "para": "pra", "app": "aplicativo"}


def arg(nome, padrao, tipo=float):
    return tipo(sys.argv[sys.argv.index(nome) + 1]) if nome in sys.argv else padrao


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]", "", s)


def whisper(wav, pasta, modelo=None):
    if shutil.which("mlx_whisper"):
        cmd = ["mlx_whisper", wav, "--model", modelo or "mlx-community/whisper-large-v3-turbo", "--language", "pt",
               "--word-timestamps", "True", "--output-format", "json", "--output-dir", pasta]
    elif shutil.which("whisper"):
        cmd = ["whisper", wav, "--model", modelo or "turbo", "--language", "pt", "--word_timestamps", "True",
               "--output_format", "json", "--output_dir", pasta]
    else:
        sys.exit("faltou o Whisper. Instale um deles:\n  uv tool install mlx-whisper     (Mac com Apple Silicon)\n"
                 "  uv tool install openai-whisper  (qualquer sistema)")
    subprocess.run(cmd, check=True, capture_output=True)
    d = json.load(open(os.path.join(pasta, os.path.splitext(os.path.basename(wav))[0] + ".json"), encoding="utf-8"))
    return [w for seg in d["segments"] for w in seg.get("words", [])]


def main():
    if len(sys.argv) < 3 or sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0 if len(sys.argv) > 1 else 1)
    filme, tomada = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
    tempo, lead, pmax = arg("--tempo", 1.07), arg("--lead", 0.12), arg("--pausa-max", 0.55)
    modelo = arg("--modelo-whisper", None, str)
    arq_texto = os.path.join(os.path.dirname(tomada), "texto.txt")
    if not os.path.exists(arq_texto):
        sys.exit(f"faltou {arq_texto}")
    texto = open(arq_texto, encoding="utf-8").read().strip()
    aud = os.path.join(filme, "audio")
    os.makedirs(aud, exist_ok=True)
    tmp = os.path.join(aud, "vo_tratada.wav")
    # tratamento de voz: corta grave, tira lama, presença, ar, compressão suave e o leve aceleramento
    chain = ("highpass=f=80,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=0.9:g=3,"
             "equalizer=f=9500:t=q:w=0.7:g=1.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=3,"
             f"atempo={tempo}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tomada, "-af", chain, "-ar", str(SR), "-ac", "1", tmp], check=True)
    ws = whisper(tmp, aud, modelo)
    y, _ = sf.read(tmp)

    # encurta pausas longas entre palavras (corta no meio do silêncio, com cross-fade curto)
    cortes = []
    for a, b in zip(ws, ws[1:]):
        gap = b["start"] - a["end"]
        if gap > pmax:
            meio = (a["end"] + b["start"]) / 2
            tira = gap - pmax
            cortes.append((meio - tira / 2, meio + tira / 2))
    out, pos, removido = [], 0, []
    for c0, c1 in cortes:
        i0, i1 = int(c0 * SR), int(c1 * SR)
        out.append(y[pos:i0])
        pos = i1
        removido.append((c0, c1 - c0))
    out.append(y[pos:])
    fade = int(0.01 * SR)
    for k in range(1, len(out)):
        if len(out[k - 1]) > fade and len(out[k]) > fade:
            out[k - 1][-fade:] *= np.linspace(1, 0, fade)
            out[k][:fade] *= np.linspace(0, 1, fade)
    y2 = np.concatenate(out)

    def remap(t):
        s = 0.0
        for c0, d in removido:
            if t > c0 + d:
                s += d
            elif t > c0:
                s += t - c0
        return t - s + lead

    y2 = np.concatenate([np.zeros(int(lead * SR)), y2, np.zeros(int(0.3 * SR))])
    sf.write(os.path.join(aud, "vo.wav"), np.stack([y2, y2]).T, SR, subtype="PCM_24")
    for extra in ("vo_tratada.wav", "vo_tratada.json"):
        p = os.path.join(aud, extra)
        if os.path.exists(p):
            os.remove(p)

    # alinha as palavras do roteiro com as do Whisper
    roteiro = re.findall(r"[\wÀ-ÿ']+[.,?!:…]*", texto)
    rn = [HOMO.get(norm(w), norm(w)) for w in roteiro]
    wn = [HOMO.get(norm(w["word"]), norm(w["word"])) for w in ws]
    sm = difflib.SequenceMatcher(a=rn, b=wn, autojunk=False)
    tempos = [None] * len(roteiro)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                tempos[i1 + k] = (ws[j1 + k]["start"], ws[j1 + k]["end"])
        elif tag == "replace":
            a0, a1 = ws[j1]["start"], ws[j2 - 1]["end"]
            for k in range(i2 - i1):
                tempos[i1 + k] = (a0 + (a1 - a0) * k / (i2 - i1), a0 + (a1 - a0) * (k + 1) / (i2 - i1))
    faltou = [roteiro[i] for i, t in enumerate(tempos) if t is None]
    # preenche buracos por interpolação
    for i in range(len(tempos)):
        if tempos[i] is None:
            prev = next((tempos[j][1] for j in range(i - 1, -1, -1) if tempos[j]), 0)
            nxt = next((tempos[j][0] for j in range(i + 1, len(tempos)) if tempos[j]), prev + 0.3)
            tempos[i] = (prev, nxt)
    words = [{"w": w, "t0": round(remap(a), 3), "t1": round(remap(b), 3)} for w, (a, b) in zip(roteiro, tempos)]
    frases, ini = [], 0
    for i, w in enumerate(roteiro):
        if (re.search(r"[.?!]$", w) and not w.endswith("...")) or i == len(roteiro) - 1:
            frases.append({"texto": " ".join(roteiro[ini:i + 1]), "t0": words[ini]["t0"], "t1": words[i]["t1"], "words": [ini, i]})
            ini = i + 1
    dur = len(y2) / SR
    json.dump({"words": words, "frases": frases, "dur": round(dur, 3), "tomada": os.path.basename(tomada),
               "tempo": tempo, "faltou": faltou},
              open(os.path.join(filme, "vo.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"vo: {dur:.2f}s, {len(words)} palavras, {len(frases)} frases, {len(removido)} pausas encurtadas")
    if faltou:
        print(f"aviso: palavras sem tempo do Whisper (interpoladas): {faltou}")
    for fr in frases:
        print(f"  {fr['t0']:6.2f}-{fr['t1']:6.2f}  {fr['texto']}")


if __name__ == "__main__":
    main()
