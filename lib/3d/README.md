# lib/3d — filme de produto fotorreal em three.js

Um "estúdio" e uma "câmera" para filmes que continuam sendo função pura do tempo
(`window.seek(t)`), como o resto do kit. Usado por `exemplos/bancada`.

| Arquivo | O que faz |
|---|---|
| `pipeline.js` | A câmera. Um quadro = N renders da cena somados em ponto flutuante. A cada amostra mudam: posição na abertura da lente (profundidade de campo de lente fina, com o plano de foco fixo por cisalhamento da projeção), meio pixel (antisserrilhado), instante no obturador (desfoque de movimento), posição de cada luz na sua área (sombra suave), direção de uma luz de céu (oclusão) e a micro-normal do chão (reflexo acetinado). Depois, um passe: bloom e halação só do buffer de emissivos, aberração, vinheta, ACES, grade, legendas, grão, dither. |
| `studio.js` | A bancada: HDRI + softboxes por plano (`bakeEnvironment`), fundo, chão com reflexo renderizado (madeira ou ciclorama de papel), luzes principal / recorte / acento / céu, `setWorld`. |
| `models.js` | Celular e notebook genéricos (sem marca), vidro maciço, `slab()` com toda aresta chanfrada, grade de subpixel das telas, materiais `envSpecOnly` e `flaggedSpec`. |
| `screens.js` | Mapas de imperfeição (digitais, grão do alumínio) e legendas das teclas. |
| `render.mjs` | Playwright + ffmpeg: `--meta`, `--contact`, `--contrast`, `--at`, `--range` (com `--audio` e, opcional, `--limpo`). |
| `assets/` | HDRI, texturas e fontes de terceiros (CC0 / OFL): ver `assets/ASSETS.md`. |

## O que um filme precisa oferecer

```js
const pipe = new Pipeline(canvas, 1080, 1920);
const S = await createStudio(pipe, '../../lib/3d/assets/');
const stage = {
  scene: S.scene, camera: S.camera, floor: S.floor, floorUniforms: S.floorUniforms, mirror: S.mirror,
  prepare(t) {},            // uma vez por quadro: redesenhar canvases de tela
  update(t) { return { pos, target, fov, focus, aperture }; },   // por amostra: tudo a partir de t
  sample(s) { S.sampleLights(s); },                              // por amostra: luzes na sua área
  glassLayers: () => [[...], [...]],                             // opcional: vidro atrás de vidro
};
window.seek = (t) => pipe.render(stage, t, { spp, fps, typeTex, frame });
```

`update()` é chamada N vezes por quadro em instantes diferentes: nada de estado acumulado, relógio
ou `Math.random`. `pipe.acabamento = 'motor' | 'limpo'` liga ou desliga grão, vinheta, halação e
aberração (master limpo para grade externa).

## Qualidade e tempo (Apple M1 Pro, Chromium headless em ANGLE Metal, 1080×1920)

Qualquer GPU com WebGL 2 serve, inclusive as integradas; os tempos abaixo são de referência e
variam com a máquina. Na prática, use os presets prontos: `npm run contato`, `npm run previa`
(128 spp) e `npm run final` (192 spp), que aceitam `--spp N` para trocar a qualidade.

| Uso | spp | Render por quadro |
|---|---|---|
| Bloqueio / folha de contato | 16–24 | 0,06–0,12 s |
| Prévia em movimento | 128 | ~0,4 s |
| Final | 192–256 | ~0,6–0,9 s |
| Foto de estilo | 768 | 2–3 s |

Vidro com `transmission` custa 3–8× (cada camada de vidro é mais uma passada da cena). A captura do
quadro (screenshot PNG → ffmpeg) soma ~0,4 s por quadro. Meça com `readPixels` no fim do quadro:
sem isso a GPU ainda não terminou e o tempo medido sai menor que o real.

## Boas práticas (e as armadilhas que elas evitam)

- **`scene.environment` ignora `material.envMapIntensity`.** Para um material ter a sua dose do
  estúdio (chão em 0, vidro antirreflexo em 0,1), atribua o mapa em `material.envMap`
  (`studio.applyEnv`). Sem isso: clarão do octabox na tela e sombras lavadas no chão claro.
- **Luz pontual que treme imprime N pontinhos em superfície polida.** Vidro e cromado recebem o
  brilho só do ambiente (`envSpecOnly`); o brilho direto no metal acetinado pode ser atenuado por
  mundo (`flaggedSpec` + `DIRECT_SPEC`).
- **Bloom por limiar não serve em cena clara** (o ciclorama inteiro brilha). O bloom sai de um passe
  só de emissivos: objetos na camada 1 (`mesh.layers.enable(1)`).
- **Vidro atrás de vidro some** (o `transmission` do three só enxerga opacos). `glassLayers` renderiza
  por camadas, de trás para a frente.
- **Profundidade de campo precisa de amostras.** Abaixo de ~128 spp o desfoque de texto mostra o
  padrão de pontos; o padrão gira a cada quadro para não virar listra fixa.
- **Pretos**: o fundo escuro emite 0,0004–0,02 linear. Confira o percentil 5 (≤ 8/255).
- **Contraste de legenda se mede, não se estima**: `render.mjs --contrast` lê o quadro renderizado
  atrás de cada legenda (WCAG, pior 5 % da caixa).
- **Canvas de tela grande é caro por quadro**: redesenhe em `prepare()`, nunca em `update()`.
