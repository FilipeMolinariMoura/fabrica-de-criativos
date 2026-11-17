# 5. Skills, plugins e como pedir ao agente

[← 4. Trilha paga](04-trilha-paga.md) · [Índice](README.md) · Próximo: [6. Técnicas de motion →](06-tecnicas-de-motion.md)

*Skills* são pacotes de instruções, com scripts e referências, que o agente carrega quando a tarefa pede. Elas não dependem do modelo: funcionam no Claude Code com modelos da Anthropic e também com um modelo aberto por trás (trilha gratuita).

Nenhuma skill é obrigatória para usar o kit: o motor de render já vem em `vendor/`, e os scripts rodam pelo terminal em Windows, macOS e Linux. As skills são um acelerador: com elas, o agente acerta mais já na primeira tentativa.

## 5.1 Qual skill em qual etapa

| Etapa | Skill ou plugin | Para quê | Peso |
|---|---|---|---|
| 1. Briefing | `marketing:competitive-brief` | Posicionamento e brechas de mensagem dos concorrentes | Opcional |
| 1. Briefing | `design:user-research` | Roteiro de conversa com quem pediu o anúncio e com o público | Opcional |
| 2. Referências | `anthropic-skills:deep-research` | Levantamento em várias fontes com síntese | Opcional |
| 2. Referências | Conector AdWhispr (MCP) | Anúncios ativos por marca, ordenados por dias no ar | Recomendado |
| 3. Roteiro | `marketing:content-creation`, `marketing:draft-content` | Variações de gancho e de CTA | Recomendado |
| 3. Roteiro | `design-skills:ux-writing` | Texto curto e claro para a tela | Recomendado |
| 3. Roteiro | `marketing:brand-review` | Tom de marca e alegações sem fonte | Recomendado |
| 4. Voz | `motion-reel-voice` (plugin) | Ferramentas da ElevenLabs dentro do agente | Opcional (há os scripts) |
| 7. Filme | **`motion-reel`** | O motor: harness, render, trilha, efeitos, mixagem, folhas de contato | **Essencial** (já em `vendor/`) |
| 7. Filme | `design-skills:interaction-design` | Microinterações e coreografia de movimento | Recomendado no 2D |
| 9. Crítica | `design:design-critique` | Crítica estruturada por heurísticas | Recomendado |
| 9. Crítica | `design:accessibility-review` | Contraste e legibilidade do texto na tela | Recomendado |
| Escala | `workflow-authoring` | Um agente por criativo, com verificação | A partir de 3 criativos |
| Documentação | `anthropic-skills:pdf` | Guias e páginas de aprovação | Opcional |

Os nomes são os dos marketplaces de plugins na data desta versão. Se algum mudar, a função continua a mesma: procure pelo que a skill faz.

## 5.2 A skill `motion-reel`

Está em `vendor/motion-reel/skills/motion-reel/` (MIT, versão 1.3.0, de Aries Spring). O atalho `skill/` na raiz aponta para ela.

| Script | Função |
|---|---|
| `scaffold.mjs` | Cria a pasta de um filme 2D (`--3d` para cenas em three.js) |
| `gather.mjs` | Capturas do site, cores, fontes, logo e textos da marca |
| `reference.mjs` | Quadros e ritmo de corte de um vídeo de referência em arquivo |
| `beats.py` | Grade de batidas de uma música |
| `render.mjs` | Render do motor 2D: `--contact`, `--strip`, `--at`, `--range`, `--hits`, `--poster` |
| `sfx.mjs` | Efeitos sonoros a partir da lista de eventos do filme |
| `mix.mjs` | Master em −14 LUFS e −1 dBTP |
| `sync.py` | Confere os efeitos contra os cortes |
| `dsp.py` | Instrumentos e barramentos para compor trilhas em código |

O motor 3D tem renderizador próprio, `lib/3d/render.mjs`, porque o desfoque e a profundidade de campo são feitos dentro do quadro. O som do filme 3D usa os mesmos `sfx.mjs` e `mix.mjs`.

O `mix.mjs` desta cópia tem uma alteração local de uma linha, documentada em [`vendor/README.md`](../vendor/README.md). Se você instalar o plugin oficial no lugar da cópia, leia aquele arquivo.

## 5.3 Como pedir ao agente

Peça por etapa, cite os arquivos e diga onde parar. Seis pedidos cobrem o método.

**Referências (etapa 2)**

> Siga `docs/09-pesquisa-de-referencias.md`. Levante 12 a 15 filmes de lançamento de produtos parecidos com o do briefing, sem baixar vídeo. Entregue a tabela de referências, as regras com números de partida e a análise de lacunas do nosso material. Marque o que é medido e o que é estimado. Pare para eu ler.

**Roteiro (etapa 3)**

> Briefing em `briefing.md`. Escreva o roteiro de 30 s em `roteiro.json` seguindo `docs/07-roteiro-e-copy.md`. Proponha 5 ganchos, diga de que família cada um é, e revise com `marketing:brand-review`. Pare para eu aprovar o texto.

**Voz (etapa 4)**

> Roteiro aprovado. Siga `docs/12-voz-dirigida.md`: gere amostras de tom só do gancho e do CTA, em 5 variações. Não gere o roteiro inteiro antes de eu escolher uma.

**Look-dev (etapa 6)**

> Siga `docs/10-look-dev.md`. Construa 4 quadros de estilo com `lib/3d` e um teste de movimento de 4 s. Avalie o realismo de cada quadro numa escala de 1 a 10 e liste os ajustes que o aproximam das referências. Não comece o filme.

**Filme (etapa 7)**

> Quadros aprovados. Crie o filme com `npm run novo -- a01 "Meu anúncio"` e construa-o com `lib/3d`, cada corte e cada evento preso a uma palavra do `vo.json`. Gere a folha de contato (`npm run contato -- <pasta do filme>`) a cada rodada e registre as observações em `docs/critica.md` do filme.

**Crítica independente (etapa 9)**

> Você é crítico e não construiu este filme. Avalie `entrega/previas/a01-previa.mp4` com a rubrica de `docs/08-qualidade-e-solucao-de-problemas.md`. Meça o que puder medir. Devolva uma avaliação por critério e uma lista de ajustes com números. Seja objetivo.

O último pedido vai para um agente novo, sem o histórico da construção. Essa é a força da etapa: quem constrói não aprova sozinho, e um olhar independente encontra o que o construtor já não enxerga.

## 5.4 Instalar skills

No Claude Code, abra o menu de plugins (`/plugin` no terminal) e procure pelo nome. Uma skill é só uma pasta com `SKILL.md`, então também dá para copiá-la para `~/.claude/skills/`.

Para usar o plugin oficial do motion-reel em vez da cópia em `vendor/`:

```bash
claude plugin marketplace add Aries-Spring/motion-reel
claude plugin install motion-reel@aries-spring
```

Depois aponte a variável `SKILL` para a pasta `skills/motion-reel` do plugin instalado.

---

Próximo: [6. Técnicas de motion →](06-tecnicas-de-motion.md)
