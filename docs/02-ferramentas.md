# 2. Ferramentas: o kit completo

Todo o método roda com dois conjuntos de ferramentas que fazem a mesma coisa em cada etapa:

- a **trilha gratuita**, só com software livre e modelos de pesos abertos ([03-trilha-gratuita.md](03-trilha-gratuita.md));
- a **trilha paga**, com serviços comerciais de qualidade mais alta e licença de uso comercial ([04-trilha-paga.md](04-trilha-paga.md)).

As duas usam o mesmo código, os mesmos scripts e os mesmos arquivos intermediários. Por isso dá para misturar: por exemplo, orquestrar com um modelo aberto e narrar com a ElevenLabs.

## 2.1 Comparativo por etapa

| Etapa | Trilha gratuita | Trilha paga | O que muda na prática |
|---|---|---|---|
| **Orquestração** (agente que escreve roteiro, código e corrige) | Claude Code CLI apontado para um modelo aberto no **Ollama** (`qwen3-coder:30b`, `gpt-oss:20b`). Alternativas: OpenCode, Aider, Qwen Code | **Claude Code** com plano Claude (modelos Opus / Sonnet) | O modelo aberto erra mais em tarefas longas e no uso de ferramentas. Revise cada etapa e quebre os pedidos em partes menores. |
| **Narração** | **Kokoro-82M** (Apache-2.0, vozes pt-BR `pf_dora`, `pm_alex`, `pm_santa`), via `scripts/voz_kokoro.py` | **ElevenLabs** (`eleven_v3`, `eleven_multilingual_v2`), via `scripts/voz_eleven.mjs` | A ElevenLabs tem entonação de locutor; o Kokoro é limpo, mas mais neutro. |
| **Conferência da fala** | `mlx-whisper` (Mac M) ou `whisper.cpp` | igual | — |
| **Tempo de cada palavra** | Whisper (`scripts/vo_montar.py`) | igual (a ElevenLabs também devolve os tempos) | — |
| **Trilha musical** | Sintetizada em código (`scripts/trilha.py`, `dsp.py`) | Igual, ou um banco licenciado (Artlist, Epidemic) | Um banco dá timbres reais, mas a trilha deixa de casar sozinha com a fala. |
| **Efeitos sonoros** | Sintetizados (`sfx.mjs`) | Igual | — |
| **Logo 3D** | **three.js** (modo `--3d` do motor) ou **Blender** | **After Effects** por script (`ae/logo3d/`) | O AE é mais rápido de iterar para quem já domina; o resultado é equivalente. |
| **Render** | Playwright + Chromium + ffmpeg | igual | — |
| **Fontes** | Google Fonts (SIL OFL) | Fontes licenciadas da marca | — |
| **Capturas do produto** | `gather.mjs`, API pública da App Store | igual | — |

## 2.2 Inventário completo

### Orquestração e inteligência

| Ferramenta | Função no método | Licença / custo |
|---|---|---|
| Claude Code (CLI ou app) | Agente que conduz todas as etapas: escreve, executa, inspeciona imagens e corrige | CLI gratuita; o modelo é pago (Anthropic) ou aberto (Ollama) |
| Ollama | Servidor local de modelos abertos, com API compatível com a da Anthropic | MIT, gratuito |
| Qwen3-Coder, gpt-oss | Modelos de pesos abertos para a trilha gratuita | Apache-2.0 |
| Subagentes / Workflow | Paralelismo: um agente por criativo depois do piloto aprovado | Consome tokens do modelo usado |

### Motor de vídeo

| Ferramenta | Função | Licença |
|---|---|---|
| `vendor/motion-reel` | Harness do filme como função do tempo; scripts `scaffold`, `gather`, `reference`, `beats`, `render`, `sfx`, `mix`, `sync` | MIT (Aries Spring) |
| `lib/cena.js` | Biblioteca de primitivas visuais: fundos, cards de vidro, títulos com desfoque, pílulas, cursor, celular, transições, cartão final | MIT |
| Node.js + Playwright | Executa o filme no Chromium e captura cada quadro | Apache-2.0 |
| ffmpeg / ffprobe | Codificação H.264, mixagem, inspeção | LGPL/GPL |
| three.js | Cenas e logos em 3D | MIT |

### Voz e fala

| Ferramenta | Função | Licença |
|---|---|---|
| ElevenLabs API | Narração de locutor (paga) | Comercial a partir do plano Starter |
| Kokoro-82M | Narração local (gratuita) | Apache-2.0 |
| Fish Audio | Narração na nuvem; modelo `s2.1-pro-free` gratuito com uso justo | Confira os termos do plano para uso comercial |
| mlx-whisper / whisper.cpp | Transcrição às cegas e tempo das palavras | MIT |
| Praat / Parselmouth | Medida de entonação (F0) no fim das frases | GPL |

### Áudio

| Ferramenta | Função | Licença |
|---|---|---|
| uv + Python (numpy, scipy, librosa, soundfile) | Síntese de trilha, análise de batidas, efeitos | BSD/ISC |
| `mix.mjs` | Master em -14 LUFS integrados e -1 dBTP (ITU-R BS.1770) | MIT |

### Logo, 3D e imagem

| Ferramenta | Função | Licença |
|---|---|---|
| After Effects + ExtendScript | Logo 3D animado, controlado por `osascript` | Comercial (Creative Cloud) |
| Blender | Alternativa gratuita para o logo 3D | GPL |
| Pillow, PyMuPDF | Folhas de contato, conversões, PDF | HPND / AGPL |

### Pesquisa e referência

| Ferramenta | Função |
|---|---|
| `reference.mjs` | Engenharia reversa de um vídeo de referência: um quadro por plano e o ritmo dos cortes |
| iTunes Search API | Capturas oficiais de apps da App Store, sem login |
| Navegador do agente (Claude in Chrome / navegador embutido) | Pesquisa de referências e materiais do cliente |

### Kit de scripts deste repositório

| Script | Faz |
|---|---|
| `scripts/novo_criativo.sh` | Cria a pasta de um criativo novo a partir do exemplo |
| `scripts/voz_eleven.mjs` / `scripts/eleven.mjs` | Narração paga, em lote, com N tomadas |
| `scripts/voz_kokoro.py` | Narração gratuita local, no mesmo formato de saída |
| `scripts/voz_fish.mjs` | Narração pela Fish Audio (modelo gratuito `s2.1-pro-free` ou pagos); `vozes` lista a biblioteca em português |
| `scripts/voz_por_frase.py` | Entonação controlada: N candidatos por frase, escolha às cegas pelo fim de frase, montagem com pausas planejadas |
| `scripts/voz_dialogo.py` | Diálogo entre vozes a partir das frases escolhidas |
| `scripts/voz_avaliar.py` | Escolhe a melhor tomada às cegas |
| `scripts/vo_montar.py` | Trata a voz e grava os tempos de palavra e frase (`vo.json`) |
| `scripts/trilha.py` | Compõe a trilha sob a narração |
| `scripts/variante.py` | Variações de cor, estilo e voz sem reescrever o filme |
| `scripts/finalizar.sh` | Trilha, efeitos, mixagem e render (prévia ou final) |
| `scripts/checar_entrega.sh` | Confere resolução, fps, formato de pixel, áudio e loudness |
| `scripts/folha_contato.py` | Folha de contato de um MP4 |

### Descartados (e por quê)

| Ferramenta | Motivo |
|---|---|
| Clone de voz local (Qwen3-TTS) | Sílaba tônica e entonação erradas em português nos testes |
| F5-TTS | Pesos oficiais sob CC BY-NC 4.0: não servem para anúncio |
| IA de vídeo generativa | Não reproduz a interface real do produto, que é o argumento de venda |
| Editores de timeline | Não reproduzem o resultado: cada ajuste vira retrabalho manual |
