#!/usr/bin/env bash
# Instalador da Fábrica de Criativos para macOS.
#
# Abra o Terminal na pasta do projeto e rode:
#   bash instalar/macos.sh
#
# O que ele faz (e pula o que já estiver instalado, então pode rodar de novo sem medo):
#   1. Homebrew, se faltar (o instalador oficial; ele pede a senha do Mac)
#   2. brew install node ffmpeg uv
#   3. npm install (three e Playwright) e o Chromium do Playwright
#   4. Whisper (mlx-whisper no Apple Silicon, openai-whisper no Mac Intel), depois de perguntar: é grande
#   5. node fabrica.mjs verificar, que confere tudo no final
#
# Não precisa instalar Python: o uv baixa sozinho a versão que cada script pede.
# Para responder "sim" a tudo sem perguntar: bash instalar/macos.sh --sim
set -uo pipefail

SIM=""
[[ "${1:-}" == "--sim" || "${1:-}" == "-y" ]] && SIM=1

titulo() { printf '\n\033[36m== %s\033[0m\n' "$1"; }
ok()     { printf '   \033[32m✔\033[0m %s\n' "$1"; }
aviso()  { printf '   \033[33m!\033[0m %s\n' "$1"; }
parar()  { printf '\n\033[31m✖ %s\033[0m\n\n' "$1"; exit 1; }
tem()    { command -v "$1" >/dev/null 2>&1; }
pergunta() {   # pergunta "texto" -> 0 para sim (o padrão), 1 para não
  [[ -n "$SIM" ]] && return 0
  [[ -t 0 ]] || return 0
  local r; read -r -p "   $1 [S/n] " r
  [[ -z "$r" || "$r" =~ ^[sSyY] ]]
}

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$RAIZ" || parar "não consegui entrar em $RAIZ"
[[ -f fabrica.mjs ]] || parar "não achei o fabrica.mjs em $RAIZ. Rode este instalador de dentro da pasta do projeto."
[[ "$(uname -s)" == "Darwin" ]] || parar "este instalador é para macOS. No Linux use: bash instalar/linux.sh"

printf '\033[36mFábrica de Criativos: instalação no macOS\033[0m\n'
echo "Pasta do projeto: $RAIZ"

APPLE_SILICON=""
[[ "$(sysctl -n hw.optional.arm64 2>/dev/null)" == "1" ]] && APPLE_SILICON=1

# ---------------------------------------------------------------- 1. Homebrew
titulo "Homebrew (o instalador de programas do macOS)"
carregar_brew() {
  for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    [[ -x "$b" ]] && { eval "$("$b" shellenv)"; return 0; }
  done
  return 1
}
tem brew || carregar_brew || true
if tem brew; then
  ok "Homebrew já instalado"
else
  echo "   O Homebrew não está instalado. Vou rodar o instalador oficial (https://brew.sh)."
  echo "   Ele mostra o que vai fazer, pede a senha do Mac (ao digitar, nada aparece: é normal)"
  echo "   e pode instalar as Ferramentas de Linha de Comando da Apple. Leva alguns minutos."
  pergunta "Instalar o Homebrew agora?" || parar "sem o Homebrew não dá para seguir. Instale por https://brew.sh e rode de novo."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || parar "a instalação do Homebrew falhou."
  carregar_brew || parar "o Homebrew foi instalado, mas não achei o comando brew. Feche e abra o Terminal e rode de novo."
  # deixa o brew no PATH dos próximos terminais (o que o próprio instalador recomenda)
  linha="eval \"\$($(command -v brew) shellenv)\""
  grep -qsF "$linha" "$HOME/.zprofile" || echo "$linha" >> "$HOME/.zprofile"
  ok "Homebrew instalado"
fi

# ---------------------------------------------------------------- 2. node, ffmpeg, uv
titulo "Programas (Node.js, FFmpeg, uv)"
versao_node() { tem node && node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }
if [[ "$(versao_node)" -ge 20 ]]; then ok "Node $(node --version) já instalado"
else
  [[ "$(versao_node)" -gt 0 ]] && aviso "o Node instalado é antigo ($(node --version)); a fábrica pede 20 ou mais"
  brew install node || parar "não consegui instalar o Node (brew install node)."
  hash -r
  [[ "$(versao_node)" -ge 20 ]] || parar "o Node continua abaixo da versão 20. Confira com: which -a node"
  ok "Node $(node --version) instalado"
fi
for p in ffmpeg uv; do
  if tem "$p"; then ok "$p já instalado"
  else brew install "$p" || parar "não consegui instalar o $p (brew install $p)."; ok "$p instalado"; fi
done

# ---------------------------------------------------------------- 3. npm e Chromium
titulo "Dependências do projeto (npm install)"
npm install --no-audit --no-fund || parar "o npm install falhou. Confira a internet e rode de novo."
ok "three e Playwright instalados"
titulo "Chromium do Playwright (o navegador que renderiza os filmes)"
npx playwright install chromium || parar "não consegui baixar o Chromium. Rode de novo: npx playwright install chromium"
ok "Chromium pronto"

# ---------------------------------------------------------------- 4. Whisper
titulo "Whisper (marca o tempo de cada palavra da narração)"
export PATH="$HOME/.local/bin:$PATH"
if [[ -n "$APPLE_SILICON" ]]; then PACOTE=mlx-whisper; CMD=mlx_whisper; else PACOTE=openai-whisper; CMD=whisper; fi
if tem "$CMD"; then
  ok "Whisper ($CMD) já instalado"
else
  if [[ -n "$APPLE_SILICON" ]]; then
    echo "   No Apple Silicon a fábrica usa o mlx-whisper (rápido na GPU do Mac): uns 500 MB agora e, no"
    echo "   primeiro uso, o modelo de fala (~1,6 GB)."
  else
    echo "   O openai-whisper é grande: uns 2 GB (PyTorch) agora e, no primeiro uso, o modelo de fala."
  fi
  echo "   Sem ele a fábrica funciona, mas o demo e a narração no tempo das cenas não."
  if pergunta "Instalar o Whisper agora?"; then
    if uv tool install --python 3.12 "$PACOTE"; then
      uv tool update-shell >/dev/null 2>&1 || true
      ok "Whisper instalado"
    else
      aviso "a instalação do Whisper falhou. Tente de novo depois: uv tool install --python 3.12 $PACOTE"
    fi
  else
    aviso "Whisper pulado. Para instalar depois: uv tool install --python 3.12 $PACOTE"
  fi
fi

# ---------------------------------------------------------------- 5. conferência
titulo "Conferência final"
node fabrica.mjs verificar
final=$?
echo
if [[ $final -eq 0 ]]; then
  printf '\033[32mInstalação concluída.\033[0m Feche e abra o Terminal (para o PATH novo valer) e rode:\n   node fabrica.mjs demo\n'
else
  printf '\033[33mQuase lá:\033[0m a conferência acima mostra o que falta e como resolver.\n'
  echo "Depois de resolver, rode: node fabrica.mjs verificar"
fi
exit $final
