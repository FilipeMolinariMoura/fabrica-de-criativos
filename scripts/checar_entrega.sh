#!/usr/bin/env bash
# checar_entrega.sh: confere se os vídeos estão prontos para subir como anúncio vertical.
#
# uso:
#   scripts/checar_entrega.sh <video.mp4> [mais.mp4 ...]
#   ALVO_LUFS=-14 TOL_LUFS=1 scripts/checar_entrega.sh entrega/finais/*.mp4
#
# Para cada arquivo (ffprobe + ffmpeg ebur128):
#   resolução  1080x1920 (9:16)
#   fps        30 ou 60 (aceita 23.976 a 60)
#   pixel      yuv420p (o que todo celular toca)
#   áudio      existe uma faixa de áudio
#   loudness   integrado em ALVO_LUFS ± TOL_LUFS (padrão -14 ± 1 LUFS)
#   pico       true peak <= -1,0 dBTP
# Imprime uma tabela PASSA/FALHA e sai com código 1 se algum arquivo falhar.
set -uo pipefail

if [[ $# -lt 1 || "$1" == "-h" || "$1" == "--help" ]]; then
  sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
  [[ $# -lt 1 ]] && exit 1 || exit 0
fi
command -v ffprobe >/dev/null && command -v ffmpeg >/dev/null || { echo "precisa de ffmpeg e ffprobe no PATH" >&2; exit 1; }

ALVO="${ALVO_LUFS:--14}"
TOL="${TOL_LUFS:-1}"
falhas=0

printf '%-34s %-11s %-7s %-9s %-6s %-8s %-8s %s\n' "arquivo" "resolução" "fps" "pixel" "áudio" "LUFS" "dBTP" "resultado"
printf '%.0s-' {1..100}; echo

for v in "$@"; do
  if [[ ! -f "$v" ]]; then
    printf '%-34s %s\n' "$(basename "$v")" "não existe  FALHA"; falhas=$((falhas + 1)); continue
  fi
  # key=valor (a ordem das colunas do ffprobe não é a ordem pedida)
  info="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,pix_fmt -of default=nw=1 "$v")"
  w="$(sed -n 's/^width=//p' <<<"$info")"; h="$(sed -n 's/^height=//p' <<<"$info")"
  rate="$(sed -n 's/^r_frame_rate=//p' <<<"$info")"; pix="$(sed -n 's/^pix_fmt=//p' <<<"$info")"
  fps="$(awk -F/ -v r="$rate" 'BEGIN{split(r,a,"/"); if (a[2]==0) a[2]=1; printf "%.3f", a[1]/a[2]}')"
  na="$(ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$v" | grep -c . || true)"
  lufs="-"; tp="-"
  if [[ "$na" -gt 0 ]]; then
    resumo="$(ffmpeg -hide_banner -nostats -i "$v" -map 0:a:0 -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary:/,$p')"
    lufs="$(awk '/I:/ {print $2; exit}' <<<"$resumo")"
    tp="$(awk '/Peak:/ {print $2; exit}' <<<"$resumo")"
  fi
  motivos=()
  [[ "$w" == 1080 && "$h" == 1920 ]] || motivos+=("resolução")
  awk -v f="$fps" 'BEGIN{exit !(f >= 23.9 && f <= 60.01)}' || motivos+=("fps")
  [[ "$pix" == "yuv420p" ]] || motivos+=("pixel")
  if [[ "$na" -gt 0 ]]; then
    awk -v l="$lufs" -v a="$ALVO" -v t="$TOL" 'BEGIN{d=l-a; if (d<0) d=-d; exit !(d <= t)}' || motivos+=("loudness")
    awk -v p="$tp" 'BEGIN{exit !(p != "" && p <= -1.0)}' || motivos+=("pico")
  else
    motivos+=("sem áudio")
  fi
  if [[ ${#motivos[@]} -eq 0 ]]; then res="PASSA"; else res="FALHA (${motivos[*]})"; falhas=$((falhas + 1)); fi
  printf '%-34s %-11s %-7s %-9s %-6s %-8s %-8s %s\n' "$(basename "$v" | cut -c1-34)" "${w}x${h}" "$fps" "$pix" "$na" "$lufs" "$tp" "$res"
done

echo
if [[ $falhas -gt 0 ]]; then echo "$falhas arquivo(s) com FALHA"; exit 1; fi
echo "tudo PASSA (alvo $ALVO ± $TOL LUFS, pico <= -1 dBTP)"
