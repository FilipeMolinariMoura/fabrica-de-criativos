# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "soundfile", "praat-parselmouth"]
# ///
"""Avalia as tomadas de narração de um criativo e ordena da melhor para a pior.

uso: uv run scripts/voz_avaliar.py voz/<id> [--modelo-whisper NOME]

Lê voz/<id>/texto.txt (o texto aprovado) e toda tomada voz/<id>/*.wav (ou *.mp3 sem .wav ao lado), venha
ela da ElevenLabs (voz_eleven.mjs) ou do Kokoro (voz_kokoro.py). Precisa da transcrição do Whisper com tempo
por palavra ao lado de cada tomada (<tomada>.json); se não existir, roda o Whisper sozinho:
mlx_whisper (Mac com Apple Silicon) ou whisper (openai-whisper, qualquer sistema).

Critérios (nessa ordem de peso):
  1. fidelidade: todas as palavras do texto, na ordem (conferência às cegas pelo Whisper);
  2. frases: afirmação termina descendo, pergunta (sim/não) termina subindo;
  3. expressividade: variação de tom (desvio do F0 em semitons) sem gritar;
  4. ritmo: 2,3 a 3,3 palavras por segundo; nenhuma pausa interna maior que 0,9 s;
  5. fim limpo: o último som decai até o silêncio.
Grava voz/<id>/avaliacao.json e imprime o ranking.
"""
import argparse
import difflib
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata

import numpy as np
import parselmouth
import soundfile as sf

# números e grafias que o Whisper escreve do jeito dele: a fala é a mesma
HOMO = {"1": "um", "2": "dois", "3": "tres", "4": "quatro", "5": "cinco", "6": "seis", "7": "sete", "8": "oito",
        "9": "nove", "10": "dez", "15": "quinze", "20": "vinte", "30": "trinta", "100": "cem", "app": "aplicativo",
        "pra": "para", "ta": "esta"}
WH = ("quant", "onde", "cade", "quem", "como", "quando", "qual", "o que", "por que", "que ")


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("whats app", "whatsapp").replace("e-mail", "email")
    toks = re.findall(r"[a-z0-9]+", s)
    return [HOMO.get(t, t) for t in toks]


def frases(texto):
    return [f.strip() for f in re.split(r"(?<=[.?!])\s+", texto.strip()) if f.strip()]


def whisper(audio, modelo=None):
    """Transcreve com tempo por palavra e grava <audio sem extensão>.json ao lado."""
    pasta = os.path.dirname(os.path.abspath(audio))
    if shutil.which("mlx_whisper"):
        cmd = ["mlx_whisper", audio, "--model", modelo or "mlx-community/whisper-large-v3-turbo", "--language", "pt",
               "--word-timestamps", "True", "--output-format", "json", "--output-dir", pasta]
    elif shutil.which("whisper"):
        cmd = ["whisper", audio, "--model", modelo or "turbo", "--language", "pt", "--word_timestamps", "True",
               "--output_format", "json", "--output_dir", pasta]
    else:
        sys.exit("faltou o Whisper. Instale um deles:\n  uv tool install mlx-whisper     (Mac com Apple Silicon)\n"
                 "  uv tool install openai-whisper  (qualquer sistema)")
    subprocess.run(cmd, check=True, capture_output=True)


def avaliar(audio, texto):
    pal = json.load(open(os.path.splitext(audio)[0] + ".json"))
    words = [w for seg in pal["segments"] for w in seg.get("words", [])]
    ouvido = norm(" ".join(w["word"] for w in words))
    esperado = norm(texto)
    sm = difflib.SequenceMatcher(a=esperado, b=ouvido, autojunk=False)
    fiel = sm.ratio()
    faltou = [esperado[i1:i2] for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag in ("delete", "replace")]
    sobrou = [ouvido[j1:j2] for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag in ("insert", "replace")]

    a, sr = sf.read(audio) if audio.endswith(".wav") else _ler_mp3(audio)
    if a.ndim > 1:
        a = a.mean(axis=1)
    dur = len(a) / sr
    snd = parselmouth.Sound(a, sr)
    pitch = snd.to_pitch_ac(time_step=0.01, pitch_floor=65, pitch_ceiling=350)
    f0 = pitch.selected_array["frequency"]
    tt = pitch.xs()
    voz = f0 > 0
    st = 12 * np.log2(f0[voz] / np.median(f0[voz])) if voz.any() else np.zeros(1)
    expr = float(np.std(st))

    # fim de cada frase: inclinação do F0 nos últimos ~450 ms com voz antes do fim da última palavra da frase
    alvo_fim, k = [], 0
    for f in frases(texto):
        k += len(norm(f))
        alvo_fim.append((f, min(k, len(words)) - 1))
    notas_fim = []
    for f, idx in alvo_fim:
        if idx < 0 or idx >= len(words):
            continue
        fim = words[idx]["end"]
        m = (tt > fim - 0.45) & (tt <= fim + 0.05) & voz
        if m.sum() < 5:
            notas_fim.append((f, None, True))
            continue
        y = 12 * np.log2(f0[m] / np.median(f0[voz]))
        inc = float(np.polyfit(tt[m], y, 1)[0])  # semitons por segundo
        sn = " ".join(norm(f))
        pergunta = f.endswith("?") and not sn.startswith(WH)
        ok = inc > 2 if pergunta else inc < 3
        notas_fim.append((f, round(inc, 1), ok))

    gaps = [words[i + 1]["start"] - words[i]["end"] for i in range(len(words) - 1)]
    maior_gap = max(gaps) if gaps else 0
    falado = (words[-1]["end"] - words[0]["start"]) if words else dur
    ritmo = len(ouvido) / falado if falado else 0
    cauda = a[int(max(0, (words[-1]["end"] + 0.15)) * sr):] if words else a[-sr // 5:]
    fim_limpo = float(np.sqrt(np.mean(cauda ** 2))) < 0.01 if len(cauda) else True

    frases_ok = sum(1 for _, _, ok in notas_fim if ok) / max(1, len(notas_fim))
    nota = (fiel ** 4) * 60 + frases_ok * 20 + min(expr / 3.5, 1) * 10 + (8 if 2.3 <= ritmo <= 3.3 else 3) + (2 if fim_limpo else 0)
    if maior_gap > 0.9:
        nota -= 8
    return {
        "tomada": os.path.basename(audio), "nota": round(nota, 1), "fiel": round(fiel, 3),
        "faltou": [" ".join(x) for x in faltou if x], "sobrou": [" ".join(x) for x in sobrou if x],
        "expr_st": round(expr, 2), "ritmo_wps": round(ritmo, 2), "maior_pausa": round(maior_gap, 2),
        "fim_limpo": fim_limpo, "dur": round(dur, 2),
        "frases": [{"frase": f, "inclinacao_st_s": inc, "ok": ok} for f, inc, ok in notas_fim],
    }


def _ler_mp3(caminho):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", caminho, "-f", "f32le", "-ac", "1", "-ar", "48000", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype="<f4").astype(np.float64), 48000


def tomadas(pasta):
    nomes = sorted(os.listdir(pasta))
    wavs = {os.path.splitext(n)[0] for n in nomes if n.endswith(".wav")}
    out = []
    for n in nomes:
        base, ext = os.path.splitext(n)
        if ext == ".wav" or (ext == ".mp3" and base not in wavs):
            out.append(os.path.join(pasta, n))
    return out


def main():
    ap = argparse.ArgumentParser(description="Avalia e ordena as tomadas de narração de um criativo.")
    ap.add_argument("pasta", help="voz/<id> (com texto.txt e as tomadas)")
    ap.add_argument("--modelo-whisper", default=None, help="modelo do Whisper (padrão: large-v3-turbo)")
    a = ap.parse_args()
    arq_texto = os.path.join(a.pasta, "texto.txt")
    if not os.path.exists(arq_texto):
        sys.exit(f"faltou {arq_texto} (voz_eleven.mjs e voz_kokoro.py gravam esse arquivo)")
    texto = open(arq_texto, encoding="utf-8").read().strip()
    res = []
    for t in tomadas(a.pasta):
        if not os.path.exists(os.path.splitext(t)[0] + ".json"):
            print(f"transcrevendo {os.path.basename(t)} ...", flush=True)
            whisper(t, a.modelo_whisper)
        res.append(avaliar(t, texto))
    if not res:
        sys.exit(f"nenhuma tomada (.wav ou .mp3) em {a.pasta}")
    res.sort(key=lambda r: -r["nota"])
    json.dump(res, open(os.path.join(a.pasta, "avaliacao.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for r in res:
        ruins = [f["frase"][:40] for f in r["frases"] if not f["ok"]]
        print(f'{r["tomada"]}: nota {r["nota"]} fiel {r["fiel"]} expr {r["expr_st"]}st ritmo {r["ritmo_wps"]} '
              f'pausa {r["maior_pausa"]}s dur {r["dur"]}s | faltou {r["faltou"]} sobrou {r["sobrou"]} | frases ruins {ruins}')
    print(f"melhor: {os.path.join(a.pasta, res[0]['tomada'])}")


if __name__ == "__main__":
    main()
