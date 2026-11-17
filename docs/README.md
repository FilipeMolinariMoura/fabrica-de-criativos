# Documentação da Fábrica de Criativos

**100% gratuito e de código aberto, do roteiro ao MP4.**

Este é o manual completo do método, versão 2.0: 15 capítulos numerados, um relatório técnico e a bibliografia. Cada capítulo responde a uma pergunta e termina apontando o próximo. Tudo o que ele ensina roda no seu computador, no Windows, no macOS ou no Linux, sem assinatura e sem marca d'água.

| Etapa | Ferramenta gratuita | Custo |
|---|---|---|
| Agente de IA que escreve o roteiro e as cenas | [Ollama](https://ollama.com) com `qwen3-coder` ou `gpt-oss` | R$ 0 |
| Voz | [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0, uso comercial liberado) | R$ 0 |
| Tempo de cada palavra | [Whisper](https://github.com/openai/whisper) | R$ 0 |
| Cenas em 3D fotorrealista | [three.js](https://threejs.org), motor incluído | R$ 0 |
| Trilha e efeitos | Sintetizados em código, presos às palavras | R$ 0 |
| Render, mixagem e entrega | Chromium + FFmpeg, 60 fps, −14 LUFS | R$ 0 |
| **Total** | | **R$ 0** |

O passo a passo completo desse caminho está no [capítulo 3](03-trilha-gratuita.md), com a criação de cada conta gratuita (Fish Audio, ElevenLabs, OpenRouter, GitHub) na [seção 3.11](03-trilha-gratuita.md#311-contas-gratuitas-passo-a-passo). Serviços pagos, como voz de locutor ou música produzida, são opcionais e estão no [capítulo 4](04-trilha-paga.md).

Se você tem pouco tempo, escolha um dos quatro caminhos abaixo e leia só o que ele pede.

## Caminhos de leitura

### Quero só rodar

Tempo: 20 minutos, mais o tempo de render.

1. [Começar em 10 minutos, no README](../README.md#-começar-em-10-minutos): baixar, rodar o instalador do seu sistema, `npm run verificar` e `npm run demo`.
2. [3. O caminho gratuito](03-trilha-gratuita.md): a instalação passo a passo no Windows, no macOS e no Linux, as [contas gratuitas](03-trilha-gratuita.md#311-contas-gratuitas-passo-a-passo) e o anúncio inteiro sem gastar nada.
3. [14. Making-of: A bancada](14-estudo-de-caso-a-bancada.md), seção "Como reproduzir".
4. [8. Qualidade e solução de problemas](08-qualidade-e-solucao-de-problemas.md), se alguma coisa travar.

### Quero entender o método

Tempo: uma tarde.

1. [0. Visão geral](00-visao-geral.md): o que o projeto faz e por que funciona.
2. [1. O método em 10 etapas](01-metodo.md): entradas, saídas e portões de qualidade.
3. [7. Roteiro e copy](07-roteiro-e-copy.md) e [9. Pesquisa de referências](09-pesquisa-de-referencias.md).
4. [12. Voz dirigida](12-voz-dirigida.md) e [13. Som](13-som.md).
5. [8. Qualidade](08-qualidade-e-solucao-de-problemas.md): a rubrica e a crítica independente.
6. [14. Making-of](14-estudo-de-caso-a-bancada.md): o método aplicado do começo ao fim.

### Quero o 3D

Tempo: duas horas de leitura e um render.

1. [9. Pesquisa de referências](09-pesquisa-de-referencias.md): as 12 regras do visual de filme de produto.
2. [10. Look-dev](10-look-dev.md): quadros de estilo antes de construir.
3. [11. 3D fotorrealista](11-3d-fotorrealista.md): o pipeline, os materiais, a luz e as boas práticas.
4. [`lib/3d/`](../lib/3d/) e [`exemplos/bancada/`](../exemplos/bancada/): o código.
5. [14. Making-of](14-estudo-de-caso-a-bancada.md): plano a plano.

### Sou estudante ou pesquisador

1. [Relatório técnico](relatorio-tecnico.md): resumo, fundamentação, método, arquitetura, avaliação, limitações e ética.
2. [Referências](referencias.md): bibliografia em ABNT.
3. [8. Qualidade](08-qualidade-e-solucao-de-problemas.md) e [14. Making-of](14-estudo-de-caso-a-bancada.md): as medições de entrega.
4. [`CITATION.cff`](../CITATION.cff) e a seção ["Como citar" do README](../README.md#-como-citar).

## Índice

| # | Capítulo | Pergunta que responde |
|---|---|---|
| 0 | [Visão geral](00-visao-geral.md) | O que é isto e por que funciona? |
| 1 | [O método em 10 etapas](01-metodo.md) | O que entra, o que sai e o que precisa passar em cada etapa? |
| 2 | [Ferramentas](02-ferramentas.md) | Que peças compõem o kit, em que versão e com que licença? |
| 3 | [O caminho gratuito](03-trilha-gratuita.md) | Como instalar tudo, criar as contas gratuitas e produzir do roteiro ao MP4 sem pagar nada? |
| 4 | [Serviços opcionais](04-trilha-paga.md) | O que um serviço pago acrescenta, se você quiser ir além? |
| 5 | [Skills](05-skills.md) | Que skills e plugins o agente usa em cada etapa? |
| 6 | [Técnicas de motion (motor 2D)](06-tecnicas-de-motion.md) | Como funciona o motor 2D e quando usá-lo? |
| 7 | [Roteiro e copy](07-roteiro-e-copy.md) | Como escrever 30 segundos que seguram a atenção? |
| 8 | [Qualidade e solução de problemas](08-qualidade-e-solucao-de-problemas.md) | Como saber que está pronto, e como resolver cada sintoma? |
| 9 | [Pesquisa de referências](09-pesquisa-de-referencias.md) | Como descobrir, com método, por que um vídeo parece caro? |
| 10 | [Look-dev](10-look-dev.md) | Como aprovar a aparência antes de construir o filme? |
| 11 | [3D fotorrealista](11-3d-fotorrealista.md) | Como o navegador produz imagem de estúdio? |
| 12 | [Voz dirigida](12-voz-dirigida.md) | Como chegar a uma narração aprovada de ouvido? |
| 13 | [Som](13-som.md) | Como fazer trilha, efeitos e mixagem que se ouvem? |
| 14 | [Making-of: A bancada](14-estudo-de-caso-a-bancada.md) | Como foi feito o anúncio do próprio projeto? |
| — | [Relatório técnico](relatorio-tecnico.md) | A versão em formato de artigo |
| — | [Referências](referencias.md) | Bibliografia em ABNT |

O guia em PDF ([`dist/Fabrica-de-Criativos.pdf`](../dist/Fabrica-de-Criativos.pdf)) é a versão diagramada e resumida deste manual.

## Convenções

- **Comandos** partem da pasta do projeto e usam a forma `npm run …`, que é igual no Windows, no macOS e no Linux. No macOS e no Linux, os mesmos atalhos também existem como `make …` (rode `make ajuda` para ver a lista).
- **Medido** quer dizer que o número saiu de um instrumento: `ffprobe`, medidor de loudness, contagem de pixels, cronômetro do render.
- **Estimado** quer dizer leitura visual ou conta de cabeça. Todo número estimado vem marcado.
- Nenhum material de cliente aparece aqui. Os exemplos anunciam um aplicativo fictício ou o próprio projeto.
