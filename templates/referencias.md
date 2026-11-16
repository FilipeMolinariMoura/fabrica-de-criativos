# Quadro de referências

> Antes de desenhar qualquer plano, junte de 8 a 15 filmes que já têm o acabamento que você quer e
> escreva **por que** cada um funciona. O objetivo não é copiar um filme: é tirar regras que se repetem
> em vários e que dá para reproduzir em código.
> Este quadro é a régua da crítica (`templates/critica.md`) e dos quadros de estilo
> (`templates/quadros-de-estilo.md`).

**Projeto:**                      **Data do levantamento:**                **Quem levantou:**

**Aonde queremos chegar, em uma frase:**

## Como cada referência foi lida (preencha com honestidade)

Diga de onde vieram as medidas, porque isso muda o quanto se pode confiar nelas.

- [ ] Assisti ao filme inteiro, com som
- [ ] Li só quadros parados ou miniaturas de pré-visualização (sem baixar o vídeo, sem som)
- [ ] Medi em quadros capturados em tamanho cheio

Regras desta folha:

- **Medida tirada de miniatura é estimativa visual.** Lente, abertura, porcentagem do quadro e duração de
  plano lidas em quadros pequenos são ponto de partida, não medição. Marque com "(estimado)".
- **O que não foi ouvido não se afirma.** Se o filme ficou mudo, escreva "som: não verificado".
- **Só referência pública**, com link. Não guarde nem redistribua o vídeo dos outros; guarde o link e as suas notas.
- **Não atribua autoria sem fonte** (estúdio, diretor, ferramenta).
- Visualizações e datas mudam: anote o dia em que olhou.

## Referências

Copie o bloco abaixo para cada filme.

### 1. Marca ou canal: "título do filme"

| Campo | Anotação |
| --- | --- |
| **Link** | https://… |
| **Duração, formato, data** | ex.: 42 s, 16:9, visto em DD/MM/AAAA |
| **Por que é boa** | Uma ou duas frases: o que este filme faz que o nosso ainda não faz. |
| **Técnicas reproduzíveis** | Em tópicos, cada uma dita de um jeito que dá para programar. Ex.: "interface mostrada como objeto físico (placa de vidro inclinada, foco raso)"; "título em serifada itálica só na palavra de acento"; "corte seco em cada verbo da narração". |
| **Medidas estimadas** | Ritmo: planos em s (média) · Lente: mm ou campo de visão · Foco: o que está nítido · Quadro ocupado pelo assunto: % da largura · Preto mais escuro: /255 · Tipografia: altura do título em % do quadro, caixa, peso · Cores: base + acento. Marque "(estimado)" no que foi lido em miniatura. |
| **Som** | O que se ouve em cada evento, ou "não verificado". |
| **O que NÃO copiar** | O que é da marca deles (personagem, slogan, trilha) ou não cabe no nosso formato. |

### 2. …

## O que se repete (as regras que saem do quadro)

Uma regra só entra aqui se aparece em **três referências ou mais**. Escreva cada uma com número, para a
crítica poder conferir depois.

| # | Regra | Número para conferir | Em quais referências |
| --- | --- | --- | --- |
| 1 | ex.: encha o quadro | assunto com 55 a 75 % da largura | 1, 4, 7 |
| 2 | ex.: preto de verdade | preto mais escuro em 8/255 ou menos | 2, 3, 5, 9 |
| 3 | | | |

## Diagnóstico da nossa versão atual contra o quadro

Meça o que já existe com a mesma régua. Sem anestesia: é este quadro que justifica refazer.

| Medida | Nossa versão | Referências | Distância |
| --- | --- | --- | --- |
| Quadro ocupado pelo assunto | | | |
| Preto mais escuro | | | |
| Cortes secos em 30 s | | | |
| Duração média de plano | | | |
| Famílias tipográficas, caixa e peso | | | |
| Cores (base + acentos) | | | |

**Os três defeitos que atravessam o filme inteiro:**
1.
2.
3.

## Tratamento proposto

- **Ideia em uma frase:**
- **Mundo(s) de luz:** (ex.: escuro → claro → escuro)
- **Tipografia e cor:** (duas famílias no máximo; uma base, um acento)
- **Lista de planos:** (número, o que se vê, palavra da narração em que entra, duração)
- **O que não consegui verificar:**

Próximo passo: quatro quadros de estilo, antes de construir o filme (`templates/quadros-de-estilo.md`).
