# 4. Serviços opcionais para ir além

[← 3. O caminho gratuito](03-trilha-gratuita.md) · [Índice](README.md) · Próximo: [5. Skills →](05-skills.md)

O [caminho gratuito](03-trilha-gratuita.md) entrega o anúncio completo, do roteiro ao MP4, por R$ 0. Este capítulo é para quando você quiser ir além numa etapa específica: **voz de locutor com interpretação dirigida**, **música produzida** ou **um agente mais rápido em tarefas longas**. Você troca só a etapa que quiser; o 3D, a sincronia, a mixagem e o render continuam os mesmos, e gratuitos.

## 4.1 O que cada serviço acrescenta

| Serviço | Etapa | O que acrescenta | Plano para anúncio |
|---|---|---|---|
| [ElevenLabs](https://elevenlabs.io) | Voz | Voz de locutor com direção de tom, ênfase e pausa; vozes nativas em português na biblioteca | Starter (a partir de US$ 5 por mês), que inclui uso comercial |
| ElevenLabs Music | Trilha | Música produzida, com timbres reais, alinhada à fala pelo kit | Conforme o plano |
| [Claude](https://claude.com) (Anthropic) | Agente | Mais rapidez e autonomia em tarefas longas, críticos independentes em paralelo | Pro ou Max, ou a API com cobrança por uso |
| Adobe After Effects | Logo | Logo 3D por script (`ae/logo3d/`), para quem já trabalha no programa | Creative Cloud |

Os preços mudam. Confira nas páginas oficiais antes de orçar.

## 4.2 Quanto custa uma narração

Os números abaixo são da narração de A bancada, o anúncio do próprio projeto, em novembro de 2026.

| Item | Valor | Natureza do dado |
|---|---|---|
| Plano | ElevenLabs Starter, US$ 5 por mês | preço do plano |
| Créditos do plano | 30 mil por mês | informado pelo plano |
| Preço por caractere no `eleven_v3` | 1 crédito | observado na conta |
| Tamanho do roteiro | 455 caracteres (78 palavras); com as marcações de direção, 547 caracteres por geração completa | contado |
| Formato de saída | `mp3_44100_128` | 192 kbps a partir do plano Creator |

**Uma geração completa do roteiro custa 547 créditos, menos de 2% do plano mensal.** O processo do [capítulo 12](12-voz-dirigida.md) mantém o gasto baixo: você aprova o tom em amostras de 10 segundos e só então gera o roteiro inteiro, em algumas tomadas.

**Orçamento prático** (regra de bolso, não medição): reserve de 10 a 15 vezes o tamanho do roteiro em créditos no primeiro criativo, enquanto escolhe o tom, e de 3 a 5 vezes nos seguintes, quando o tom já está aprovado e só o texto muda. Com o plano Starter, isso dá vários criativos por mês.

## 4.3 Configuração

A chave fica no arquivo `.env`, na pasta do projeto. Copie o modelo e cole a chave em `ELEVENLABS_API_KEY`:

```bash
cp .env.example .env              # macOS e Linux
copy .env.example .env            # Windows (PowerShell)
```

Depois, confira o plano e as vozes da conta:

```bash
node scripts/eleven.mjs conta     # plano e cota
node scripts/eleven.mjs vozes     # vozes da conta
```

Para o agente com plano Claude: `npm install -g @anthropic-ai/claude-code` e depois `claude`, que pede o login na primeira vez. Sem as variáveis do Ollama definidas, o Claude Code usa a sua conta.

O `.env` nunca vai para o repositório: o `.gitignore` já o exclui. Não cole a chave no chat com o agente nem em arquivo versionado. Veja [`SECURITY.md`](../SECURITY.md).

## 4.4 Narração dirigida com a ElevenLabs

Esta é a receita da narração de A bancada. O [capítulo 12](12-voz-dirigida.md) traz o processo inteiro.

| Parâmetro | Voz 1 (roteiro) | Voz 2 (fecho) |
|---|---|---|
| Modelo | `eleven_v3` | `eleven_multilingual_v2` |
| Idioma | `language_code: "pt"` | — |
| Direção | Marcações de tom por bloco (`[serious]`, `[warmly]`, `[excited]`), ênfase em CAIXA ALTA, reticências para pausa | Pontuação de impacto (reticências, exclamação, vírgula de respiro) |
| Ajustes | estabilidade 0,5 | `stability` 0,30 e `style` 0,55 |

O texto dirigido exato está em [`exemplos/bancada/narracao.json`](../exemplos/bancada/narracao.json). O script é `scripts/voz_dirigida.py`:

```bash
uv run scripts/voz_dirigida.py amostras <voice_id> <rótulo> --id <criativo> --roteiros <roteiro.json>
uv run scripts/voz_dirigida.py bloco <criativo> <voice_id> <rótulo> --modelo eleven_v3 --tomadas 5 --roteiros <roteiro.json>
```

No macOS e no Linux, os atalhos equivalentes são `make voz-amostras` e `make voz-dirigida`.

**Três recomendações para tirar o melhor da voz paga:**

1. **Prefira uma voz nativa do português.** Vozes nativas soam mais naturais que vozes de outro idioma forçadas para o português. A biblioteca da ElevenLabs tem vozes brasileiras; usá-las pela API pede um plano pago e a permissão de vozes da biblioteca na chave.
2. **Aprove de ouvido.** O filtro automático confere palavras e entonação; a emoção, quem aprova é uma pessoa ouvindo as duas melhores tomadas.
3. **Use um plano com uso comercial.** O plano gratuito da ElevenLabs não permite anúncio. Assine antes de publicar.

## 4.5 Como combinar o gratuito e o opcional

| Situação | Combinação |
|---|---|
| Aprovar o roteiro | Voz gratuita (Kokoro). A voz paga entra só depois do texto fechado, e o filme se reorganiza sozinho com a voz nova |
| Muitos criativos com pouco orçamento | Piloto com o agente que você preferir; os demais com o modelo aberto, copiando o piloto |
| Sem Creative Cloud | Marca modelada em three.js ou no Blender, de graça |
| Orçamento zero | O caminho gratuito inteiro: Kokoro ou Fish Audio, trilha sintetizada, 3D e render locais |

## 4.6 O que é igual nos dois caminhos

- **O visual.** O 3D fotorrealista é o mesmo, e sempre gratuito.
- **As etapas.** Pesquisa de referências, look-dev e crítica independente são processo, e valem igual.
- **A sincronia e a entrega.** Cortes presos às palavras, 60 fps, −14 LUFS e a conferência de entrega.

---

Próximo: [5. Skills →](05-skills.md)
