# 7. Roteiro e copy

[← 6. Técnicas de motion](06-tecnicas-de-motion.md) · [Índice](README.md) · Próximo: [8. Qualidade →](08-qualidade-e-solucao-de-problemas.md)

O roteiro decide a maior parte do resultado: é ele que a voz interpreta e é nele que cada cena se prende. Este capítulo dá a fórmula, as famílias de gancho que se veem em anúncios que ficam muito tempo no ar, e mostra, frase a frase, como o roteiro do anúncio deste projeto foi lapidado, com o raciocínio de cada escolha.

## 7.1 Fórmula de 30 segundos

| Bloco | Tempo | Função | Exemplo genérico |
|---|---|---|---|
| Gancho | 0–3 s | Fazer o público se reconhecer | "Quanto tempo você perde por dia procurando informação?" |
| Problema | 3–9 s | Mostrar a dor numa cena concreta | "Planilha desatualizada. Mensagem perdida no grupo." |
| Virada | ~10 s | Apresentar o produto com a maior mudança visual | "Com o Fluxo, tudo fica num lugar só." |
| Produto em ação | 11–21 s | Mostrar a interface real resolvendo | "Toque, atribua, acompanhe." |
| Prova | 21–25 s | Dar um detalhe verificável | "Cada etapa com responsável e horário." |
| CTA | 25–30 s | Pedir uma ação | "Chama no WhatsApp e peça seu diagnóstico gratuito." |

"Fluxo" é o aplicativo fictício do exemplo `exemplos/demo`.

A fórmula é um ponto de partida. O anúncio deste projeto dobra a regra: o gancho e a virada acontecem nos primeiros 4 segundos, porque o produto *é* a virada ("não foi editado, foi programado").

## 7.2 Famílias de gancho

### As cinco clássicas

| Família | Quando usar |
|---|---|
| Pergunta de dor | O público já sente o problema |
| Número concreto | Existe um dado com fonte |
| Contraste antes e depois | O produto tem efeito visual claro |
| Afirmação contraintuitiva | O mercado tem uma crença que o produto derruba |
| "Você sabia" | Há um recurso pouco conhecido |

### O que se viu em anúncios de longa duração

Na pesquisa de referências deste projeto ([capítulo 9](09-pesquisa-de-referencias.md)), anúncios ativos de ferramentas criativas e de IA foram ordenados por dias no ar na biblioteca de anúncios da Meta. Dias no ar é um sinal indireto: quem paga por um anúncio durante meses provavelmente tem motivo. A ferramenta de consulta não informa gasto nem resultado, então **isto é indício, não prova de desempenho**.

| Família | Exemplo observado | Dias no ar na data da coleta |
|---|---|---|
| **"Você ainda faz do jeito antigo?"** | "It's 2026, if you're still manually recording your voiceovers…" (ElevenLabs) | 270 |
| **Número concreto de ganho** | "Cut your editing time from 4 hours to 4 minutes" (ElevenLabs) | 228 |
| **O produto ocupando o quadro inteiro** | Interface do editor em tela cheia, sem frase de efeito (CapCut) | 229 |
| **"Isto que você vê é diferente do que parece"** | "Esto no lo estoy grabando yo." (HeyGen) | 64 |
| **Desafio ao espectador** | "Un plan dans cette vidéo n'existe pas. Tu l'as repéré ?" (HeyGen) | 56 |
| **Sequência de verbos** | "Idea, type, generate, edit, done!" (Canva) | 53 |

Coleta em 16 nov. 2026. Só foram vistos o primeiro quadro e o texto de cada anúncio, não o vídeo.

Padrões que se repetem nos mais antigos:

1. **O primeiro quadro já é a imagem pronta.** Produto ou prova visível, texto legível. Nunca fade de preto, nunca logo.
2. **Número concreto vence adjetivo.** "De 4 horas para 4 minutos" diz mais que "muito mais rápido".
3. **Legenda queimada grande**, de 2 a 4 palavras por vez, sincronizada com a fala.
4. **CTA por ação simples**, dito e escrito.
5. **O que está há mais tempo no ar é "prova mais rosto"**, e não motion polido. Um filme sem rosto compensa com prova no primeiro quadro.

O gancho deste projeto, "Esse vídeo não foi editado. Ele foi programado.", pertence à quarta família. No orgânico, a mesma ideia sustenta vídeos técnicos com centenas de milhares de visualizações (por exemplo, "This video was made with code", do canal Fireship). Por isso o gancho é o eixo do roteiro, e o trabalho de lapidação se concentra no meio.

## 7.3 Lapidando o roteiro: o caso deste anúncio

Todo roteiro bom passa por uma lapidação. Escreva um rascunho completo, leia em voz alta e reescreva cada frase com três perguntas: dá para filmar? diz o benefício? a voz tem o que interpretar? No anúncio deste projeto, o rascunho de 84 palavras virou um roteiro final de 78. O gancho, o coração ("cada cena entra exatamente na palavra falada") e o CTA se mantiveram; seis frases ganharam força.

| # | Rascunho | Roteiro final | Técnica aplicada |
|---|---|---|---|
| 1 | Esse vídeo não foi editado. | *igual* | É o melhor ativo do filme e pertence a uma família de gancho que dura no ar |
| 2 | Ele foi programado. | *igual* | Fecha o gancho com a virada |
| 3 | Sem timeline. | **Ninguém abriu um editor.** | "Timeline" é jargão, e "sem" é negação abstrata. "Ninguém abriu um editor" é uma imagem: dá para filmar (a tampa do notebook fechando) |
| 4 | Sem arrastar clipe por clipe. | **Ninguém arrastou um clipe.** | Mesma construção da frase anterior, mais curta, com sujeito |
| 5 | Você escreve o roteiro, a inteligência artificial narra, e cada cena entra exatamente na palavra falada. | *igual* | É a explicação do produto em uma frase, e cada oração vira um plano |
| 6 | Outra cor. Outro estilo. Outra voz. | **Quer outra cor? Outro estilo? Outra voz?** | A pergunta devolve a palavra ao espectador e dá à voz três finais de frase subindo, que quebram a monotonia do trecho |
| 7 | Um comando só. | *igual* | Resposta seca às três perguntas |
| 8 | Sessenta quadros por segundo, com o áudio no padrão das redes. | Sessenta quadros por segundo, **pronto pra postar.** | "Padrão das redes" é especificação. Quem não sabe o que é LUFS não sente nada. "Pronto pra postar" é o benefício |
| 9 | E dá pra fazer tudo de graça, com modelos abertos. | **E custa zero: os modelos são abertos.** | Aos 19 segundos a frase precisa de energia. "Custa zero" é mais curto, é número, e os dois-pontos criam a pausa que dá peso |
| 10 | Método completo, guia em PDF e o código inteiro, aberto no GitHub. | **O método, o guia em PDF e o código inteiro estão no GitHub.** | Frase com verbo. Uma lista sem verbo soa como leitura de índice |
| 11 | Procure Fábrica de Criativos no GitHub e crie o seu hoje. | Procure Fábrica de Criativos e crie o seu hoje. | "GitHub" já foi dito na frase anterior e está escrito na tela |

Três técnicas saem desta tabela e valem para qualquer roteiro:

- **Troque negação por imagem.** Se a frase não pode ser filmada, reescreva.
- **Troque especificação por benefício.** O número técnico vai para a tela (o medidor mostra "−14 LUFS"); a fala diz o que isso dá a quem ouve.
- **Dê à voz o que cantar.** Perguntas, dois-pontos e frases curtas depois de uma longa criam melodia. Um roteiro de afirmações do mesmo tamanho sai monótono em qualquer motor de voz.

**Mudar o roteiro é barato:** regrave a voz, refaça o `vo.json` e o filme se reposiciona sozinho, porque as cenas são presas às palavras. Só as frases novas pedem planos novos. Ainda assim, aprove o texto antes de gerar a voz final: é a forma mais rápida de chegar ao filme pronto.

## 7.4 Escrever para a voz

| Evite | Prefira |
|---|---|
| Frase longa com vírgulas | Frases de 4 a 9 palavras |
| Siglas ("QR", "CRM") | A grafia como se fala ("quiu-ár"), testando no motor escolhido |
| "R$ 25 mil", "10s" | "vinte e cinco mil reais", "dez segundos" |
| Jargão ("solução robusta") | A palavra que o público usa |
| Três ideias numa cena | Uma ideia por cena |
| Só afirmações | Uma pergunta ou uma pausa a cada três ou quatro frases |

**A grafia depende do motor.** Em motores como o Fish Audio, estrangeirismos podem pedir grafia fonética ("taimláin", "Guitirrábi"). Com a ElevenLabs dirigida, a grafia normal ("GitHub", "PDF") sai certa. Teste a palavra difícil sozinha antes de gerar o roteiro inteiro, e guarde o texto limpo num campo e o texto de fala em outro.

**Marcações de direção** (`[serious]`, `[warmly]`) e ênfase em CAIXA ALTA entram num texto à parte, o texto dirigido. O roteiro aprovado continua limpo. Veja o [capítulo 12](12-voz-dirigida.md).

## 7.5 Texto da tela

- Na tela vai a palavra-chave, não a frase inteira (princípio da redundância).
- No máximo 5 palavras por vez, em caixa mista, com uma palavra de acento.
- A frase do gancho está **escrita no quadro 0**, para quem assiste sem som.
- A legenda nunca encosta no assunto. Se encostar, mova o assunto.
- Contraste medido de pelo menos 4,5:1 contra o que está atrás da legenda (critério AA da WCAG para texto normal).

## 7.6 Conformidade

- Nenhum número sem fonte. Se houver fonte, ela aparece na tela.
- Nenhuma marca de terceiros sem autorização escrita.
- Narração sintética: siga as políticas da plataforma de anúncios sobre conteúdo gerado por IA.
- Antes de veicular, confira a licença comercial da voz ([capítulo 4](04-trilha-paga.md)).
- Se o roteiro afirma algo sobre o próprio vídeo ("foi programado", "custa zero"), o vídeo precisa cumprir. Por isso o anúncio deste projeto é 100% renderizado por código, sem tomadas de IA de vídeo, e este manual informa com clareza qual trilha de voz foi usada na versão final (a dirigida, do [capítulo 12](12-voz-dirigida.md)); a trilha gratuita reproduz o mesmo filme a custo zero.

## 7.7 Esquema do `roteiro.json`

```json
{
  "cta_fala": "Chama no WhatsApp e peça seu diagnóstico gratuito.",
  "criativos": [
    {
      "id": "a01-tudo-num-lugar",
      "titulo": "Tudo num lugar só",
      "falas": ["Quanto tempo você perde por dia procurando informação?", "..."],
      "tela":  ["Quanto tempo?", "..."]
    }
  ]
}
```

O modelo completo, com os campos opcionais, está em [`templates/roteiro.json`](../templates/roteiro.json).

---

Próximo: [8. Qualidade →](08-qualidade-e-solucao-de-problemas.md)
