# Crítica do criativo

> Faça a crítica olhando a folha de contato e o vídeo no celular, **sem som** primeiro e depois com som.
> Folha de contato: `uv run scripts/folha_contato.py <video.mp4>` (qualquer vídeo) ou
> `make contato3d FILME=<pasta>` (filme 3D, dois quadros por plano, antes de renderizar o vídeo).
> Nota de 1 a 10 em cada critério. Régua: **8 = eu colocaria no ar; 10 = não distingo de um filme de
> produto de estúdio.** Abaixo de 7 volta para ajuste; a meta é tudo em 8 ou mais.
> Registre cada rodada: é assim que o vídeo melhora de verdade.
> Quem construiu o vídeo preenche esta folha, mas **não aprova sozinho** (veja "Crítico independente").

**Criativo:**                      **Versão / data:**                **Quem avaliou:**

## Critérios de todo criativo

| Critério | O que olhar | 1 (ruim) | 10 (pronto) | Nota |
| --- | --- | --- | --- | --- |
| **Gancho** | Os 3 primeiros segundos param o dedo? Há movimento e texto no primeiro quadro? | quadro parado, logo primeiro | pergunta ou tensão visível no quadro 1 | |
| **Leitura no celular** | Todo texto lê na tela do celular, na folha de contato em meia escala? Fica fora das áreas de interface (topo, legenda, botões)? A história se entende no mudo? | texto pequeno ou sob a legenda | texto legível, contraste de 4,5:1 ou mais, dentro da área livre | |
| **Movimento** | As coisas têm peso (molas, easing), nada pula ou trava? | tudo linear, saltos | molas, desfoque de movimento, nada parado nem correndo | |
| **Variedade** | Cada 2 a 3 s acontece algo novo (plano, escala, cor)? | o mesmo plano por 6 s | ritmo de planos constante, sem repetição | |
| **Marca** | Cores, fontes e logo certos? O produto aparece cedo e o nome é dito? | marca só no fim | marca reconhecível no primeiro terço e no fim | |
| **Sincronia** | Cada palavra-chave da narração tem uma imagem no mesmo instante? Efeitos nos acentos? | imagem atrasada da fala | imagem e efeito no quadro da palavra | |

## Critérios de acabamento (entraram na versão 2)

Valem para todo criativo e pesam mais no caminho 3D. Foi por eles que a primeira versão do anúncio do
próprio projeto voltou como "crua".

| Critério | O que olhar | 1 (ruim) | 10 (pronto) | Nota |
| --- | --- | --- | --- | --- |
| **Realismo / materiais** | As coisas têm matéria (espessura, aresta arredondada que pega luz, reflexo, sombra de contato, algum defeito)? Há um lugar (chão, luz de estúdio) ou só um degradê? O preto é preto (8/255 ou menos)? | formas planas sobre degradê, preto leitoso (perto de 23/255) | materiais físicos, luz com intenção, nada que denuncie o computador | |
| **Câmera e montagem** | A câmera existe (lente, foco raso, movimento lento e contínuo)? O quadro está cheio (o assunto ocupa mais da metade da largura)? Há cortes secos, presos à palavra falada? Foi visto **em movimento**, não só em folha de contato? | tudo entra por fusão com a mesma curva; assunto pequeno no meio do quadro | cada plano tem motivo, lente e duração; os cortes caem na palavra | |
| **"Premium, não IA"** | Um estranho diria que isso saiu de um estúdio? Ou tem cara de template: caixa alta pesada, tudo centralizado, brilho e néon gratuitos, cinco cores, elementos genéricos? | parece gerado, parece template | não dá para dizer como foi feito | |
| **Som medido** | O som foi **medido**, não só ouvido? Master em -14 LUFS e pico real até -1 dBTP (`make checar`). Frases e vozes no mesmo nível. A trilha aparece nos intervalos da fala (não some sob a voz). Cada efeito começa no quadro do evento e nunca em cima de uma palavra. Há respiro antes da virada e um fecho no cartão final. | trilha some ou briga com a voz; efeito em cima de palavra; nível varia de frase para frase | medidas anotadas abaixo e dentro da meta | |

Critérios separados quando fizer sentido: composição,
tipografia, consistência entre planos, história sem som, CTA. No caminho 3D com dois mundos de luz, dê uma nota
de realismo para cada mundo.

**Média:** ____ / 10        **Critérios abaixo de 8:** ____

### Medidas desta rodada (preencha o que foi medido; "não medi" também é resposta)

| Medida | Valor | Meta |
| --- | --- | --- |
| Loudness integrado / pico real | | -14 LUFS (± 1) / até -1 dBTP |
| Nível de cada frase da narração (maior diferença) | | frases e vozes no mesmo nível |
| Trilha nos intervalos da fala, em relação à voz | | perto de 9 LU abaixo; com 14 LU ou mais ela some |
| Início de cada efeito em relação ao evento na imagem | | no mesmo quadro; nenhum em cima de palavra |
| Preto mais escuro do quadro | | 8/255 ou menos |
| Contraste das legendas contra o quadro renderizado | | 4,5:1 ou mais |
| Largura do quadro ocupada pelo assunto | | mais da metade |

## O que mudar nesta rodada (no máximo 5 itens, do mais importante para o menos)
1.
2.
3.

## Crítico independente

**Quem constrói nunca aprova sozinho.** Depois de tantas rodadas, o construtor conhece cada justificativa
e para de ver o detalhe. Um crítico independente, sem o histórico da construção, enxerga o que passou e
devolve correções com números. No anúncio de exemplo, foi essa rodada que levou o filme ao acabamento final.

Como fazer:

- **Quem critica não construiu.** Pode ser outra pessoa ou outro agente de IA aberto do zero, sem o
  histórico da construção.
- **O que o crítico recebe:** o vídeo (ou a prévia), a folha de contato, o quadro de referências
  (`templates/referencias.md`) e esta rubrica. **Não recebe** as notas nem as justificativas do construtor.
- **Dois olhares, se der:** um de **realismo**, comparando quadro a quadro com as referências; outro de
  **montagem, movimento e som**, com medições (nível por frase, relação entre voz e trilha, início dos
  efeitos contra os eventos da imagem).
- **O crítico devolve números:** a nota de cada critério e uma lista de correções que se pode conferir
  ("preto em 23/255, levar a 8 ou menos"; "trilha 14,8 LU abaixo da voz, levar a 9").
- **O construtor responde item por item:** aplicado, ou não aplicado e por quê. Nada some da lista.
- **A voz é aprovada de ouvido por uma pessoa.** `scripts/voz_avaliar.py` só filtra palavra errada e tom
  errado no fim da frase; o tom e a emoção, quem escolhe é o ouvido.
- **Só vai para o ar** com as notas do crítico em 8 ou mais; o que ficar abaixo vai escrito na entrega.

| Crítico (não construiu) | Olhar | Notas dele | Reprovou o quê | Correções pedidas |
| --- | --- | --- | --- | --- |
| | realismo | | | |
| | montagem, movimento e som | | | |

### Itens do crítico não aplicados (e por quê)
-

## Rodadas anteriores
| Rodada | Quem avaliou | Média | Critérios abaixo de 8 | Principal mudança |
| --- | --- | --- | --- | --- |
| 1 | construtor | | | |
| 2 | construtor | | | |
| 3 | crítico independente | | | |
