# 12. Voz dirigida

[← 11. 3D fotorrealista](11-3d-fotorrealista.md) · [Índice](README.md) · Próximo: [13. Som →](13-som.md)

Num anúncio, a voz é o que faz a pessoa do outro lado **sentir** alguma coisa. Uma narração correta informa; uma narração dirigida convence. Este capítulo ensina a dirigir uma voz sintética como se dirige um locutor de estúdio, com um processo curto, barato e repetível.

O método cabe numa frase: **dirija a voz com marcações de tom, aprove o tom em amostras curtas antes de gerar o roteiro inteiro, e deixe o ouvido de uma pessoa dar a palavra final.**

O processo vale para qualquer motor. Com as vozes gratuitas (Kokoro, local, e Fish Audio) ele custa R$ 0, e a [seção 12.8](#128-e-na-trilha-gratuita) mostra o passo a passo. Os exemplos com marcações de tom usam a ElevenLabs, um serviço opcional para quem quer interpretação de locutor.

## 12.1 A máquina filtra, o ouvido aprova

O kit traz um filtro às cegas que poupa o seu ouvido de tomadas com erro objetivo:

- o **Whisper** transcreve a tomada sem ver o roteiro. Se ele ouve outra palavra, a pronúncia está errada;
- o **Praat** mede a frequência fundamental no fim de cada frase. Afirmação precisa terminar descendo; pergunta de sim ou não, subindo.

O filtro é ótimo no que mede e não pretende medir o resto. Naturalidade e emoção são trabalho do ouvido.

| O filtro garante | O ouvido decide |
|---|---|
| Nenhuma palavra trocada, engolida ou mal pronunciada | Se a leitura tem intenção |
| Afirmação terminando como afirmação | Se a melodia soa brasileira |
| Pausas na medida | Se a emoção combina com a frase |
| Nenhum final cortado | Se as frases variam de desenho |

Daí a regra: **a máquina filtra, o ouvido aprova.** O filtro leva ao ouvido só tomadas sem erro; a aprovação é sempre de uma pessoa.

## 12.2 O processo

```
amostras de tom → escolha de ouvido → roteiro inteiro, várias sementes → filtro às cegas → 2 finalistas → ouvido
   (10 s cada)      (uma pessoa)          (5 a 8 tomadas)                  (máquina)                      (uma pessoa)
```

### Passo 1: amostras de tom

Comece pelo **gancho e pelo CTA**, uns 10 segundos, em 4 a 7 variações de voz, modelo e ajuste. É barato, é rápido de ouvir, e são as duas frases que mais dependem de intenção. Aprovar o tom aqui economiza o crédito de gerar o roteiro inteiro várias vezes.

```bash
uv run scripts/voz_dirigida.py amostras <voice_id> ana --id c01 --roteiros roteiros/roteiros.json
```

No macOS e no Linux, o atalho equivalente é `make voz-amostras VOICE=<voice_id> ROTULO=ana ID=c01`. O script gera arquivos numerados e um `amostras.json` dizendo o que é cada número. Rode de novo com outra voz e a numeração continua, para ouvir lado a lado. As variações prontas são:

| Variação | Modelo | Ajuste | Texto |
|---|---|---|---|
| `v3-natural` | `eleven_v3` | estabilidade 0,5 | limpo |
| `v3-estavel` | `eleven_v3` | estabilidade 1,0 | limpo |
| `v3-dirigida` | `eleven_v3` | estabilidade 0,5 | com marcações de tom |
| `v2` | `eleven_multilingual_v2` | `stability` 0,30, `style` 0,55 | limpo |
| `v3-criativa` | `eleven_v3` | estabilidade 0,0 | com marcações de tom |

No anúncio do projeto foram sete amostras: quatro com a voz feminina e três com a masculina.

### Passo 2: uma pessoa escolhe o tom

Mande os arquivos numerados e pergunte qual número. Não descreva as amostras antes: a descrição contamina a escuta.

Em A bancada, a escolha foi a variação dirigida para a voz 1 e a `v2` expressiva para a voz 2.

### Passo 3: o roteiro inteiro, com sementes

Com o tom aprovado, gere o texto dirigido **inteiro numa geração só**, para a entonação atravessar as frases. Faça de 5 a 8 tomadas, cada uma com uma semente diferente. A semente torna a tomada repetível: se a quarta for a boa, você consegue gerá-la de novo.

```bash
# voz 1: as falas dela, dirigidas, no eleven_v3
uv run scripts/voz_dirigida.py bloco c01 f1 ana --so-voz f1 --tomadas 5

# voz 2: as falas dela, no multilingual v2 expressivo
uv run scripts/voz_dirigida.py bloco c01 m5 beto --so-voz m5 \
  --modelo eleven_multilingual_v2 --estabilidade 0.30 --estilo 0.55 --tomadas 3
```

`f1` e `m5` são apelidos do mapa `vozes` do roteiro, que liga cada apelido a um `voice_id`. O modelo completo, com `vozes` e `falas_dirigidas`, é o criativo `c02-voz-dirigida` de [`templates/roteiro.json`](../templates/roteiro.json). Use `--dry-run` para ver as requisições sem gastar crédito. No macOS e no Linux, o atalho é `make voz-dirigida ID=c01 VOICE=<voice_id> ROTULO=ana`.

### Passo 4: filtro às cegas

```bash
uv run scripts/voz_avaliar.py voz/<pasta-das-tomadas>
```

Descarte o que tiver palavra errada ou fim de frase no tom errado. O que sobrar são candidatas. O script termina indicando a "melhor no filtro", lembrando que a escolha final é de ouvido.

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

## 12.3 Como se dirige

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

A voz 2 usa o `eleven_multilingual_v2`, que dispensa marcações e responde muito bem à pontuação:

```
O método, o guia em PDF e o código inteiro... estão no GitHub!
Procure Fábrica de Criativos, e crie o seu, hoje!
```

As vírgulas de respiro e as exclamações fazem o trabalho. O registro completo está em [`exemplos/bancada/narracao.json`](../exemplos/bancada/narracao.json).

**Dois textos, sempre.** O roteiro aprovado fica limpo. O texto dirigido é outro campo (`falas_dirigidas` no roteiro). O filtro e o `vo_montar.py` conferem contra o texto limpo.

**Dose certa.** Uma marcação por ideia. Com uma marcação por frase, a leitura fica teatral e instável.

## 12.4 `language_code`: a melodia do português

Vozes nativas do idioma soam mais naturais. As vozes padrão da ElevenLabs são americanas: pronunciam bem o português, mas tendem a levar a **melodia do inglês** para a frase. Duas medidas trazem a entonação para o português:

1. **Forçar o idioma:** `language_code: "pt"` na requisição do `eleven_v3`. O script envia por padrão.
2. **Dirigir.** A marcação de tom dá ao modelo um desenho de frase para seguir.

Para o resultado mais natural, escolha uma **voz brasileira nativa** da biblioteca de vozes. Isso pede plano pago e uma chave de API com permissão para usar vozes da biblioteca.

## 12.5 Qual motor usar quando

Avaliação de ouvido, em português do Brasil, em novembro de 2026.

| Motor | Ponto forte | Custo | Use para |
|---|---|---|---|
| **Kokoro-82M** | Leitura limpa e correta; roda local; repetível; licença permite uso comercial | Grátis | Rascunho, aprovação de roteiro, `npm run demo`, anúncios em que a imagem é a protagonista |
| **Fish Audio** `s2.1-pro-free` | Mais expressivo que o Kokoro; biblioteca grande de vozes em português | Grátis, com uso justo | Trilha gratuita com mais cor na voz; frase a frase onde precisar de controle fino |
| **ElevenLabs** `eleven_v3`, dirigido | Obedece às marcações de tom; timbre de estúdio; sementes repetíveis | Pago | A voz principal de um anúncio |
| **ElevenLabs** `eleven_multilingual_v2` expressivo | Estável; responde muito bem à pontuação | Pago | Segunda voz, fecho, variações |
| **ElevenLabs** modo diálogo | Duas vozes numa geração, com troca natural | Pago | Diálogo de verdade, com direção por fala |

Dicas para tirar o melhor de cada um:

- **Kokoro:** não sobe o tom em pergunta por conta própria; prefira roteiros com afirmações curtas.
- **Fish Audio:** em textos longos, gere frase a frase e escolha às cegas; estrangeirismos ficam melhores com grafia fonética.
- **ElevenLabs:** sempre com direção (marcações, `language_code` e sementes). As tomadas variam entre si, e é por isso que o processo gera várias.

## 12.6 Duas vozes

No filme, a voz 1 lê as onze primeiras frases, e a voz 2 entra só nas duas últimas ("O método…" e "Procure…"). A segunda voz marca a passagem do filme para o convite.

Boas práticas ao emendar vozes:

- **Iguale o loudness.** Em A bancada, as duas vozes foram niveladas no mesmo valor (−19,6 LUFS).
- **Trate a sibilância e a dinâmica.** Um de-esser na faixa de 5 a 9 kHz e compressão suave de 3:1 deixam os níveis de palavra parelhos.
- **Mostre a troca na imagem.** No filme, a legenda muda de cor de acento quando a voz muda, e uma etiqueta "voz 1 → voz 2" aparece.
- **Troque com propósito.** Uma segunda voz funciona melhor num momento marcado (o fecho, o convite) do que alternando frase a frase.

## 12.7 Custos

| Item | Valor |
|---|---|
| Plano | ElevenLabs Starter, US$ 5 por mês, 30 mil créditos |
| Preço no `eleven_v3` | 1 crédito por caractere |
| Uma geração completa do roteiro dirigido de A bancada | 547 caracteres (435 da voz 1 e 112 da voz 2) |
| Processo completo deste capítulo | sete amostras de 10 s e oito tomadas completas: menos de 6 mil caracteres |
| Formato | `mp3_44100_128`; 192 kbps a partir do plano Creator |

Ou seja: um anúncio inteiro, com amostras e tomadas, cabe com folga no plano de entrada.

O kit registra os caracteres de cada chamada em `voz/caracteres.log`. Some antes de começar um lote e confira o saldo com `node scripts/eleven.mjs conta`.

## 12.8 E na trilha gratuita?

O processo é o mesmo, com as alavancas que cada motor oferece.

1. **Amostras de tom:** o gancho e o CTA em três ou quatro vozes da biblioteca da Fish Audio, e nas três do Kokoro.
2. **Direção por pontuação:** reticências, dois-pontos, perguntas. É a direção que esses motores entendem.
3. **Roteiro que ajuda a voz:** frases curtas, uma pergunta a cada três ou quatro frases ([capítulo 7](07-roteiro-e-copy.md)).
4. **Frase a frase onde a voz pedir**, e em bloco no restante.
5. **Ouvido no fim**, igual.

O resultado é uma narração clara e correta, de custo zero. Quando a voz for o centro do anúncio, a trilha paga dá a camada extra de emoção.

## 12.9 Ética e licença

- **Não use vozes que imitam pessoas reais.** Clonar a voz de alguém exige consentimento.
- **Confira a licença comercial** do plano antes de veicular. O plano gratuito da ElevenLabs não permite uso comercial.
- **Siga as políticas de conteúdo gerado por IA** da plataforma de anúncios.
- **Não guarde áudio no repositório.** O `.gitignore` do kit já exclui `voz/`, `*.wav` e `*.mp3`.

## 12.10 Checklist da etapa

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
