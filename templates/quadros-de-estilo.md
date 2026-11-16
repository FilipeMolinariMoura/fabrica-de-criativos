# Quadros de estilo (look-dev)

> Antes de construir o filme, prove o visual em **quatro quadros parados** e em **um teste de movimento
> de 4 s**. É barato errar aqui: um quadro refeito custa minutos; um filme refeito custa horas de render.
> Só comece a montar os planos depois que os quatro quadros forem aprovados por quem **não** os construiu.
> A régua é o quadro de referências (`templates/referencias.md`).

**Projeto:**                      **Rodada / data:**                **Quem construiu:**                **Quem aprova:**

## Os quatro quadros

Escolha quadros que cubram o filme: os mundos de luz, os materiais mais difíceis e o texto na tela.

| # | Quadro | O que ele precisa provar | Arquivo | Amostras por quadro |
| --- | --- | --- | --- | --- |
| 1 | Herói (o plano do gancho) | o objeto principal, a luz e a lente | | |
| 2 | Macro de material | metal, vidro, tela acesa: o detalhe aguenta de perto? | | |
| 3 | O outro mundo de luz (claro, se o 1 é escuro) | o visual se sustenta fora do preto | | |
| 4 | Cartão final com tipografia | texto, marca e CTA legíveis no celular | | |

Para tirar um quadro de um filme 3D (pasta com `index.html` que usa `lib/3d`), no instante em segundos:

```
node lib/3d/render.mjs --film <pasta> --at 2.6,10.5 --spp 256     # salva em out/<pasta>/stills/
```

## Conferência de cada quadro

Marque só o que conferiu no quadro renderizado, em tamanho cheio e também na tela do celular.

| Item | Q1 | Q2 | Q3 | Q4 |
| --- | --- | --- | --- | --- |
| O assunto ocupa mais da metade da largura do quadro | | | | |
| Preto mais escuro em 8/255 ou menos (nada de preto leitoso) | | | | |
| Um plano de foco só; o resto desfoca de verdade | | | | |
| Luz de estúdio com intenção: principal suave, recorte, reflexo passando na aresta | | | | |
| Toda aresta tem raio e pega luz; nada com quina de computador | | | | |
| O material tem defeito (digital no vidro, poeira, desgaste leve) | | | | |
| Sombra de contato: o objeto está pousado, não flutuando | | | | |
| A tela é luz e é legível; o conteúdo é real, não texto de enfeite | | | | |
| Duas famílias tipográficas no máximo; nada de caixa alta pesada | | | | |
| Uma cor de base e um acento | | | | |
| Grão e vinheta discretos; sem faixas no degradê | | | | |
| Legenda com contraste de 4,5:1 ou mais contra o que está atrás | | | | |

## Nota honesta de realismo (1 a 10)

Régua: **8 = eu colocaria no ar; 10 = não distingo de uma foto de produto de estúdio.**
Dê a nota **antes** de olhar a nota da rodada anterior. Se a dúvida é entre duas notas, vale a menor.
Coloque o quadro ao lado de um quadro das referências: é contra ele que se compara, não contra a rodada passada.

| Quadro | Nota | O que ainda parece falso (seja específico: onde, no quadro) | Correção para a próxima rodada |
| --- | --- | --- | --- |
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |

**O pior quadro desta rodada e por quê:**

## Teste de movimento (4 s)

Um plano só, com a câmera e um objeto se movendo, renderizado com a qualidade da prévia.

```
node lib/3d/render.mjs --film <pasta> --range 0:4 --fps 30 --spp 128 --mp4 out/teste-movimento.mp4
```

- [ ] A câmera nunca para e nunca corre
- [ ] O desfoque de movimento aparece no que se mexe rápido, sem fantasma
- [ ] O foco troca de assunto com suavidade
- [ ] Nada pisca, treme ou cintila de um quadro para o outro (grão, reflexo, sombra)
- [ ] Tempo de render por quadro anotado: ____ s (dá para estimar o filme inteiro)

## Rodadas

Não existe número certo de rodadas: o look-dev do filme de exemplo levou nove. Pare quando as notas
passarem de 8, não quando cansar.

| Rodada | Notas (Q1 / Q2 / Q3 / Q4) | O que mudou | O que ainda parece falso |
| --- | --- | --- | --- |
| 1 | | | |
| 2 | | | |
| 3 | | | |

## Aprovação antes de construir

- [ ] Os quatro quadros têm nota 8 ou mais, **dada por quem não construiu** (pessoa ou crítico independente)
- [ ] O que ficou abaixo de 8 está escrito aqui, com a decisão de seguir assim mesmo e o motivo:
- [ ] O teste de movimento foi visto em vídeo, no celular
- [ ] O tempo de render do filme inteiro foi estimado e cabe no prazo

**Aprovado por:**                      **Data:**

Só agora: construir os planos, prender cada corte à palavra falada e seguir para a crítica
(`templates/critica.md`).
