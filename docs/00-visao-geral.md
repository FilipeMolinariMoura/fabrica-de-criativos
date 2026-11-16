# 0. Visão geral

[Índice](README.md) · Próximo: [1. O método em 10 etapas →](01-metodo.md)

A Fábrica de Criativos é um método, com um kit de código aberto, para produzir anúncios de vídeo vertical a partir de código. O vídeo é um programa. Cada quadro é calculado a partir do tempo, cada cena começa numa palavra da narração, e o resultado pode ser refeito, variado e versionado como qualquer software.

Este capítulo conta como o método chegou à versão 2.0 e explica como o manual está organizado.

## 0.1 O problema

Anúncio para Reels, TikTok e Shorts pede três coisas ao mesmo tempo: volume, variação e rapidez. O editor de timeline atrapalha as três.

- Trocar uma palavra do roteiro obriga a regravar a voz e arrastar todos os cortes de novo.
- Cada variação de cor ou de voz é um projeto novo.
- O que foi feito à mão não se reproduz: ninguém sabe dizer por que a versão de ontem ficou melhor.

## 0.2 A primeira resposta: vídeo como código

A primeira versão do método (1.0 e 1.1) resolveu a parte mecânica.

- **O filme é uma função pura do tempo.** `window.seek(t)` desenha o quadro *t*. O mesmo commit gera o mesmo MP4.
- **As cenas são presas às palavras.** A narração é transcrita com o tempo de cada palavra, e o filme pergunta "quando a palavra *roteiro* é dita?" em vez de guardar segundos. Trocar a voz reposiciona o filme sozinho.
- **O som é sintetizado.** Trilha e efeitos saem de código, alinhados aos mesmos tempos, e a mixagem fecha em −14 LUFS.

Com isso veio um motor 2D em canvas (`lib/cena.js`), dois exemplos (`exemplos/demo` e `exemplos/divulgacao`) e um guia em PDF.

## 0.3 A reprovação

O anúncio do próprio projeto, feito com o motor 2D, passou em todas as conferências automáticas e em quatro rodadas de crítica do próprio construtor, com nota 8 em tudo. O autor assistiu e reprovou com uma palavra: **cru**.

A reprovação virou medição. O que se achou no filme reprovado:

| Medida | Filme 2D reprovado | Filmes de referência |
|---|---|---|
| Área do quadro ocupada por conteúdo | 3% a 21% (mediana perto de 11%) | 60% a 100% |
| Preto mais escuro (percentil 5 de luminância) | 23/255 | 0 a 8/255 |
| Cortes secos em 32 s | 0 | 10 a 40 |
| Movimento de câmera | nenhum | em todos os planos |
| Fontes de luz e sombras projetadas | nenhuma | sempre |
| Tipografia | caixa alta, peso perto de 800 | caixa mista, peso 400 a 600, uma palavra de acento |

As medidas do filme reprovado são contagens sobre 12 quadros. As das referências são leitura visual de miniaturas (veja o [capítulo 9](09-pesquisa-de-referencias.md)).

A lição que organiza a versão 2.0 é esta: **conferência automática prova que o vídeo está correto, e correto ainda pode ser cru.** Faltava ao método um jeito de mirar em "parece caro" e um jeito de impedir que o construtor aprovasse o próprio trabalho.

## 0.4 A segunda resposta: cinco peças novas

| Peça | O que faz | Capítulo |
|---|---|---|
| **Pesquisa de referências** | Lê 17 filmes de lançamento e anúncios de longa duração sem baixar nenhum vídeo, e destila 12 regras com números de partida | [9](09-pesquisa-de-referencias.md) |
| **Look-dev** | Aprova quatro quadros de estilo e um teste de movimento de 4 s antes de construir o filme, com nota honesta de realismo | [10](10-look-dev.md) |
| **3D fotorrealista** | Um pipeline em three.js (`lib/3d/`) que acumula de 192 a 768 amostras por quadro para obter profundidade de campo de lente, desfoque de movimento e sombra suave de verdade | [11](11-3d-fotorrealista.md) |
| **Voz dirigida** | Troca "gerar e torcer" por um processo: amostras de tom, marcações de direção, sementes, filtro às cegas e aprovação de ouvido | [12](12-voz-dirigida.md) |
| **Crítica independente** | Dois críticos que não construíram o filme, um de imagem e um de montagem e som, com medições objetivas e lista de correção numérica | [8](08-qualidade-e-solucao-de-problemas.md) |

O anúncio refeito com essas peças se chama **A bancada** e está em [`exemplos/bancada/`](../exemplos/bancada/). O [capítulo 14](14-estudo-de-caso-a-bancada.md) é o making-of.

## 0.5 O que continua valendo da versão 1

Nada foi jogado fora.

- O contrato do render (filme como função pura do tempo) é o mesmo nos motores 2D e 3D.
- A sincronia pela palavra continua sendo o centro do método. O 3D só passou a usá-la em tudo: cortes, foco, luz, objetos e som.
- O motor 2D continua no kit e continua sendo o caminho mais rápido para anúncios de interface. Os exemplos `demo` e `divulgacao` permanecem como referência dele.
- A trilha gratuita continua completa. O 3D é código aberto e roda nas duas trilhas.

## 0.6 O que este manual não esconde

- **A voz aprovada no anúncio é da trilha paga.** As tentativas gratuitas foram reprovadas de ouvido. O [capítulo 12](12-voz-dirigida.md) conta cada uma.
- **Um critério de qualidade ficou abaixo da meta.** O realismo do mundo claro fechou em 7,5, não em 8. O [capítulo 14](14-estudo-de-caso-a-bancada.md) explica por quê.
- **Os scripts de logo no After Effects não foram testados nesta versão genérica.** Eles seguem em `ae/logo3d/` como ponto de partida, e o filme novo não depende deles.
- **Não há dado de desempenho de anúncio.** O manual não afirma taxa de clique, retenção nem custo por resultado. O que ele mede é o arquivo e o processo.

## 0.7 Como ler

O manual tem três partes.

| Parte | Capítulos | Para quê |
|---|---|---|
| **Base** | 0 a 5 | O método, as ferramentas, as duas trilhas e as skills |
| **Ofício** | 6 a 13 | Uma disciplina por capítulo: motion 2D, roteiro, qualidade, referências, look-dev, 3D, voz e som |
| **Prova** | 14, relatório técnico e referências | O método aplicado, os números e as fontes |

Os caminhos de leitura por objetivo estão no [índice](README.md#caminhos-de-leitura).

## 0.8 Vocabulário

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
| **Trilha** | Conforme o contexto: a música do filme ou um dos dois conjuntos de ferramentas (gratuita e paga) |

---

Próximo: [1. O método em 10 etapas →](01-metodo.md)
