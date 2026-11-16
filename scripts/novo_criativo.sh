#!/usr/bin/env bash
# novo_criativo.sh: cria a pasta de um filme novo a partir do exemplo (exemplos/demo).
#
# uso:
#   scripts/novo_criativo.sh <id> "<título>" [pasta-destino]
#     <id>            nome curto, sem espaço (ex.: c01-agenda-cheia)
#     "<título>"      título do criativo (vai para film.json e para a aba do navegador)
#     [pasta-destino] padrão: criativos/<id>
#
# Copia index.html, film.js, film.json, trilha.json e roteiro.json do demo (sem áudio, narração nem saídas),
# acerta o título e os caminhos para lib/. Depois: edite roteiro.json e film.js e rode
# scripts/finalizar.sh <pasta-destino> previa.
set -euo pipefail

if [[ $# -lt 2 || "$1" == "-h" || "$1" == "--help" ]]; then
  sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'
  [[ $# -lt 2 ]] && exit 1 || exit 0
fi

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ID="$1"; TITULO="$2"; DEST="${3:-criativos/$ID}"
[[ "$ID" =~ ^[a-z0-9][a-z0-9_-]*$ ]] || { echo "id inválido: use minúsculas, números, - e _" >&2; exit 1; }
cd "$RAIZ"
[[ -e "$DEST" ]] && { echo "já existe: $DEST" >&2; exit 1; }
mkdir -p "$DEST"
for f in index.html film.js film.json trilha.json roteiro.json; do cp "exemplos/demo/$f" "$DEST/$f"; done

# título, id e caminho relativo até lib/ (o demo está a dois níveis da raiz: ../../lib/)
DEST_ABS="$(cd "$DEST" && pwd)"
node - "$DEST_ABS" "$RAIZ" "$ID" "$TITULO" <<'NODE'
const fs = require('fs'), path = require('path');
const [dest, raiz, id, titulo] = process.argv.slice(2);
const rel = path.relative(dest, path.join(raiz, 'lib')).split(path.sep).join('/') + '/';
const fj = JSON.parse(fs.readFileSync(path.join(dest, 'film.json'), 'utf8'));
fj.title = titulo;
fs.writeFileSync(path.join(dest, 'film.json'), JSON.stringify(fj, null, 1) + '\n');
for (const f of ['index.html', 'film.js']) {
  let s = fs.readFileSync(path.join(dest, f), 'utf8').split('../../lib/').join(rel);
  if (f === 'index.html') s = s.replace(/<title>[^<]*<\/title>/, `<title>${titulo.replace(/</g, '&lt;')}</title>`);
  // a marca do demo (window.MARCA) sai: o filme novo usa lib/marca.json
  if (f === 'index.html') s = s.replace(/<script>\s*\/\/ A marca do demo[\s\S]*?<\/script>\n/, '');
  fs.writeFileSync(path.join(dest, f), s);
}
const rp = path.join(dest, 'roteiro.json');
const r = JSON.parse(fs.readFileSync(rp, 'utf8'));
if (r.criativos && r.criativos[0]) { r.criativos[0].id = id; r.criativos[0].titulo = titulo; }
fs.writeFileSync(rp, JSON.stringify(r, null, 2) + '\n');
NODE

echo "criado: $DEST"
echo "próximos passos:"
echo "  1. escreva o roteiro em $DEST/roteiro.json (modelo em templates/roteiro.json)"
echo "  2. narração grátis: uv run scripts/voz_kokoro.py $ID pf_dora --roteiros $DEST/roteiro.json"
echo "  3. configure a marca em lib/marca.json; reescreva $DEST/film.js (as cenas do demo estão presas às palavras dele) e $DEST/trilha.json"
echo "  4. scripts/finalizar.sh $DEST previa"
