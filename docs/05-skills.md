# 5. Skills, plugins e como usá-los no método

*Skills* são pacotes de instruções (com scripts e referências) que o agente carrega quando a tarefa pede. Elas não dependem do modelo: funcionam no Claude Code com modelos da Anthropic e também com um modelo aberto atrás dele (trilha gratuita).

## 5.1 Mapa: qual skill em qual etapa

| Etapa | Skill / plugin | Para quê | Essencial? |
|---|---|---|---|
| Briefing | `marketing:competitive-brief` | Posicionamento e brechas de mensagem dos concorrentes | Opcional |
| Briefing | `design:user-research` / `design-skills:ux-research` | Roteiro de entrevista com o cliente e o público | Opcional |
| Roteiro | `marketing:content-creation` / `marketing:draft-content` | Variações de gancho e de CTA | Recomendado |
| Roteiro | `design-skills:ux-writing` | Texto curto e claro para a tela (microcopy) | Recomendado |
| Roteiro | `marketing:brand-review` | Confere tom de marca e alegações sem fonte | Recomendado |
| Voz | `motion-reel-voice` (plugin opcional) | Ferramentas MCP da ElevenLabs dentro do agente | Opcional (há o script) |
| Filme | **`motion-reel`** | O motor: harness, render, trilha, SFX, mix, folhas de contato, rodadas de crítica | **Essencial** (em `vendor/`) |
| Filme | `design-skills:interaction-design` | Microinterações, estados e coreografia de movimento | Recomendado |
| Filme | `design-skills:design-elevation` | Polimento visual (tokens, espaçamento, hierarquia) | Opcional |
| Crítica | `design:design-critique` / `design-skills:design-critique` | Crítica estruturada por heurísticas | Recomendado |
| Crítica | `design:accessibility-review` | Contraste e legibilidade do texto na tela | Recomendado |
| Escala | `workflow-authoring` + ferramenta Workflow | Um agente por criativo, com verificação | Recomendado a partir de 3 criativos |
| Documentação | `anthropic-skills:pdf`, `artifact-design` | Página de aprovação e guias em PDF | Opcional |

## 5.2 A skill `motion-reel` em detalhe

Ela está em `vendor/motion-reel/skills/motion-reel/` (MIT, v1.3.0). Para usar como skill do agente, instale o plugin pelo menu de plugins do Claude Code ou aponte o agente para o `SKILL.md`.

| Script | Função |
|---|---|
| `scaffold.mjs` | Cria a pasta do filme (`--3d` para cenas em three.js) |
| `gather.mjs` | Capturas do site, cores, fontes, logo e textos da marca |
| `reference.mjs` | Quadros e ritmo de corte de um vídeo de referência |
| `beats.py` | Grade de batidas de uma música ou trilha sintetizada |
| `render.mjs` | `--contact`, `--strip`, `--at`, `--range`, `--hits`, `--video-only`, `--poster` |
| `sfx.mjs` | Efeitos sonoros a partir da lista `HITS` do filme |
| `mix.mjs` | Master em -14 LUFS / -1 dBTP e mux do MP4 |
| `sync.py` | Confere os efeitos contra os cortes |
| `dsp.py` | Instrumentos e barramentos para compor trilhas em código |

## 5.3 Como pedir ao agente

Peça por etapa e cite os arquivos. Por exemplo:

> Siga `docs/01-metodo.md`. Briefing em `briefing.md`. Escreva 6 roteiros de 30 s em `roteiros/roteiros.json` seguindo `docs/07-roteiro-e-copy.md` e use `marketing:brand-review` para revisar. Pare para eu aprovar.

> Monte o piloto `a01` com `lib/cena.js`, prenda as cenas às palavras de `vo.json` e rode 3 rodadas de crítica com `templates/critica.md` antes de me mostrar.

> Piloto aprovado. Escreva um workflow com um agente por roteiro de `a02` a `a06`, cada um copiando o piloto e passando pela crítica.

## 5.4 Instalar skills

No Claude Code, abra o menu de plugins (no terminal, `/plugin`) e procure pelo nome. Os marketplaces de plugins oficiais trazem os pacotes `design`, `design-skills` e `marketing`. Uma skill é só uma pasta com `SKILL.md`, então também dá para copiá-la para `~/.claude/skills/`.
