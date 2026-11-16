# 6. Técnicas de motion design

Cada técnica abaixo tem três partes: um fundamento (por que funciona), uma receita (como fazer em `lib/cena.js`) e o erro comum que estraga o efeito.

## 6.1 Fundamentos

### Princípios da animação
Os doze princípios de Thomas e Johnston (1981), levados para a computação gráfica por Lasseter (1987), valem para interface em movimento. No método, quatro são os mais usados:

| Princípio | No anúncio |
|---|---|
| *Slow in / slow out* | Toda entrada e saída usa curva, nunca velocidade constante |
| Antecipação | O cursor vai até o botão antes do toque; o card recua 2% antes de expandir |
| *Follow-through* | O elemento passa um pouco do destino e assenta (mola) |
| Encenação (*staging*) | Uma ação por vez, no centro de atenção |

### Aprendizagem multimídia
Os princípios de Mayer (2009) explicam por que texto na tela, fala e imagem precisam ser sincronizados e enxutos:

| Princípio de Mayer | Regra no método |
|---|---|
| Contiguidade temporal | O texto na tela entra na palavra falada correspondente. É por isso que as cenas vêm do `vo.json`. |
| Sinalização | A pílula acende e o zoom vai até o ponto que a fala cita |
| Coerência | Nada decorativo que não sirva à mensagem |
| Redundância | Na tela vai a palavra-chave, não a frase inteira da narração |
| Segmentação | Uma ideia por cena, com troca a cada 2 a 4 segundos |

### Carga cognitiva
Quem rola o feed tem pouca atenção sobrando (Sweller, 1988). Cada quadro deve ter uma leitura principal, com no máximo uma fonte de título e uma de interface.

## 6.2 Receitas

| Técnica | Receita | Erro comum |
|---|---|---|
| **Molas** (`springU`, `springKeys`) | Resposta de mola criticamente amortecida, calculada pelo tempo e não acumulada quadro a quadro. Use os presets `SPRING.snappy` (UI) e `SPRING.gentle` (câmera). | Easing linear: parece apresentação de slides |
| **Título com desfoque** (`headline`) | Cada palavra entra com desfoque de 12 px até 0, subindo 20 px, com 60 ms entre palavras | Desfocar a frase inteira de uma vez |
| **Cards de vidro** (`card`) | Branco a 70%, borda de 1 px clara, sombra longa e difusa | Sombra curta e escura: parece 2010 |
| **Pílulas que acendem** (`pill`) | Cor da marca e um leve brilho no instante em que a fala cita a função | Todas acesas o tempo todo |
| **Cursor e toque** (`cursor`, `tap`, `ripple`) | Trajetória em arco com mola, anel que se expande no toque, som `tap` em `HITS` | Clique sem antecipação |
| **Celular em perspectiva** (`phone`) | Captura real dentro do aparelho; o zoom vai até a área citada | Inventar tela que não existe |
| **Zoom de câmera** | Escala em espaço logarítmico: `s = a * (b / a) ** p` | Interpolação linear da escala, que fica parada no zoom alto |
| **Fragmentos de profundidade** | Recortes da tela flutuando à frente do celular, com parallax de 2 ou 3 camadas | Desfocar demais o fragmento |
| **Transições** (`blurZoom`, `lightSweep`) | A cena nova já aparece no primeiro quadro do corte; um flash cheio só na virada | Flash branco em todo corte |
| **Desfoque de movimento** | Média de subquadros no render final a 60 fps | Desfoque aplicado como filtro estático |
| **Grão** (`grain`) | Ruído com semente aplicado depois do desfoque (`post`) | `Math.random`, que faz cada render sair diferente |
| **Cartão final** (`endCard`, `logoSeq`) | Logo animado, CTA em pílula, ícone do canal e a frase falada na tela | CTA só na fala |

## 6.3 Contrato do render
1. O filme é uma função pura do tempo: `seek(t)` sempre produz o mesmo quadro.
2. Nada de `setTimeout`, `requestAnimationFrame`, `Math.random` ou estado guardado entre quadros.
3. O renderizador pede os quadros fora de ordem e em várias páginas ao mesmo tempo.

Isso garante o reprodutível: o mesmo commit gera o mesmo MP4.

## 6.4 Regras de estilo que não se quebram
- Usar só a interface real do produto.
- Proibido o padrão de modelo pronto: título centralizado sobre degradê e tudo entrando com fade.
- Algo novo na tela a cada 2 a 4 segundos.
- Uma fonte de título, uma de interface e uma cor de destaque.
- Todo texto que precisa ser lido sobrevive à folha em meio tamanho.
