# 12. Voz dirigida

[← 11. 3D fotorrealista](11-3d-fotorrealista.md) · [Índice](README.md) · Próximo: [13. Som →](13-som.md)

Este é o capítulo mais honesto do manual, porque a voz foi a parte que mais deu errado.

A versão 1 do método tratava a narração como um problema de conferência: gerar três tomadas, deixar uma máquina escolher a melhor, seguir. Funcionou para pegar palavra errada. Não funcionou para o que importa num anúncio, que é a pessoa do outro lado **sentir** alguma coisa. Três narrações foram reprovadas de ouvido antes de uma passar.

O que este capítulo ensina cabe numa frase: **dirija a voz como se dirige um locutor, aprove o tom antes do texto, e deixe o ouvido de uma pessoa dar a palavra final.**

## 12.1 A lição que custou mais caro

O filtro às cegas do kit faz duas coisas bem:

- o **Whisper** transcreve a tomada sem ver o roteiro. Se ele ouve outra palavra, a pronúncia está errada;
- o **Praat** mede a frequência fundamental no fim de cada frase. Afirmação precisa terminar descendo; pergunta de sim ou não, subindo.

Esse filtro **não mede naturalidade nem emoção**. Várias narrações com nota 100 no filtro foram reprovadas de ouvido pelo autor. Estavam corretas e mortas.

| O filtro pega | O filtro não pega |
|---|---|
| Palavra trocada, engolida ou mal pronunciada | Leitura sem intenção |
| Afirmação que termina como pergunta | Melodia de outro idioma |
| Pausa longa demais | Emoção errada para a frase |
| Final cortado | Monotonia: todas as frases com o mesmo desenho |

Daí a regra: **a máquina filtra, o ouvido aprova.** O filtro serve para não gastar o ouvido de ninguém com tomadas que têm erro objetivo. A aprovação é sempre de uma pessoa.

## 12.2 A trilha de tentativas

Na ordem em que aconteceram, para o roteiro de A bancada.

| # | Tentativa | Como foi feita | Resultado no filtro | Resultado no ouvido |
|---|---|---|---|---|
| 1 | **Kokoro** (gratuito, local) | Roteiro em bloco | Passa | **Reprovada.** Limpa e neutra, sem intenção |
| 2 | **Fish Audio** (`s2.1-pro-free`, gratuito) | Frase a frase, vários candidatos por frase, escolha às cegas, duas vozes em diálogo | Passa | **Reprovada.** Melhor que a primeira; cada frase certa, o conjunto sem fio de emoção |
| 3 | **ElevenLabs `eleven_v3` em modo diálogo** | Duas vozes numa geração só, pelo endpoint `/v1/text-to-dialogue` | Passa: palavras fiéis | **Reprovada.** Entonação errada para o texto |
| 4 | **ElevenLabs com direção** | Voz 1 no `eleven_v3` com idioma forçado e marcações de tom; voz 2 no `eleven_multilingual_v2` expressivo | Passa | **Aprovada** |

A tentativa 2 foi a narração publicada na versão 1.1 do repositório. Ela continua no exemplo `exemplos/divulgacao`.

A tentativa 4 não foi "o motor certo". Foi o primeiro uso de um **processo**. O mesmo motor, sem direção, tinha sido reprovado na tentativa 3.

## 12.3 O processo que funcionou

```
amostras de tom → escolha de ouvido → roteiro inteiro, várias sementes → filtro às cegas → 2 finalistas → ouvido
   (10 s cada)      (uma pessoa)          (5 a 8 tomadas)                  (máquina)                      (uma pessoa)
```

### Passo 1: amostras de tom

Não gere o roteiro inteiro. Gere só o **gancho e o CTA**, uns 10 segundos, em 4 a 7 variações de voz, modelo e ajuste. É barato, é rápido de ouvir, e são as duas frases que mais dependem de intenção.

```bash
uv run scripts/voz_dirigida.py amostras <voice_id> ana --id c01 --roteiros roteiros/roteiros.json
```

O atalho equivalente é `make voz-amostras VOICE=<voice_id> ROTULO=ana ID=c01`. O script gera arquivos numerados e um `amostras.json` dizendo o que é cada número. Rode de novo com outra voz e a numeração continua, para ouvir lado a lado. As variações prontas são:

| Variação | Modelo | Ajuste | Texto |
|---|---|---|---|
| `v3-natural` | `eleven_v3` | estabilidade 0,5 | limpo |
| `v3-estavel` | `eleven_v3` | estabilidade 1,0 | limpo |
| `v3-dirigida` | `eleven_v3` | estabilidade 0,5 | com marcações de tom |
| `v2` | `eleven_multilingual_v2` | `stability` 0,30, `style` 0,55 | limpo |
| `v3-criativa` | `eleven_v3` | estabilidade 0,0 | com marcações de tom |

Neste projeto foram sete amostras: quatro com a voz feminina e três com a masculina.

### Passo 2: uma pessoa escolhe o tom

Mande os arquivos numerados e pergunte qual número. Não descreva as amostras antes: a descrição contamina a escuta.

Aqui a escolha foi a variação dirigida para a voz 1 e a `v2` expressiva para a voz 2.

### Passo 3: o roteiro inteiro, com sementes

Com o tom aprovado, gere o texto dirigido **inteiro numa geração só**, para a entonação atravessar as frases. Faça de 5 a 8 tomadas, cada uma com uma semente diferente. A semente torna a tomada repetível: se a quarta for a boa, você consegue gerá-la de novo.

```bash
# voz 1: as falas dela, dirigidas, no eleven_v3
uv run scripts/voz_dirigida.py bloco c01 f1 ana --so-voz f1 --tomadas 5

# voz 2: as falas dela, no multilingual v2 expressivo
uv run scripts/voz_dirigida.py bloco c01 m5 beto --so-voz m5 \
  --modelo eleven_multilingual_v2 --estabilidade 0.30 --estilo 0.55 --tomadas 3
```

`f1` e `m5` são apelidos do mapa `vozes` do roteiro, que liga cada apelido a um `voice_id`. O modelo completo, com `vozes` e `falas_dirigidas`, é o criativo `c02-voz-dirigida` de [`templates/roteiro.json`](../templates/roteiro.json). Use `--dry-run` para ver as requisições sem gastar crédito. O atalho é `make voz-dirigida ID=c01 VOICE=<voice_id> ROTULO=ana`.

### Passo 4: filtro às cegas

```bash
uv run scripts/voz_avaliar.py voz/<pasta-das-tomadas>
```

Descarte o que tiver palavra errada ou fim de frase no tom errado. O que sobrar são candidatas. O próprio script termina com "melhor no filtro" e o aviso de que a nota não mede naturalidade nem emoção.

### Passo 5: duas finalistas para o ouvido

Leve **duas** opções, não uma e não cinco. Com uma, não há escolha. Com cinco, a pessoa cansa e passa a escolher pela ordem.

### Passo 6: juntar e pôr no tempo

```bash
# emenda a voz 1 e a voz 2, iguala o volume e põe a pausa na troca
uv run scripts/voz_dirigida.py juntar c01-final narracao \
  voz/c01-ana/ana-3.wav voz/c01-beto/beto-1.wav --pausa 0.36

# trata, acelera de leve e grava o tempo de cada palavra
uv run scripts/vo_montar.py <pasta-do-filme> voz/c01-final/narracao-1.wav --tempo 1.10 --pausa-max 0.36
```

Os valores de `--tempo` e `--pausa-max` são os usados em A bancada.

## 12.4 Como se dirige

O `eleven_v3` aceita direção escrita dentro do texto. São três ferramentas.

**1. Marcações de tom por bloco**, entre colchetes. Uma marcação vale até a próxima.

| Marcação | Onde foi usada | Efeito buscado |
|---|---|---|
| `[serious]` | No gancho | Peso, sem sorriso |
| `[dramatic]` | Em "Ele foi programado." | A virada |
| `[short pause]` | Depois da virada | Deixar a frase assentar |
| `[warmly]` | Na explicação do produto | Aproximar |
| `[curious]` | Nas três perguntas | Final subindo, de verdade |
| `[confident]` | Em "Um comando só!" | Resposta seca |
| `[excited]` | Em "pronto pra postar!" | Energia |
| `[amazed]` | Em "E custa zero" | Surpresa |

**2. Ênfase em CAIXA ALTA.** Uma palavra por frase, no máximo: "Esse vídeo... NÃO foi editado."

**3. Reticências para pausa.** "Esse vídeo... NÃO foi editado." abre um silêncio antes da palavra que importa.

O texto dirigido da voz 1, como foi enviado:

```
[serious] Esse vídeo... NÃO foi editado. [dramatic] Ele foi programado. [short pause]
Ninguém abriu um editor. Ninguém arrastou um clipe. [warmly] Você escreve o roteiro,
a inteligência artificial narra, e cada cena entra exatamente na palavra falada.
[curious] Quer outra cor? Outro estilo? Outra voz? [confident] Um comando só!
[excited] Sessenta quadros por segundo, pronto pra postar! [amazed] E custa zero:
os modelos são abertos!
```

A voz 2 usa o `eleven_multilingual_v2`, que **não entende marcações**. Ali a direção é só pontuação:

```
O método, o guia em PDF e o código inteiro... estão no GitHub!
Procure Fábrica de Criativos, e crie o seu, hoje!
```

As vírgulas de respiro e as exclamações fazem o trabalho. O registro completo está em [`exemplos/bancada/narracao.json`](../exemplos/bancada/narracao.json).

**Dois textos, sempre.** O roteiro aprovado fica limpo. O texto dirigido é outro campo (`falas_dirigidas` no roteiro). O filtro e o `vo_montar.py` conferem contra o texto limpo.

**Não exagere.** Uma marcação por ideia. Texto com uma marcação por frase sai teatral e instável.

## 12.5 `language_code`: o sotaque de entonação

As vozes padrão da ElevenLabs são americanas. Elas falam português com as palavras certas e a **melodia do inglês**: sobem onde o português desce, alongam a sílaba errada.

Duas coisas reduziram isso:

1. **Forçar o idioma:** `language_code: "pt"` na requisição do `eleven_v3`. O script envia por padrão.
2. **Dirigir.** A marcação de tom dá ao modelo um desenho de frase para seguir.

Reduziram, e não eliminaram. O caminho ideal é uma **voz brasileira nativa** da biblioteca de vozes. Isso exige plano pago e que a chave de API tenha permissão para usar vozes da biblioteca. Não foi o caminho deste anúncio, e fica registrado como limite.

## 12.6 O que cada motor fez bem e mal

Avaliação do autor, de ouvido, em português do Brasil, em novembro de 2026. Não é teste controlado.

| Motor | Fez bem | Fez mal | Custo | Use para |
|---|---|---|---|---|
| **Kokoro-82M** | Leitura limpa e correta; roda local; repetível; licença permite uso comercial | Pouca emoção; não sobe o tom em pergunta | Grátis | Rascunho, aprovação de roteiro, `make demo` |
| **Fish Audio** `s2.1-pro-free` | Mais expressivo que o Kokoro; biblioteca grande de vozes em português | Em bloco, "se perde" e termina afirmação como pergunta; frase a frase, perde o fio de emoção; estrangeirismos pediram grafia fonética | Grátis, com uso justo | Trilha gratuita, quando a voz não é o centro do anúncio |
| **ElevenLabs** `eleven_v3`, sem direção | Palavras fiéis; timbre de estúdio | Entonação fora do texto; melodia de inglês nas vozes padrão | Pago | Não recomendado sem direção |
| **ElevenLabs** modo diálogo | Duas vozes numa geração, com troca natural | A mesma entonação errada, agora em duas vozes | Pago | Diálogo de verdade, com direção por fala |
| **ElevenLabs** `eleven_v3`, dirigido | Obedece às marcações; aprovado de ouvido | Varia entre tomadas (por isso as sementes); sotaque de entonação residual | Pago | A voz principal de um anúncio |
| **ElevenLabs** `eleven_multilingual_v2` expressivo | Estável; responde bem à pontuação | Não entende marcações | Pago | Segunda voz, fecho, variações |

## 12.7 Duas vozes

No filme, a voz 1 lê as onze primeiras frases, e a voz 2 entra só nas duas últimas ("O método…" e "Procure…"). Foi uma decisão de aprovação: a segunda voz marca a passagem do filme para o convite.

Cuidados ao emendar vozes:

- **Iguale o loudness.** Na rodada de correções, as duas vozes foram niveladas no mesmo valor (−19,6 LUFS).
- **Trate a sibilância e a dinâmica.** O crítico de som pediu de-esser na faixa de 5 a 9 kHz e compressão suave de 3:1, para os níveis de palavra não variarem demais.
- **Mostre a troca na imagem.** No filme, a legenda muda de cor de acento quando a voz muda, e uma etiqueta "voz 1 → voz 2" aparece.
- **Não alterne por alternar.** A primeira versão alternava as vozes frase a frase. Na aprovação, pediu-se a segunda voz só no fecho.

## 12.8 Custos

| Item | Valor |
|---|---|
| Plano usado | ElevenLabs Starter, US$ 5 por mês, 30 mil créditos |
| Preço no `eleven_v3` | 1 crédito por caractere |
| Uma geração completa do roteiro dirigido | 547 caracteres (435 da voz 1 e 112 da voz 2) |
| Gasto somando todas as tentativas | da ordem de 12 a 15 mil créditos (estimativa pelo saldo da conta) |
| Formato | `mp3_44100_128`; 192 kbps só a partir do plano Creator |

O kit registra os caracteres de cada chamada em `voz/caracteres.log`. Some antes de começar um lote e confira o saldo com `node scripts/eleven.mjs conta`.

Com o processo deste capítulo, o gasto esperado é bem menor que o deste anúncio: sete amostras de 10 segundos e oito tomadas completas somam menos de 6 mil caracteres. O resto foi o preço de descobrir o processo.

## 12.9 E na trilha gratuita?

O processo é o mesmo, com menos alavancas.

1. **Amostras de tom:** o gancho e o CTA em três ou quatro vozes da biblioteca da Fish Audio, e nas três do Kokoro.
2. **Direção por pontuação:** reticências, dois-pontos, perguntas. É a única direção que esses motores entendem.
3. **Roteiro que ajuda a voz:** frases curtas, uma pergunta a cada três ou quatro frases ([capítulo 7](07-roteiro-e-copy.md#74-escrever-para-a-voz)).
4. **Frase a frase só onde a voz se perde**, e não no roteiro inteiro.
5. **Ouvido no fim**, igual.

Espere um resultado correto e mais neutro. Se a voz for o centro do anúncio, é a peça em que vale pagar.

## 12.10 Ética e licença

- **Não use vozes que imitam pessoas reais.** Clonar a voz de alguém exige consentimento.
- **Confira a licença comercial** do plano antes de veicular. O plano gratuito da ElevenLabs não permite uso comercial.
- **Siga as políticas de conteúdo gerado por IA** da plataforma de anúncios.
- **Não guarde áudio no repositório.** O `.gitignore` do kit já exclui `voz/`, `*.wav` e `*.mp3`.

## 12.11 Checklist da etapa

- [ ] Roteiro aprovado antes de qualquer geração
- [ ] Amostras de tom só do gancho e do CTA, de 4 a 7 variações
- [ ] Tom escolhido de ouvido por uma pessoa
- [ ] Texto dirigido num campo separado do texto limpo
- [ ] De 5 a 8 tomadas com sementes registradas
- [ ] Filtro às cegas rodado
- [ ] Duas finalistas ouvidas por uma pessoa
- [ ] Vozes niveladas, se houver mais de uma
- [ ] Caracteres somados e licença conferida

---

Próximo: [13. Som →](13-som.md)
