# 11. 3D fotorrealista no navegador

[← 10. Look-dev](10-look-dev.md) · [Índice](README.md) · Próximo: [12. Voz dirigida →](12-voz-dirigida.md)

Este capítulo explica como o kit produz imagem com cara de estúdio usando three.js, WebGL e a GPU que você já tem. O código está em [`lib/3d/`](../lib/3d/) e o filme que o usa está em [`exemplos/bancada/`](../exemplos/bancada/).

O segredo não é traçado de raios: é rasterização comum, repetida muitas vezes por quadro, com uma coisa diferente a cada vez. A soma dessas repetições entrega o que normalmente se atribui a motores caros (desfoque de lente de verdade, desfoque de movimento e sombra suave) rodando no navegador, em qualquer GPU com WebGL 2.

## 11.1 A ideia: uma câmera que soma

Uma câmera real não registra um instante nem um ponto. O obturador fica aberto por um tempo, e a luz entra por uma abertura que tem área. A imagem é a **média** de tudo o que passou.

O pipeline faz o mesmo. Um quadro do filme é a média de *N* renders completos da cena, somados num alvo de ponto flutuante. *N* é o número de amostras por quadro, abreviado **spp**. O filme usa de 192 a 768.

A técnica é antiga: é o *buffer de acumulação* de Haeberli e Akeley (1990), filho do traçado de raios distribuído de Cook, Porter e Carpenter (1984). O que o kit faz é usá-la para tudo ao mesmo tempo, no mesmo laço.

## 11.2 O que muda a cada amostra

| O que varia | Como | O que se ganha |
|---|---|---|
| **Posição da câmera na abertura da lente** | Pontos numa espiral sobre um disco; a projeção é cisalhada para o plano de foco não sair do lugar | Profundidade de campo de lente fina. Correta atrás de vidro e em reflexos, onde o desfoque de pós-processamento erra |
| **Meio pixel** | Deslocamento gaussiano dentro do pixel | Antisserrilhado |
| **Instante dentro do obturador** | Tempos estratificados entre a abertura e o fechamento | Desfoque de movimento real: o que gira rápido borra, o que está parado fica nítido |
| **Posição de cada luz dentro da sua área** | Um ponto diferente do softbox por amostra | Sombra suave de luz de área, com um mapa de sombra comum |
| **Direção da luz de céu** | Uma direção do hemisfério por amostra | Oclusão de ambiente de verdade |
| **Micro-normal do chão** | A normal do plano do espelho treme um pouco | Reflexo acetinado, que endurece perto do contato |

A lente, em números do código:

- campo de visão vertical a partir da distância focal: `fov = 2 · atan(18 / mm)` (sensor de 36 mm na vertical);
- raio da abertura: `focal / (2 · f-stop)`;
- cisalhamento da projeção para o foco na distância *F*: `P[8] = −dx · P[0] / F` e `P[9] = −dy · P[5] / F`.

Dois detalhes que fazem diferença:

- **O padrão de amostras gira a cada quadro.** Sem isso, o desfoque mostra as mesmas estrias em todos os quadros, e o olho as pega como defeito fixo.
- **Perto das bordas do quadro, parte da abertura é escondida.** Isso deforma os discos de desfoque em "olho de gato", como numa objetiva real.

Tudo isso é função pura de (tempo, índice da amostra). Não há relógio nem `Math.random`. O contrato do render continua valendo.

## 11.3 Luz de estúdio

O estúdio (`lib/3d/studio.js`) tem quatro luzes e um ambiente.

| Luz | Papel | No mundo escuro | No mundo claro |
|---|---|---|---|
| **Principal** | Forma do objeto | Suave e moderada, de frente em três quartos | Mais forte e mais fechada, em três quartos de trás, formando um foco de luz no chão |
| **Recorte** | Separa o objeto do fundo | Verde-petróleo, mais de 1 stop acima da principal | Fraca |
| **Acento** | A cor da marca | Coral, rasante | Desligada |
| **Céu** | Preenchimento com sombra | Baixa | É o preenchimento principal |
| **Ambiente (HDRI)** | Só reflexo | Intensidade perto de 0,5, com o chão do estúdio escurecido | Perto de 0,42 |

**O softbox calculado.** O reflexo retangular que corre na borda de uma tela é o que mais diz "estúdio". Em vez de girar o HDRI até dar sorte, o filme calcula, para cada plano, a direção que o vidro daquela tela espelha para aquela câmera (`mirrorDir`) e assa um cartão de luz exatamente ali (`bakeEnvironment`).

**Três mundos de luz no filme.** Escuro (gancho), claro cor de osso (o método) e escuro de novo (CTA). A troca de mundo coincide com a virada do roteiro. Uma só gradação de cor atravessa os dois: sombras levemente puxadas para o verde-petróleo, altas para o quente.

## 11.4 Materiais

Todos são físicos (`MeshPhysicalMaterial`). O que conta é o defeito.

| Material | Receita | O detalhe que convence |
|---|---|---|
| **Alumínio anodizado** | Rugosidade média com um mapa de grão variando-a | A faixa de luz na aresta chanfrada |
| **Vidro de tela** | Verniz (`clearcoat`) com rugosidade muito baixa e mapa de digitais | As digitais só aparecem onde há reflexo |
| **Vidro maciço** | Transmissão total, espessura, índice de refração 1,49, cor de atenuação; aresta com material próprio | A aresta mais escura e colorida que a face |
| **Papel** | Rugosidade alta, fibra no mapa de normais, leve curvatura | A sombra suave entre páginas |
| **Chão escuro** | Madeira escura (textura CC0) com reflexo renderizado por câmera espelhada | O reflexo que se desfaz com a distância |
| **Chão claro** | Ciclorama cor de osso com fibra de papel e foco de luz | A sombra de contato de cada objeto |

Regras de modelagem (`lib/3d/models.js`):

- **Toda aresta tem raio.** Quina viva é a assinatura de computação gráfica. A função `slab()` extruda qualquer contorno com chanfro arredondado.
- **Cantos de curvatura contínua.** Os aparelhos usam contorno superelíptico: o realce corre pela esquina sem "quebrar", como em produto industrial.
- **Unidades em centímetros.** Um celular tem 7,16 × 14,96 cm. Lente e abertura passam a significar o que significam numa câmera.
- **Aparelhos genéricos.** Celular e notebook sem logotipo e sem modelo de terceiros.

## 11.5 Telas, legendas e acabamento

**Telas com conteúdo real.** A tela é um canvas desenhado em função do tempo, aplicado como cor e como emissão. No filme, as telas mostram quadros reais do exemplo `demo`, as variantes reais, o `roteiro.json` real, comandos reais do kit e a página real do repositório. Uma luz retangular fraca na frente da tela, com a cor do conteúdo, faz a tela iluminar o teclado.

**Legendas em 2D por cima.** Curtas, em caixa baixa, em Geist com uma palavra de acento em Instrument Serif itálico. Cada palavra entra no instante em que é dita. Elas existem para quem assiste sem som.

**Contraste medido.** A tinta da legenda é escolhida pelo que está atrás dela, e o renderizador mede a razão de contraste no quadro pronto:

```bash
node lib/3d/render.mjs --film exemplos/bancada --contrast
```

No filme, a tinta ficou entre 8,2:1 e 17,9:1, e a palavra de acento entre 4,96:1 e 11,0:1, acima do critério AA da WCAG (4,5:1). Rode a medição sempre antes do render final: é o jeito seguro de garantir legenda legível sobre qualquer fundo.

**Um passe de acabamento.** Depois da soma, na ordem: bloom e halação (só do buffer de emissivos), aberração cromática lateral, vinheta, exposição, mapeamento de tons de filme (ACES), gradação, legendas, grão e dither. O bloom sai de um passe separado em que tudo é preto, menos as telas e os LEDs. No mundo claro, um bloom por limiar de brilho faria o fundo inteiro brilhar.

**Dois acabamentos do mesmo render.** `motor` é o filme finalizado. `limpo` desliga grão, vinheta, halação e aberração, para quem quer finalizar em outro programa. O renderizador grava os dois de uma vez com `--limpo`.

## 11.6 Armadilhas conhecidas e como evitar

O motor já resolve cada uma destas armadilhas. A tabela explica o porquê de cada decisão e serve de referência quando você escrever o seu próprio filme ou estender `lib/3d`.

| Armadilha | Sintoma | Como evitar |
|---|---|---|
| **`scene.environment` ignora `material.envMapIntensity`** | Clarão de softbox na tela do notebook; sombras lavadas no chão claro | Atribuir o mapa de ambiente direto em `material.envMap`, com a dose de cada material |
| **Luz que se move imprime pontos em superfície polida** | *N* pontinhos brilhantes num vidro ou numa esfera cromada | Vidro e polidos recebem brilho só do ambiente (`envSpecOnly`) |
| **Bloom por limiar em cena clara** | O ciclorama inteiro brilha | Bloom só de emissivos, em passe próprio |
| **Vidro atrás de vidro some** | A segunda placa desaparece | A transmissão do three.js só enxerga objetos opacos. O pipeline renderiza o vidro em camadas, de trás para a frente (`glassLayers`) |
| **Poucas amostras no desfoque** | Padrão de pontos em texto desfocado | 128 spp é o piso; 192 a 256 em movimento; 768 em quadro parado |
| **Vidro falso** | Blocos de cor com borda acesa, que leem como sabonete | Transmissão e atenuação de verdade, e algo com textura *atrás* do vidro para ele refratar |
| **Objetos flutuando no mundo claro** | Uma fresta clara de 12 a 18 px entre o objeto e a sombra | Decalque de sombra de contato por objeto |
| **Fundo "claro" que é cinza** | Mundo claro com cara de vazio técnico | Osso quente no lugar de cinza neutro, e um foco de luz que deixa os cantos caírem cerca de um stop e meio |
| **Legenda sobre o assunto** | Texto em cima do celular | Uma linha de base para as legendas e o **assunto** desce; nunca o contrário |
| **Quadro frontal** | Uma régua de pinos vista de frente parece gráfico de barras 2D | Girar o objeto e a câmera; luz rasante para as sombras encherem o quadro |
| **Movimento que chega antes da hora** | A transformação já estava 87% pronta 250 ms antes do impacto | Segurar, e resolver em 2 quadros no início audível da palavra |
| **Canvas de tela grande redesenhado por amostra** | Render dezenas de vezes mais lento | Redesenhar uma vez por quadro (`prepare`), nunca por amostra |
| **Cronômetro que mente** | Tempos de render bons demais | A GPU ainda não terminou. Ler um pixel no fim do quadro antes de parar o cronômetro |

## 11.7 Comandos

Todos partem da raiz do repositório.

```bash
# tempos e eventos de som a partir da fala -> trilha.json e out/<filme>/hits.json
node lib/3d/render.mjs --film exemplos/bancada --meta

# folha de contato (dois quadros por plano) e meia folha "celular"
node lib/3d/render.mjs --film exemplos/bancada --contact --spp 24

# contraste de todas as legendas
node lib/3d/render.mjs --film exemplos/bancada --contrast

# quadros avulsos em qualidade alta
node lib/3d/render.mjs --film exemplos/bancada --at 2.6,10.5 --spp 256

# prévia a 30 fps e final a 60 fps, já com o áudio mixado
node lib/3d/render.mjs --film exemplos/bancada --range 0:35 --fps 30 --spp 128 --crf 20 \
  --mp4 entrega/previas/bancada-previa.mp4 --audio exemplos/bancada/audio/mix.wav
node lib/3d/render.mjs --film exemplos/bancada --range 0:35 --fps 60 --spp 192 --crf 18 \
  --mp4 entrega/finais/bancada.mp4 --audio exemplos/bancada/audio/mix.wav
```

Os mesmos passos pelos atalhos do kit, que funcionam igual em Windows, macOS e Linux:

```bash
npm run contato -- exemplos/bancada   # folha de contato -> out/exemplos/bancada/contato.jpg
npm run audio   -- exemplos/bancada   # eventos -> trilha -> efeitos -> mixagem
npm run previa  -- exemplos/bancada   # áudio + 30 fps, 128 amostras -> entrega/previas/
npm run final   -- exemplos/bancada   # áudio + 60 fps, 192 amostras -> entrega/finais/
npm run checar  -- entrega/finais/bancada.mp4   # resolução, fps, áudio, -14 LUFS, pico
```

`previa` e `final` aceitam `--de S --ate S` (renderizar só um trecho, em segundos), `--spp N` (amostras por quadro), `--fps N` e `--sem-audio` (usa a mixagem que já existe). Por exemplo, para conferir só o gancho em qualidade final:

```bash
npm run final -- exemplos/bancada --de 0 --ate 4
```

No macOS e no Linux, os mesmos passos também existem no `Makefile`: `make contato3d`, `make contraste3d`, `make audio3d`, `make previa3d` e `make final3d`, com `FILME=exemplos/bancada`. As variáveis `SPP`, `FPS` e `CRF` trocam a qualidade, `SEM_AUDIO=1` usa a mixagem existente e `LIMPO=1` grava também o master sem grão nem vinheta (veja `scripts/finalizar3d.sh --help`).

**Sistemas e GPU.** O motor roda em Windows 10 e 11, macOS e Linux, no Chromium do Playwright, e usa a GPU por WebGL 2; uma placa integrada é suficiente, e o `lib/3d/gpu.mjs` escolhe o caminho da GPU de cada sistema. Para confirmar que o Chromium enxerga a sua placa, rode `npm run verificar`. Os tempos deste capítulo são de uma máquina de exemplo, um notebook com Apple M1 Pro.

Para abrir o filme no navegador e andar pelo tempo com as setas, sirva a raiz do repositório com qualquer servidor estático e abra `exemplos/bancada/index.html`.

## 11.8 Desempenho e predefinições

Exemplo medido num notebook com Apple M1 Pro e 16 GB, Chromium sem interface, 1080×1920. Em outra máquina, os tempos mudam com a placa de vídeo.

| Uso | Amostras (spp) | Render por quadro |
|---|---|---|
| Bloqueio e folha de contato | 16 a 24 | 0,06 a 0,12 s |
| Prévia em movimento | 128 | cerca de 0,4 s |
| Final | 192 a 256 | 0,6 a 0,9 s |
| Foto de estilo | 768 | 2 a 3 s |
| Plano com vidro maciço | 192 | cerca de 4,5 s |

A captura do quadro e a codificação somam uns 0,4 s por quadro. O filme inteiro, 35 s a 60 fps com 192 amostras, leva de 35 a 40 minutos. A prévia a 30 fps com 128 amostras leva perto de 14 minutos.

Como escolher as amostras:

- A 60 fps, o obturador cobre metade do tempo de um quadro de 30 fps. Dá para usar menos amostras por quadro com o mesmo resultado percebido.
- Vidro com transmissão multiplica o custo por 3 a 8. Use onde ele conta a história.
- Se a máquina for mais fraca, baixe as amostras antes de baixar a resolução. Ruído fino de desfoque incomoda menos que imagem mole.

## 11.9 Como escrever um filme com `lib/3d`

O filme é uma página (`index.html`) que carrega um módulo (`film.js`). O módulo monta o estúdio, descreve os planos e expõe `window.seek(t)`.

```js
import { Pipeline } from '../../lib/3d/pipeline.js';
import { createStudio } from '../../lib/3d/studio.js';
import { buildPhone } from '../../lib/3d/models.js';

const pipe = new Pipeline(canvas, 1080, 1920);
const S = await createStudio(pipe, '../../lib/3d/assets/');

const stage = {
  scene: S.scene, camera: S.camera, floor: S.floor,
  floorUniforms: S.floorUniforms, mirror: S.mirror,
  prepare(t) { /* uma vez por quadro: redesenhar as telas */ },
  update(t)  { /* por amostra: posicionar objetos e devolver a câmera */
    return { pos, target, fov, focus, aperture };
  },
  sample(s)  { S.sampleLights(s); },   // por amostra: cada luz num ponto da sua área
};

window.seek = (t) => pipe.render(stage, t, { spp, fps, typeTex, frame });
window.filmReady = true;
```

O passo a passo usado em A bancada:

1. **Carregue o `vo.json` e monte os tempos.** Uma tabela `T` com o instante de cada palavra que importa, e uma tabela `CUT` com os cortes: o início da frase menos dois quadros.
2. **Descreva cada plano como um objeto** com quatro partes: o mundo de luz, o que as telas mostram em *t*, a função `at(t)` que posiciona objetos e devolve a câmera, e a legenda.
3. **Escreva a câmera em linguagem de fotografia.** Uma função `camOf(posição, alvo, mm, ponto de foco, f-stop)` evita pensar em matrizes.
4. **Use `on()` para tudo que precisa bater na palavra.** É o início audível medido no áudio, e não o `t0` da transcrição.
5. **Liste os eventos de som ao lado dos eventos de imagem.** O filme expõe `HITS_S` (segundos, rótulo, som), e o `--meta` do renderizador grava isso para os scripts de áudio.
6. **Renderize a folha de contato a cada mudança.** Com 24 amostras, sai em segundos.
7. **Renderize tiras densas das ações.** Uma folha de contato não mostra se o giro trava com peso. Uma tira a 15 fps sobre a ação mostra.

`update()` é chamada *N* vezes por quadro, em instantes diferentes. Nada de estado acumulado.

## 11.10 Escopo do motor

Para planejar o seu filme, tenha em mente o que o motor faz e como ele escala:

- **Iluminação direta com sombra suave e oclusão de céu.** Luz rebatida e cáusticas entram como refinamento opcional ([seção 10.5](10-look-dev.md)).
- **Refração em espaço de tela.** Ideal para quadros parados e câmera calma em volta de vidro.
- **Um navegador, uma GPU.** O render acontece numa máquina só; filmes de 30 a 35 s são a escala natural de um anúncio.
- **Tempo de render depende da GPU.** Os números da seção 11.8 são de um notebook com Apple M1 Pro, como exemplo; cada máquina terá os seus tempos. Para ganhar velocidade, baixe as amostras antes da resolução.
- **Texto pequeno em tela desfocada** pede mais amostras para um desfoque limpo.

---

Próximo: [12. Voz dirigida →](12-voz-dirigida.md)
