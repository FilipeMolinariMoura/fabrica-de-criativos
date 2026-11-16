# 9. Pesquisa de referências

[← 8. Qualidade](08-qualidade-e-solucao-de-problemas.md) · [Índice](README.md) · Próximo: [10. Look-dev →](10-look-dev.md)

"Ficou cru" é um veredito. Para virar trabalho, ele precisa virar medida. Este capítulo mostra como transformar "quero que pareça caro" numa lista de regras com números, lendo filmes de referência **sem baixar nenhum vídeo**.

É a etapa 2 do método. A saída dela são três documentos: a tabela de referências, as regras e a análise de lacunas. A ficha em branco para preencher é [`templates/referencias.md`](../templates/referencias.md).

## 9.1 Como ler um filme sem baixá-lo

### Miniaturas de pré-visualização

O YouTube gera, para cada vídeo, as miniaturas que aparecem quando você passa o mouse na barra de tempo. Elas vêm agrupadas em folhas: 320×180 px por miniatura, uma por segundo nos filmes curtos e uma a cada 5 ou 10 segundos nos longos. Uma folha dessas é uma folha de contato pronta.

Com as folhas e os metadados públicos (título, duração, visualizações, descrição, capítulos) dá para ler:

| Dá para ler | Com que precisão |
|---|---|
| Ritmo: quantos planos, duração média | Contagem, com erro de ±1 s por plano |
| Enquadramento e ocupação do quadro | Boa |
| Paleta, claro ou escuro, quantidade de acentos | Boa |
| Tipografia: caixa, peso aproximado, quantas palavras | Razoável |
| Lente, abertura, luz | **Estimativa visual.** Ponto de partida, não medição |
| Som | **Nada.** As miniaturas são mudas |

### Biblioteca de anúncios

A biblioteca de anúncios da Meta é pública. Com uma ferramenta de consulta (neste projeto, o conector AdWhispr), dá para listar os anúncios ativos de uma marca e ordená-los por dias no ar. Dias no ar é o melhor sinal indireto que esse tipo de ferramenta oferece. Ela **não** informa gasto, alcance nem resultado.

### Regras de honestidade da coleta

Escreva estas quatro notas no topo do seu documento de referências. Elas evitam que uma estimativa vire verdade três documentos depois.

1. Não vi os filmes em resolução cheia nem em movimento.
2. Toda medida de lente, abertura e pixels é leitura visual sobre miniaturas pequenas.
3. Não ouvi nenhum filme. O que digo de som é convenção do gênero.
4. Não sei quem produziu os filmes e não atribuo autoria.

Todas valem para a pesquisa descrita abaixo.

## 9.2 A tabela de referências

Levantamento de 16 nov. 2026. Dezessete entradas em seis grupos. Os endereços estão em [referencias.md](referencias.md#filmes-e-anúncios-de-referência).

### A. A régua de acabamento

| # | Referência | Por que está aqui | O que se pega |
|---|---|---|---|
| 1 | Higgsfield, vídeos de motion graphics com Claude (dois tutoriais do canal oficial) | É o mesmo caso deste projeto: vídeo de lançamento feito por agente e código | Fundo claro quente; título em serifada com uma palavra em itálico; um cartão por vez; interface como placa de acrílico espessa; alternância claro e escuro |
| 2 | Higgsfield, tutoriais de realismo | Direção de imagem que vale também em 3D | Folha de produto antes de gerar; storyboard primeiro; luz motivada; duas temperaturas de cor; produto parado e legível no fim |

### B. Filmes de lançamento de software

| # | Referência | Duração | Por que está aqui | O que se pega |
|---|---|---|---|---|
| 3 | Linear, "Introducing Linear Agent" | 55 s | A interface real tratada como objeto num estúdio escuro | Tela inclinada e rasante; foco raso numa faixa de 2 ou 3 linhas; preto real; vinheta forte; ritmo lento |
| 4 | Framer, "Framer 3.0" | 75 s | Interface escura que parece cara só com luz de borda | Linha de luz que desenha o contorno; botão como objeto emissivo; close extremo de interface |
| 5 | Cursor, "Introducing Cursor 2.0" | 64 s | Contenção: pouco texto, pequeno, bem espaçado | Cartão de texto de 5 a 8 palavras; alternância rígida texto e interface; zoom até a interface ser legível |
| 6 | Notion, "Meet Notion Mail" | 60 s | Uma promessa por frase, com um objeto condutor | Um elemento que atravessa os planos; frase-título por benefício; fecho na ação |
| 7 | Lovable, "Lovable 2.0 is here" | 80 s | Tipografia cinética sem cara de modelo pronto | Uma palavra por batida; corte por cor de fundo; clique em macro |
| 8 | ElevenLabs, "Eleven v3" e "SFX v3" | 75 s e 45 s | Produto de voz mostrado sem a forma de onda chapada | Voz como objeto; frase pequena com a última palavra em cor; painéis quase invisíveis |
| 9 | Screen Studio, "Introducing Screen Studio 4.0" | 83 s | Macro de tela de verdade | Câmera rasante a centímetros da tela; luz quente contra o frio da tela; teclas em primeiro plano desfocado |
| 10 | Apple, "Introducing Liquid Glass" | 4 min 34 s | Aula de material vidro | Vidro tem espessura, refração e fio de luz na borda; só funciona sobre conteúdo |
| 11 | Perplexity, "Introducing Comet" | 72 s | Luxo em fundo de papel | Fundo com grão; serifada em corpo pequeno; sombra de janela em duas camadas |
| 12 | Granola, "Say hello to Recipes" | 43 s | Vidro fosco em fundo claro num filme real | Cartão fosco com borda interna clara; legenda pequena em pílula |
| 13 | The Browser Company, "Dia Browser" | 78 s | Mistura de vida real com macro de interface | Inserção de interface em macro rasante; cartões pretos de 3 ou 4 palavras |

### C. Filmes de produto físico

| # | Referência | Por que está aqui | O que se pega |
|---|---|---|---|
| 14 | rabbit, "rabbit r1" · teenage engineering, "OP–1 field" · Tendril, reel de design industrial | É daqui que vem a sensação de objeto caro | Ciclorama de uma cor; abertura no escuro com luz de recorte; macro de detalhe a cada dois planos; uma cor de herói contra neutros |

### D. Anúncios verticais de longa duração

| # | Referência | Por que está aqui | O que se pega |
|---|---|---|---|
| 15 | Biblioteca de anúncios da Meta: CapCut, ElevenLabs, HeyGen, Canva | O que dura no ar em mídia paga | Primeiro quadro pronto; legenda grande sincronizada; número concreto no gancho; CTA dito e escrito. Tabela no [capítulo 7](07-roteiro-e-copy.md#o-que-se-viu-em-anúncios-de-longa-duração) |

### E. Vídeo feito com código

| # | Referência | Por que está aqui | O que se pega |
|---|---|---|---|
| 16 | Fireship, "This video was made with code" · Remotion · Motion Canvas | A categoria deste projeto | O gancho "foi feito com código" segura público técnico. O teto visual da categoria é 2D chapado: fazer isso com cara de filme de produto é a diferença |

### F. Estúdios para estudar

| # | Referência | O que se pega |
|---|---|---|
| 17 | Ordinary Folk, Tendril, ManvsMachine, Buck, Oddfellows, Not Real | Direção de arte. Só os reels de Ordinary Folk e Tendril foram lidos; os demais são indicação de estilo, sem análise |

### As cinco que mais pesaram

1. Linear Agent: interface real como objeto em estúdio escuro, foco raso.
2. Screen Studio 4.0: macro de tela, luz quente contra tela fria.
3. Higgsfield com Claude: placa de vidro espessa, serifada itálica, cartão único, fundo claro.
4. Framer 3.0: luz de borda, bloom contido, close extremo.
5. rabbit r1 e OP–1 field: ciclorama, luz de recorte, uma cor de herói.

## 9.3 As 12 regras do visual caro

O que os filmes têm em comum, escrito como especificação. **Os números são ponto de partida para 1080×1920.** Vieram de leitura visual de miniaturas e foram ajustados no look-dev. Onde aparece "mm", a convenção é câmera de quadro cheio deitada de lado. Em three.js o campo de visão é vertical: 50 mm ≈ 39,6°, 85 mm ≈ 23,9°, 100 mm ≈ 20,4°, 135 mm ≈ 15,2°.

| # | Regra | Números de partida |
|---|---|---|
| 1 | **Encha o quadro** | Objeto principal em 55% a 75% da largura; pelo menos 60% da área trabalhada; o terço de baixo é chão com reflexo, nunca vazio. Texto fora de 12% do topo, 22% da base e 14% da direita (zonas de interface das redes; convenção, confira a especificação atual) |
| 2 | **Lente longa** | Herói em 85 a 100 mm; macro em 100 a 135 mm; geral no máximo em 50 mm. Grande-angular distorce o aparelho e parece jogo |
| 3 | **Um plano nítido só** | Abertura equivalente a f/1,8 a f/2,8 em macro e f/4 nos gerais. O foco está na palavra que está sendo dita. Troca de foco em 0,4 a 0,6 s |
| 4 | **A câmera nunca para, e nunca corre** | Todo plano tem empurrão de 2% a 6% ou órbita de 3° a 8°, em velocidade constante. No máximo três movimentos fortes no filme |
| 5 | **Luz de estúdio com três papéis** | Principal grande e suave; contraluz de 1 a 2 stops acima, do lado oposto; preenchimento negativo. Relação principal para preenchimento de 4:1 a 8:1. HDRI de estúdio só para reflexo, intensidade de 0,3 a 0,6 |
| 6 | **Matéria tem defeito** | Toda aresta com raio. Alumínio com rugosidade de 0,30 a 0,45, variando. Vidro de tela com digitais a poucos por cento. Nenhuma superfície totalmente lisa e uniforme |
| 7 | **Tela é luz e é legível** | A tela ilumina a mesa com a cor do conteúdo; fica inclinada de 8° a 25°. Texto que precisa ser lido tem ao menos 30 px de altura de letra; o resto fica deliberadamente fora de foco |
| 8 | **Tipografia fina** | Duas famílias no máximo (grotesca e serifada itálica no acento). Caixa mista. Altura de maiúscula de 3,8% a 4,8% do quadro, peso 500 a 600. No máximo 5 palavras na tela e uma de acento |
| 9 | **Uma base, um acento** | Base neutra (quase preto no ato escuro, osso no claro); acento em no máximo 8% da área. Mapeamento de tons de filme, saturação global uns 8% abaixo. No ato escuro, percentil 5 de luminância ≤ 8/255 |
| 10 | **Textura de lente** | Grão de 3% a 5%; vinheta de 12% a 18%; bloom baixo e só em emissivos; aberração cromática mínima e só nos cantos; dither nos degradês |
| 11 | **Montagem com intenção** | Em 30 s, de 10 a 12 planos. O quadro 0 já é imagem pronta. Primeira troca forte antes de 1,8 s. Corte 2 quadros antes da palavra-chave. Escala alternando. Zero fusão |
| 12 | **Todo evento visual tem som** | Tecla, clique, deslize e batida grave no gancho e no CTA; de 150 a 250 ms de quase silêncio antes da virada; master em −14 LUFS e −1 dBTP. *Esta regra não veio de escuta das referências: é convenção do gênero* |

**O que mudou na prática.** As regras 2, 3 e 5 foram ajustadas no look-dev: f/2,8 no celular deixava só uma faixa de texto legível, e o herói passou para f/4. A relação de luz do mundo claro ficou perto de 3,5:1, um pouco abaixo da faixa. A regra 12 precisou de medição de verdade, que está no [capítulo 13](13-som.md). Regra de partida é isso: um lugar para começar a errar com método.

## 9.4 Análise de lacunas

Com as regras na mão, meça o seu material contra elas. O método tem quatro passos.

**1. Amostre.** Tire 12 quadros espaçados do seu filme.

**2. Meça o que for mensurável.**

| Medida | Como medir |
|---|---|
| Área ocupada | Fração de pixels que diferem do fundo |
| Faixa vertical usada | Primeira e última linha com conteúdo |
| Preto mais escuro | Percentil 5 de luminância |
| Cortes secos | Detector de mudança de cena (por exemplo, o filtro `select='gt(scene,0.25)'` do ffmpeg) |
| Altura da tipografia | Altura de maiúscula em pixels, dividida pela altura do quadro |

**3. Compare cena a cena.** Uma tabela com quatro colunas: o que está na tela, por que parece barato, o que a referência faz, e em que regra isso cai.

**4. Liste os defeitos que atravessam o filme inteiro.** São eles que orientam o tratamento.

O resultado para o anúncio 2D deste projeto:

| Medida | Filme 2D | Referências (leitura visual) |
|---|---|---|
| Área ocupada por conteúdo | 3% a 21% (mediana perto de 11%) | 60% a 100% |
| Faixa vertical usada | de 11–17% até 62–79% da altura | quadro inteiro |
| Preto mais escuro | 23/255 | 0 a 8/255 |
| Cortes secos | 0 em 32 s | 10 a 40 |
| Movimento de câmera | nenhum | em todos os planos |
| Luz e sombra projetada | nenhuma | sempre |
| Fundo | o mesmo degradê nos 12 quadros | um lugar |
| Tipografia | caixa alta, peso perto de 800, maiúscula em 5,8% do quadro | caixa mista, 400 a 600, 2% a 5% |

O número que mais explicava o "cru": em 9 dos 12 quadros, mais de 85% dos pixels eram degradê vazio.

E os defeitos que atravessavam o filme:

1. Não existe lugar. Sem chão, sem horizonte, sem luz.
2. Nada tem matéria. Painéis sem espessura, celular sem volume.
3. Nada é legível quando precisa ser. Código, terminal e página do repositório eram a prova, e estavam ilegíveis.
4. A câmera não existe. Nunca um close, nunca um geral.
5. Sem ritmo de montagem. Toda troca é fusão.
6. Tipografia de modelo pronto de anúncio.
7. Cor sem direção: cinco cores disputando.
8. Preto lavado e degradê liso.

O que **manter** também faz parte da análise: o gancho, a ideia da palavra que dispara a cena, os materiais reais (quadros do exemplo, páginas do guia, a página do repositório).

## 9.5 Das lacunas ao tratamento

O tratamento é uma frase e uma tabela.

**A frase:** *o filme se passa num estúdio de produto, sobre uma bancada; tudo o que o roteiro cita vira objeto físico fotografado com lente longa.* A timeline vira blocos de vidro em trilhos. A voz vira uma régua de pinos metálicos que sobem com o áudio real. "Custa zero" vira uma alavanca que estala.

**A tabela:** um plano por linha, com fala, assunto, câmera, luz, texto na tela, saída e som. A do filme final está no [capítulo 14](14-estudo-de-caso-a-bancada.md#143-lista-de-planos).

Duas decisões de tratamento que valem como regra geral:

- **Aparelhos genéricos, modelados em código.** Sem logotipo, sem modelo de terceiros, sem marca alheia.
- **Aprovar dois quadros de estilo antes de construir.** É o look-dev, [capítulo 10](10-look-dev.md).

## 9.6 Por que não vídeo generativo

A pesquisa considerou inserir tomadas de IA de vídeo (uma mão virando a chave, um rosto iluminado pela tela). A recomendação foi **não usar no corte principal**, por dois tipos de risco.

**Riscos de imagem:**

- Texto e interface saem errados e precisam ser substituídos por composição.
- Geometria fina (teclados, grades) ondula entre quadros.
- Os modelos entregam de 24 a 30 fps; o filme é de 60 fps e diz isso em voz alta.
- A bancada gerada não bate com a bancada em 3D.

**Riscos de mensagem, os mais sérios:**

1. O filme afirma "Esse vídeo não foi editado. Ele foi programado." Tomadas geradas e compostas à mão tornariam a frase falsa.
2. O filme afirma que os modelos são abertos. Créditos pagos de um serviço fechado contradizem isso.
3. O filme é a demonstração do produto. Cada plano que o kit não fez é um plano a menos de prova.

A estimativa de custo para três inserções ficou na casa de 500 créditos de um serviço desse tipo. O número de tentativas por plano era chute, e o custo não foi verificado porque a ideia foi descartada antes.

## 9.7 O que a pesquisa não conseguiu verificar

Registre isto no seu documento também.

- O som de todas as referências.
- Lentes, aberturas e medidas em pixels das referências.
- Quem produziu os filmes.
- O desempenho real dos anúncios: só dias no ar. Várias marcas procuradas não estavam na base consultada.
- As zonas seguras das redes: valores de convenção.

## 9.8 Checklist da etapa

- [ ] De 10 a 20 referências, cada uma com motivo e técnicas reproduzíveis
- [ ] Notas de honestidade no topo do documento
- [ ] Regras escritas com números de partida
- [ ] O seu material medido em pelo menos cinco grandezas
- [ ] Lista do que manter
- [ ] Tratamento em uma frase e uma tabela de planos
- [ ] Lista do que não foi verificado

---

Próximo: [10. Look-dev →](10-look-dev.md)
