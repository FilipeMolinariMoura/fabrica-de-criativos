# 1. O método em 10 etapas

[← 0. Visão geral](00-visao-geral.md) · [Índice](README.md) · Próximo: [2. Ferramentas →](02-ferramentas.md)

```
Briefing → Referências → Roteiro → Voz dirigida → Narração no tempo
    1           2           3            4                 5

→ Look-dev → Filme → Som → Crítica independente → Render, variações e entrega
      6        7      8            9                         10
```

Cada etapa produz um arquivo que a seguinte consome. Por isso dá para voltar a qualquer ponto sem refazer o resto. Cada etapa também tem um **portão de qualidade**: uma condição objetiva que precisa ser verdadeira antes de seguir.

Duas etapas fazem a diferença entre um vídeo correto e um vídeo que parece caro: a pesquisa de referências (etapa 2), que transforma "filme de produto" em números, e o look-dev (etapa 6), que aprova a aparência antes de construir. A crítica independente (etapa 9) garante que quem constrói não aprova sozinho.

## Visão de conjunto

| # | Etapa | Entra | Sai | Portão de qualidade | Capítulo |
|---|---|---|---|---|---|
| 1 | Briefing | conversa com quem pediu o anúncio | `briefing.md` preenchido | Produto, público, dor, CTA e telas reais confirmados | este |
| 2 | Referências | 10 a 20 vídeos do gênero | tabela de referências, regras com números, análise de lacunas | Cada regra tem número de partida e cada lacuna tem medida | [9](09-pesquisa-de-referencias.md) |
| 3 | Roteiro | briefing e referências | `roteiro.json` | Texto aprovado **antes** de gerar a voz | [7](07-roteiro-e-copy.md) |
| 4 | Voz dirigida | roteiro aprovado | tomadas em `voz/<id>/` | Tom aprovado de ouvido em amostra curta; depois, tomada final aprovada de ouvido | [12](12-voz-dirigida.md) |
| 5 | Narração no tempo | tomada aprovada | `audio/vo.wav` e `vo.json` | Todas as palavras do roteiro encontradas; nenhuma frase cortada | este |
| 6 | Look-dev | regras e tratamento | 3 a 4 quadros de estilo e um teste de movimento | Avaliação de realismo registrada; quem pediu aprova os quadros | [10](10-look-dev.md) |
| 7 | Filme | tudo acima | `film.js` | Contrato do render respeitado; todo corte sai de uma palavra | [11](11-3d-fotorrealista.md) (3D) · [6](06-tecnicas-de-motion.md) (2D) |
| 8 | Som | `vo.json` e eventos do filme | `music.wav`, `sfx.wav`, `mix.wav` | −14 LUFS, pico ≤ −1 dBTP, música audível nos intervalos da voz | [13](13-som.md) |
| 9 | Crítica independente | prévia renderizada | lista de correções numérica | Todos os critérios ≥ 8, ou a exceção registrada por escrito | [8](08-qualidade-e-solucao-de-problemas.md) |
| 10 | Render, variações e entrega | filme aprovado | `entrega/finais/*.mp4` | `npm run checar` passa | [8](08-qualidade-e-solucao-de-problemas.md) |

## 1.1 Briefing

Colete, numa só rodada de perguntas:

- o produto, para quem é e a dor que resolve;
- telas reais (site, loja de aplicativos, capturas);
- logo, cores e fontes;
- o CTA e o canal;
- dois ou três vídeos de referência;
- duração e formato.

Use [`templates/briefing.md`](../templates/briefing.md).

**O erro mais caro do método é entender errado o escopo.** Antes de escrever uma linha de roteiro, confirme *o que* está sendo anunciado: um produto específico ou a marca inteira.

## 1.2 Referências

O briefing diz o que anunciar. As referências dizem que cara o anúncio precisa ter. Sem elas, o construtor mira no que sabe fazer, não no que o público está acostumado a ver.

O trabalho tem três saídas:

1. **Tabela de referências:** de 10 a 20 filmes, cada um com o motivo de estar ali e as técnicas reproduzíveis.
2. **Regras com números:** o que os filmes têm em comum, escrito como especificação (lente, abertura, ocupação do quadro, ritmo).
3. **Análise de lacunas:** o seu material medido contra as regras.

Tudo isso é feito sem baixar vídeo, lendo as miniaturas de pré-visualização e os metadados públicos. O passo a passo está no [capítulo 9](09-pesquisa-de-referencias.md).

## 1.3 Roteiro

Estrutura de 30 segundos:

| Tempo | Bloco | O que faz |
|---|---|---|
| 0–3 s | **Gancho** | Afirmação ou pergunta que o público reconhece, com imagem pronta já no primeiro quadro |
| 3–9 s | **Problema** | Uma cena concreta |
| ~10 s | **Virada** | O produto entra junto com a maior mudança visual |
| 11–21 s | **Produto em ação** | Interface ou objeto real |
| 21–25 s | **Prova** | Um detalhe verificável |
| 25–30 s | **CTA** | Verbo, canal e benefício |

Regras de texto: frases de 4 a 9 palavras, uma ideia por cena, números por extenso na fala, nenhum número sem fonte. Os detalhes, e a lapidação do roteiro deste projeto, estão no [capítulo 7](07-roteiro-e-copy.md).

**Portão:** o roteiro é aprovado antes da voz. Uma palavra trocada depois custa narração, tempos e render.

## 1.4 Voz dirigida

A conferência automática confere palavras e entonação, mas quem sente a emoção é o ouvido. Por isso a ordem é esta: primeiro se aprova o **tom** em amostras curtas, depois se gera o roteiro inteiro. Assim você gasta pouco e acerta o tom antes de gerar tudo.

1. Gere amostras curtas, só com o gancho e o CTA (uns 10 segundos), em 4 a 7 variações de modelo e ajuste.
2. Uma pessoa ouve e escolhe o tom.
3. Gere o roteiro inteiro com a direção escolhida, em 5 a 8 tomadas com sementes diferentes.
4. Passe o filtro às cegas (palavras pelo Whisper, tom no fim de frase pelo Praat).
5. Leve as duas melhores para o ouvido humano. É ele quem aprova.

O processo completo, as marcações de direção e qual motor usar em cada caso estão no [capítulo 12](12-voz-dirigida.md). A voz gratuita (Kokoro) segue os mesmos passos, sem custo.

## 1.5 Narração no tempo

`scripts/vo_montar.py` trata a voz e grava o tempo de cada palavra em `vo.json`. No filme, nada começa em segundos fixos:

```js
const VO = await loadVO();
const tVirada = wt(VO, 'produto', { after: 8 });   // primeira ocorrência depois de 8 s
const tCTA    = ph(VO, -1).t0;                      // início da última frase
```

Duas regras de precisão:

- **O corte vai dois quadros antes da palavra.** O olho precisa de um instante para ler a imagem nova.
- **O impacto vai no início audível da palavra.** O tempo que o Whisper grava (`t0`) fica adiantado em relação ao som: nas medições de A bancada, de 50 a 235 ms, com média perto de 140 ms. Tudo o que precisa "bater" numa palavra usa o início de energia medido no áudio, ou `t0` mais uns 0,10 s.

## 1.6 Look-dev

Antes de construir 30 segundos, construa quatro quadros. O look-dev responde, por um custo pequeno, à pergunta que mais importa num anúncio: *isto parece caro?*

- Três ou quatro quadros de estilo, um para cada mundo de luz e um para o cartão final.
- Um teste de movimento de 4 segundos, porque quadro parado perdoa o que o movimento denuncia.
- Uma avaliação de realismo de 1 a 10 por quadro, com a lista do que refinar.

O filme só começa depois da aprovação dos quadros. Veja o [capítulo 10](10-look-dev.md).

## 1.7 Filme

O filme é `window.seek(t)`: desenha o quadro *t* num canvas de 1080×1920. Há dois motores, com o mesmo contrato.

| Motor | Use quando | Onde |
|---|---|---|
| **2D** (`lib/cena.js`) | O anúncio mostra interface de aplicativo, precisa de muitas variações rápidas e de render em poucos minutos | [capítulo 6](06-tecnicas-de-motion.md) |
| **3D** (`lib/3d/`) | O anúncio precisa de aparência de filme de produto: objetos, luz de estúdio, lente | [capítulo 11](11-3d-fotorrealista.md) |

Construa **um piloto completo**, aprove, e só então escale para os demais criativos.

## 1.8 Som

A música e os efeitos são sintetizados a partir dos mesmos tempos do filme. O som é **medido**, não só construído: nível por frase, distância entre voz e música, e posição de cada efeito em relação às palavras. Veja o [capítulo 13](13-som.md).

## 1.9 Crítica independente

Quem construiu o filme não o aprova sozinho. Dois críticos que não participaram da construção avaliam a prévia:

- um de **imagem**, que compara quadros com as referências e mede cor, contraste e ocupação;
- um de **montagem e som**, que mede ritmo, movimento, níveis e posição dos efeitos.

Cada um devolve uma avaliação por critério e uma lista de ajustes com números (posição, intensidade, tempo). O construtor aplica, registra o que decidiu não aplicar e por quê, e a rodada se repete até todos os critérios chegarem a 8. Veja o [capítulo 8](08-qualidade-e-solucao-de-problemas.md).

## 1.10 Render, variações e entrega

1. Gere a prévia a 30 fps para aprovação.
2. Gere o final a 60 fps.
3. Faça as variações de cor, estilo e voz. No motor 2D, `scripts/variante.py` faz as três com um comando.
4. Rode `npm run checar -- entrega/finais/<arquivo>.mp4` em todos os arquivos antes de enviar.

A especificação de entrega está no [capítulo 8](08-qualidade-e-solucao-de-problemas.md#83-especificação-de-entrega).

## 1.11 Quanto tempo leva

Os números abaixo são de uma máquina de exemplo, um notebook com Apple M1 Pro, 16 GB e GPU integrada. Servem de ordem de grandeza em qualquer sistema.

| Trabalho | Tempo | Natureza do dado |
|---|---|---|
| `npm run demo` (exemplo 2D, voz gratuita, prévia) | minutos | medido |
| Um criativo 2D depois do kit montado | 1 a 2 horas, dominadas pela revisão humana | estimado pelo autor |
| Render final do filme 3D (35 s, 60 fps) | 35 a 40 minutos | medido |
| O filme 3D inteiro, da pesquisa de referências à entrega | menos de um dia, com vários agentes em paralelo | estimado, não cronometrado |

---

Próximo: [2. Ferramentas →](02-ferramentas.md)
