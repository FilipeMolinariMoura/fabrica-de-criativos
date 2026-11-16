# 2. Ferramentas: o kit completo

[← 1. O método](01-metodo.md) · [Índice](README.md) · Próximo: [3. Trilha gratuita →](03-trilha-gratuita.md)

O método roda com dois conjuntos de ferramentas que cumprem o mesmo papel em cada etapa:

- a **trilha gratuita**, com software livre e modelos de pesos abertos ([capítulo 3](03-trilha-gratuita.md));
- a **trilha paga**, com serviços comerciais ([capítulo 4](04-trilha-paga.md)).

As duas usam o mesmo código, os mesmos scripts e os mesmos arquivos intermediários. Por isso dá para misturar: orquestrar com um modelo aberto e narrar com uma voz paga, por exemplo.

## 2.1 Comparativo por etapa

| Etapa | Trilha gratuita | Trilha paga | O que muda na prática |
|---|---|---|---|
| **Agente** (escreve roteiro e código, roda, revisa) | Claude Code apontado para um modelo aberto no **Ollama** (`qwen3-coder:30b`, `gpt-oss:20b`). Alternativas: OpenCode, Aider, Qwen Code | **Claude Code** com plano Claude | O modelo aberto erra mais em tarefas longas e no uso de ferramentas. Peça uma etapa por vez. |
| **Pesquisa de referências** | Miniaturas e metadados públicos do YouTube | Igual, mais uma ferramenta de biblioteca de anúncios (AdWhispr) | A biblioteca de anúncios mostra há quantos dias um anúncio está no ar. |
| **Narração** | **Kokoro-82M** (local) ou **Fish Audio** `s2.1-pro-free` | **ElevenLabs** com direção (`eleven_v3`, `eleven_multilingual_v2`) | É a maior diferença entre as trilhas. No anúncio deste projeto, só a paga foi aprovada de ouvido. |
| **Conferência da fala** | Whisper e Praat | iguais | — |
| **Filme 2D** | `lib/cena.js` | igual | — |
| **Filme 3D** | `lib/3d/` com three.js | igual | O 3D é código aberto. Roda nas duas trilhas. |
| **Trilha e efeitos** | Sintetizados em código | Iguais, ou banco de música licenciado | Um banco dá timbres reais, mas a música deixa de casar sozinha com a fala. |
| **Crítica independente** | Agentes separados com o modelo aberto | Agentes separados com Claude | O que importa é o crítico não ter construído o filme. |
| **Logo 3D** | three.js ou Blender | After Effects por script (`ae/logo3d/`) | Os scripts do After Effects não foram testados nesta versão. |
| **Render** | Playwright, Chromium e ffmpeg | iguais | — |

## 2.2 Inventário

### Orquestração

| Ferramenta | Função no método | Licença ou custo |
|---|---|---|
| Claude Code (CLI ou app) | Agente que conduz as etapas: escreve, executa, olha imagens e corrige | CLI gratuita; o modelo é pago (Anthropic) ou aberto (Ollama) |
| Ollama | Servidor local de modelos abertos, com API compatível com a da Anthropic | MIT |
| Qwen3-Coder, gpt-oss | Modelos de pesos abertos para a trilha gratuita | Apache-2.0 |
| Subagentes | Paralelismo: um agente por criativo, e os críticos independentes | Consomem tokens do modelo usado |

### Motor de vídeo 2D

| Ferramenta | Função | Licença |
|---|---|---|
| `vendor/motion-reel` | Harness do filme como função do tempo; scripts `scaffold`, `gather`, `reference`, `beats`, `render`, `sfx`, `mix`, `sync` | MIT (Aries Spring) |
| `lib/motion.js` | Harness derivado do motion-reel, com comentários em português | MIT |
| `lib/cena.js` | Primitivas visuais 2D: fundos, vidro, títulos, pílulas, cursor, celular, transições, cartão final | MIT |

### Motor de vídeo 3D (novo na 2.0)

| Arquivo | Função |
|---|---|
| `lib/3d/pipeline.js` | A "câmera": acumula N renders por quadro variando lente, subpixel, tempo, luzes e reflexo do chão; depois um único passe de acabamento |
| `lib/3d/studio.js` | O estúdio: ambiente HDRI com softboxes posicionados por cálculo, fundo, chão com reflexo renderizado, luzes |
| `lib/3d/models.js` | Aparelhos genéricos modelados em código (celular, notebook, placa de vidro) e utilitários de material |
| `lib/3d/screens.js` | O conteúdo das telas e os mapas de imperfeição (digitais, grão) |
| `lib/3d/render.mjs` | Renderizador: metadados, folha de contato, quadros avulsos, trecho em MP4, contraste das legendas |

| Dependência | Função | Licença |
|---|---|---|
| three.js (0.187 nos testes) | Renderização WebGL, materiais físicos, PMREM | MIT |
| Poly Haven: HDRI `studio_small_08`, textura `dark_wood` | Luz e reflexo de estúdio; tampo da bancada | CC0 |
| ambientCG: `Fingerprints004` | Digitais no vidro das telas | CC0 |
| Geist, Geist Mono, Instrument Serif | Tipografia do filme 3D | SIL OFL 1.1 |

O capítulo [11](11-3d-fotorrealista.md) explica o pipeline.

### Render e codificação

| Ferramenta | Função | Licença |
|---|---|---|
| Node.js e Playwright | Abrem o filme no Chromium e capturam cada quadro | Apache-2.0 (Playwright) |
| ffmpeg e ffprobe | Codificação H.264, mixagem, inspeção | LGPL/GPL |

### Voz e fala

| Ferramenta | Função | Licença ou custo |
|---|---|---|
| ElevenLabs API | Narração dirigida: marcações de tom no `eleven_v3`, `language_code`, sementes; modo diálogo | Paga. Uso comercial a partir do plano Starter |
| Fish Audio | Narração na nuvem; modelo `s2.1-pro-free` gratuito com uso justo | Confira os termos do plano para uso comercial |
| Kokoro-82M | Narração local | Apache-2.0 |
| mlx-whisper, openai-whisper | Transcrição às cegas e tempo de cada palavra | MIT |
| Praat e Parselmouth | Medida de entonação (F0) no fim das frases | GPL |

### Áudio

| Ferramenta | Função | Licença |
|---|---|---|
| uv e Python (numpy, scipy, librosa, soundfile) | Síntese da trilha, análise de batidas, medições | BSD/ISC |
| `sfx.mjs` (motion-reel) | Efeitos sonoros a partir da lista de eventos do filme | MIT |
| `mix.mjs` (motion-reel, com um ajuste local) | Mixagem e master em −14 LUFS e −1 dBTP | MIT |

O ajuste local no `mix.mjs` expõe os parâmetros do sidechain. Está descrito em [`vendor/README.md`](../vendor/README.md) e no [capítulo 13](13-som.md).

### Pesquisa e referência

| Ferramenta | Função |
|---|---|
| Miniaturas de pré-visualização do YouTube | Leitura de ritmo, enquadramento e luz de um filme sem baixá-lo |
| AdWhispr (biblioteca de anúncios da Meta) | Anúncios ativos de uma marca, ordenados por dias no ar |
| `reference.mjs` (motion-reel) | Quadros e ritmo de corte de um vídeo que você já tem em arquivo |
| `gather.mjs` (motion-reel) | Capturas do site do produto, cores, fontes e logo |
| iTunes Search API | Capturas oficiais de aplicativos da App Store, sem login |

### Logo e imagem

| Ferramenta | Função | Licença |
|---|---|---|
| After Effects e ExtendScript (`ae/logo3d/`) | Logo 3D animado por script. **Não testado nesta versão** | Comercial (Creative Cloud) |
| Blender | Alternativa gratuita para logo 3D | GPL |
| Pillow, PyMuPDF | Folhas de contato, conversões, PDF | HPND / AGPL |

### Scripts deste repositório

| Script | Faz |
|---|---|
| `scripts/novo_criativo.sh` | Cria a pasta de um criativo novo a partir do exemplo 2D |
| `scripts/voz_kokoro.py` | Narração gratuita local |
| `scripts/voz_fish.mjs` | Narração pela Fish Audio; `vozes` lista a biblioteca em português |
| `scripts/voz_eleven.mjs`, `scripts/eleven.mjs` | Narração paga em bloco; conta, vozes e fala avulsa |
| `scripts/voz_dirigida.py` | Narração dirigida pela ElevenLabs: amostras de tom, bloco com marcações, diálogo e junção de trechos |
| `scripts/voz_por_frase.py` | N candidatos por frase, escolha às cegas, montagem (motor Fish ou ElevenLabs) |
| `scripts/voz_dialogo.py` | Diálogo entre vozes a partir das frases escolhidas |
| `scripts/voz_avaliar.py` | Filtro às cegas: ordena as tomadas |
| `scripts/vo_montar.py` | Trata a voz e grava os tempos de palavra e frase (`vo.json`) |
| `scripts/trilha.py` | Compõe a trilha sob a narração |
| `scripts/variante.py` | Variações de cor, estilo e voz no motor 2D |
| `scripts/finalizar.sh` | Trilha, efeitos, mixagem e render do motor 2D (prévia ou final) |
| `scripts/finalizar3d.sh` | O mesmo para o motor 3D, mais folha de contato e contraste das legendas (`previa`, `final`, `contato`, `contraste`, `audio`) |
| `scripts/checar_entrega.sh` | Confere resolução, fps, formato de pixel, áudio e loudness |
| `scripts/folha_contato.py` | Folha de contato de um MP4 pronto |

## 2.3 Descartados, e por quê

| Ferramenta ou abordagem | Motivo | Como se soube |
|---|---|---|
| **Motor 2D para o anúncio do projeto** | Resultado correto e cru: quadro vazio, preto lavado, sem câmera, sem luz, sem corte | Reprovação do autor, depois medida ([capítulo 0](00-visao-geral.md#03-a-reprovação)) |
| **IA de vídeo generativa no corte principal** | Texto e interface saem errados; entrega 24 a 30 fps; e tornaria falsa a frase "foi programado" | Análise antes de construir ([capítulo 9](09-pesquisa-de-referencias.md#96-por-que-não-vídeo-generativo)) |
| **Kokoro para a voz final deste anúncio** | Limpo e neutro demais; reprovado de ouvido | Escuta do autor |
| **Fish Audio para a voz final deste anúncio** | Melhor que o Kokoro; ainda reprovado de ouvido | Escuta do autor |
| **ElevenLabs em modo diálogo sem direção** | Palavras fiéis, entonação reprovada | Escuta do autor |
| **Profundidade de campo por pós-processamento** | Erra atrás de vidro e em reflexos | Teste no look-dev |
| **Traçado de caminhos no navegador** (`three-gpu-pathtracer`) | A própria biblioteca se declarava instável na data do teste | Leitura da documentação |
| **Modelos 3D de terceiros para os aparelhos** | Não há celular nem notebook moderno em CC0 no acervo consultado, e modelos de marca carregam marca alheia | Consulta ao acervo |
| **Clone de voz local (Qwen3-TTS)** | Sílaba tônica e entonação erradas em português | Testes da versão 1 |
| **F5-TTS, XTTS-v2** | Pesos sob licença não comercial | Leitura da licença |
| **Editores de timeline** | Não reproduzem o resultado; cada ajuste é retrabalho manual | Premissa do método |

"Descartado" vale para o caso descrito. Kokoro e Fish continuam no kit, funcionam e servem bem para rascunho e aprovação de roteiro.

---

Próximo: [3. Trilha gratuita →](03-trilha-gratuita.md)
