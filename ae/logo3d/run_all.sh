#!/usr/bin/env bash
# run_all.sh: monta o logo 3D ao vivo dentro do After Effects aberto, um passo visível de cada vez (macOS).
#
# uso:
#   ae/logo3d/run_all.sh            passos 01..07 (projeto montado e salvo em ae/logo3d/logo3d.aep)
#   ae/logo3d/run_all.sh render     também renderiza (08) e converte para PNG 8 bits (png16to8.py)
#   AE_APP="Adobe After Effects 2026" ae/logo3d/run_all.sh
#
# Antes: edite ae/logo3d/config.jsxinc (logo, cores, tamanho, duração) e abra o After Effects.
# ATENÇÃO: o passo 01 fecha o projeto aberto SEM salvar. Salve o que importa antes.
# Cada passo grava ae/logo3d/logs/NN_nome.log; o script mostra as linhas de OK/ERRO.
# Na primeira vez o macOS pede permissão para o Terminal controlar o After Effects (Automação).
set -euo pipefail

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0; fi
[[ "$(uname)" == "Darwin" ]] || { echo "run_all.sh usa AppleScript (macOS). No Windows, rode cada .jsx em Arquivo > Scripts > Executar arquivo de script." >&2; exit 1; }

D="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -z "${AE_APP:-}" ]]; then
  # o After Effects mais novo instalado em /Applications
  AE_APP="$(find /Applications -maxdepth 1 -name 'Adobe After Effects 20*' -type d 2>/dev/null | sort | tail -1 | xargs -I{} basename {})"
  AE_APP="${AE_APP:-$(sed -n 's/.*AE_APP: *"\(.*\)".*/\1/p' "$D/config.jsxinc")}"
fi
echo "After Effects: $AE_APP"
osascript -e "tell application \"$AE_APP\" to activate"

steps=(01_comp 02_tile 03_logo 04_anim 05_sweep 06_shadow 07_master)
[[ "${1:-}" == "render" ]] && steps+=(08_render)
for s in "${steps[@]}"; do
  osascript -e "with timeout of 3600 seconds" -e "tell application \"$AE_APP\" to DoScriptFile \"$D/$s.jsx\"" -e "end timeout" >/dev/null
  echo "--- $s"; grep -E "ERRO|OK$" "$D/logs/$s.log" || echo "(sem log: o script rodou?)"
  if grep -q ERRO "$D/logs/$s.log" 2>/dev/null; then echo "parei no erro; veja $D/logs/$s.log" >&2; exit 1; fi
  sleep 1.5
done
if [[ "${1:-}" == "render" ]]; then
  echo "--- png16to8"
  uv run -q --with pillow --with numpy python "$D/png16to8.py"
fi
