#!/usr/bin/env bash
# Instalador da Fábrica de Criativos para Linux (Debian, Ubuntu e derivados, com apt).
#
# Abra o terminal na pasta do projeto e rode:
#   bash instalar/linux.sh
#
# O que ele faz (e pula o que já estiver instalado, então pode rodar de novo sem medo):
#   1. apt: curl, ca-certificates e ffmpeg
#   2. Node.js 22 pelo repositório oficial da NodeSource, se faltar Node 20 ou mais
#   3. uv pelo instalador oficial (https://astral.sh/uv)
#   4. npm install (three e Playwright) e o Chromium do Playwright com as bibliotecas do sistema
#   5. Whisper (openai-whisper), depois de perguntar: é grande
#   6. node fabrica.mjs verificar, que confere tudo no final
#
# Usa sudo para o apt (pede a sua senha). Não precisa instalar Python: o uv baixa sozinho a versão
# que cada script pede. Para responder "sim" a tudo sem perguntar: bash instalar/linux.sh --sim
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
[[ "$(uname -s)" == "Linux" ]] || parar "este instalador é para Linux. No macOS use: bash instalar/macos.sh"

printf '\033[36mFábrica de Criativos: instalação no Linux\033[0m\n'
echo "Pasta do projeto: $RAIZ"

if ! tem apt-get; then
  parar "este instalador usa o apt (Debian, Ubuntu, Mint, Pop!_OS...). Na sua distribuição, instale à mão:
   Node.js 20 ou mais, ffmpeg e uv (curl -LsSf https://astral.sh/uv/install.sh | sh); depois, nesta pasta:
   npm install && npx playwright install --with-deps chromium && uv tool install --python 3.12 openai-whisper
   e confira com: node fabrica.mjs verificar"
fi
SUDO=""
[[ "$(id -u)" -ne 0 ]] && SUDO="sudo"
[[ -n "$SUDO" ]] && ! tem sudo && parar "preciso do sudo para instalar pelo apt (ou rode como root)."

# ---------------------------------------------------------------- 1. apt
titulo "Pacotes do sistema (curl, ffmpeg)"
faltam=()
tem curl || faltam+=(curl)
dpkg -s ca-certificates >/dev/null 2>&1 || faltam+=(ca-certificates)
tem ffmpeg || faltam+=(ffmpeg)
if [[ ${#faltam[@]} -eq 0 ]]; then ok "curl e ffmpeg já instalados"
else
  echo "   instalando: ${faltam[*]} (o sudo pode pedir a sua senha; ao digitar, nada aparece: é normal)"
  $SUDO apt-get update || parar "o apt-get update falhou. Confira a internet e rode de novo."
  $SUDO apt-get install -y "${faltam[@]}" || parar "não consegui instalar: ${faltam[*]}"
  ok "${faltam[*]} instalado(s)"
fi

# ---------------------------------------------------------------- 2. Node
titulo "Node.js"
versao_node() { tem node && node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }
if [[ "$(versao_node)" -ge 20 ]]; then ok "Node $(node --version) já instalado"
else
  [[ "$(versao_node)" -gt 0 ]] && aviso "o Node instalado é antigo ($(node --version)); a fábrica pede 20 ou mais"
  echo "   Vou instalar o Node.js 22 pelo repositório oficial da NodeSource (https://github.com/nodesource/distributions)."
  pergunta "Instalar o Node.js 22 agora?" || parar "sem Node 20 ou mais não dá para seguir. Instale e rode de novo."
  curl -fsSL https://deb.nodesource.com/setup_22.x | ${SUDO:+$SUDO -E} bash - || parar "não consegui configurar o repositório da NodeSource."
  $SUDO apt-get install -y nodejs || parar "não consegui instalar o nodejs."
  hash -r
  [[ "$(versao_node)" -ge 20 ]] || parar "o Node continua abaixo da versão 20. Confira com: which -a node"
  ok "Node $(node --version) instalado"
fi
tem npm || parar "o npm não veio com o Node. Instale o pacote nodejs da NodeSource (ele já traz o npm) e rode de novo."

# ---------------------------------------------------------------- 3. uv
titulo "uv (roda os scripts em Python e baixa o Python sozinho)"
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
if tem uv; then ok "uv já instalado"
else
  curl -LsSf https://astral.sh/uv/install.sh | sh || parar "não consegui instalar o uv."
  export PATH="$HOME/.local/bin:$PATH"
  tem uv || parar "o uv foi instalado, mas não aparece no PATH. Feche e abra o terminal e rode de novo."
  ok "uv instalado"
fi

# ---------------------------------------------------------------- 4. npm e Chromium
titulo "Dependências do projeto (npm install)"
npm install --no-audit --no-fund || parar "o npm install falhou. Confira a internet e rode de novo."
ok "three e Playwright instalados"
titulo "Chromium do Playwright e as bibliotecas que ele usa (pode pedir a senha do sudo)"
npx playwright install --with-deps chromium || parar "não consegui instalar o Chromium. Rode de novo: npx playwright install --with-deps chromium"
ok "Chromium pronto"

# ---------------------------------------------------------------- 5. Whisper
titulo "Whisper (marca o tempo de cada palavra da narração)"
if tem whisper; then
  ok "Whisper já instalado"
else
  echo "   O openai-whisper é grande: uns 3 GB (PyTorch) agora e, no primeiro uso, o modelo de fala."
  echo "   Sem ele a fábrica funciona, mas o demo e a narração no tempo das cenas não."
  if pergunta "Instalar o Whisper agora?"; then
    if uv tool install --python 3.12 openai-whisper; then
      uv tool update-shell >/dev/null 2>&1 || true
      ok "Whisper instalado"
    else
      aviso "a instalação do Whisper falhou. Tente de novo depois: uv tool install --python 3.12 openai-whisper"
    fi
  else
    aviso "Whisper pulado. Para instalar depois: uv tool install --python 3.12 openai-whisper"
  fi
fi

# ---------------------------------------------------------------- 6. conferência
titulo "Conferência final"
node fabrica.mjs verificar
final=$?
echo
if [[ $final -eq 0 ]]; then
  printf '\033[32mInstalação concluída.\033[0m Feche e abra o terminal (para o PATH novo valer) e rode:\n   node fabrica.mjs demo\n'
else
  printf '\033[33mQuase lá:\033[0m a conferência acima mostra o que falta e como resolver.\n'
  echo "Depois de resolver, rode: node fabrica.mjs verificar"
fi
exit $final
