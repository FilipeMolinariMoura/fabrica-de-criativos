# 6. Técnicas de motion design (motor 2D)

[← 5. Skills](05-skills.md) · [Índice](README.md) · Próximo: [7. Roteiro e copy →](07-roteiro-e-copy.md)

Este capítulo cobre o motor 2D do kit, `lib/cena.js`. Ele desenha num canvas, renderiza em poucos minutos e é o caminho mais curto para anúncios de interface com muitas variações. Os exemplos `exemplos/demo` e `exemplos/divulgacao` são feitos com ele.

Cada técnica tem três partes: um fundamento (por que funciona), uma receita (como fazer) e o erro comum que estraga o efeito.

## 6.1 Quando o 2D basta, e quando não

| Use o motor 2D quando | Passe para o 3D quando |
|---|---|
| O argumento de venda é a interface de um aplicativo | O argumento é o objeto, o acabamento ou a "cara de produto" |
| Você precisa de dezenas de variações de cor, estilo e voz | Você precisa de um filme de divulgação que seja comparado a filmes de lançamento |
| O render precisa sair em minutos | Há margem para cerca de 35 a 40 minutos de render final por meio minuto de filme |
| O público vai ver o anúncio entre outros anúncios de performance | O público vai ver o filme ao lado de comerciais de marca |

Os dois motores convivem no mesmo kit, e escolher entre eles é uma decisão de produção, não de qualidade. O 2D é imbatível em velocidade e volume de variações; o 3D entrega a "cara de comercial de marca". As regras de enquadramento, contraste e ritmo da seção 6.5 valem para os dois e elevam o 2D ao mesmo padrão visual.

## 6.2 Fundamentos

### Princípios da animação

Os doze princípios de Thomas e Johnston (1981), levados à computação gráfica por Lasseter (1987), valem para interface em movimento. Quatro são os mais usados:

| Princípio | No anúncio |
|---|---|
| *Slow in / slow out* | Toda entrada e saída usa curva, nunca velocidade constante |
| Antecipação | O cursor vai até o botão antes do toque; o card recua 2% antes de expandir |
| *Follow-through* | O elemento passa um pouco do destino e assenta (mola) |
| Encenação (*staging*) | Uma ação por vez, no centro de atenção |

### Aprendizagem multimídia

Os princípios de Mayer (2009) explicam por que texto, fala e imagem precisam ser sincronizados e enxutos:

| Princípio de Mayer | Regra no método |
|---|---|
| Contiguidade temporal | O texto na tela entra na palavra falada correspondente. É por isso que as cenas vêm do `vo.json` |
| Sinalização | A pílula acende e o zoom vai até o ponto que a fala cita |
| Coerência | Nada decorativo que não sirva à mensagem |
| Redundância | Na tela vai a palavra-chave, não a frase inteira da narração |
| Segmentação | Uma ideia por cena, com troca a cada 2 a 4 segundos |

### Carga cognitiva

Quem rola o feed tem pouca atenção sobrando (Sweller, 1988). Cada quadro deve ter uma leitura principal.

## 6.3 Receitas

| Técnica | Receita | Erro comum |
|---|---|---|
| **Molas** (`springU`, `springKeys`) | Resposta de mola calculada pelo tempo, não acumulada quadro a quadro. Presets `SPRING.snappy` (interface) e `SPRING.gentle` (câmera) | Easing linear: parece apresentação de slides |
| **Título com desfoque** (`headline`) | Cada palavra entra com desfoque de 12 px até 0, subindo 20 px, com 60 ms entre palavras | Desfocar a frase inteira de uma vez |
| **Cards de vidro** (`card`, `vidro`) | Desfoque real do fundo, borda clara de 1 px, sombra longa e difusa | Sombra curta e escura |
| **Pílulas que acendem** (`pill`) | Cor da marca e um leve brilho no instante em que a fala cita a função | Todas acesas o tempo todo |
| **Cursor e toque** (`cursor`, `tap`, `ripple`) | Trajetória em arco com mola, anel que se expande no toque, som `tap` na lista de eventos | Clique sem antecipação |
| **Celular em perspectiva** (`phone`) | Captura real dentro do aparelho; o zoom vai até a área citada | Inventar tela que não existe |
| **Zoom de câmera** | Escala em espaço logarítmico: `s = a * (b / a) ** p` | Interpolação linear da escala, que parece travar no zoom alto |
| **Fragmentos de profundidade** | Recortes da tela flutuando à frente do celular, com parallax de 2 ou 3 camadas | Desfocar demais o fragmento |
| **Transições** (`blurZoom`, `lightSweep`) | A cena nova já aparece no primeiro quadro do corte | Flash branco em todo corte |
| **Fundo com campos de luz** (`bgCampos`) | Manchas de luz lentas no lugar de degradê liso | O mesmo degradê do começo ao fim |
| **Desfoque de movimento** | Média de subquadros no render final a 60 fps | Desfoque aplicado como filtro estático |
| **Grão** (`grain`) | Ruído com semente, aplicado depois do desfoque | `Math.random`, que faz cada render sair diferente |
| **Cartão final** (`endCard`, `logoSeq`) | Marca animada, CTA em pílula, ícone do canal e a frase falada na tela | CTA só na fala |

## 6.4 O contrato do render

Vale para os dois motores.

1. O filme é uma função pura do tempo: `seek(t)` sempre produz o mesmo quadro.
2. Nada de `setTimeout`, `requestAnimationFrame`, `Math.random` ou estado guardado entre quadros.
3. O renderizador pode pedir os quadros fora de ordem.

É isso que torna o vídeo reprodutível: o mesmo commit gera o mesmo MP4.

## 6.5 Padrão visual de filme de lançamento no 2D

A leitura de filmes de lançamento ([capítulo 9](09-pesquisa-de-referencias.md)) gerou regras que não dependem de 3D. Aplique-as a qualquer filme em canvas: elas são a diferença entre um anúncio que parece modelo pronto e um que parece produção.

| Armadilha comum | Como fazer no 2D |
|---|---|
| Conteúdo pequeno, ocupando uma fração do quadro | O objeto principal ocupa de 55% a 75% da largura. Corte a interface em vez de mostrá-la inteira e pequena |
| Preto lavado, acinzentado | Fundo escuro de verdade (percentil 5 de luminância ≤ 8/255). Confira com um histograma do quadro |
| Filme inteiro em fusões, sem corte seco | De 10 a 12 planos em 30 s. Prefira o corte na palavra à fusão |
| O mesmo fundo o filme todo | Dois "mundos" de cor, com a troca coincidindo com a virada do roteiro |
| Caixa alta pesada em três linhas | Caixa mista, peso 500 a 600, no máximo 5 palavras na tela, uma palavra de acento em outra família |
| Código e terminal ilegíveis | Texto que precisa ser lido tem ao menos 30 px de altura de letra no quadro final. O resto fica deliberadamente fora de foco ou fora do quadro |

As 12 regras completas estão no [capítulo 9](09-pesquisa-de-referencias.md#93-as-12-regras-do-visual-caro).

## 6.6 Regras de estilo que não se quebram

- Só a interface real do produto.
- Proibido o padrão de modelo pronto: título centralizado sobre degradê e tudo entrando com fade.
- Algo novo na tela a cada 2 a 4 segundos.
- Uma fonte de título, uma de interface e uma cor de destaque.
- Todo texto que precisa ser lido sobrevive à folha em meio tamanho.

---

Próximo: [7. Roteiro e copy →](07-roteiro-e-copy.md)
