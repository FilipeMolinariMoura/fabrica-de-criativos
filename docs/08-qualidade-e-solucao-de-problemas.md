# 8. Qualidade, entrega e solução de problemas

[← 7. Roteiro e copy](07-roteiro-e-copy.md) · [Índice](README.md) · Próximo: [9. Pesquisa de referências →](09-pesquisa-de-referencias.md)

Conferência automática prova que o vídeo está correto. Para garantir que ele também parece caro, o método usa três ferramentas: uma rubrica de imagem, montagem e som; críticos que não construíram o filme; e medições no lugar de impressões. No fim do capítulo, uma tabela de solução de problemas cobre da instalação ao render.

## 8.1 A regra central

**O construtor nunca aprova o próprio trabalho sozinho.**

Quem construiu sabe o que quis fazer e tende a ver isso na tela, mesmo quando não está lá. As rodadas do próprio construtor são úteis e pegam o grosso; a aprovação vem de quem olha com olhos novos.

Três camadas, nesta ordem:

| Camada | Quem | O que pega |
|---|---|---|
| 1. Rodadas do construtor | O agente que escreve o filme | Erros grosseiros: plano ilegível, legenda em cima do objeto, quadro vazio |
| 2. Críticos independentes | Agentes sem o histórico da construção | O que o construtor deixou de ver: flutuação, falta de peso, som que sumiu |
| 3. Pessoa | Quem pediu o anúncio | O que nenhuma medição alcança: se a voz emociona, se o filme convence |

## 8.2 A rubrica

Notas de 1 a 10. A régua: **8 = eu colocaria no ar; 10 = não distingo de um filme de produto de estúdio.**

### Imagem

| Critério | 1–4 | 5–7 | 8–10 |
|---|---|---|---|
| **Realismo** | Formas planas, sem luz | Render bonito que qualquer um reconhece como 3D | Passa por fotografia de estúdio à primeira vista |
| **Composição** | Quadro meio vazio, objeto cortado sem intenção | Cheio, mas com legenda sobre o assunto ou objeto encostado na borda | Quadro cheio, assunto livre, zonas de interface da rede respeitadas |
| **Tipografia** | Caixa alta pesada, ilegível no celular | Legível com esforço | Caixa mista, corpo certo, contraste medido ≥ 4,5:1 |
| **Acabamento ("premium")** | Parece modelo pronto | Correto e genérico | Tem matéria, luz e intenção em todo plano |
| **Consistência** | Cada plano parece de um filme | Mesma paleta, luz que muda sem motivo | Uma gradação de cor, mundos de luz com lógica |

### Montagem e movimento

| Critério | 1–4 | 5–7 | 8–10 |
|---|---|---|---|
| **Gancho** | Primeiro segundo parado ou vazio | Imagem pronta, ação só depois de 1 s | Ação visível em até 0,5 s e ideia clara em 1,5 s |
| **Ritmo** | Mesmo plano por 6 s ou fusões | Cortes na frase | Cortes dois quadros antes da palavra, escala alternando |
| **Movimento** | Linear, sem peso | Curvas, mas tudo igual | Antecipação, sobressalto e assentamento visíveis |
| **História sem som** | Não se entende no mudo | Entende-se com esforço | A legenda e a imagem contam tudo |
| **CTA** | Só falado | Escrito, mas pequeno ou rápido | Dito, escrito, segurado em tela e com ação mostrada |

### Som

| Critério | 1–4 | 5–7 | 8–10 |
|---|---|---|---|
| **Clareza da voz** | Palavras perdidas | Entende-se, com sibilância ou níveis desiguais | Nível parelho entre frases e entre vozes |
| **Desenho de som** | Sem efeitos, ou efeitos em cima das palavras | Efeitos existem mas não se ouvem | Todo evento visual tem som audível, nenhum cobre palavra, a música respira nos intervalos |

**Critério de saída:** todos os critérios ≥ 8. Se uma escolha consciente deixar algum critério abaixo disso, ela é registrada por escrito no `docs/critica.md` do filme, com o motivo.

A ficha em branco para preencher a cada rodada é [`templates/critica.md`](../templates/critica.md).

## 8.3 Especificação de entrega

| Item | Valor |
|---|---|
| Resolução | 1080×1920 (9:16) |
| Quadros | 60 fps no final, 30 fps na prévia |
| Vídeo | H.264, yuv420p, CRF 16 |
| Áudio | AAC, −14 LUFS integrados (tolerância de ±1), pico ≤ −1 dBTP |
| Nome | `A01-NOME-CURTO.mp4`, com sufixo de variação (`-ESCURO`, `-IMPACTO`, `-VOZ2`) |

Confira com:

```bash
npm run checar -- entrega/finais/bancada.mp4
```

O comando confere cada item da tabela e imprime o resultado por arquivo. No macOS e no Linux, `make checar` confere de uma vez todos os MP4 de `entrega/finais/`.

## 8.4 Como montar os críticos independentes

1. **Abra um agente novo para cada crítico.** Ele não pode herdar a conversa da construção.
2. **Entregue material, não conclusões.** A prévia em vídeo, as referências, o roteiro e a rubrica. Nada de "achamos que o plano 3 ficou bom".
3. **Separe as especialidades.** Um crítico de imagem e um de montagem e som. Um só agente fazendo as duas coisas tende a ser raso nas duas.
4. **Exija medição.** Tudo o que pode ser medido deve vir com número.
5. **Exija correção numérica.** "A legenda encosta no celular" não basta. "Desça o assunto 170 px para o topo do celular ficar abaixo de y = 560" basta.
6. **Peça só o que melhorar.** O pedido termina com "não elogie": o crítico rende mais quando procura ajustes.

O texto do pedido está no [capítulo 5](05-skills.md#53-como-pedir-ao-agente).

## 8.5 O que cada crítico mede

### Crítico de imagem

| Medida | Como | Limite usado |
|---|---|---|
| Preto do mundo escuro | Percentil 5 de luminância do quadro | ≤ 8/255 |
| Brancos do mundo claro | Pico de luminância | Perto de 225; acima de 235 estoura |
| Cor do fundo | Média RGB de uma área lisa | Osso quente, não cinza neutro |
| Contraste das legendas | Razão WCAG no pior 5% da caixa da legenda, no quadro renderizado | ≥ 4,5:1 |
| Ocupação do quadro | Fração de pixels com conteúdo | ≥ 60% |
| Posição da legenda e do assunto | Coordenadas em pixels | Assunto fora da faixa da legenda |
| Frestas de contato | Distância entre objeto e sombra, em pixels | Zero: fresta clara faz o objeto flutuar |

No motor 3D, o contraste das legendas sai de um comando:

```bash
node lib/3d/render.mjs --film exemplos/bancada --contrast
```

### Crítico de montagem e som

| Medida | Como | Limite usado |
|---|---|---|
| Tempo até a primeira ação | Diferença entre quadros nos primeiros segundos | ≤ 0,5 s |
| Movimento por plano | Energia de diferença entre quadros em tiras densas (15 fps) | Sem "vale" de movimento no meio do filme |
| Chegada do movimento | Quanto do movimento já aconteceu antes do impacto | A resolução acontece em 2 quadros, na palavra |
| Loudness integrado e pico | Medidor ITU-R BS.1770 | −14 LUFS, ≤ −1 dBTP |
| Nível por frase da voz | Loudness de cada frase | Variação pequena entre frases e entre vozes |
| Voz acima da música | Diferença média em dB | Perto de 14 dB sob a fala |
| Música nos intervalos da voz | Loudness nos vãos | Cerca de 9 LU abaixo da voz, não 15 |
| Efeitos audíveis | Nível de cada efeito contra a voz | Nenhum mais de 15 dB abaixo |
| Efeitos e palavras | Início do efeito contra o início audível das palavras | Nenhum golpe forte em cima de uma palavra |

## 8.6 O que a crítica independente encontra

Na produção de A bancada, os dois críticos trabalharam sobre a prévia e devolveram listas de ajuste com números. Os tipos de achado se repetem em quase todo filme, e por isso valem como lista de conferência.

| Tipo de achado | Exemplo de ajuste em número | Critério que sobe |
|---|---|---|
| Objeto sem contato com o chão | Decalque de sombra de contato sob cada objeto, fresta de zero pixel | Realismo |
| Fundo claro sem temperatura | Fundo osso quente no lugar de cinza neutro; brancos perto de 225 | Realismo, consistência |
| Legenda sobre o produto | Assunto 170 px mais baixo, topo do celular abaixo de y = 560 | Composição, tipografia |
| Contraste de legenda insuficiente | Tinta trocada até ≥ 4,5:1 no pior 5% da caixa, medido com `--contrast` | Tipografia |
| Plano sem movimento no meio do filme | Câmera com deriva lenta em todo plano | Ritmo e movimento |
| Música sumindo nos intervalos da fala | Sidechain mais suave: música cerca de 9 LU abaixo da voz nos vãos | Desenho de som |
| Efeitos inaudíveis | Nenhum efeito mais de 15 dB abaixo da voz | Desenho de som |
| Impacto adiantado em relação à palavra | Impacto no início audível da palavra, não no `t0` do Whisper | Ritmo, som |

Cada ajuste foi aplicado e conferido com a medição refeita. O modelo em branco para registrar as rodadas de revisão é [`templates/critica.md`](../templates/critica.md).

## 8.7 Solução de problemas

### Voz

| Sintoma | Causa | Solução |
|---|---|---|
| A narração passa no filtro, mas você quer mais emoção | O filtro mede palavra e fim de frase; a emoção se dirige | Volte às amostras de tom e dirija ([capítulo 12](12-voz-dirigida.md)) |
| Afirmação termina subindo, como pergunta | A voz "se perde" em frase longa | Quebre a frase, ou gere frase a frase |
| Português com melodia de inglês | Voz padrão americana | Force `language_code: "pt"`, dirija com marcações, ou use voz nativa |
| Palavra pronunciada errada | Grafia ambígua para aquele motor | Teste a palavra sozinha; ajuste a grafia de fala |
| Duas vozes com volumes diferentes | Cada geração sai num nível | Iguale o loudness das duas antes de montar |
| Erro de formato na ElevenLabs | 192 kbps não está no seu plano | Use `mp3_44100_128` |
| A cota acabou | Limite mensal | Confira com `node scripts/eleven.mjs conta` antes do lote |

### Sincronia

| Sintoma | Causa | Solução |
|---|---|---|
| Cenas fora do lugar depois de trocar a voz | Tempos fixos em segundos | Prenda tudo às palavras com `wt()` |
| O impacto chega antes da palavra | O `t0` do Whisper é adiantado (50 a 235 ms nas medições) | Use o início audível medido no áudio, ou `t0` + 0,10 s |
| `vo.json: palavra "x" não encontrada` | O roteiro mudou e o filme ainda pede a palavra antiga | Atualize a palavra no filme |
| O vídeo acaba antes do cartão final | Mixagem antiga, mais curta que o filme | Refaça a mixagem antes do render |

### Motor 2D

| Sintoma | Causa | Solução |
|---|---|---|
| Título sai em fonte com serifa | O peso ou o itálico não foi carregado | Liste a variação em `FONTES_EXTRA` ou no carregamento do `motion.js` |
| Quadros diferentes a cada render | `Math.random` ou estado entre quadros | Ruído com semente; tudo calculado a partir de *t* |

### Motor 3D

| Sintoma | Causa | Solução |
|---|---|---|
| Pontinhos brilhantes num vidro ou metal polido | Uma luz que se move dentro da própria área imprime um ponto por amostra | Superfícies lisas recebem especular só do ambiente (`envSpecOnly`) |
| Padrão de pontos no desfoque | Poucas amostras | 192 spp ou mais em movimento; 768 em quadro parado |
| Estrias que se repetem no desfoque | O mesmo padrão de lente em todos os quadros | Gire o padrão a cada quadro (o pipeline já faz) |
| Clarão branco na tela do notebook | Um softbox do HDRI refletido; `envMapIntensity` é ignorado quando existe `scene.environment` | Entregue o mapa de ambiente direto em `material.envMap`, com a dose de cada material |
| Sombras lavadas no mundo claro | O chão recebendo luz ambiente sem sombra | Ambiente do chão em zero; o chão reflete pelo passe de espelho |
| Objetos flutuando | Fresta clara entre o objeto e a sombra | Decalque de sombra de contato por objeto |
| Preto leitoso | Fundo emitindo cinza | Fundo escuro com emissão quase nula; confira o percentil 5 |
| O mundo claro inteiro brilha | Bloom por limiar de brilho | Bloom só do passe de emissivos |
| Vidro atrás de vidro some | A transmissão do three.js só enxerga objetos opacos | Renderize o vidro em camadas, de trás para a frente |
| Legenda ilegível sobre a tela | Sem contraste contra o que está atrás | Meça com `--contrast`; mude a tinta ou mova o assunto |
| Render muito lento num plano | Vidro com transmissão custa várias passadas por amostra | Menos vidro no quadro, ou menos amostras naquele plano |
| O tempo de render medido parece bom demais | A GPU ainda não terminou quando o cronômetro parou | Force a leitura de um pixel antes de medir |

### Instalação e ambiente

O primeiro passo é sempre o mesmo: rode `npm run verificar`. Ele confere cada ferramenta e a placa de vídeo, e a linha com ✖ diz o que falta.

| Sintoma | Causa | Solução |
|---|---|---|
| Windows: "a execução de scripts foi desabilitada neste sistema" | A política de execução do PowerShell bloqueia scripts baixados | Rode o instalador exatamente assim: `powershell -ExecutionPolicy Bypass -File instalar\windows.ps1`. A liberação vale só para essa execução |
| Windows: `winget` não é reconhecido | O Instalador de Aplicativos está desatualizado ou ausente (comum em Windows 10 antigo) | Atualize o **Instalador de Aplicativos** (App Installer) pela Microsoft Store e abra um PowerShell novo |
| Windows: `node`, `npm`, `ffmpeg` ou `uv` "não é reconhecido" logo depois de instalar | O terminal aberto ainda usa o PATH antigo | Feche o PowerShell e abra um novo. Se persistir, reinicie o Windows |
| `ffmpeg` não encontrado | O FFmpeg não foi instalado ou não está no PATH | Windows: `winget install Gyan.FFmpeg` e abra um terminal novo. macOS: `brew install ffmpeg`. Ubuntu e Debian: `sudo apt install ffmpeg` |
| Windows: render muito lento e o antivírus usando muita CPU | O antivírus inspeciona cada quadro que o Chromium grava | Adicione a pasta do projeto às exclusões do Windows Defender (Segurança do Windows → Proteção contra vírus e ameaças → Exclusões) |
| `npm run verificar` acusa WebGL indisponível ou render por software | O Chromium não conseguiu usar a placa de vídeo | Atualize o driver de vídeo. Em notebook com duas placas, no Windows, escolha a placa de alto desempenho para o Chromium em Configurações → Sistema → Tela → Gráficos. Em máquina virtual ou servidor sem GPU, o render funciona, mas fica bem mais lento |
| Linux: o Chromium não abre | Faltam bibliotecas do sistema | Rode `npx playwright install --with-deps chromium` |
| Erro de `espeak` na primeira narração do Kokoro | O pacote embutido não encontrou o espeak-ng | Instale o do sistema: macOS `brew install espeak-ng`; Ubuntu e Debian `sudo apt install espeak-ng`; Windows, o instalador `.msi` em <https://github.com/espeak-ng/espeak-ng/releases> |
| A primeira narração demora muito | O uv está baixando o Python, o Kokoro e o PyTorch (cerca de 1 GB) e o modelo de voz (cerca de 330 MB) | Espere terminar uma vez. Das próximas, é rápido |
| `whisper` ou `mlx_whisper` não encontrado | O reconhecedor de fala não foi instalado | Mac Apple Silicon: `uv tool install mlx-whisper`. Windows, Linux e Mac Intel: `uv tool install openai-whisper`. Abra um terminal novo |

### Agente

| Sintoma | Causa | Solução |
|---|---|---|
| Modelo aberto se perde no meio da tarefa | Contexto curto ou tarefa longa demais | Contexto de 32 mil tokens ou mais; uma etapa por vez |
| Claude Code ignora o Ollama | `ANTHROPIC_API_KEY` está definida | Deixe essa variável vazia (no PowerShell: `$env:ANTHROPIC_API_KEY=""`) |
| As variáveis do Ollama "somem" | Elas valem só para o terminal em que foram definidas | Defina de novo ao abrir outro terminal |
| "Permissão negada" no After Effects | O programa não deixa scripts gravarem arquivos | Ative a opção em *Script e expressões* e reabra |

---

Próximo: [9. Pesquisa de referências →](09-pesquisa-de-referencias.md)
