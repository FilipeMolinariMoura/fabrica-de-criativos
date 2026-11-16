# 4. Trilha paga: o que vale pagar e quanto custou

[← 3. Trilha gratuita](03-trilha-gratuita.md) · [Índice](README.md) · Próximo: [5. Skills →](05-skills.md)

A trilha paga compra duas coisas: um agente mais confiável e uma voz que passa no ouvido. O resto do método é o mesmo código da trilha gratuita.

## 4.1 O que assinar

| Serviço | Plano mínimo para anúncio | O que ele compra | Obrigatório? |
|---|---|---|---|
| Claude (Anthropic) | Pro ou Max, ou a API com cobrança por uso | Agente que conduz roteiro, código, revisão, críticos independentes e paralelismo | Não. Há a trilha gratuita |
| ElevenLabs | Starter | Voz dirigida e licença de uso comercial | Não, mas foi o que aprovou a voz neste projeto |
| Adobe After Effects | Creative Cloud | Logo 3D por script | Não. O filme novo não usa |

Os preços mudam. Confira nas páginas oficiais antes de orçar.

## 4.2 Quanto custou a voz deste anúncio

Os números abaixo são do anúncio A bancada, em novembro de 2026.

| Item | Valor | Natureza do dado |
|---|---|---|
| Plano | ElevenLabs Starter, US$ 5 por mês | preço pago |
| Créditos do plano | 30 mil por mês | informado pelo plano |
| Preço por caractere no `eleven_v3` | 1 crédito | observado na conta |
| Tamanho do roteiro | 455 caracteres (78 palavras); com as marcações de direção, 547 caracteres cobrados por geração completa | contado |
| Gasto total, somando todas as tentativas | da ordem de 12 a 15 mil créditos | estimativa pelo saldo da conta; o registro do kit (`voz/caracteres.log`) cobre só parte das chamadas |
| Formato de saída | `mp3_44100_128` | 192 kbps só a partir do plano Creator |

**Leia este número do jeito certo.** Uma geração completa do roteiro custa 547 créditos, menos de 2% do plano. O gasto real foi mais de vinte vezes isso, porque incluiu todas as tentativas reprovadas: narração frase a frase, modo diálogo, amostras de tom e várias tomadas com sementes diferentes. O processo do [capítulo 12](12-voz-dirigida.md) existe para você gastar menos que isso: aprovar o tom em amostras de 10 segundos antes de gerar o roteiro inteiro.

**Orçamento prático:** reserve de 10 a 15 vezes o tamanho do roteiro em créditos por criativo enquanto estiver achando o tom, e de 3 a 5 vezes depois que o tom estiver aprovado e você só trocar o texto. É uma regra de bolso do autor, não uma medição.

## 4.3 Configuração

```bash
npm install -g @anthropic-ai/claude-code   # ou o app desktop
claude                                     # login na conta Claude

cp .env.example .env                       # cole a chave em ELEVENLABS_API_KEY
node scripts/eleven.mjs conta              # confere o plano e a cota
node scripts/eleven.mjs vozes              # lista as vozes da conta
```

A chave fica só no `.env`, que o `.gitignore` já exclui. Nunca cole a chave no chat com o agente nem em arquivo versionado. Veja [`SECURITY.md`](../SECURITY.md).

## 4.4 Narração dirigida com a ElevenLabs

O resumo do que funcionou (o capítulo [12](12-voz-dirigida.md) traz o processo inteiro):

| Parâmetro | Voz 1 (roteiro) | Voz 2 (fecho) |
|---|---|---|
| Modelo | `eleven_v3` | `eleven_multilingual_v2` |
| Idioma | `language_code: "pt"` forçado | — |
| Direção | Marcações de tom por bloco (`[serious]`, `[warmly]`, `[excited]`), ênfase em CAIXA ALTA, reticências para pausa | Pontuação de impacto (reticências, exclamação, vírgula de respiro) |
| Ajustes | estabilidade 0,5 | `stability` 0,30 e `style` 0,55 |

O texto dirigido exato está em [`exemplos/bancada/narracao.json`](../exemplos/bancada/narracao.json). O script é `scripts/voz_dirigida.py`.

**Três limites para saber antes de pagar:**

1. **As vozes padrão são americanas.** Em português, elas carregam melodia do inglês. Forçar `language_code` e dirigir ajuda bastante, mas não apaga o sotaque de entonação. O ideal é uma voz brasileira nativa da biblioteca, o que exige plano pago e permissão de vozes da biblioteca na chave de API.
2. **A máquina não mede emoção.** Narrações com nota máxima no filtro às cegas foram reprovadas de ouvido. Reserve tempo para uma pessoa ouvir.
3. **O plano gratuito não permite uso comercial.** Para publicar anúncio, assine antes de subir.

## 4.5 Quando misturar as trilhas

| Situação | Combinação |
|---|---|
| Rascunho para aprovar o roteiro | Voz gratuita (Kokoro); a paga entra só depois do texto fechado |
| Pouco orçamento de tokens | Piloto e críticos com Claude; demais criativos com o modelo aberto copiando o piloto |
| Sem Creative Cloud | Marca modelada em three.js |
| Sem verba nenhuma | Trilha gratuita inteira, com Fish Audio frase a frase, sabendo que a narração será o ponto mais fraco |

## 4.6 O que a trilha paga não compra

- **Não compra o visual.** O 3D fotorrealista é o mesmo nas duas trilhas.
- **Não dispensa as etapas.** Pesquisa de referências, look-dev e crítica independente são processo, e valem igual.
- **Não garante a voz na primeira tentativa.** O que garante é o processo de direção.

---

Próximo: [5. Skills →](05-skills.md)
