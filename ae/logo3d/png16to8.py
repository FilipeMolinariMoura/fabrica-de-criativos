"""PNG mestres de 16 bits com alfa straight (ae/logo3d/render16) -> PNG RGBA de 8 bits para o filme.

uso: uv run --with pillow --with numpy python ae/logo3d/png16to8.py [pasta16] [pasta_saida]
     (padrão: ae/logo3d/render16 -> ae/logo3d/saida; precisa de ffmpeg/ffprobe no PATH para decodificar)

Arredondamento simples, sem dither: a cauda parada da vinheta fica idêntica quadro a quadro.
Grava saida/logo_00000.png ... e saida/final.png (= último quadro). No film.js:
  images: { ...S.logoSeqImages('../../ae/logo3d/saida', 180, { passo: 2 }) }   // 60 fps -> 30 fps
  S.logoSeq(ctx, IMG, t, t0, W / 2, 700, 600);
"""
import glob
import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
if len(sys.argv) > 1 and sys.argv[1] in ("-h", "--help"):
    print(__doc__)
    sys.exit(0)
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, "render16")
DST = sys.argv[2] if len(sys.argv) > 2 else os.path.join(AQUI, "saida")
padrao = os.path.join(SRC, "logo16_%05d.png")
n = len(glob.glob(os.path.join(SRC, "logo16_*.png")))
if not n:
    sys.exit(f"nenhum PNG de 16 bits em {SRC} (rode o passo 08_render.jsx)")
w, h = map(int, subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                                "-of", "csv=p=0", os.path.join(SRC, "logo16_00000.png")],
                               check=True, capture_output=True, text=True).stdout.strip().split(","))
os.makedirs(DST, exist_ok=True)
for f in glob.glob(os.path.join(DST, "*.png")):
    os.remove(f)
raw = subprocess.run(["ffmpeg", "-v", "error", "-start_number", "0", "-i", padrao,
                      "-f", "rawvideo", "-pix_fmt", "rgba64le", "-"], check=True, stdout=subprocess.PIPE).stdout
frames = np.frombuffer(raw, dtype="<u2").reshape(-1, h, w, 4)
assert len(frames) == n, (len(frames), n)
for i, fr in enumerate(frames):
    a = ((fr.astype(np.uint32) * 255 + 32767) // 65535).astype(np.uint8)
    Image.fromarray(a, "RGBA").save(os.path.join(DST, "logo_%05d.png" % i), compress_level=6)
shutil.copyfile(os.path.join(DST, "logo_%05d.png" % (n - 1)), os.path.join(DST, "final.png"))
print(f"{n} quadros {w}x{h} -> {DST} | final.png = logo_{n - 1:05d}.png")
