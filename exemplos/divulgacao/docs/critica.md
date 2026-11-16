# Crítica · divulgação (9:16, 31,8 s)

Loop do motion-reel: `render.mjs --contact` (1 quadro por batida, 99 bpm) + folhas de celular em meio tamanho,
`--strip` nas transições, `sfx.mjs` + `mix.mjs` + `--hits` + `sync.py`. Notas de 1 a 10.
`sync.py` mede contra o mix inteiro (a voz gera onsets perto dos acentos); por isso cada rodada também mede
contra o stem de efeitos (`audio/sfx.wav`), que mostra se o som está no quadro.

## Rodada 1
| gancho | leitura | movimento | variedade | marca | som | mín |
|  7  |  6  |  7  |  8  |  8  |  8  |  6  |

- Gancho: quadro 0 já tem "ESSE VÍDEO" + linha do tempo com agulha; mas o quadro do corte (2,22 s) sai quase cinza: o flash da virada lava o editor.
- Leitura: código do editor (29 px), chips da trilha de palavras (36 px), selo `wt(VO,'palavra')`, terminal, réguas do medidor e a opção `--tema` somem no celular.
- Movimento: molas e slams com peso; whips com os dois planos na tela. S4c: metade direita vazia até a palavra ser dita.
- Som: mix -14,0 LUFS, pico -1,2 dBTP. sync.py (mix) 44/74 dentro de 20 ms, mediana 10,3 ms; no stem de efeitos 52/74, mediana 3,7 ms — todos os golpes (thud/impact/pop/bell) no quadro; fora só whooshes (som de pico, onset ambíguo) e camadas sobrepostas.

Piores três:
1. [2,22 s] flash da virada lava o quadro do corte -> o espectador vê um quadro em branco no momento mais importante -> flash 0,7 -> 0,4 com queda cúbica e RGB 34 -> 26 px.
2. [vários] textos pequenos ilegíveis no celular -> código 29 -> 33 px, chips da trilha 36 -> 44 px, selo 34 -> 40 px, terminal 36 -> 41 px, opção de linha de comando 36 -> 44 px, réguas LUFS 28 -> 36/44 px.
3. [10,1-11,8 s] trilha de palavras com a metade direita vazia e cena-herói pobre (f_265 é um quadro de transição) -> vagas tracejadas esperando cada cena, miniaturas 190 -> 210 px, herói = f_241 ("Um toque: hora e dono"). Junto: zoom do GitHub cortava o nome do repositório (foco 420 -> 370) e os tópicos (zoom 1,75 -> 1,12).

Checagens falhas: um corte abre quase em branco (virada). Veredito: OUTRA RODADA.

## Rodada 2
| gancho | leitura | movimento | variedade | marca | som | mín |
|  7  |  7  |  8  |  8  |  8  |  8  |  7  |

- Strip da virada: o quadro do corte ainda tem véu cinza e o terço de baixo vazio até "FOI" (2,58 s).
- Leitura melhorou (chips 44 px, selo 40 px, terminal 41 px, réguas 36/44 px); código do editor ainda pequeno.
- S4c: vagas tracejadas resolveram o vazio; herói f_241 legível; herói encostava em "NA PALAVRA".
- Som: mix -14,0 LUFS; stem de efeitos 52/74 em 20 ms (mediana 3,7 ms), todos os golpes no quadro.

Piores três:
1. [2,22 s] corte sem tipografia e com véu -> "ELE FOI" entra no próprio corte (ELE em T.ele - 0,05), flash 0,4 -> 0,22.
2. [19,3-20,6 s] S7 só tem a chave pequena no topo, 2/3 da tela vazios por 1,2 s -> título "DÁ PRA FAZER" em "E dá pra", chave maior (760x170, fonte 58).
3. [26,4 s+] CTA: "Procure no GitHub" pequeno (84 px) -> linha em 900 ajustada a 940 px com "GitHub" em destaque, entrando palavra a palavra; código do editor 33 -> 35 px; herói de S4c desce para y 935.

Checagens falhas: nenhuma nova. Veredito: OUTRA RODADA.

## Rodada 3
| gancho | leitura | movimento | variedade | marca | som | mín |
|  8  |  8  |  8  |  8  |  8  |  8  |  8  |

- Strip da virada: corte abre no editor com "ELE" em RGB, sem quadro em branco.
- Strip do whip 3,95 s: os dois planos na tela, rastro direcional, "SEM" já no quadro do corte.
- Strip do CTA: marca, nome, "Procure no GitHub", endereço em duas linhas e selo entram nas palavras; segura 3,5 s depois do endereço.

Piores três (ainda corrigidos nesta rodada):
1. [3,3-3,9 s] a varredura de luz de "PROGRAMADO." pintava um retângulo cinza fora das letras (composição `lighter` sem máscara) -> varredura removida.
2. [19,3-20,7 s] S7 continuava com a metade de baixo vazia -> a chave nasce grande no centro (y 860, escala 1,25) e sobe para y 640 quando o R$ 0 entra.
3. [29 s+] selo "Open source · 100% grátis" a 42 px e estrela amarela fora da paleta -> 48 px, estrela branca pulsando em "hoje", logo 200 -> 230 px.

## Rodada 4 (verificação)
| gancho | leitura | movimento | variedade | marca | som | mín |
|  8  |  8  |  8  |  9  |  8  |  8  |  8  |

- Gancho: quadro 0 com "ESSE VÍDEO" + linha do tempo; NÃO / FOI / EDITADO. em slam com tremor; a linha do tempo dá glitch e estilhaça; corte seco com RGB para o editor com "ELE".
- Leitura (folhas de celular): todos os títulos, chips, opções de linha de comando, terminal, selo LUFS, endereço e selo do CTA legíveis; o código do editor e a página do GitHub são texto de apoio (a palavra-chave está no título).
- Movimento: slams 1,35 -> 1 com mola, letras de "PROGRAMADO." caindo, whips com os dois planos, giro de card nas variações, odômetro, molas na chave e nos chips.
- Variedade: evento novo a cada 0,3-1,5 s; maior intervalo sem evento ~1,1 s (S6, celular tocando entre "60" e o medidor).
- Marca: base #0D0B0C com brasa vermelha, destaque #B3121B / #E2474D, Urbanist + Inter + Menlo no código; só telas reais (quadros do demo, variações renderizadas, páginas do PDF, GitHub sem a linha de contadores).
- Som: -14,0 LUFS integrado / -1,2 dBTP; golpes no quadro (stem de efeitos, mediana 3,7 ms).
- Ajuste final: "GITHUB" entrava em slam por cima de "NO" -> entra com desfoque subindo.

Checagens: sem padrões proibidos; só dois flashes (virada e CTA); whips com os dois planos; cartão final segura 3,5 s depois do endereço.
Veredito: PRONTO.

---

# Identidade v2 · tinta-petróleo + vidro (pedido do cliente: outras cores, mais glassmorphism, leis de design, nada de "cara de IA")

Mesmo roteiro, mesmos cortes presos à fala, mesmo desenho de som. Paleta, vidro, escala tipográfica e leis em
`docs/design.md`; contraste calculado por `docs/contraste.mjs`. Colunas: gancho · leitura no celular · movimento ·
variedade · consistência de marca/design · "premium, feito à mão, não IA".

## Rodada 5 (v2, primeira montagem)
| gancho | leitura | movimento | variedade | marca/design | premium | mín |
|  8  |  6  |  7  |  8  |  8  |  7  |  6  |

- Fundo #08161A -> #0E2A30 com campos de luz; S.vidro em todos os painéis; vermelho removido; um destaque coral.
- Leitura: "MÉTODO COMPLETO" a 110 px vaza a largura do quadro (~1 150 px); chips "PRONTO PRA POSTAR", modelos e chave a 44 px somem no celular.
- Movimento: os whips ainda mostram quadros do meio quase vazios (rastro de 90 px + desfoque de movimento borram o painel escuro).
- Premium: terço de baixo vazio E mais claro (campo petróleo em y 0,7): o olho vai para o vazio.

Piores três:
1. [22,5 s] título vazando -> MÉTODO / COMPLETO em duas linhas; `line()` ganhou trava de largura (margem 56 px).
2. [whips] faixa vazia -> curva quintic (mais tempo nítido nas pontas), rastro 90 -> 36 px; selo 44 -> 56 px, modelos 44 -> 56 px, chave 44 -> 56 px, selo do topo 32 -> 36 px.
3. [todas] composição -> campos sobem para trás dos painéis (petróleo y 0,56), base mais escura; CTA desce 32 px e o logo já está inteiro no quadro do corte.

## Rodada 6
| gancho | leitura | movimento | variedade | marca/design | premium | mín |
|  8  |  8  |  7  |  8  |  8  |  7  |  7  |

- Strip da virada (2,15-2,5 s): RGB só na virada, sem véu (pixel do painel 40,56,59 no corte x 41,55,56 depois).
- Strips dos whips 8,26 / 15,85 / 19,32 s: S5 -> S6 cheio (celular + contador); S4a -> S4b e S6 -> S7 ainda ralos no meio.
- Contraste: coral sobre o fundo dava 4,10:1 (campo coral no canto de cima, perto dos títulos).

Piores três:
1. [8,1-8,4 s] forma de onda só aparecia depois da fala -> o arquivo inteiro aparece pré-carregado em cor de textura (como num editor real); o whip passa a ter conteúdo.
2. [19,1-19,5 s] S7 vazio no whip -> "DÁ PRA FAZER" entra com o whip; chave, R$ 0 e modelos descem 48 px (equilíbrio vertical).
3. [10-12 s] miniaturas caíam de y 432 cruzando "CADA CENA" -> queda de 280 px, começa abaixo da zona do título. Junto: campos reposicionados (coral embaixo à esquerda) -> coral 5,06:1 na zona de títulos; painel do roteiro mais alto (lh 66).

## Rodada 7
| gancho | leitura | movimento | variedade | marca/design | premium | mín |
|  8  |  8  |  8  |  8  |  9  |  8  |  8  |

- Strips 8,08-8,40 / 10,08-10,42 / 19,14-19,46 s: os dois planos na tela, forma de onda e trilho de vidro presentes; whip vertical com "60 FPS" saindo e "DÁ PRA FAZER" entrando.
- Strip 24,3-24,9 s: o leque do PDF recua atrás do celular e não cruza mais o título; mas "GUIA EM PDF" ainda saía enquanto "CÓDIGO" entrava no mesmo lugar (0,12 s de sobreposição).
- Strip 26,3-26,9 s: CTA ralo até 27,1 s (só logo + botão; endereço só em 28,3 s).

Piores três (corrigidos):
1. [24,4 s] dois títulos sobrepostos -> o primeiro sai em `codigo - 0,26`.
2. [26,4-28,3 s] card do CTA vazio -> card e endereço entram no corte e ficam legíveis o CTA inteiro (~5 s); o botão é "apertado" em "GitHub".
3. [26,4 s] logo entrava apagado -> mola mais firme, inteiro no quadro do corte.

## Rodada 8 (verificação)
| gancho | leitura | movimento | variedade | marca/design | premium | mín |
|  8  |  8  |  8  |  8  |  9  |  8  |  8  |

- Contato + folhas de celular: títulos 110-270 px legíveis; rótulos 36-56 px legíveis; código, régua e GitHub são textura e não competem.
- Strips 24,2-24,8 e 26,3-27,3 s: um título por vez; CTA forte desde o primeiro quadro.
- Demo (`exemplos/demo`, 4,8 s) renderiza igual; `checar_sintaxe.mjs` 22/22 ok.
- Som: mesmos acentos (modelos 6 -> 4 pops; "endereço" no corte do CTA; clique do botão em "GitHub").

Ainda fraco: os quadros do meio do whip S4b -> S4c continuam ralos (a cena nova só tem o trilho e a primeira
miniatura); o endereço `github.com/FilipeMolinariMoura/` (36 px) é o texto lido mais pequeno; o vidro só "mostra"
refração onde algo passa atrás (terminal, selo, trilho), sobre os campos lisos ele lê como fosco escuro.
Veredito: PRONTO para a prévia; final de 60 fps depois da troca de voz.
