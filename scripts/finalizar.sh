#!/usr/bin/env bash
# finalizar.sh: áudio + vídeo de um filme: trilha, efeitos, mixagem em -14 LUFS e o render.
#
# uso:
#   scripts/finalizar.sh <pasta-do-filme> [previa|final]
#     previa  30 fps, sem desfoque de movimento (rápido)  -> entrega/previas/<nome>-previa.mp4
#     final   60 fps, com desfoque de movimento            -> entrega/finais/<nome>.mp4
#
# A pasta do filme fica dentro do repositório (ex.: exemplos/demo, criativos/c01), porque o render serve a raiz
# do repositório para o navegador achar lib/. Rode de qualquer lugar: o script entra na raiz sozinho.
# Passos: trilha.py (se houver trilha.json) -> sfx.mjs (acentos do HITS) -> mix.mjs (música + efeitos + voz)
#         -> render.mjs. O skill motion-reel vem de $SKILL (padrão vendor/motion-reel/skills/motion-reel).
set -euo pipefail

if [[ $# -lt 1 || "$1" == "-h" || "$1" == "--help" ]]; then
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  [[ $# -lt 1 ]] && exit 1 || exit 0
fi

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL="${SKILL:-$RAIZ/vendor/motion-reel/skills/motion-reel}"
MODO="${2:-previa}"

# caminho do filme relativo à raiz do repositório
ALVO="$(cd "$1" && pwd)"
case "$ALVO" in
  "$RAIZ"/*) F="${ALVO#"$RAIZ"/}" ;;
  *) echo "o filme precisa estar dentro do repositório ($RAIZ)" >&2; exit 1 ;;
esac
cd "$RAIZ"
[[ -f "$F/index.html" && -f "$F/film.json" ]] || { echo "faltou $F/index.html ou $F/film.json" >&2; exit 1; }
[[ -f "$SKILL/scripts/render.mjs" ]] || { echo "skill não encontrado em $SKILL (defina SKILL)" >&2; exit 1; }

NOME="$(basename "$F")"
DUR="$(node -e "process.stdout.write(String(require('./$F/film.json').duration ?? 15))")"

if [[ -f "$F/trilha.json" ]]; then
  echo "== trilha"
  SKILL="$SKILL" uv run -q scripts/trilha.py "$F" | grep -E "^(andamento|loudness|->)" || true
elif [[ ! -f "$F/audio/music.wav" || ! -f "$F/beats.json" ]]; then
  echo "faltou $F/trilha.json (ou audio/music.wav + beats.json prontos)" >&2; exit 1
fi
echo "== efeitos"
node "$SKILL/scripts/sfx.mjs" "$F" | tail -1
echo "== mixagem"
node "$SKILL/scripts/mix.mjs" "$F" --no-mux | tail -1

if [[ "$MODO" == "final" ]]; then
  echo "== render final (60 fps, com desfoque)"
  node "$SKILL/scripts/render.mjs" --film "$F" --format 9x16 --video-only | tail -1
  mkdir -p entrega/finais
  ffmpeg -v error -y -i "out/$F/video_9x16.mp4" -i "$F/audio/mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k \
    -shortest -movflags +faststart "entrega/finais/$NOME.mp4"
  echo "final: entrega/finais/$NOME.mp4"
else
  echo "== render de prévia (30 fps, sem desfoque)"
  node "$SKILL/scripts/render.mjs" --film "$F" --format 9x16 --range "0:$DUR" --fps 30 --noblur | tail -1
  mkdir -p entrega/previas
  ULTIMO="$(ls -t "out/$F"/range_9x16_0-*.mp4 | head -1)"
  cp "$ULTIMO" "entrega/previas/$NOME-previa.mp4"
  echo "prévia: entrega/previas/$NOME-previa.mp4"
fi
echo "confira: scripts/checar_entrega.sh entrega/*/$NOME*.mp4"
