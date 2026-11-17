# 3. O caminho gratuito: do roteiro ao MP4 sem pagar nada

[← 2. Ferramentas](02-ferramentas.md) · [Índice](README.md) · Próximo: [4. Serviços opcionais →](04-trilha-paga.md)

**100% gratuito e de código aberto, do roteiro ao MP4.** Este é o caminho principal do método. Ele produz o anúncio completo, com 3D fotorrealista, voz por IA, trilha, efeitos e mixagem no padrão das redes, usando só software livre e modelos de IA abertos que rodam no seu computador. Não há assinatura, limite de vídeos nem marca d'água.

Este capítulo é um passo a passo para quem nunca usou terminal. Siga na ordem.

## 3.1 O que você vai usar, e quanto custa

| Peça | Ferramenta | Licença | Custo |
|---|---|---|---|
| Agente de IA (roteiro e cenas) | Ollama com `qwen3-coder` ou `gpt-oss`, usado pelo Claude Code, OpenCode, Aider ou Qwen Code | MIT e Apache-2.0 | R$ 0 |
| Voz | Kokoro-82M, local, vozes em português do Brasil | Apache-2.0, uso comercial permitido | R$ 0 |
| Tempo de cada palavra | Whisper e Praat, locais | MIT e GPL | R$ 0 |
| Cenas 2D e 3D | Motores do projeto, com three.js | MIT | R$ 0 |
| Materiais do 3D | HDRI, texturas e fontes | CC0 e SIL OFL | R$ 0 |
| Trilha e efeitos | Sintetizados em código, presos às palavras | MIT | R$ 0 |
| Render, mixagem e entrega | Chromium (Playwright) e FFmpeg | Apache-2.0 e LGPL | R$ 0 |
| **Total** | | | **R$ 0** |

Há também uma segunda voz gratuita na nuvem, a Fish Audio (`s2.1-pro-free`, com cota de uso justo), descrita na [seção 3.10](#310-outra-voz-gratuita-fish-audio).

## 3.2 Requisitos de máquina

| Item | Mínimo | Recomendado |
|---|---|---|
| Sistema | Windows 10 (22H2) ou 11, macOS 13, Ubuntu 22.04 ou Debian 12 | O mais atual do seu sistema |
| Memória | 8 GB para gerar vídeos | 16 GB, ou mais se for rodar o agente local (veja abaixo) |
| Placa de vídeo | Qualquer uma com WebGL 2, inclusive a integrada | Placa dedicada ou Apple Silicon, para render mais rápido |
| Disco | De 3 a 5 GB para as ferramentas e os modelos de IA | 10 GB, para guardar vários renders |

**Para o agente de IA local**, a memória decide o modelo:

| Memória (RAM unificada ou VRAM) | Modelo sugerido | Como usar |
|---|---|---|
| 16 GB | `gpt-oss:20b` ou um Qwen Coder de 14B | Peça uma etapa por vez |
| 32 GB | `qwen3-coder:30b` | O ponto de equilíbrio |
| 64 GB ou mais | Modelos maiores da família Qwen3 | Tarefas mais longas de uma vez |
| Pouca memória | Modelo aberto hospedado com cota gratuita (OpenRouter, Ollama Cloud) | O código é enviado ao serviço |

Os nomes e tamanhos dos modelos mudam rápido. Confira <https://ollama.com/library> antes de baixar.

**Você não precisa do agente para gerar vídeos.** Os comandos deste capítulo bastam para rodar os exemplos e fazer um anúncio novo. O agente ajuda a escrever o roteiro e a criar cenas novas.

**Para o render 3D**, a placa integrada dá conta. Num notebook Apple M1 Pro com 16 GB e GPU integrada, os 35 segundos de A bancada a 60 fps saem em cerca de 40 minutos. Uma placa mais simples renderiza o mesmo filme em mais tempo, ou com menos amostras por quadro (`--spp`).

## 3.3 Passo 1: abra o terminal e baixe o projeto

**Onde fica o terminal:**

- **Windows:** menu Iniciar, procure **PowerShell** e abra.
- **macOS:** ⌘ + espaço, digite **Terminal** e abra.
- **Linux:** procure **Terminal** no menu de aplicativos.

**Baixe o projeto.** Com o Git:

```bash
git clone https://github.com/FilipeMolinariMoura/fabrica-de-criativos.git
cd fabrica-de-criativos
```

Sem o Git: na página do projeto no GitHub, clique em **Code → Download ZIP**, descompacte e abra o terminal dentro da pasta. No Windows, abra a pasta no Explorador de Arquivos, clique na barra de endereço, digite `powershell` e tecle Enter: o PowerShell abre já na pasta certa. (O instalador do Windows instala o Git para as próximas vezes.)

## 3.4 Passo 2: instale tudo com um comando

O instalador coloca no computador o que o projeto precisa, pula o que você já tiver e termina conferindo tudo.

### Windows 10 e 11

No PowerShell, dentro da pasta do projeto:

```powershell
powershell -ExecutionPolicy Bypass -File instalar\windows.ps1
```

O que ele faz:

1. Instala pelo **winget** (o instalador de programas que já vem no Windows): Git, Node.js LTS, FFmpeg e uv.
2. Roda `npm install` (three.js e Playwright).
3. Baixa o Chromium do Playwright, o navegador que desenha os quadros.
4. Pergunta se pode instalar o reconhecedor de fala `openai-whisper` (é o item maior: de 2 a 3 GB, com o PyTorch) e instala.
5. Roda `npm run verificar`.

O `-ExecutionPolicy Bypass` libera só a execução deste script, sem mudar a configuração do Windows. Quando terminar, **feche o PowerShell e abra de novo**, para que os programas recém-instalados apareçam.

### macOS

```bash
bash instalar/macos.sh
```

Usa o [Homebrew](https://brew.sh) para instalar Node.js, FFmpeg e uv, depois as bibliotecas do projeto, o Chromium e, se você confirmar, o Whisper (`mlx-whisper` no Apple Silicon, `openai-whisper` no Intel). Se o Homebrew não estiver instalado, o script instala primeiro e pede a senha do Mac.

### Linux (Ubuntu, Debian e derivados)

```bash
bash instalar/linux.sh
```

Usa o `apt` (pede a senha de administrador, `sudo`) para os programas do sistema e segue com as bibliotecas do projeto, o Chromium com as dependências dele e o `openai-whisper`.

### Python: o uv cuida dele

Você não precisa instalar o Python. O **uv** baixa sozinho a versão que cada script pede (3.10 a 3.12) e as bibliotecas dele, na primeira vez que o script roda. Por isso a primeira narração demora mais: o uv instala o Kokoro e o PyTorch (cerca de 1 GB) e o Kokoro baixa o modelo de voz (cerca de 330 MB). Da segunda vez em diante, é rápido.

## 3.5 Passo 3: confira a instalação

```bash
npm run verificar
```

Você verá uma lista com ✔ em cada item: Node.js, npm, FFmpeg, uv, o Chromium, o Whisper e a placa de vídeo pelo WebGL. Se algum item vier com ✖, a própria linha diz o que fazer, e o [capítulo 8](08-qualidade-e-solucao-de-problemas.md#instalação-e-ambiente) tem a solução para cada caso.

## 3.6 Passo 4: gere o primeiro anúncio

```bash
npm run demo
```

O demo faz o caminho inteiro de graça: narração com o Kokoro, tempo de cada palavra, trilha, efeitos, mixagem e render da prévia. Em poucos minutos o vídeo aparece em:

```
entrega/previas/demo-previa.mp4
```

Para ver o filme 3D, gere a folha com um quadro de cada plano de A bancada, em segundos:

```bash
npm run contato -- exemplos/bancada
```

E renderize uma prévia completa. A narração original de A bancada não vai no repositório, então use `--sem-audio` (não refaz o áudio) e a prévia sai sem som:

```bash
npm run previa -- exemplos/bancada --sem-audio
```

No macOS e no Linux, os mesmos comandos existem como `make` (`make demo`, `make contato3d FILME=exemplos/bancada`). Rode `make ajuda` para ver todos.

## 3.7 Passo 5: o agente de IA de graça (Claude Code + Ollama)

O Ollama roda modelos de IA abertos no seu computador e oferece uma API compatível com a da Anthropic. Basta apontar o Claude Code para ele. O agente lê este manual, escreve o roteiro, cria as cenas, roda os comandos e olha os resultados.

**1. Instale o Ollama e o Claude Code.**

| Sistema | Ollama | Claude Code |
|---|---|---|
| Windows | Baixe o instalador em <https://ollama.com/download> | `npm install -g @anthropic-ai/claude-code` |
| macOS | `brew install ollama`, ou o aplicativo em <https://ollama.com/download> | `npm install -g @anthropic-ai/claude-code` |
| Linux | `curl -fsSL https://ollama.com/install.sh \| sh` | `npm install -g @anthropic-ai/claude-code` |

**2. Baixe um modelo e deixe o servidor rodando.**

```bash
ollama pull qwen3-coder:30b
ollama serve
```

Com 16 GB de memória, troque `qwen3-coder:30b` por `gpt-oss:20b`. No Windows e no macOS, o aplicativo do Ollama já deixa o servidor rodando; se o `ollama serve` avisar que a porta está em uso, está tudo certo.

**3. Em outro terminal, aponte o Claude Code para o Ollama e abra-o na pasta do projeto.**

No macOS e no Linux:

```bash
export ANTHROPIC_BASE_URL=http://localhost:11434
export ANTHROPIC_AUTH_TOKEN=ollama
export ANTHROPIC_API_KEY=""
claude --model qwen3-coder:30b
```

No Windows (PowerShell):

```powershell
$env:ANTHROPIC_BASE_URL="http://localhost:11434"; $env:ANTHROPIC_AUTH_TOKEN="ollama"; $env:ANTHROPIC_API_KEY=""
claude --model qwen3-coder:30b
```

A variável `ANTHROPIC_API_KEY` fica vazia de propósito: se ela tiver valor, o Claude Code a usa no lugar do Ollama. As variáveis valem só para aquele terminal; ao abrir um novo, defina de novo.

**4. Peça o anúncio.** Exemplo:

> Siga `docs/01-metodo.md`. Meu produto é [descreva]. Escreva o roteiro de 30 s em `criativos/meu-anuncio/roteiro.json` e me mostre antes de gerar a voz.

**Boas práticas com o modelo local:**

- Peça **uma etapa do método por vez** e cite os arquivos envolvidos.
- Comece **copiando um exemplo que funciona** (`exemplos/demo` no 2D, `exemplos/bancada` no 3D) em vez de pedir um filme do zero.
- Rode a conferência depois de cada mudança: `npm run contato -- <pasta>` para ver os quadros, e uma prévia curta com `--de` e `--ate`.
- Use **um agente separado como crítico**: quem constrói não deve aprovar sozinho. A independência vale mais que o tamanho do modelo.
- Use contexto de pelo menos 32 mil tokens. Em modelos de raciocínio, deixe `CLAUDE_CODE_MAX_OUTPUT_TOKENS` em 8000 ou mais.
- Skills e plugins funcionam igual, porque são arquivos de instrução lidos pelo agente.

**Outros agentes**, todos de código aberto e compatíveis com o Ollama: OpenCode, Aider e Qwen Code. Neles, aponte as instruções do agente para [`docs/01-metodo.md`](01-metodo.md).

## 3.8 Passo 6: faça o seu anúncio

O caminho completo, com voz gratuita, em seis comandos:

```bash
# 1. Crie a pasta do anúncio a partir do modelo
npm run novo -- meu-anuncio "Meu primeiro anúncio"

# 2. Escreva o roteiro em criativos/meu-anuncio/roteiro.json (o agente pode escrever)

# 3. Gere três tomadas da narração com a voz gratuita
uv run scripts/voz_kokoro.py meu-anuncio pf_dora 3 --roteiros criativos/meu-anuncio/roteiro.json

# 4. Ordene as tomadas, ouça as melhores e marque o tempo de cada palavra da escolhida
uv run scripts/voz_avaliar.py voz/meu-anuncio
uv run scripts/vo_montar.py criativos/meu-anuncio voz/meu-anuncio/pf_dora-1.wav

# 5. Prévia rápida (30 fps) e versão final (60 fps), com trilha, efeitos e mixagem
npm run previa -- criativos/meu-anuncio
npm run final -- criativos/meu-anuncio

# 6. Confira se o arquivo está no padrão das redes
npm run checar -- entrega/finais/meu-anuncio.mp4
```

Na prévia e no final dá para renderizar só um trecho (`--de 10 --ate 15`), mudar a qualidade do 3D (`--spp 64`), mudar os quadros por segundo (`--fps 30`) ou reaproveitar a mixagem que já existe, sem refazer o áudio (`--sem-audio`). Para refazer só a trilha, os efeitos e a mixagem: `npm run audio -- criativos/meu-anuncio`.

Para um filme 3D, comece copiando `exemplos/bancada` e trocando o roteiro, as telas e os objetos. O [capítulo 11](11-3d-fotorrealista.md) explica o motor e o [capítulo 14](14-estudo-de-caso-a-bancada.md) mostra o filme plano a plano.

## 3.9 A voz gratuita: Kokoro

O Kokoro-82M tem licença Apache-2.0, roda no seu computador, em CPU, e tem vozes de português do Brasil.

| Voz | Perfil |
|---|---|
| `pf_dora` | feminina |
| `pm_alex` | masculina |
| `pm_santa` | masculina, mais grave |

**Como tirar o melhor dele:**

- O Kokoro dá a mesma saída a cada execução, o que é ótimo para refazer o vídeo igual. As tomadas extras variam a velocidade (×1,00, ×0,96, ×1,04) para você escolher o ritmo.
- Leitura limpa, clara e neutra: combina com anúncios diretos, tutoriais e demonstrações de produto.
- Prefira ganchos afirmativos a perguntas: a leitura fica mais firme.
- Escreva números e siglas por extenso e use reticências para pausas.
- Aprove o roteiro com o Kokoro antes de qualquer outra coisa: trocar a voz depois não muda nada no filme, porque as cenas seguem as palavras.

## 3.10 Outra voz gratuita: Fish Audio

A Fish Audio tem um modelo gratuito na API (`s2.1-pro-free`, com uso justo) e uma biblioteca grande de vozes em português, com mais variação de interpretação que o Kokoro. Ela roda na nuvem e pede uma chave gratuita.

```bash
# .env: FISH_API_KEY=...   (crie em fish.audio → API Keys)
node scripts/voz_fish.mjs vozes                                   # lista vozes em português
uv run scripts/voz_por_frase.py <criativo> <voice_id> f1 --roteiros <roteiro.json> --n 3
uv run scripts/voz_por_frase.py <criativo> <voice_id> f1 --roteiros <roteiro.json> --mais 8:5,11:7   # mais candidatos só para as frases 8 e 11
uv run scripts/voz_dialogo.py voz/<criativo> voz/<criativo>/dueto.wav --vozes f1,m5,f1,...
```

**Frase a frase.** Gerar cada frase separadamente, com alguns candidatos, e escolher às cegas o que termina no tom certo garante entonação firme em todas as frases. Use `--temperatura 0.55` para uma leitura mais estável. Para uma interpretação contínua, gere o roteiro em bloco e escolha a melhor tomada.

**Escolha da voz.** Use vozes que não imitam pessoas reais: em anúncio público, isso evita risco legal e de reputação. Confira também se o seu plano permite uso comercial.

**Outra opção local:** o Piper roda em CPU e é leve. Confira a licença de cada voz antes de usar em anúncio.

## 3.11 Filme 3D sem pagar nada

O pipeline 3D não depende de nenhum serviço. Os comandos principais:

```bash
npm run contato -- exemplos/bancada                       # folha de contato, um quadro por plano
npm run previa -- exemplos/bancada --de 10 --ate 15       # só um trecho, para conferir
npm run final -- exemplos/bancada                         # 60 fps, qualidade de entrega
```

Para quadros avulsos em qualidade alta, use o renderizador direto:

```bash
node lib/3d/render.mjs --film exemplos/bancada --at 2.6,10.5 --spp 256
```

Os materiais de terceiros (um HDRI, uma textura de madeira, um mapa de digitais e três fontes) são CC0 ou OFL e estão listados no [capítulo 2](02-ferramentas.md). Todos os comandos e presets de qualidade estão no [capítulo 11](11-3d-fotorrealista.md#117-comandos).

## 3.12 Logo 3D gratuito

1. **three.js dentro do filme.** No motor 3D, modele a marca como objeto (veja `buildMark` em `exemplos/bancada/props.js`). No motor 2D, use o modo `--3d` do `scaffold.mjs` do motion-reel.
2. **Blender.** Importe o SVG, use *Extrude*, anime a rotação e uma luz de varredura, e renderize uma sequência PNG com transparência. No motor 2D, ela entra no cartão final com `logoSeq()` de `lib/cena.js`.

## 3.13 Custo total

| Item | Custo |
|---|---|
| Software e modelos | R$ 0 |
| Materiais (HDRI, texturas, fontes) | R$ 0 |
| Licença para anúncio comercial | R$ 0: código MIT, Kokoro Apache-2.0, materiais CC0 e OFL |
| Tempo de máquina | O render final 3D de 35 s leva cerca de 40 minutos num M1 Pro; o 2D, poucos minutos |

Quer voz de locutor profissional ou música produzida? Troque só essa etapa por um serviço pago e mantenha o resto de graça: veja os [serviços opcionais](04-trilha-paga.md).

---

Próximo: [4. Serviços opcionais →](04-trilha-paga.md)
