# 0. Visão geral

[Índice](README.md) · Próximo: [1. O método em 10 etapas →](01-metodo.md)

**100% gratuito e de código aberto, do roteiro ao MP4.**

A Fábrica de Criativos é um método, com um kit de código aberto, para produzir anúncios em vídeo vertical a partir de código. Você escreve o roteiro, a IA narra e o código filma: cada quadro é calculado a partir do tempo, cada cena entra numa palavra da narração, e o resultado pode ser refeito, variado e versionado como qualquer software. Tudo roda no seu computador, no Windows, no macOS ou no Linux.

## 0.1 Grátis de ponta a ponta

Cada etapa do método tem um caminho gratuito, com software livre e modelos de IA abertos.

| Etapa | Ferramenta gratuita | Custo |
|---|---|---|
| Agente de IA que escreve o roteiro e as cenas | [Ollama](https://ollama.com) com `qwen3-coder` ou `gpt-oss`, usado pelo Claude Code ou por outro agente | R$ 0 |
| Voz | [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), com vozes em português do Brasil (Apache-2.0, uso comercial liberado) | R$ 0 |
| Tempo de cada palavra | [Whisper](https://github.com/openai/whisper), local | R$ 0 |
| Cenas em 3D fotorrealista | [three.js](https://threejs.org), com o motor incluído no projeto | R$ 0 |
| Trilha e efeitos sonoros | Sintetizados em código, presos às palavras | R$ 0 |
| Render, mixagem e entrega | Chromium + FFmpeg, 1080×1920, 60 fps, −14 LUFS | R$ 0 |
| **Total** | | **R$ 0** |

Nenhuma etapa pede cartão de crédito. Os serviços na nuvem que o kit usa ou sugere (Fish Audio, ElevenLabs, OpenRouter, GitHub) têm conta gratuita, e a [seção 3.11](03-trilha-gratuita.md#311-contas-gratuitas-passo-a-passo) ensina a criar cada uma, clique a clique.

O comando `npm run demo` percorre exatamente esse caminho e entrega um anúncio pronto em poucos minutos. O passo a passo, da instalação ao MP4, está no [capítulo 3](03-trilha-gratuita.md). Se um dia você quiser voz de locutor profissional ou música produzida, troque só essa etapa por um serviço pago: o [capítulo 4](04-trilha-paga.md) mostra como, e o resto do método continua igual.

## 0.2 O problema que ele resolve

Anúncio para Reels, TikTok e Shorts pede três coisas ao mesmo tempo: volume, variação e rapidez. O editor de vídeo tradicional, com linha do tempo, atrapalha as três.

- Trocar uma palavra do roteiro obriga a regravar a voz e arrastar todos os cortes de novo.
- Cada variação de cor ou de voz vira um projeto novo.
- O que foi feito à mão não se reproduz: ninguém sabe dizer por que a versão de ontem ficou melhor.

## 0.3 A ideia central: vídeo como código

- **O filme é uma função pura do tempo.** `window.seek(t)` desenha o quadro *t*. O mesmo código gera sempre o mesmo MP4.
- **As cenas são presas às palavras.** A narração é transcrita com o tempo de cada palavra, e o filme pergunta "quando a palavra *roteiro* é dita?" em vez de guardar segundos. Trocou a voz ou o texto? O filme se reorganiza sozinho.
- **O som é sintetizado.** Trilha e efeitos saem de código, alinhados aos mesmos tempos, e a mixagem fecha em −14 LUFS, o padrão das plataformas.
- **Cada etapa grava um arquivo que a próxima lê.** Dá para trocar só a voz, só a música ou só uma cena, e o resto se ajusta.

## 0.4 Por que o resultado parece caro

Vídeo correto não basta: o anúncio precisa parecer filme de produto. O método mira nisso com cinco peças, cada uma com seu capítulo.

| Peça | O que faz | Capítulo |
|---|---|---|
| **Pesquisa de referências** | Lê 17 filmes de lançamento e anúncios de longa duração sem baixar nenhum vídeo e destila 12 regras com números de partida: ocupação do quadro, preto profundo, cortes secos, câmera sempre em movimento, luz com sombra | [9](09-pesquisa-de-referencias.md) |
| **Look-dev** | Aprova quatro quadros de estilo e um teste de movimento de 4 s antes de construir o filme | [10](10-look-dev.md) |
| **3D fotorrealista** | Um pipeline em three.js (`lib/3d/`) que acumula de 192 a 768 amostras por quadro para obter profundidade de campo de lente, desfoque de movimento e sombra suave de verdade | [11](11-3d-fotorrealista.md) |
| **Voz dirigida** | Um processo para chegar à narração certa: amostras de tom, marcações de direção, sementes, filtro às cegas e aprovação de ouvido | [12](12-voz-dirigida.md) |
| **Crítica independente** | Dois críticos que não construíram o filme, um de imagem e um de montagem e som, com medições objetivas e correções em números | [8](08-qualidade-e-solucao-de-problemas.md) |

O anúncio do próprio projeto, **A bancada**, foi feito com essas peças e está inteiro em [`exemplos/bancada/`](../exemplos/bancada/): roteiro, cenas, câmera, luz, materiais e som. O [capítulo 14](14-estudo-de-caso-a-bancada.md) é o making-of.

## 0.5 Dois motores, o mesmo contrato

| Motor | Use quando | Render |
|---|---|---|
| **2D** (`lib/cena.js`) | O anúncio mostra a interface de um aplicativo e você quer muitas variações rápidas | Poucos minutos |
| **3D** (`lib/3d/`) | O anúncio pede aparência de filme de produto: objetos, luz de estúdio, lente | Cerca de 40 minutos para 35 s a 60 fps num notebook com GPU integrada (Apple M1 Pro) |

Os dois obedecem ao mesmo contrato do render e usam a mesma sincronia pela palavra. No 3D, ela comanda tudo: cortes, foco, luz, objetos e som. Os exemplos `exemplos/demo` e `exemplos/divulgacao` mostram o motor 2D; `exemplos/bancada` mostra o 3D.

## 0.6 O que você precisa para começar

| Item | Requisito |
|---|---|
| Sistema | Windows 10 ou 11, macOS 13 ou mais novo, Ubuntu 22.04 ou Debian 12 e derivados |
| Memória | 8 GB no mínimo, 16 GB recomendado |
| Placa de vídeo | Qualquer uma com WebGL 2; a integrada serve |
| Disco | De 3 a 5 GB para as ferramentas e os modelos de IA |
| Conhecimento | Copiar e colar comandos no terminal. Para criar cenas novas, um agente de IA escreve o código seguindo este manual |

Um instalador por sistema coloca tudo no lugar (Node.js, FFmpeg, uv, o navegador de render e o Whisper), e `npm run verificar` confere o resultado. As versões de referência estão no [capítulo 2](02-ferramentas.md#22-versões-de-referência) e a instalação passo a passo no [capítulo 3](03-trilha-gratuita.md).

## 0.7 Escopo

- O manual mede o arquivo entregue e o processo: resolução, quadros por segundo, loudness, contraste, tempo de render. Desempenho de veiculação (clique, retenção, custo por resultado) depende da campanha e fica fora do escopo.
- Os scripts de logo no After Effects, em `ae/logo3d/`, são um ponto de partida opcional para quem já usa o programa. Os filmes do kit não dependem deles: a marca pode ser modelada em three.js ou no Blender, de graça.

## 0.8 Como ler

O manual tem três partes.

| Parte | Capítulos | Para quê |
|---|---|---|
| **Base** | 0 a 5 | O método, as ferramentas, o caminho gratuito, os serviços opcionais e as skills |
| **Ofício** | 6 a 13 | Uma disciplina por capítulo: motion 2D, roteiro, qualidade, referências, look-dev, 3D, voz e som |
| **Prova** | 14, relatório técnico e referências | O método aplicado, os números e as fontes |

Os caminhos de leitura por objetivo estão no [índice](README.md#caminhos-de-leitura).

## 0.9 Vocabulário

| Termo | Significado aqui |
|---|---|
| **Criativo** | Um anúncio em vídeo, com suas variações |
| **Filme** | A pasta com o código do criativo (`film.js`, `index.html`, `vo.json`, `audio/`) |
| **Plano** | Um trecho contínuo de câmera, entre dois cortes |
| **Corte seco** | Troca de plano de um quadro para o outro, sem fusão |
| **Look-dev** | Desenvolvimento da aparência: quadros de estilo aprovados antes do filme |
| **Mundo** | Um esquema completo de luz, fundo e cor (escuro, claro) |
| **spp** | Amostras por quadro: quantos renders completos da cena são somados num quadro |
| **Tomada** | Uma geração da narração |
| **Semente** | Número que torna uma geração de voz repetível |
| **Filtro às cegas** | Conferência da voz por máquina, sem ver o roteiro |
| **Trilha** | A música do filme. Nos nomes de arquivo dos capítulos 3 e 4, também os dois conjuntos de ferramentas: o gratuito e o dos serviços opcionais |

---

Próximo: [1. O método em 10 etapas →](01-metodo.md)
