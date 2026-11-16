#!/usr/bin/env bash
# finalizar3d.sh: áudio + vídeo de um filme 3D (lib/3d, three.js na GPU): eventos, trilha, efeitos,
# mixagem em -14 LUFS e o render com áudio.
#
# uso:
#   scripts/finalizar3d.sh <pasta-do-filme> [previa|final|contato|contraste|audio]
#     contato    folha de contato, 2 quadros por plano, 24 amostras -> out/<filme>/contato.jpg e celular.jpg
#     contraste  contraste (WCAG) de cada legenda contra o quadro renderizado, impresso no terminal
#     audio      só o áudio: eventos -> trilha -> efeitos -> mixagem  -> <filme>/audio/mix.wav
#     previa     áudio + 30 fps, 128 amostras por quadro             -> entrega/previas/<nome>-previa.mp4
#     final      áudio + 60 fps, 192 amostras por quadro             -> entrega/finais/<nome>.mp4
#
# Variáveis opcionais:
#   SPP, FPS, CRF      qualidade do render (amostras por quadro, quadros por segundo, compressão)
#   LIMPO=1            no final, grava também out/<filme>/<nome>-limpo.mp4 (sem grão, vinheta nem áudio)
#   Q="exp=1"          parâmetros extras para a página do filme (o --q do render)
#   SEM_AUDIO=1        não refaz o áudio; usa o <filme>/audio/mix.wav que já existe
#   TRILHA=1           refaz a trilha mesmo sem mudança no trilha.json; TRILHA_ARGS="--mood tech" vai para trilha.py
#   MUSICA_DB, DUCK_THRESHOLD, DUCK_RATIO, DUCK_ATTACK, DUCK_RELEASE
#                      mixagem: ganho da trilha e o quanto ela abaixa sob a voz (padrão 2, 0.08, 3, 15, 350)
#
# A pasta do filme fica dentro do repositório (ex.: exemplos/bancada) e tem index.html e film.json.
# A narração (<filme>/audio/vo.wav + vo.json) vem antes: uv run scripts/vo_montar.py <filme> voz/<id>/<tomada>.wav
# Tempo de render medido num MacBook com M1 Pro, para um filme de uns 35 s: prévia em torno de 14 min, final de 35 a 40 min.
# O skill motion-reel (efeitos e mixagem) vem de $SKILL (padrão vendor/motion-reel/skills/motion-reel).
set -euo pipefail

if [[ $# -lt 1 || "$1" == "-h" || "$1" == "--help" ]]; then
  sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'
  [[ $# -lt 1 ]] && exit 1 || exit 0
fi

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL="${SKILL:-$RAIZ/vendor/motion-reel/skills/motion-reel}"
MODO="${2:-previa}"
case "$MODO" in
  previa|final|contato|contraste|audio) ;;
  *) echo "modo desconhecido: $MODO (use previa, final, contato, contraste ou audio)" >&2; exit 1 ;;
esac

[[ -d "$1" ]] || { echo "pasta não encontrada: $1" >&2; exit 1; }
ALVO="$(cd "$1" && pwd)"
case "$ALVO" in
  "$RAIZ"/*) F="${ALVO#"$RAIZ"/}" ;;
  *) echo "o filme precisa estar dentro do repositório" >&2; exit 1 ;;
esac
cd "$RAIZ"
RENDER="lib/3d/render.mjs"
[[ -f "$RENDER" ]] || { echo "faltou $RENDER" >&2; exit 1; }
[[ -f "$F/index.html" ]] || { echo "faltou $F/index.html" >&2; exit 1; }
[[ -e node_modules/three && -e node_modules/playwright ]] || { echo "faltam dependências (three, playwright): rode make setup" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "faltou o ffmpeg no PATH" >&2; exit 1; }

NOME="$(basename "$F")"
EXTRA=()
[[ -n "${Q:-}" ]] && EXTRA+=(--q "$Q")

if [[ "$MODO" == "contato" ]]; then
  node "$RENDER" --film "$F" --contact --spp "${SPP:-24}" ${EXTRA[@]+"${EXTRA[@]}"}
  echo "folha de contato: out/$F/contato.jpg (e celular.jpg, em meia escala). Crítica: templates/critica.md"
  exit 0
fi
if [[ "$MODO" == "contraste" ]]; then
  node "$RENDER" --film "$F" --contrast --spp "${SPP:-24}" ${EXTRA[@]+"${EXTRA[@]}"}
  exit 0
fi

if [[ -n "${SEM_AUDIO:-}" ]]; then
  [[ -f "$F/audio/mix.wav" ]] || { echo "SEM_AUDIO=1, mas não existe $F/audio/mix.wav" >&2; exit 1; }
else
  [[ -f "$SKILL/scripts/sfx.mjs" && -f "$SKILL/scripts/mix.mjs" ]] || { echo "skill não encontrado em $SKILL (defina SKILL)" >&2; exit 1; }
  [[ -f "$F/film.json" ]] || { echo "faltou $F/film.json (a mixagem lê a duração dele)" >&2; exit 1; }
  echo "== eventos e pontos da trilha"
  ANTES="$(cat "$F/trilha.json" 2>/dev/null || true)"
  META="$(node "$RENDER" --film "$F" --meta)"
  echo "${META%%$'\n'*}"
  if [[ -n "${TRILHA:-}" || ! -f "$F/audio/music.wav" || ! -f "$F/beats.json" || "$ANTES" != "$(cat "$F/trilha.json")" ]]; then
    echo "== trilha"
    # shellcheck disable=SC2086
    SKILL="$SKILL" uv run -q scripts/trilha.py "$F" ${TRILHA_ARGS:-} | grep -E "^(andamento|loudness|->)" || true
  else
    echo "== trilha: $F/audio/music.wav mantida (trilha.json não mudou; TRILHA=1 refaz)"
  fi
  [[ -f "$F/audio/vo.wav" ]] || echo "aviso: sem $F/audio/vo.wav, a mixagem sai sem narração (gere a voz e rode scripts/vo_montar.py)" >&2
  echo "== efeitos"
  node "$SKILL/scripts/sfx.mjs" "$F" | tail -1
  echo "== mixagem"
  MIX=(--no-mux --music-db "${MUSICA_DB:-2}")
  if grep -q -- "duck-threshold" "$SKILL/scripts/mix.mjs"; then
    MIX+=(--duck-threshold "${DUCK_THRESHOLD:-0.08}" --duck-ratio "${DUCK_RATIO:-3}" --duck-attack "${DUCK_ATTACK:-15}" --duck-release "${DUCK_RELEASE:-350}")
  else
    echo "aviso: o mix.mjs de $SKILL não aceita --duck-*; a trilha abaixa sob a voz com os valores originais (veja vendor/README.md)" >&2
  fi
  node "$SKILL/scripts/mix.mjs" "$F" "${MIX[@]}" | tail -1
fi
[[ "$MODO" == "audio" ]] && { echo "áudio: $F/audio/mix.wav"; exit 0; }

DUR="${DUR:-$(node -e "const fs=require('fs');const p='./$F/film.json';process.stdout.write(String(fs.existsSync(p)?(JSON.parse(fs.readFileSync(p,'utf8')).duration??''):''))")}"
[[ -n "$DUR" ]] || { echo "não sei a duração: ponha \"duration\" em $F/film.json ou passe DUR=<segundos>" >&2; exit 1; }

if [[ "$MODO" == "final" ]]; then
  SAIDA="entrega/finais/$NOME.mp4"
  [[ -n "${LIMPO:-}" ]] && EXTRA+=(--limpo "out/$F/$NOME-limpo.mp4")
  echo "== render final (${FPS:-60} fps, ${SPP:-192} amostras por quadro)"
  node "$RENDER" --film "$F" --range "0:$DUR" --fps "${FPS:-60}" --spp "${SPP:-192}" --crf "${CRF:-18}" \
    --mp4 "$SAIDA" --audio "$F/audio/mix.wav" ${EXTRA[@]+"${EXTRA[@]}"}
  echo "final: $SAIDA"
  [[ -n "${LIMPO:-}" ]] && echo "master limpo (sem áudio): out/$F/$NOME-limpo.mp4"
else
  SAIDA="entrega/previas/$NOME-previa.mp4"
  echo "== render de prévia (${FPS:-30} fps, ${SPP:-128} amostras por quadro)"
  node "$RENDER" --film "$F" --range "0:$DUR" --fps "${FPS:-30}" --spp "${SPP:-128}" --crf "${CRF:-20}" \
    --mp4 "$SAIDA" --audio "$F/audio/mix.wav" ${EXTRA[@]+"${EXTRA[@]}"}
  echo "prévia: $SAIDA"
fi
echo "confira: scripts/checar_entrega.sh $SAIDA"
