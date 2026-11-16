# A bancada — rodadas de crítica

Notas de 1 a 10 sobre folhas de contato (2 quadros por plano, 20 spp) e a meia-folha "celular"
(`out/exemplos/bancada/contato.jpg`, `celular.jpg`), mais seis quadros a 128 spp na rodada 3.
Régua: 8 = eu colocaria no ar; 10 = não distingo de um filme de produto de estúdio.
A sincronia de som é nota de construção (cada evento do `HITS_S` sai do mesmo `wt()` que move a
imagem); não ouvi a mixagem.

## Rodada 1 — primeiro bloqueio dos 16 planos

| Critério | Nota |
|---|---|
| Gancho (0–3 s) | 7 |
| Leitura no celular | 6 |
| Realismo / materiais | 6,5 |
| Câmera e montagem | 5,5 |
| Tipografia | 7 |
| Variedade | 8 |
| Marca | 7 |
| Sincronia de som | 8 |
| "Premium, não IA" | 6,5 |

Os três piores:

1. **Planos 4 e 8 (notebook no mundo claro) eram um borrão escuro.** O teclado desfocado ocupava
   60 % do quadro e o texto digitado ficava no quarto de cima, atrás da legenda. → notebook
   prateado no mundo claro, enquadramento refeito, legenda fora do código.
2. **Plano 2 (tampa fechando) ilegível:** preto sobre preto. → 50 mm mais aberta, recorte forte na
   tampa, alumínio um tom acima só nesse plano.
3. **Planos 7 e 9: a legenda caía em cima do topo do celular;** plano 10 mostrava a placa como uma
   faixa preta; plano 6 pequeno no quadro. → celular 130 px mais baixo, placa clara, câmera do 6
   mais perto.

## Rodada 2

| Critério | Nota |
|---|---|
| Gancho | 7,5 |
| Leitura no celular | 7 |
| Realismo / materiais | 7 |
| Câmera e montagem | 6,5 |
| Tipografia | 7,5 |
| Variedade | 8,5 |
| Marca | 7,5 |
| Sincronia de som | 8 |
| "Premium, não IA" | 7 |

Os três piores:

1. **Plano 4 ainda errado:** a linha digitada ficava no alto da tela e o resto era fundo vazio.
   → o bloco de código desceu na tela (a linha digitada cai no terço de baixo, junto das teclas),
   macro de 100 mm como no lookdev, legenda clara sobre a parte escura.
2. **Plano 10 (chave):** alavanca pequena, "pago / grátis" fora do quadro, placas ilegíveis.
   → alavanca 40 % maior, gravações mais perto do centro, visor "R$ 0" na frente, as quatro
   placas em duas fileiras e menores.
3. **Legendas sobre tela escura no mundo claro ganhavam um véu osso** (planos 4 e 8) e a do 1b
   brigava com o código. → véu e tinta escolhidos pelo que está atrás da legenda (`dark: true`),
   câmera do 1a/1b mais alta para sobrar ar acima do código.

Também nesta rodada: trilha, efeitos e mixagem rodando pela cadeia do repositório
(-14,0 LUFS, pico -1,3 dBTP).

## Rodada 3 (seis quadros a 128 spp + folha de contato)

| Critério | Nota |
|---|---|
| Gancho | 8 |
| Leitura no celular | 8 |
| Realismo / materiais | 7,5 |
| Câmera e montagem | 7,5 |
| Tipografia | 8 |
| Variedade | 9 |
| Marca | 8 |
| Sincronia de som | 8 |
| "Premium, não IA" | 7,5 |

**Não chegou a "tudo ≥ 8".** Realismo, câmera/montagem e "premium" ficaram em 7,5. Parei aqui para
entregar a prévia aos críticos independentes; o que falta está abaixo.

Os três piores que ficaram:

1. **Realismo no mundo claro.** O chão é procedural (fibra de papel + ruído), sem rebatimento de
   luz nos objetos; a chave, o medidor e as placas são limpos demais (sem desgaste, sem parafuso
   torto, sem poeira).
2. **Montagem só vista em folha de contato.** Não assisti ao filme em movimento: giro do celular,
   queda da tampa, blocos saindo e trocas de foco foram conferidos em quadros parados. Os cortes
   estão nas palavras, mas ritmo e respiro só o vídeo mostra.
3. **Plano 3 (timeline de acrílico)** é o mais fraco: o acrílico é falso (alfa + borda emissiva,
   sem refração) e lê como blocos coloridos, não exatamente como "timeline".

Ajustes da rodada 3 já aplicados antes da prévia: legenda do plano 4 no terço de baixo, placas do
plano 10 reagrupadas, gravações e visor da chave maiores.

---

# Rodada de correções (críticos independentes + voz nova)

Base: a lista de correções dos dois críticos independentes. Narração nova (31,70 s; voz 1 nas frases 1–11, voz 2 de
"O método…" até o fim); filme com 33,90 s. A voz passou por de-esser, compressão 3:1 e ganho de
+1,1 dB na voz 2 (as duas ficaram em −19,6 LUFS; pico −6,1 dBFS; o original está em
`audio/vo_original.wav`). Tudo o que "bate" numa palavra usa `on()`: o início audível medido no
`vo.wav` (ou t0 + 0,10 s), não o t0 do `vo.json`.

## Rodada 4 (folha de contato + contraste medido)

| Critério | Nota |
|---|---|
| Gancho | 8 |
| Leitura no celular | 8 |
| Realismo (escuro / claro) | 8 / 7 |
| Composição | 7,5 |
| Tipografia | 7,5 |
| Montagem e movimento | 8 |
| Consistência | 8 |
| Som (construção; não ouvi) | 8 |
| História sem som | 8,5 |
| CTA | 8 |
| "Premium, não IA" | 7,5 |

Piores três: (1) contraste das legendas medido pela primeira vez e reprovado em 1a, 3, 4, 6, 10 e
11 (de 1,0:1 a 3,8:1); (2) plano 4 com a tampa do notebook atrás da legenda e metade da tela vazia;
(3) a câmera do gancho girava para o código antes de a timeline achatar (dois quadros de tela
preta). Corrigidos: acentos mais escuros no mundo claro (#8F2408 e #094C44), preenchimento do céu
de 1,6 para 2,6 (a zona da legenda deixou de cair no anel escuro do foco de luz), assunto sempre
abaixo de y = 560, giro da câmera amarrado ao achatamento, terminal real na parte de baixo da tela
do plano 4.

## Rodada 5 (folha de contato + tiras densas a 15 fps + contraste)

Contraste (WCAG, pior 5 % da caixa da legenda, medido no quadro renderizado com
`node lib/3d/render.mjs --film exemplos/bancada --contrast`): tinta de 8,2:1 a 17,9:1; palavra de
acento de 4,96:1 (7b) a 11,0:1 (12a). Nenhuma abaixo de 4,5:1.

Tiras densas conferidas: virada (timeline → código cravado em "programado"), tampa, clipes saindo,
Enter (afunda, acende, foco sobe), giro (costas → perfil → frente → trava com sobressalto),
alavanca (recuo, estalo, balanço).

| Critério | Nota |
|---|---|
| Gancho | 8,5 |
| Leitura no celular | 8,5 |
| Realismo (escuro / claro) | 8,5 / 7,5 |
| Composição | 8 |
| Tipografia | 8,5 |
| Montagem e movimento | 8 |
| Consistência | 8 |
| Som (construção; não ouvi) | 8 |
| História sem som | 8,5 |
| CTA | 8 |
| "Premium, não IA" | 8 |

**Um critério continua abaixo de 8: realismo no mundo claro (7,5).** O chão tem foco de luz, fibra
de papel e sombra de contato, mas continua sem rebatimento de luz nos objetos. O plano 3 (trilhos
de vidro) melhorou e ainda é o mais fraco do filme: lê como "peças em trilhos", não de imediato
como timeline.

## Itens dos críticos não aplicados (e por quê)

- **Tirar o chanfro de baixo das peças** (§1.4): o chanfro vem do mesmo perfil extrudado das
  arestas de cima; o decalque de sombra de contato resolve a fresta clara sem mexer na geometria.
- **Tela do notebook em K = 180** (§1.5): ficou em 160 (4.934 × 3.478 px); 180 passa de 21 MP
  redesenhados e reenviados à GPU a cada quadro.
- **"Sem véu" no plano 11** (§1.1): uma legenda ("Guia em PDF.", ~1,2 s) mantém véu osso a 86 %,
  porque a grua passa a tela escura do notebook por trás dela. A primeira e a última legenda do
  plano estão sobre papel limpo, sem véu. Nos mundos escuros o véu ficou (o crítico o pediu fora
  só nos claros), mais forte em 1a e 3 para o contraste passar.
- **7a com "recolor" da mesma tela** (§1.6): usei a variante real `escuro.jpg` (o `--tema escuro`
  do kit) em vez de girar a matiz de `base.jpg`, que seria uma tela inventada.
- **Igualar o brilho (timbre) da voz 2 ao da voz 1** (§0): igualei só o nível; não equalizei.
- **Corte da cena 3 para a tela do 1a** (§1.3, alternativa): mantive o plano físico reconstruído
  (vidro real, tiras com miniaturas e forma de onda, trilhos, lâmina).
- **Estéreo** (§3): sem mudança (o próprio crítico deu baixa prioridade).

## Narração final (32,79 s) e rodada de conferência

A narração foi regravada mais uma vez (entrega mais pausada); o filme passou a 35,00 s. Nada foi
remarcado à mão: cortes, legendas, eventos e sons saem do `vo.json` novo. Conferência: folha de
contato (um quadro por plano) e 30 medidas de contraste, todas ≥ 4,5:1. Imagem aprovada pelo
cliente na prévia 2; as notas da rodada 5 valem.
