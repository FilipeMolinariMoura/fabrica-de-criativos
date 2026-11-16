# 3. Trilha gratuita: software livre e modelos abertos

[← 2. Ferramentas](02-ferramentas.md) · [Índice](README.md) · Próximo: [4. Trilha paga →](04-trilha-paga.md)

Esta trilha produz o mesmo tipo de criativo sem pagar nenhum serviço. O custo passa a ser a máquina e o tempo de revisão.

> **Expectativa honesta.** Três coisas são verdade ao mesmo tempo.
> 1. O filme 3D fotorrealista, a trilha, os efeitos e o render são código aberto e saem iguais nas duas trilhas.
> 2. Nenhum modelo aberto "é" o Claude. Você mantém a mesma interface de agente e troca o modelo por trás. Em tarefas longas, ele erra mais.
> 3. A voz é o ponto fraco. No anúncio deste projeto, as duas vozes gratuitas foram reprovadas de ouvido, e a aprovada veio da trilha paga. A trilha gratuita entrega um vídeo completo; a narração dele será mais neutra.

## 3.1 O que é grátis de verdade

| Peça | Grátis? | Observação |
|---|---|---|
| Motor 2D, motor 3D, scripts | Sim | MIT |
| three.js, Playwright, ffmpeg | Sim | Licenças abertas |
| HDRI, texturas e fontes usados no 3D | Sim | CC0 e SIL OFL |
| Trilha e efeitos sonoros | Sim | Sintetizados em código |
| Whisper e Praat | Sim | Rodam na máquina |
| Voz Kokoro | Sim | Apache-2.0, local, uso comercial permitido |
| Voz Fish Audio `s2.1-pro-free` | Sim, com cota de uso justo | Confira os termos para veicular anúncio |
| Agente com modelo aberto | Sim | Precisa de memória; veja abaixo |

## 3.2 Requisitos de máquina

**Para o agente local:**

| Memória (RAM unificada ou VRAM) | Modelo sugerido | Observação |
|---|---|---|
| 16 GB | `gpt-oss:20b` ou um Qwen Coder de 14B | Funciona, mas é lento e se perde em tarefas longas |
| 32 GB | `qwen3-coder:30b` | O ponto de equilíbrio |
| 64 GB ou mais | Modelos maiores da família Qwen3 | Mais perto da trilha paga |
| Pouca memória | Modelo aberto hospedado (OpenRouter, Ollama Cloud) | Cotas gratuitas, mas o código sai da máquina |

Os nomes e tamanhos mudam rápido. Confira <https://ollama.com/library> antes de baixar.

**Para o render 3D:** uma GPU que o navegador consiga usar por WebGL. Não precisa ser placa dedicada. O filme deste projeto foi renderizado num Apple M1 Pro com 16 GB, GPU integrada, em 35 a 40 minutos para 35 segundos a 60 fps. Em máquina mais fraca, o mesmo filme sai com menos amostras ou em mais tempo; o resultado não muda de natureza. **O motor 3D só foi testado em macOS**: o renderizador abre o Chromium com o backend gráfico Metal, e em Linux ou Windows essa opção precisa ser trocada (não testado).

## 3.3 Claude Code com um modelo aberto no Ollama

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

- Use contexto de pelo menos 32 mil tokens. Em modelos de raciocínio, deixe `CLAUDE_CODE_MAX_OUTPUT_TOKENS` em 8000 ou mais.
- Versões antigas do Ollama não têm o endpoint `/v1/messages`. Confira com `curl localhost:11434/api/version`.
- Skills e plugins funcionam igual, porque são arquivos de instrução lidos pelo agente.

**Alternativas ao Claude Code**, todas de código aberto e compatíveis com o Ollama: OpenCode, Aider e Qwen Code. Nelas, aponte as instruções do agente para [`docs/01-metodo.md`](01-metodo.md).

**Como compensar o modelo mais fraco:**

1. Peça uma etapa do método por vez e cite os arquivos.
2. Comece copiando um exemplo que funciona (`exemplos/demo` no 2D, `exemplos/bancada` no 3D) em vez de pedir um filme do zero.
3. Rode a conferência depois de cada mudança: `make sintaxe` e uma folha de contato.
4. Use um agente separado como crítico. A independência importa mais que o tamanho do modelo.

## 3.4 Narração gratuita com Kokoro

O Kokoro-82M tem licença Apache-2.0 e vozes de português do Brasil.

```bash
uv run scripts/voz_kokoro.py all pf_dora 3 --rotulo kokoro-dora   # a 1ª vez baixa o modelo (~330 MB)
uv run scripts/voz_avaliar.py voz/<criativo>
uv run scripts/vo_montar.py <pasta-do-filme> voz/<criativo>/kokoro-dora-2.wav
```

| Voz | Perfil |
|---|---|
| `pf_dora` | feminina |
| `pm_alex` | masculina |
| `pm_santa` | masculina, mais grave |

**O que esperar:**

- Leitura limpa e correta, com pouca emoção. Serve para rascunho, aprovação de roteiro e para o `make demo`.
- O Kokoro dá a mesma saída a cada execução. As tomadas extras variam só a velocidade (x1,00, x0,96, x1,04).
- Ele não sobe o tom no fim de perguntas. Prefira ganchos afirmativos.
- Escreva números e siglas por extenso. Use reticências para pausas.

## 3.5 Narração gratuita com Fish Audio

A Fish Audio tem um modelo gratuito na API (`s2.1-pro-free`, com uso justo) e uma biblioteca grande de vozes em português. Nos testes do autor, ficou acima do Kokoro em expressividade.

```bash
# .env: FISH_API_KEY=...   (crie em fish.audio → API Keys)
node scripts/voz_fish.mjs vozes                                   # lista vozes em português
uv run scripts/voz_por_frase.py <criativo> <voice_id> f1 --roteiros <roteiro.json> --n 3
uv run scripts/voz_por_frase.py <criativo> <voice_id> f1 --roteiros <roteiro.json> --mais 8:5,11:7   # só as frases fracas
uv run scripts/voz_dialogo.py voz/<criativo> voz/<criativo>/dueto.wav --vozes f1,m5,f1,...
```

**Por que frase a frase.** Em bloco, a voz às vezes "se perde": uma afirmação termina subindo, como pergunta. Isso aparece mais em frases longas com vírgula. Frase a frase, cada candidato é conferido às cegas e só fica o que termina no tom certo. Use `--temperatura 0.55` para estabilizar.

**O limite.** Frase a frase corrige o erro de entonação, mas a narração montada perde o fio de emoção que uma leitura contínua tem. Foi por isso que essa narração, embora correta, não passou no ouvido para o anúncio deste projeto. A história inteira está no [capítulo 12](12-voz-dirigida.md).

**Escolha da voz.** Não use vozes que imitam pessoas reais. Em anúncio público, isso é risco legal e de reputação. Confira também se o seu plano permite uso comercial.

**Outras opções gratuitas:** o Piper roda em CPU e é leve (confira a licença de cada voz). O XTTS-v2 tem licença não comercial e não serve para anúncio.

## 3.6 Filme 3D sem pagar nada

O pipeline 3D não depende de nenhum serviço. Com `make setup` feito:

```bash
node lib/3d/render.mjs --film exemplos/bancada --contact --spp 24      # folha de contato
node lib/3d/render.mjs --film exemplos/bancada --at 2.6,10.5 --spp 256 # dois quadros em qualidade alta
```

Os atalhos do `Makefile` (`make contato3d`, `make previa3d`, `make final3d`) estão no [capítulo 11](11-3d-fotorrealista.md#117-comandos). Os materiais de terceiros (um HDRI, uma textura de madeira, um mapa de digitais e três fontes) são CC0 ou OFL e estão listados no [capítulo 2](02-ferramentas.md).

## 3.7 Logo 3D gratuito

1. **three.js dentro do filme.** No motor 3D, modele a marca como objeto (veja `buildMark` em `exemplos/bancada/props.js`). No motor 2D, use o modo `--3d` do `scaffold.mjs` do motion-reel.
2. **Blender.** Importe o SVG, use *Extrude*, anime a rotação e uma luz de varredura, e renderize uma sequência PNG com transparência. No motor 2D, ela entra no cartão final com `logoSeq()` de `lib/cena.js`.

## 3.8 Custo total da trilha gratuita

| Item | Custo |
|---|---|
| Software e modelos | R$ 0 |
| Materiais (HDRI, texturas, fontes) | R$ 0 |
| Máquina e energia | O render final 3D de 35 s leva de 35 a 40 minutos num M1 Pro; o 2D leva poucos minutos |
| Revisão humana | Maior que na trilha paga. O autor estima de 30% a 50% mais tempo por criativo; não é medição |

---

Próximo: [4. Trilha paga →](04-trilha-paga.md)
