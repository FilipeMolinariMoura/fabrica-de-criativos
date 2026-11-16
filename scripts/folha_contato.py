# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow"]
# ///
"""Folha de contato de um vídeo: N quadros espaçados por igual numa grade, com o tempo de cada um.

uso: uv run scripts/folha_contato.py <video.mp4> [saida.jpg] [--n 12] [--colunas 6] [--largura 270]
                                     [--de 0] [--ate FIM] [--fundo "#111111"]

  --n        quantos quadros (padrão 12)
  --colunas  quadros por linha (padrão: 6 para vertical, 4 para horizontal)
  --largura  largura de cada miniatura em px (padrão 270)
  --de/--ate trecho do vídeo em segundos (padrão: o vídeo inteiro)
Saída padrão: <video>_contato.jpg ao lado do vídeo. Precisa de ffmpeg/ffprobe no PATH.
Serve para a crítica (templates/critica.md): leia a folha como se fosse o feed, sem som.
"""
import argparse
import io
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def sonda(video):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=width,height:format=duration", "-of", "json", video], capture_output=True, text=True, check=True)
    d = json.loads(r.stdout)
    s = d["streams"][0]
    return int(s["width"]), int(s["height"]), float(d["format"]["duration"])


def quadro(video, t, largura):
    r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1",
                        "-vf", f"scale={largura}:-2:flags=lanczos", "-f", "image2pipe", "-vcodec", "png", "-"],
                       capture_output=True, check=True)
    return Image.open(io.BytesIO(r.stdout)).convert("RGB")


def fonte(tam):
    for nome in ("/System/Library/Fonts/Supplemental/Arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                 "C:/Windows/Fonts/arial.ttf"):
        if Path(nome).exists():
            return ImageFont.truetype(nome, tam)
    return ImageFont.load_default()


def main():
    ap = argparse.ArgumentParser(description="Folha de contato (grade de quadros) de um vídeo.")
    ap.add_argument("video")
    ap.add_argument("saida", nargs="?")
    ap.add_argument("--n", type=int, default=12)
    ap.add_argument("--colunas", type=int, default=None)
    ap.add_argument("--largura", type=int, default=270)
    ap.add_argument("--de", type=float, default=0.0)
    ap.add_argument("--ate", type=float, default=None)
    ap.add_argument("--fundo", default="#111111")
    a = ap.parse_args()
    if not Path(a.video).exists():
        sys.exit(f"não existe: {a.video}")
    w, h, dur = sonda(a.video)
    t0, t1 = a.de, min(a.ate or dur, dur)
    cols = a.colunas or (6 if h > w else 4)
    n = max(1, a.n)
    # o centro de cada fatia, para não pegar o primeiro quadro preto nem o último
    tempos = [t0 + (t1 - t0) * (i + 0.5) / n for i in range(n)]
    imgs = [quadro(a.video, t, a.largura) for t in tempos]
    tw, th = imgs[0].size
    pad, rot = 12, 30
    linhas = (n + cols - 1) // cols
    folha = Image.new("RGB", (cols * (tw + pad) + pad, linhas * (th + rot + pad) + pad), a.fundo)
    d = ImageDraw.Draw(folha)
    f = fonte(18)
    for i, (im, t) in enumerate(zip(imgs, tempos)):
        x = pad + (i % cols) * (tw + pad)
        y = pad + (i // cols) * (th + rot + pad)
        folha.paste(im, (x, y))
        d.text((x, y + th + 6), f"{i + 1:02d} · {t:5.2f} s", fill="#BBBBBB", font=f)
    saida = a.saida or str(Path(a.video).with_name(Path(a.video).stem + "_contato.jpg"))
    folha.save(saida, quality=88)
    print(f"{n} quadros ({cols} por linha) -> {saida}")


if __name__ == "__main__":
    main()
