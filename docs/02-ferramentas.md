# 2. Ferramentas: o kit completo

[← 1. O método](01-metodo.md) · [Índice](README.md) · Próximo: [3. O caminho gratuito →](03-trilha-gratuita.md)

Todo o kit é software livre ou modelo de IA aberto. Cada etapa do método tem uma ferramenta gratuita que roda no seu computador, e algumas etapas aceitam, se você quiser, um serviço pago no lugar:

- o **caminho gratuito**, completo do roteiro ao MP4 ([capítulo 3](03-trilha-gratuita.md));
- os **serviços opcionais**, para quem quiser voz de locutor ou música produzida ([capítulo 4](04-trilha-paga.md)).

Os dois usam o mesmo código, os mesmos scripts e os mesmos arquivos intermediários. Por isso dá para misturar: fazer tudo de graça e trocar só a voz, por exemplo.

## 2.1 Comparativo por etapa

| Etapa | Caminho gratuito | Serviço opcional | Quando vale o opcional |
|---|---|---|---|
| **Agente** (escreve roteiro e código, roda, revisa) | Claude Code apontado para um modelo aberto no **Ollama** (`qwen3-coder:30b`, `gpt-oss:20b`). Alternativas: OpenCode, Aider, Qwen Code | **Claude Code** com plano Claude | Tarefas longas com muitas etapas seguidas. Com o modelo aberto, peça uma etapa por vez e o resultado é o mesmo. |
| **Pesquisa de referências** | Miniaturas e metadados públicos do YouTube | Igual, mais uma biblioteca de anúncios (AdWhispr) | Quando você quer saber há quantos dias um anúncio está no ar. |
| **Narração** | **Kokoro-82M** (local) ou **Fish Audio** `s2.1-pro-free` | **ElevenLabs** com direção (`eleven_v3`, `eleven_multilingual_v2`) | Quando o anúncio pede interpretação de locutor, com emoção dirigida frase a frase. |
| **Conferência da fala** | Whisper e Praat | iguais | — |
| **Filme 2D** | `lib/cena.js` | igual | — |
| **Filme 3D** | `lib/3d/` com three.js | igual | O 3D fotorrealista é sempre gratuito. |
| **Trilha e efeitos** | Sintetizados em código, já presos às palavras | ElevenLabs Music | Quando você quer timbres de música produzida. |
| **Crítica independente** | Agentes separados com o modelo aberto | Agentes separados com Claude | O que importa é o crítico não ter construído o filme. |
| **Logo 3D** | three.js dentro do filme, ou Blender | After Effects por script (`ae/logo3d/`) | Quando você já trabalha no After Effects. |
| **Render** | Playwright, Chromium e FFmpeg | iguais | — |

## 2.2 Versões testadas

O kit foi testado com as versões abaixo. A coluna "Requisito" é o mínimo que funciona.

### Sistemas e computador

| Item | Requisito |
|---|---|
| Windows | 10 (22H2) ou 11, com o winget (já vem no sistema) |
| macOS | 13 Ventura ou mais novo, Intel ou Apple Silicon, com o Homebrew |
| Linux | Ubuntu 22.04 ou mais novo, Debian 12 e derivados, com o apt |
| Memória | 8 GB no mínimo, 16 GB recomendado. O agente com modelo aberto pede mais: veja o [capítulo 3](03-trilha-gratuita.md#32-requisitos-de-máquina) |
| Placa de vídeo | Qualquer uma com WebGL 2; a integrada serve. Uma placa melhor só deixa o render mais rápido |
| Disco | De 3 a 5 GB para as ferramentas e os modelos de IA (o Whisper e o Kokoro trazem o PyTorch); reserve mais para guardar renders |

### Programas

| Programa | Requisito | Testado com | Para quê |
|---|---|---|---|
| [Node.js](https://nodejs.org) | 20 ou mais novo | 22.23 | Roda o motor, o render e a linha de comando `npm run …` |
| npm | vem com o Node.js | 10.9 | Instala as bibliotecas JavaScript e roda os comandos |
| [uv](https://docs.astral.sh/uv/) | 0.5 ou mais novo | 0.13 | Roda os scripts Python e baixa sozinho o Python certo |
| Python | 3.10 a 3.12, gerenciado pelo uv | 3.11 | Voz, trilha, conferência da fala |
| [FFmpeg](https://ffmpeg.org) e ffprobe | 6 ou mais novo | 6.0 | Codifica o vídeo, mixa e mede o áudio |
| [Git](https://git-scm.com) | qualquer recente | — | Baixa o projeto (opcional: dá para baixar o ZIP) |
| Chromium do [Playwright](https://playwright.dev) | instalado pelo instalador | Playwright 1.65.1 | Desenha cada quadro na placa de vídeo |
| Reconhecedor de fala | mlx-whisper (Mac Apple Silicon) ou openai-whisper (Windows, Linux e Mac Intel) | mlx-whisper 0.4.3 | Marca o instante de cada palavra |

Você não precisa instalar o Python à parte: na primeira vez que cada script roda, o `uv` baixa a versão que ele pede e as bibliotecas dele.

### Bibliotecas

| Biblioteca | Linguagem | Versão | Usada em |
|---|---|---|---|
| [three.js](https://threejs.org) | JavaScript | 0.187.0 | Motor 3D: cenas, materiais físicos, luz |
| [Playwright](https://playwright.dev) | JavaScript | 1.65.1 | Abre o filme no Chromium e captura cada quadro |
| [motion-reel](../vendor/motion-reel) | JavaScript e Python | 1.3 (incluída em `vendor/`) | Motor 2D, efeitos sonoros e mixagem |
| [NumPy](https://numpy.org), [SciPy](https://scipy.org) | Python | atuais | Áudio e sinais |
| [soundfile](https://github.com/bastibe/python-soundfile) | Python | atual | Leitura e gravação de áudio |
| [librosa](https://librosa.org) | Python | 0.10 ou mais nova | Análise de ritmo da trilha |
| [Parselmouth (Praat)](https://parselmouth.readthedocs.io) | Python | atual | Mede a entonação no fim das frases |
| [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) | Python | 0.9.4 ou mais nova | Voz gratuita, local |
| [Pillow](https://python-pillow.org) | Python | atual | Folhas de contato |
| PyTorch | Python | atual | Instalado junto com o Kokoro na primeira narração (cerca de 1 GB). torchaudio só entra em scripts opcionais |

Cada script Python declara no cabeçalho as bibliotecas de que precisa, e o `uv` as instala na primeira execução.

### Linguagens

| Linguagem | Onde é usada |
|---|---|
| **JavaScript** (Node.js, módulos ES) | Cenas, motores 2D e 3D, render, efeitos, mixagem e a linha de comando `fabrica.mjs` |
| **Python** | Voz, conferência da fala, trilha, folhas de contato |
| **HTML e CSS** | A página de cada filme e o guia em PDF |
| **Shell** (opcional) | Atalhos `make` e scripts de apoio no macOS e no Linux |

## 2.3 Inventário

### Linha de comando e instaladores

| Arquivo | Função |
|---|---|
| `instalar/windows.ps1` | Instala Git, Node.js LTS, FFmpeg e uv pelo winget; depois as bibliotecas do projeto, o Chromium do Playwright e o Whisper; termina com a conferência |
| `instalar/macos.sh` | O mesmo no macOS, pelo Homebrew |
| `instalar/linux.sh` | O mesmo no Ubuntu, Debian e derivados, pelo apt |
| `fabrica.mjs` | A linha de comando por trás dos `npm run …`: `verificar`, `demo`, `novo`, `contato`, `previa`, `final`, `audio`, `checar` |
| `Makefile` | Os mesmos atalhos como `make …`, para quem usa macOS ou Linux; `make ajuda` lista todos |

### Orquestração

| Ferramenta | Função no método | Licença ou custo |
|---|---|---|
| Ollama | Servidor local de modelos abertos, com API compatível com a da Anthropic | MIT, gratuito |
| Qwen3-Coder, gpt-oss | Modelos de pesos abertos para o agente | Apache-2.0, gratuitos |
| Claude Code (CLI ou app) | Agente que conduz as etapas: escreve, executa, olha imagens e corrige | CLI gratuita; funciona com o Ollama (grátis) ou com um plano Claude (opcional) |
| Subagentes | Paralelismo: um agente por criativo, e os críticos independentes | Usam o mesmo modelo do agente |

### Motor de vídeo 2D

| Ferramenta | Função | Licença |
|---|---|---|
| `vendor/motion-reel` | Harness do filme como função do tempo; scripts `scaffold`, `gather`, `reference`, `beats`, `render`, `sfx`, `mix`, `sync` | MIT (Aries Spring) |
| `lib/motion.js` | Harness derivado do motion-reel, com comentários em português | MIT |
| `lib/cena.js` | Primitivas visuais 2D: fundos, vidro, títulos, pílulas, cursor, celular, transições, cartão final | MIT |

### Motor de vídeo 3D

| Arquivo | Função |
|---|---|
| `lib/3d/pipeline.js` | A "câmera": acumula N renders por quadro variando lente, subpixel, tempo, luzes e reflexo do chão; depois um único passe de acabamento |
| `lib/3d/studio.js` | O estúdio: ambiente HDRI com softboxes posicionados por cálculo, fundo, chão com reflexo renderizado, luzes |
| `lib/3d/models.js` | Aparelhos genéricos modelados em código (celular, notebook, placa de vidro) e utilitários de material |
| `lib/3d/screens.js` | O conteúdo das telas e os mapas de imperfeição (digitais, grão) |
| `lib/3d/render.mjs` | Renderizador: metadados, folha de contato, quadros avulsos, trecho em MP4, contraste das legendas |

| Dependência | Função | Licença |
|---|---|---|
| three.js 0.187 | Renderização WebGL, materiais físicos, PMREM | MIT |
| Poly Haven: HDRI `studio_small_08`, textura `dark_wood` | Luz e reflexo de estúdio; tampo da bancada | CC0 |
| ambientCG: `Fingerprints004` | Digitais no vidro das telas | CC0 |
| Geist, Geist Mono, Instrument Serif | Tipografia do filme 3D | SIL OFL 1.1 |

O capítulo [11](11-3d-fotorrealista.md) explica o pipeline.

### Render e codificação

| Ferramenta | Função | Licença |
|---|---|---|
| Node.js e Playwright | Abrem o filme no Chromium e capturam cada quadro | MIT (Node.js), Apache-2.0 (Playwright) |
| FFmpeg e ffprobe | Codificação H.264, mixagem, inspeção | LGPL/GPL |

### Voz e fala

| Ferramenta | Função | Licença ou custo |
|---|---|---|
| Kokoro-82M | Narração local, com vozes em português do Brasil | Apache-2.0, gratuito, uso comercial permitido |
| Fish Audio | Narração na nuvem; modelo `s2.1-pro-free` gratuito com uso justo | Confira os termos do plano para uso comercial |
| ElevenLabs API (opcional) | Narração dirigida: marcações de tom no `eleven_v3`, `language_code`, sementes; modo diálogo | Paga. Uso comercial a partir do plano Starter |
| mlx-whisper, openai-whisper | Transcrição às cegas e tempo de cada palavra | MIT, gratuitos |
| Praat e Parselmouth | Medida de entonação (F0) no fim das frases | GPL, gratuitos |

### Áudio

| Ferramenta | Função | Licença |
|---|---|---|
| uv e Python (NumPy, SciPy, librosa, soundfile) | Síntese da trilha, análise de batidas, medições | BSD/ISC |
| `sfx.mjs` (motion-reel) | Efeitos sonoros a partir da lista de eventos do filme | MIT |
| `mix.mjs` (motion-reel, com um ajuste local) | Mixagem e master em −14 LUFS e −1 dBTP | MIT |

O ajuste local no `mix.mjs` expõe os parâmetros do sidechain. Está descrito em [`vendor/README.md`](../vendor/README.md) e no [capítulo 13](13-som.md).

### Pesquisa e referência

| Ferramenta | Função |
|---|---|
| Miniaturas de pré-visualização do YouTube | Leitura de ritmo, enquadramento e luz de um filme sem baixá-lo |
| AdWhispr (biblioteca de anúncios da Meta, opcional) | Anúncios ativos de uma marca, ordenados por dias no ar |
| `reference.mjs` (motion-reel) | Quadros e ritmo de corte de um vídeo que você já tem em arquivo |
| `gather.mjs` (motion-reel) | Capturas do site do produto, cores, fontes e logo |
| iTunes Search API | Capturas oficiais de aplicativos da App Store, sem login |

### Logo e imagem

| Ferramenta | Função | Licença |
|---|---|---|
| three.js | Marca modelada como objeto dentro do filme 3D (`buildMark` em `exemplos/bancada/props.js`) | MIT |
| Blender | Logo 3D animado, exportado como sequência PNG | GPL, gratuito |
| After Effects e ExtendScript (`ae/logo3d/`) | Ponto de partida opcional para quem já usa o programa | Comercial (Creative Cloud) |
| Pillow, PyMuPDF | Folhas de contato, conversões, PDF | HPND / AGPL |

### Scripts deste repositório

| Script | Faz |
|---|---|
| `scripts/novo_criativo.sh` | Cria a pasta de um criativo novo a partir do exemplo 2D (no Windows, use `npm run novo`) |
| `scripts/voz_kokoro.py` | Narração gratuita local |
| `scripts/voz_fish.mjs` | Narração pela Fish Audio; `vozes` lista a biblioteca em português |
| `scripts/voz_eleven.mjs`, `scripts/eleven.mjs` | Narração pela ElevenLabs em bloco; conta, vozes e fala avulsa (opcional) |
| `scripts/voz_dirigida.py` | Narração dirigida pela ElevenLabs: amostras de tom, bloco com marcações, diálogo e junção de trechos (opcional) |
| `scripts/voz_por_frase.py` | N candidatos por frase, escolha às cegas, montagem (motor Fish ou ElevenLabs) |
| `scripts/voz_dialogo.py` | Diálogo entre vozes a partir das frases escolhidas |
| `scripts/voz_avaliar.py` | Filtro às cegas: ordena as tomadas |
| `scripts/vo_montar.py` | Trata a voz e grava os tempos de palavra e frase (`vo.json`) |
| `scripts/trilha.py` | Compõe a trilha sob a narração (sintetizada, grátis) |
| `scripts/trilha_eleven.py` | Gera a trilha na ElevenLabs Music e alinha a virada e o final à fala (opcional) |
| `scripts/variante.py` | Variações de cor, estilo e voz no motor 2D |
| `scripts/finalizar.sh` | Trilha, efeitos, mixagem e render do motor 2D (prévia ou final) |
| `scripts/finalizar3d.sh` | O mesmo para o motor 3D, mais folha de contato e contraste das legendas |
| `scripts/checar_entrega.sh` | Confere resolução, fps, formato de pixel, áudio e loudness |
| `scripts/folha_contato.py` | Folha de contato de um MP4 pronto |

Os scripts `.sh` são chamados por trás dos comandos `npm run …`. Você não precisa rodá-los diretamente.

## 2.4 Escolhas de projeto

Algumas decisões dão ao kit o resultado que ele tem. Elas valem como recomendação para quem for estender o método.

| Escolha | Por quê |
|---|---|
| **3D fotorrealista para filme de produto, 2D para interface** | O 3D dá matéria, luz e lente; o 2D é o mais rápido para mostrar telas e gerar variações. Use cada um no que faz melhor |
| **Imagem 100% renderizada por código no corte principal** | Texto e interface saem exatos, o filme sai em 60 fps e a frase "foi programado" é verdadeira. Veja o [capítulo 9](09-pesquisa-de-referencias.md#96-por-que-não-vídeo-generativo) |
| **Profundidade de campo por acumulação de amostras** | Fica correta atrás de vidro e em reflexos, onde o desfoque por pós-processamento erra |
| **Rasterização acumulada no lugar de traçado de caminhos no navegador** | É estável, roda em qualquer GPU com WebGL 2 e entrega sombra suave e desfoque de lente reais |
| **Aparelhos modelados em código** | Sem marca alheia e sem dependência de acervo: o celular e o notebook são genéricos e editáveis |
| **Vozes com licença comercial** | Kokoro (Apache-2.0) é livre para anúncio. Modelos de voz com licença não comercial, como F5-TTS e XTTS-v2, ficam fora do kit |
| **Vozes nativas do idioma** | Em português, vozes nativas soam mais naturais que vozes estrangeiras forçadas para o idioma |
| **Código no lugar de editor de linha do tempo** | O mesmo código gera sempre o mesmo vídeo, e cada ajuste é refeito com precisão |

---

Próximo: [3. O caminho gratuito →](03-trilha-gratuita.md)
