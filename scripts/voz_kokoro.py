# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["kokoro>=0.9.4", "soundfile", "numpy"]
# ///
"""Narração GRÁTIS e local com o Kokoro (modelo aberto de 82M parâmetros, licença Apache-2.0).

uso: uv run scripts/voz_kokoro.py <id1,id2|all> <voz> [tomadas] [--roteiros roteiros/roteiros.json]
                                  [--velocidade 1.0] [--rotulo NOME] [--pausa 0.22]

  <voz>          pf_dora (feminina) | pm_alex (masculina) | pm_santa (masculina, grave)  — português do Brasil
  [tomadas]      quantas versões por criativo (padrão 1). O Kokoro é determinístico: cada tomada a mais
                 muda um pouco a velocidade (x1,00, x0,96, x1,04, x0,92, x1,08...) para você escolher o ritmo.
  --roteiros     caminho do roteiro (padrão roteiros/roteiros.json; formato em templates/roteiro.json)
  --velocidade   velocidade base da fala (padrão 1.0)
  --rotulo       nome do arquivo (padrão: o nome da voz)
  --pausa        silêncio entre as falas do roteiro, em segundos (padrão 0.22)

Saída (o mesmo formato da voz paga, scripts/voz_eleven.mjs, então voz_avaliar.py e vo_montar.py funcionam igual):
  voz/<id>/texto.txt              o texto do roteiro, com o CTA no lugar
  voz/<id>/<rotulo>-<n>.wav       a tomada (24 kHz mono, como o modelo gera)
  voz/<id>/<rotulo>-<n>.mp3       a mesma tomada em MP3 (se houver ffmpeg)

Na primeira execução o uv instala as dependências (PyTorch incluso, ~1 GB) e o Kokoro baixa o modelo
(~330 MB) do Hugging Face. O português usa o espeak-ng embutido no pacote espeakng-loader; se der erro
de espeak, instale o do sistema (macOS: brew install espeak-ng; Debian/Ubuntu: apt install espeak-ng).
Roda em CPU; num notebook atual leva poucos segundos por frase.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import warnings

import numpy as np
import soundfile as sf

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 24000
VOZES = {"pf_dora": "feminina", "pm_alex": "masculina", "pm_santa": "masculina, grave"}
PASSOS = [1.0, 0.96, 1.04, 0.92, 1.08, 0.9, 1.1]


def falas_do(criativo, cta):
    return [cta if f == "CTA" else f for f in criativo["falas"]]


def sintetizar(pipe, falas, voz, velocidade, pausa):
    partes = []
    silencio = np.zeros(int(pausa * SR), dtype=np.float32)
    for i, fala in enumerate(falas):
        for _, _, audio in pipe(fala, voice=voz, speed=velocidade, split_pattern=r"\n+"):
            if audio is not None:
                partes.append(np.asarray(audio, dtype=np.float32))
        if i < len(falas) - 1:
            partes.append(silencio)
    y = np.concatenate(partes) if partes else np.zeros(1, dtype=np.float32)
    pico = float(np.abs(y).max()) or 1.0
    return y * min(1.0, 0.89 / pico)   # pico em -1 dBFS, sem clipar


def main():
    ap = argparse.ArgumentParser(description="Narração grátis com Kokoro (pt-BR), no mesmo formato da voz paga.")
    ap.add_argument("ids", help="ids do roteiro separados por vírgula, ou all")
    ap.add_argument("voz", help="pf_dora | pm_alex | pm_santa")
    ap.add_argument("tomadas", nargs="?", type=int, default=1)
    ap.add_argument("--roteiros", default=os.path.join(RAIZ, "roteiros/roteiros.json"))
    ap.add_argument("--velocidade", type=float, default=1.0)
    ap.add_argument("--rotulo", default=None)
    ap.add_argument("--pausa", type=float, default=0.22)
    ap.add_argument("--saida", default=os.path.join(RAIZ, "voz"), help="pasta das vozes (padrão voz/)")
    a = ap.parse_args()
    if a.voz not in VOZES:
        print(f"aviso: {a.voz} não é uma das vozes pt-BR conhecidas ({', '.join(VOZES)}); tentando assim mesmo")
    if not os.path.exists(a.roteiros):
        sys.exit(f"roteiro não encontrado: {a.roteiros} (modelo em templates/roteiro.json)")
    dados = json.load(open(a.roteiros, encoding="utf-8"))
    alvo = [c for c in dados["criativos"] if a.ids == "all" or c["id"] in a.ids.split(",")]
    if not alvo:
        sys.exit(f"nenhum criativo com id {a.ids} em {a.roteiros}")

    warnings.filterwarnings("ignore")
    from kokoro import KPipeline  # importado aqui para --help responder sem carregar o PyTorch
    pipe = KPipeline(lang_code="p", repo_id="hexgrad/Kokoro-82M")   # 'p' = português do Brasil
    rotulo = a.rotulo or a.voz
    tem_ffmpeg = shutil.which("ffmpeg") is not None
    for c in alvo:
        falas = falas_do(c, dados.get("cta_fala", ""))
        pasta = os.path.join(a.saida, c["id"])
        os.makedirs(pasta, exist_ok=True)
        open(os.path.join(pasta, "texto.txt"), "w", encoding="utf-8").write(" ".join(falas) + "\n")
        for n in range(1, a.tomadas + 1):
            destino = os.path.join(pasta, f"{rotulo}-{n}.wav")
            if os.path.exists(destino):
                continue
            vel = a.velocidade * PASSOS[(n - 1) % len(PASSOS)]
            y = sintetizar(pipe, falas, a.voz, vel, a.pausa)
            sf.write(destino, y, SR, subtype="PCM_16")
            if tem_ffmpeg:
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", destino, "-b:a", "192k", destino[:-4] + ".mp3"], check=True)
            rel = os.path.relpath(destino)
            print(f"ok {destino if rel.startswith('..') else rel}  ({len(y) / SR:.2f} s, velocidade x{vel:.2f})", flush=True)
    print("próximo passo: uv run scripts/voz_avaliar.py voz/<id>  e depois  uv run scripts/vo_montar.py <filme> voz/<id>/<tomada>.wav")


if __name__ == "__main__":
    main()
