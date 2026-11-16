# Design · divulgação (identidade v2: tinta-petróleo + vidro)

Pedido do cliente: trocar as cores (o fundo pode ser outra cor), usar mais glassmorphism, seguir leis de design,
UX e UI, qualidade muito alta e nada de "cara de IA". A história, as cenas, a lógica de tempo (cada cena presa à
palavra falada) e o desenho de som ficaram iguais; mudou a identidade visual inteira.

## Tokens

| token | valor | uso |
|---|---|---|
| `escuro` (base) | `#08161A` | fundo, texto sobre coral (`P.ink`) |
| `escuro2` (meio) | `#0E2A30` | meio-tom radial do fundo |
| campo petróleo | `#2A9D8F` @ 25% | luz difusa atrás dos painéis (x 0,32 · y 0,62) |
| campo âmbar | `#F4A259` @ 12% | luz quente embaixo à direita (x 0,88 · y 0,80) |
| campo coral | `#FF6B4A` @ 8% | luz fraca embaixo à esquerda (x 0,10 · y 0,94) |
| `texto` | `#F4F1EC` | texto primário (branco quente) |
| `texto2` | `#A9C1C4` | texto secundário |
| `destaque` | `#FF6B4A` | o ÚNICO destaque: palavra-chave da cena, estado ativo, CTA |
| `destaqueClaro` | `#FF8466` | ativo/pressionado (botão do CTA, ripple) |
| textura | `#6F8C90`, `#3E5A5E` | texto-textura de interfaces (régua, gutter, títulos de janela) |
| sintaxe | `#F4A259` palavra-chave, `#9ED9CF` string, `#5F7A7E` comentário | código (textura) |

Fonte única de verdade: `window.MARCA` em `index.html` (lida por `lib/cena.js`; o filme lê `S.MARCA.cores`).
O vermelho antigo (`#B3121B` / `#E2474D`) não aparece mais em nenhum lugar do filme. Os campos de luz são
`marca.cores.campos` e o fundo é `S.bgCampos` (os campos derivam devagar com ruído com semente). Pós: grão fino em
`soft-light` (não lava os pretos) + vinheta.

Banidos de propósito (clichês de vídeo de IA): degradê neon roxo/azul, lens flare, partículas/brilhos genéricos,
glow pesado, anel iridescente (`bloomRing` saiu), varredura de luz na tela inteira (`lightSweep` saiu), fantasmas
coloridos no glitch do gancho. A única separação de cor (aberração cromática) é a da virada, em ~2,22 s, num quadro
nítido (sem desfoque de movimento, para não virar véu). As únicas telas de outra cor são as reais: quadros do
demo "Fluxo" (roxo é a marca dele), capa do guia em PDF e a página do GitHub.

## `S.vidro(ctx, x, y, w, h, opts)` (lib/cena.js)

Glassmorphism de verdade, não um retângulo translúcido:
1. copia do canvas a região atrás do painel (caixa no espaço do dispositivo + margem de 2,2σ), reduz a 1/4 e
   desfoca (`blur` 24-32 px na escala do filme), devolve recortada no retângulo arredondado;
2. sombra projetada só por fora (deslocamento 20 px, desfoque 48 px, preto 35%);
3. fumê (`smoke`, cor da base) para garantir contraste + branco 8-12% (`tint`);
4. sombra interna sutil embaixo, reflexo especular na borda de cima (faixa + filete), borda de 1,5 px em degradê
   (clara no canto superior esquerdo -> transparente no inferior direito), ruído fixo de 2,5% em `overlay`;
5. `accent` opcional: borda coral para o estado ativo.

Função pura das entradas e do que já está pintado (os canvases auxiliares são rascunho, limpos a cada uso).
Respeita transformação (escala, rotação, `scaleX` do giro) e `globalAlpha`; `src` lê o fundo de outro canvas
(usado quando o painel é desenhado numa camada transparente). Custo medido: contato de 52 quadros com desfoque
de movimento a ~1,6 quadro/s, igual ao filme antigo.

Receitas no filme (`GL` em film.js), uma por profundidade: `panel` (editor, linha do tempo, terminal, forma de
onda: fumê 0,42, branco 0,07), `card` (moldura das variações, LUFS, trilho de palavras, chave, CTA, logo: 0,30 /
0,09), `chip` (selos, chips de comando, modelos, PDF, `wt(...)`: 0,30 / 0,11, sombra menor). Camadas de
profundidade: campos de luz (fundo) -> vidro (meio) -> conteúdo e títulos (frente). O vidro refrata de verdade o
que passa atrás: as três variações descem por trás do terminal (S5), o selo "GRÁTIS · OPEN SOURCE" fica por cima
dos whips, as miniaturas caem por trás do trilho de vidro (S4c).

## Leis aplicadas -> onde

| lei | onde no filme |
|---|---|
| **Hierarquia + escala modular 1,25** | `TY = 36/44/56/70/88/110/138/172/216/270`. Por cena, 2 tamanhos de display + 1 rótulo: S1 138/172 · S2 138/172 · S3 110/172 · S4a 110/138 · S4b 110/138 + karaokê 56 · S4c 110/138 + rótulo 36 · S5 110/138 + chip 44 · S6 270/110 + selo 56 · S7 110/270 + chips 56 · S8 110 · S9 110 + botão/endereço 56 + rótulo 36. Texto de interface real (régua, gutter, título de janela, escala do medidor) é textura e fica fora da contagem. |
| **Grade de 8 px** | posições e medidas de painéis, chips, linhas de base (`Y1 = 432`, `Y2 = 600`, selo em 220..292, painéis em 704..1464). |
| **Alinhamento consistente** | tudo centrado no eixo x = 540; o CTA inteiro centrado em x = 496 (o trilho de ícones do Reels/TikTok ocupa x > ~920). |
| **Contraste WCAG AA** | `docs/contraste.mjs` calcula o pior caso (ponto mais claro do fundo no filme inteiro, vidro incluído). Resultado abaixo: todo texto que precisa ser lido >= 4,5:1. Coral nunca é texto pequeno sobre vidro (3,4:1): no vidro, coral só aparece como borda, preenchimento (com texto tinta 6,5:1) ou glifo grande. |
| **Tamanho mínimo** | tudo que precisa ser lido no celular tem >= 36 px (rótulos) e as palavras da mensagem >= 56 px; títulos 110-270 px. |
| **Texto-textura secundário** | código (32 px, 82% de opacidade, 0,6 px fora de foco, cores de sintaxe suaves), régua/gutter/títulos de janela (16-26 px em `#6F8C90`), página do GitHub dentro do celular: nunca competem com o título. |
| **Gestalt: proximidade / região comum / semelhança** | o vidro agrupa: as redes (Reels · TikTok · Shorts) moram no rodapé do card do LUFS; as palavras da fala moram no trilho de vidro; botão + endereço do CTA no mesmo card; chips de modelos com a mesma forma; toda palavra-chave tem a mesma cor e o mesmo "slam". |
| **Von Restorff** | um destaque só (coral): a palavra-chave de cada cena, o estado ativo (agulha, cursor de texto, palavra atual do karaokê, chip de opção ativo, chave "Grátis", anéis no GitHub) e o botão do CTA. Nada mais é coral. |
| **Miller (<= 4 itens)** | modelos abertos 6 -> 4 (Ollama, Qwen3-Coder, Whisper, ffmpeg); S6 com 4 grupos (contador, celular, card LUFS+redes, selo); CTA com 4 grupos (logo, marca, card do CTA, selo). |
| **Hick / Fitts** | um único CTA, sem alternativas: botão coral 768 x 120 px "Procure no GitHub ->", o maior alvo do filme, com o endereço logo abaixo no mesmo card; ele é "apertado" quando a voz diz "GitHub". |
| **Jakob** | interfaces que o público já conhece: janela com três pontos, editor com gutter e realce de sintaxe, linha do tempo de editor (V1/V2/A1/A2, agulha), terminal `zsh` com `$`, chave tipo iOS, cursor de sistema, página real do GitHub, estrela do GitHub. |
| **Estética-usabilidade** | paleta contida, vidro com luz física (borda clara em cima à esquerda, reflexo em cima, sombra embaixo), grão fino, nada de neon: o filme parece cuidado, e por isso parece confiável. |
| **Zonas de segurança** | nada importante em y < 220 (o selo fica em 220..292) nem em y > 1540 (o que há de mais baixo: selo PRONTO PRA POSTAR até 1536, celular do GitHub até ~1534). |
| **Movimento com propósito** | entradas ease-out (`rise` 380 ms; molas com massa 1,1 e amortecimento alto, sem passar do ponto), saídas ease-in (220 ms, desfocando), movimentos de UI 200-600 ms, cascatas de 28-80 ms (letras de PROGRAMADO., redes, variações, modelos 170 ms porque seguem a fala). No máximo 2 movimentos primários por vez (título + painel); o tremor de câmera é secundário e caiu 40%. Saídas nunca atravessam a zona do título: o leque do PDF agora recua no lugar (escala 0,8, desfoque, some) atrás do celular. |
| **Cortes** | whips com os dois planos inteiros na tela, curva quintic (mais tempo nítido nas pontas) e rastro de 36 px; cada cena já tem o painel no lugar durante o whip (forma de onda pré-carregada, "DÁ PRA FAZER" entra com o whip). Dois momentos estruturais: a virada (RGB) e o CTA (respiro de luz quente 12%, sem flash branco). |

## Contraste (saída de `node exemplos/divulgacao/docs/contraste.mjs`)

```
pior fundo, zona de títulos: #0F2F33 (L = 0.0237)
pior fundo, zona de conteúdo: #164848 (L = 0.0525)
```

| papel | onde | fundo | contraste | alvo | |
|---|---|---|---|---|---|
| título (branco quente #F4F1EC) | fundo, zona de títulos | #0F2F33 | 12.65:1 | 4.5:1 | ok |
| palavra-chave coral #FF6B4A | fundo, zona de títulos | #0F2F33 | 5.06:1 | 4.5:1 | ok |
| secundário #A9C1C4 | fundo, zona de títulos | #0F2F33 | 7.54:1 | 4.5:1 | ok |
| palavra-chave coral no CTA ("Criativos") | fundo, CTA y 700-832 | #11383B | 4.51:1 | 4.5:1 | ok |
| karaokê / rótulos #F4F1EC | fundo, zona de conteúdo | #164848 | 9.09:1 | 4.5:1 | ok |
| texto #F4F1EC no vidro panel | vidro panel (pior fundo) | #214143 | 9.78:1 | 4.5:1 | ok |
| secundário #A9C1C4 no vidro panel | vidro panel (pior fundo) | #214143 | 5.83:1 | 4.5:1 | ok |
| texto #F4F1EC no vidro card | vidro card (pior fundo) | #274B4C | 8.51:1 | 4.5:1 | ok |
| secundário #A9C1C4 no vidro card | vidro card (pior fundo) | #274B4C | 5.07:1 | 4.5:1 | ok |
| texto #F4F1EC no vidro chip | vidro chip (pior fundo) | #2C4F50 | 7.99:1 | 4.5:1 | ok |
| secundário #A9C1C4 no vidro chip | vidro chip (pior fundo) | #2C4F50 | 4.77:1 | 4.5:1 | ok |
| texto tinta #08161A no coral (chip ativo, botão CTA) | preenchimento coral | #FF6B4A | 6.54:1 | 4.5:1 | ok |
| texto tinta #08161A no coral ativo #FF8466 | botão pressionado | #FF8466 | 7.67:1 | 4.5:1 | ok |
| textura #6F8C90 no vidro panel (de propósito < 4,5) | vidro panel (só textura) | #214243 | 3.06:1 | 2:1 | ok |
| coral #FF6B4A no vidro card (só >= 70 px ou ícone) | vidro card (texto grande) | #274B4C | 3.40:1 | 3:1 | ok |

A vinheta do pós escurece ainda mais as bordas, então os números reais no vídeo são iguais ou melhores. Conferência
por pixel: na virada (2,225 s x 2,6 s) o interior do painel mede (40,56,59) x (41,55,56): o "véu cinza" antigo sumiu.

## Voz trocável

A narração vai mudar (Kokoro com grafia fonética -> Fish Audio com grafia normal). Toda busca de palavra usa
`S.wt2(VO, [grafias...], { after })`, com âncoras relativas (cada palavra é procurada depois da anterior) e os
cortes derivados da fala (`s5 = outra - 0,19`, `s6 = sessenta - 0,15`, nada de segundos fixos). Grafias aceitas:
`taimlain/timeline/...`, `guitirrabi/github/...`, `procura/procure`, `cria/crie`, `sessenta/60`, `graca/gratis`,
`pdf/pedeefe`, `clipe/clip`, `um/1`. Nenhum nome de voz na tela: "voz: locutor 1" -> "locutor 2" e
`--voz locutor-2.wav`.

## Correções na biblioteca (lib/cena.js)

- `vidro()` (acima), `bgCampos()` (fundo de tinta + campos; `bgDark` usa ele quando a marca define `campos`),
  `C.text` / `C.text2` (tokens `texto` / `texto2`), `grain(..., comp)` (modo do grão), `wt` aceita lista + `wt2`.
- Nome da marca escuro sobre escuro no tema escuro (o "Fluxo" ao lado do ícone na variação "cor"): `txt()` agora,
  no tema escuro, olha o que já está pintado atrás de um texto em cor de tinta (>= 40 px) e, se for escuro ou
  transparente, usa a cor de texto claro. Texto em card claro continua escuro. `assets/variantes/escuro.jpg` foi
  renderizado de novo com a correção (demo, tema escuro, 7,0 s).
