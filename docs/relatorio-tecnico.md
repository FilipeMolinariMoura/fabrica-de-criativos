# Fábrica de Criativos: um método aberto e reprodutível para anúncios em vídeo com motion design e inteligência artificial

**Filipe Molinari** · Relatório técnico · Versão 1.0 · Novembro de 2026

---

## Resumo

Anúncios em vídeo vertical para redes sociais exigem volume, variação e rapidez, mas a produção em editores de timeline é manual e difícil de reproduzir. Este relatório apresenta um método de produção em que o vídeo é um programa: cada quadro é uma função pura do tempo, renderizada de forma determinística num navegador sem interface.

O método integra seis componentes:
1. roteiro estruturado em seis blocos;
2. narração sintética com escolha da melhor tomada por transcrição às cegas e análise de entonação;
3. sincronização das cenas pelos tempos de palavra da fala;
4. trilha e efeitos sonoros sintetizados em código, masterizados em -14 LUFS;
5. biblioteca de primitivas de motion design fundamentada em princípios de animação e de aprendizagem multimídia;
6. ciclo de crítica por rubrica sobre folhas de contato.

São descritas duas configurações equivalentes em processo: uma gratuita, com modelos de pesos abertos (Qwen3-Coder via Ollama, Kokoro-82M), e outra paga, com serviços comerciais (Claude, ElevenLabs, After Effects). O resultado é um kit de código aberto, sob licença MIT, que permite variar cor, estilo e voz de um criativo com um comando, mantendo a sincronia.

**Palavras-chave:** motion design; publicidade digital; síntese de fala; render procedural; agentes de IA; modelos de pesos abertos.

## Abstract

Short-form vertical video ads demand volume, variation and speed, yet timeline-editor production is manual and hard to reproduce. This report presents a production method in which the video is a program: each frame is a pure function of time, rendered deterministically in a headless browser.

The method combines six components:
1. a six-block script structure;
2. synthetic narration with blind-transcription take selection and intonation analysis;
3. scene timing driven by spoken word timestamps;
4. code-synthesised music and sound effects mastered to -14 LUFS;
5. a motion-design primitive library grounded in animation and multimedia-learning principles;
6. a rubric-based critique loop over contact sheets.

Two process-equivalent configurations are described: a free one built on open-weight models (Qwen3-Coder via Ollama, Kokoro-82M) and a paid one built on commercial services (Claude, ElevenLabs, After Effects). The outcome is an MIT-licensed open-source kit in which colour, style and voice variants of an ad are produced with a single command while preserving synchronisation.

**Keywords:** motion design; digital advertising; text-to-speech; procedural rendering; AI agents; open-weight models.

---

## 1 Introdução

Plataformas como Instagram Reels e TikTok favorecem vídeos verticais curtos, consumidos em rolagem rápida. Nesse contexto, o anúncio tem cerca de 1,5 segundo para prender a atenção e precisa de várias versões para teste A/B. A produção tradicional, em editores de timeline, cria três gargalos:

- **reprodutibilidade:** um ajuste de texto exige retrabalho manual;
- **variação:** cada versão é um projeto novo;
- **sincronia:** trocar a narração desalinha cenas e efeitos.

A hipótese deste trabalho é que tratar o vídeo como código resolve os três gargalos sem perder qualidade visual, se a camada de código incorporar princípios estabelecidos de animação e de comunicação multimídia.

## 2 Fundamentação

### 2.1 Princípios de animação
Os princípios de Thomas e Johnston (1981), formalizados para a computação gráfica por Lasseter (1987), estabelecem que movimento crível exige aceleração e desaceleração, antecipação e continuidade de ação. No método, isso se traduz em molas criticamente amortecidas calculadas em forma fechada, de modo que a posição dependa apenas de *t*, e em zoom em espaço logarítmico.

### 2.2 Aprendizagem multimídia e carga cognitiva
A teoria de Mayer (2009) prevê que o entendimento melhora quando palavra falada e imagem coincidem no tempo (contiguidade temporal), quando o elemento relevante é destacado (sinalização) e quando se evita duplicar a narração em texto (redundância). A teoria da carga cognitiva (Sweller, 1988) reforça a limitação a uma ideia por cena. O método operacionaliza esses princípios ancorando cada cena a uma palavra da narração.

### 2.3 Síntese e verificação de fala
Modelos neurais de síntese de fala atingem qualidade de locutor, mas erram a sílaba tônica e a entonação de forma imprevisível. Para detectar esses erros, o método usa o reconhecedor Whisper (Radford et al., 2023) às cegas: uma palavra que o reconhecedor não recupera provavelmente também não será compreendida pelo ouvinte. Complementa a verificação a medida da frequência fundamental no fim da frase, com Praat/Parselmouth (Boersma; Weenink; Jadoul et al., 2018).

### 2.4 Loudness
A normalização segue ITU-R BS.1770-4 e EBU R 128, com alvo de -14 LUFS integrados e pico verdadeiro de -1 dBTP, padrão das plataformas de streaming e redes sociais.

## 3 Método

O processo tem oito etapas encadeadas por arquivos ([01-metodo.md](01-metodo.md)): briefing, roteiro, voz, narração no tempo, trilha e efeitos, filme, crítica, render e variações. Cada etapa tem um portão de qualidade explícito. Dois deles merecem destaque:

- **Aprovação do roteiro antes da voz:** evita regenerar narração, tempos e render.
- **Piloto antes da escala:** um criativo completo é aprovado e serve de modelo para os demais, produzidos em paralelo por agentes independentes.

### 3.1 Seleção de tomada
Para cada roteiro geram-se *n* tomadas (tipicamente *n* = 3). A pontuação combina, em ordem lexicográfica:
1. fidelidade, que é a proporção de palavras do roteiro recuperadas na transcrição às cegas;
2. adequação dos finais de frase, isto é, contorno descendente em afirmações e ascendente em perguntas;
3. expressividade, medida pelo desvio do F0 em semitons, limitado superiormente.

### 3.2 Sincronização pela fala
A narração escolhida é alinhada palavra a palavra, e o filme consulta os tempos por funções como `wt(VO, palavra)`. Trocar a voz atualiza todos os eventos visuais, sonoros e de trilha sem editar o filme.

### 3.3 Determinismo
O filme é uma função pura do tempo. O renderizador (Playwright + Chromium) solicita quadros fora de ordem e em paralelo, e o ruído usa semente fixa. O mesmo código produz, portanto, o mesmo vídeo, o que permite versionar criativos em Git.

## 4 Arquitetura

```
roteiros.json ─▶ voz (ElevenLabs | Kokoro) ─▶ voz_avaliar ─▶ vo_montar ─▶ vo.json
                                                                         │
trilha.json ─▶ trilha.py ─▶ music.wav ─┐                                 ▼
film.js (lib/cena.js + motion.js) ─▶ HITS ─▶ sfx.mjs ─▶ mix.mjs ─▶ mix.wav
        │                                                         │
        └────────────▶ render.mjs (Playwright) ─▶ quadros ─▶ ffmpeg ─▶ MP4 1080×1920 @60
```

Componentes de terceiros: motor `motion-reel` (MIT), Playwright, ffmpeg, three.js, Whisper, Kokoro.

## 5 Avaliação

O método foi aplicado numa produção comercial real, cujos materiais não são publicados por confidencialidade. A produção resultou em:
- 8 criativos de 20 a 30 segundos e 18 variações (cor, estilo e voz), a partir de um piloto;
- todos os finais entregues em 1080×1920, 60 fps, masterizados para -14 LUFS.

Este relatório não apresenta métricas de veiculação, que ficam como trabalho futuro.

Depois de montado o kit, o tempo por criativo ficou entre uma e duas horas, dominado pela revisão humana.

Na comparação qualitativa entre as trilhas, a narração paga foi preferida pelo cliente pela entonação de locutor, e a gratuita mostrou-se adequada para rascunhos e aprovação de roteiro. A trilha gratuita exigiu decompor as tarefas do agente em passos menores.

## 6 Limitações e considerações éticas

- **Licenças:** planos gratuitos de serviços de voz podem vedar uso comercial, e pesos de alguns modelos abertos (como o F5-TTS) são não comerciais. O kit documenta a licença de cada componente.
- **Voz sintética:** a veiculação deve seguir as políticas de conteúdo gerado por IA de cada plataforma, e clonar a voz de terceiros exige consentimento.
- **Veracidade:** o método proíbe telas inventadas e números sem fonte.
- **Dados pessoais:** materiais de cliente não devem entrar no repositório público. O `.gitignore` exclui áudio, vídeo e chaves.
- **Generalização:** a avaliação vem de um único estudo de caso. Um estudo controlado de desempenho dos anúncios (CTR, retenção) fica como trabalho futuro.

## 7 Conclusão

Tratar o anúncio em vídeo como programa, com cenas ancoradas na fala, torna a produção reprodutível, variável e sincronizada por construção. A fundamentação em princípios de animação e de aprendizagem multimídia orienta a biblioteca de primitivas, e a verificação às cegas da narração reduz erros de pronúncia antes da revisão humana. A existência de uma trilha integralmente gratuita torna o método acessível para ensino e pesquisa.

Trabalhos futuros:
- medir o efeito das técnicas sobre retenção e conversão em testes A/B;
- ampliar a avaliação de vozes abertas em português;
- avaliar a geração automática de roteiros com modelos abertos.

## Referências

Ver [referencias.md](referencias.md).
