# vendor/

Código de terceiros copiado para dentro do repositório, para o projeto funcionar sem instalar nada além
das dependências de sistema.

## motion-reel

| | |
| --- | --- |
| Origem | https://github.com/Aries-Spring/motion-reel |
| Versão | 1.3.0 (ver `motion-reel/CHANGELOG.md`) |
| Autor | Aries Spring |
| Licença | MIT (`motion-reel/LICENSE`) |
| Modificações | duas, pequenas, descritas no fim deste arquivo (`mix.mjs` e `sfx.mjs`) |

O motion-reel é um plugin do Claude Code que transforma código em vídeo: o filme é um canvas que é função
pura do tempo, renderizado quadro a quadro pelo Chromium (Playwright), com trilha e efeitos sintetizados e
mixagem em -14 LUFS. Daqui a fábrica usa principalmente:

- `skills/motion-reel/scripts/render.mjs`: render quadro a quadro (prévia, final, folhas de contato, stills);
- `skills/motion-reel/scripts/sfx.mjs`: efeitos sonoros a partir da lista de acentos (`HITS`) do filme;
- `skills/motion-reel/scripts/mix.mjs`: mixagem música + efeitos + voz, master em -14 LUFS / -1 dBTP;
- `skills/motion-reel/scripts/dsp.py`: os instrumentos sintetizados que `scripts/trilha.py` usa.

`lib/motion.js` é derivado de `skills/motion-reel/assets/lib/motion.js` (comentários traduzidos e o gancho
`FONTES_EXTRA`).

### Onde os scripts procuram o skill

Todos os scripts da fábrica leem a variável de ambiente `SKILL` e, se ela não existir, usam
`vendor/motion-reel/skills/motion-reel`:

```bash
SKILL=~/.claude/skills/motion-reel scripts/finalizar.sh exemplos/demo previa
```

### Usar o plugin instalado em vez da cópia

Se você usa o Claude Code, pode instalar o plugin oficial (e receber atualizações) em vez de usar esta cópia:

```bash
claude plugin marketplace add Aries-Spring/motion-reel
claude plugin install motion-reel@aries-spring
```

Depois aponte `SKILL` para a pasta `skills/motion-reel` do plugin instalado. Com o plugin instalado, o
Claude Code também passa a conhecer o fluxo completo (roteiro de planos, crítica por folhas de contato etc.).

## Alteração local em `motion-reel/skills/motion-reel/scripts/mix.mjs`

Uma linha, para expor os parâmetros do sidechain que abaixa a música sob a voz (antes fixos em
`threshold=0.02:ratio=6:attack=12:release=280`): quatro opções novas, com os mesmos valores por padrão,
então quem não as usa não vê diferença.

```
node vendor/motion-reel/skills/motion-reel/scripts/mix.mjs <filme> --no-mux \
  --music-db 2 --duck-threshold 0.08 --duck-ratio 3 --duck-attack 15 --duck-release 350
```

Motivo: em `exemplos/bancada` a crítica mediu a música 14,8 LU abaixo da voz nos intervalos (sumia).
Ao atualizar o vendor, reaplique esta troca ou a mixagem volta ao comportamento original.

## Alteração local em `motion-reel/skills/motion-reel/scripts/sfx.mjs`

Uma linha: o `sfx.mjs` chama o `render.mjs --hits` com o mesmo Node que está rodando (`process.execPath`) em vez
de procurar `node` no PATH. Funciona igual no macOS e no Linux e evita surpresa no Windows (Node instalado fora
do PATH, ou duas versões instaladas).

```
- spawnSync('node', [RENDER, '--film', film, '--hits'], ...)
+ spawnSync(process.execPath, [RENDER, '--film', film, '--hits'], ...)
```

Ao atualizar o vendor, reaplique esta troca também.

## Windows, macOS e Linux

O resto do vendor já roda nos três sistemas (caminhos com `path.join`, `ffmpeg` chamado sem shell, Playwright
achado a partir da pasta do projeto). Dois cuidados ficam com quem chama, e o `fabrica.mjs` já os toma:

- `--film` vira caminho de URL dentro do `render.mjs`: passe com barras normais (`exemplos/demo`, nunca
  `exemplos\demo`) e relativo à raiz do repositório;
- o `render.mjs` do vendor escolhe a GPU por conta própria no macOS (Metal) e usa o padrão do Chromium nos
  outros sistemas. Para os filmes 2D isso basta; os filmes 3D da fábrica usam `lib/3d/render.mjs`, que escolhe
  a GPU de cada sistema (Windows, macOS e Linux) pelo `lib/3d/gpu.mjs`.
