# 3. Trilha gratuita: só software livre e modelos abertos

Esta trilha produz o mesmo tipo de criativo sem pagar nenhum serviço. O custo passa a ser o hardware e o tempo de revisão.

> **Expectativa honesta.** Nenhum modelo aberto "é" o Claude. O que se faz é manter a mesma interface de agente (o Claude Code, que é gratuito para instalar) e trocar o modelo por trás dela por um modelo de pesos abertos. Os melhores modelos abertos de código chegam perto em tarefas curtas, mas erram mais no uso de ferramentas e em tarefas longas. Compense com pedidos menores e revisão a cada etapa.

## 3.1 Requisitos de máquina

| Memória (RAM unificada ou VRAM) | Modelo local sugerido | Observação |
|---|---|---|
| 16 GB | `gpt-oss:20b` ou um Qwen Coder de 14B | Funciona, mas é lento e se perde em tarefas longas |
| 32 GB | `qwen3-coder:30b` | O ponto de equilíbrio recomendado |
| 64 GB ou mais | Modelos MoE maiores da família Qwen3 | Mais perto da trilha paga |
| Sem GPU / pouca memória | Modelo aberto hospedado (OpenRouter, Ollama Cloud) | Ainda grátis nas cotas gratuitas, mas sai da máquina |

Os nomes e tamanhos mudam rápido. Confira a lista atual em <https://ollama.com/library> antes de baixar.

## 3.2 Claude Code com um modelo aberto no Ollama

O Ollama expõe uma API compatível com a Messages API da Anthropic. Basta apontar o Claude Code para ela.

```bash
# 1. instalar
brew install ollama
npm install -g @anthropic-ai/claude-code

# 2. baixar o modelo e subir o servidor
ollama pull qwen3-coder:30b
ollama serve            # deixe rodando em outro terminal

# 3. apontar o Claude Code para o Ollama
export ANTHROPIC_BASE_URL=http://localhost:11434
export ANTHROPIC_AUTH_TOKEN=ollama
export ANTHROPIC_API_KEY=""         # vazio: se estiver definido, o Claude Code prefere ele
claude --model qwen3-coder:30b
```

**Cuidados:**

- Use um contexto de pelo menos 32 mil tokens. Em modelos de raciocínio, deixe `CLAUDE_CODE_MAX_OUTPUT_TOKENS` em 8000 ou mais.
- Versões antigas do Ollama não têm o endpoint `/v1/messages`. Confira a sua com `curl localhost:11434/api/version` e atualize se precisar.
- As skills e os plugins (incluindo o `motion-reel`) funcionam igual, porque são arquivos de instrução lidos pelo agente, não pelo modelo da Anthropic.

**Alternativas ao Claude Code**, todas de código aberto e compatíveis com o Ollama:

- **OpenCode**
- **Aider**
- **Qwen Code**

Nelas, aponte as instruções do agente para `docs/01-metodo.md` e para a pasta `vendor/motion-reel/skills/motion-reel/`.

## 3.3 Narração gratuita com Kokoro

O Kokoro-82M tem licença Apache-2.0, que permite uso comercial, e traz vozes de português do Brasil.

```bash
uv run scripts/voz_kokoro.py all pf_dora 3 --rotulo kokoro-dora   # 1ª vez baixa o modelo (~330 MB)
uv run scripts/voz_avaliar.py voz/<criativo>
uv run scripts/vo_montar.py <pasta-do-filme> voz/<criativo>/kokoro-dora-2.wav
```

| Voz | Perfil |
|---|---|
| `pf_dora` | feminina |
| `pm_alex` | masculina |
| `pm_santa` | masculina, mais grave |

**Dicas:**

- O fonema do português vem embutido (pacote `espeakng-loader`); não precisa instalar nada no sistema.
- O Kokoro dá a mesma saída a cada execução, então as tomadas extras variam levemente a velocidade (x1,00, x0,96, x1,04).
- O Kokoro não sobe o tom no fim de perguntas: prefira ganchos afirmativos ou aceite a leitura neutra.
- O Kokoro lê bem frases curtas. Escreva números e siglas por extenso.
- Use reticências para pausas.
- Prefira gerar frase a frase quando o bloco inteiro soar monótono.

**Outras opções gratuitas:**

- **Piper:** roda em CPU, leve. Confira a licença de cada voz no cartão do modelo.
- **XTTS-v2:** licença não comercial; não serve para anúncio.

## 3.4 Logo 3D gratuito

Há dois caminhos sem o After Effects:

1. **three.js dentro do próprio filme** (`node vendor/motion-reel/skills/motion-reel/scripts/scaffold.mjs <filme> --3d`): extrude o SVG do logo, ilumine e anime a câmera com as mesmas molas do resto do filme.
2. **Blender:** importe o SVG, use *Extrude* e anime a rotação e uma luz de varredura. Renderize uma sequência PNG com transparência (RGBA) e toque no cartão final com `logoSeq()` de `lib/cena.js`.

## 3.5 Custo total da trilha gratuita

| Item | Custo |
|---|---|
| Software | R$ 0 |
| Modelos | R$ 0 (local) |
| Energia e tempo de máquina | O render final de 30 s a 60 fps leva alguns minutos num Mac M |
| Revisão humana | Maior que na trilha paga: conte de 30 a 50% mais tempo por criativo |
