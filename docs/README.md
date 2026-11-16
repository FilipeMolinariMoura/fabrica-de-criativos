# Documentação da Fábrica de Criativos

Este é o manual completo do método, versão 2.0. São 15 capítulos numerados, um relatório técnico e a bibliografia. Cada capítulo responde a uma pergunta e termina apontando o próximo.

Se você tem pouco tempo, escolha um dos quatro caminhos abaixo e leia só o que ele pede.

## Caminhos de leitura

### Quero só rodar

Tempo: 20 minutos, mais o tempo de render.

1. [Começo rápido no README](../README.md#começo-rápido): clonar, `make setup`, `make demo`.
2. [3. Trilha gratuita](03-trilha-gratuita.md): o que instalar para não pagar nada.
3. [14. Estudo de caso: A bancada](14-estudo-de-caso-a-bancada.md), seção "Como reproduzir".
4. [8. Qualidade e solução de problemas](08-qualidade-e-solucao-de-problemas.md), quando algo falhar.

### Quero entender o método

Tempo: uma tarde.

1. [0. Visão geral](00-visao-geral.md): a história e o mapa.
2. [1. O método em 10 etapas](01-metodo.md): entradas, saídas e portões de qualidade.
3. [7. Roteiro e copy](07-roteiro-e-copy.md) e [9. Pesquisa de referências](09-pesquisa-de-referencias.md).
4. [12. Voz dirigida](12-voz-dirigida.md) e [13. Som](13-som.md).
5. [8. Qualidade](08-qualidade-e-solucao-de-problemas.md): a rubrica e os críticos independentes.
6. [14. Estudo de caso](14-estudo-de-caso-a-bancada.md): o método aplicado do começo ao fim.

### Quero o 3D

Tempo: duas horas de leitura e um render.

1. [9. Pesquisa de referências](09-pesquisa-de-referencias.md): as 12 regras do visual caro.
2. [10. Look-dev](10-look-dev.md): quadros de estilo antes de construir.
3. [11. 3D fotorrealista](11-3d-fotorrealista.md): o pipeline, os materiais, a luz e os tropeços.
4. [`lib/3d/`](../lib/3d/) e [`exemplos/bancada/`](../exemplos/bancada/): o código.
5. [14. Estudo de caso](14-estudo-de-caso-a-bancada.md): plano a plano.

### Sou estudante ou pesquisador

1. [Relatório técnico](relatorio-tecnico.md): resumo, fundamentação, método, arquitetura, avaliação, limitações e ética.
2. [Referências](referencias.md): bibliografia em ABNT.
3. [8. Qualidade](08-qualidade-e-solucao-de-problemas.md) e [14. Estudo de caso](14-estudo-de-caso-a-bancada.md): os dados de avaliação.
4. [`CITATION.cff`](../CITATION.cff) e a seção ["Como citar" do README](../README.md#como-citar).

## Índice

| # | Capítulo | Pergunta que responde |
|---|---|---|
| 0 | [Visão geral](00-visao-geral.md) | O que é isto, de onde veio e como ler? |
| 1 | [O método em 10 etapas](01-metodo.md) | O que entra, o que sai e o que precisa passar em cada etapa? |
| 2 | [Ferramentas](02-ferramentas.md) | Que peças compõem o kit, com que licença, e o que ficou de fora? |
| 3 | [Trilha gratuita](03-trilha-gratuita.md) | Como produzir sem pagar nenhum serviço? |
| 4 | [Trilha paga](04-trilha-paga.md) | O que vale pagar e quanto custou de verdade? |
| 5 | [Skills](05-skills.md) | Que skills e plugins o agente usa em cada etapa? |
| 6 | [Técnicas de motion (motor 2D)](06-tecnicas-de-motion.md) | Como funciona o motor 2D e quando ele basta? |
| 7 | [Roteiro e copy](07-roteiro-e-copy.md) | Como escrever 30 segundos que seguram a atenção? |
| 8 | [Qualidade e solução de problemas](08-qualidade-e-solucao-de-problemas.md) | Como saber que está pronto, e o que fazer quando quebra? |
| 9 | [Pesquisa de referências](09-pesquisa-de-referencias.md) | Como descobrir, com método, por que um vídeo parece caro? |
| 10 | [Look-dev](10-look-dev.md) | Como aprovar a aparência antes de construir o filme? |
| 11 | [3D fotorrealista](11-3d-fotorrealista.md) | Como o navegador produz imagem de estúdio? |
| 12 | [Voz dirigida](12-voz-dirigida.md) | Como chegar a uma narração aprovada de ouvido? |
| 13 | [Som](13-som.md) | Como fazer trilha, efeitos e mixagem que se ouvem? |
| 14 | [Estudo de caso: A bancada](14-estudo-de-caso-a-bancada.md) | Como foi feito o anúncio do próprio projeto? |
| — | [Relatório técnico](relatorio-tecnico.md) | A versão em formato de artigo |
| — | [Referências](referencias.md) | Bibliografia em ABNT |

O guia em PDF ([`dist/Fabrica-de-Criativos.pdf`](../dist/Fabrica-de-Criativos.pdf)) é a versão diagramada e resumida deste manual.

## Convenções

- **Medido** quer dizer que o número saiu de um instrumento: `ffprobe`, medidor de loudness, contagem de pixels, cronômetro do render.
- **Estimado** quer dizer leitura visual ou conta de cabeça. Todo número estimado vem marcado.
- **Reprovado** quer dizer que uma pessoa ouviu ou viu e disse não. O manual registra as reprovações, porque é delas que saíram as regras.
- Comandos partem da raiz do repositório.
- Nenhum material de cliente aparece aqui. Os exemplos anunciam um aplicativo fictício ou o próprio projeto.
