# Como contribuir

Obrigado por querer melhorar a Fábrica de Criativos! O projeto é 100% gratuito e de código aberto, e cresce com cada filme, cena, voz e correção que a comunidade traz. Este guia diz o que cabe no projeto, quais regras o código precisa respeitar e como propor a mudança.

Ao participar, você aceita o [código de conduta](CODE_OF_CONDUCT.md).

## O que é bem-vindo

| Contribuição | Onde entra |
|---|---|
| Um filme de exemplo | `exemplos/<nome>/` |
| Uma primitiva de motion 2D | `lib/cena.js` |
| Um objeto, material ou recurso do motor 3D | `lib/3d/` |
| Um motor de voz, sobretudo aberto e em português | `scripts/voz_<motor>.*` |
| Correção de erro, de documentação ou de tradução | onde o erro estiver |
| Suporte e testes em Windows, macOS e Linux | `instalar/`, `fabrica.mjs` e [`docs/08`](docs/08-qualidade-e-solucao-de-problemas.md) |
| Uma ideia das [issues abertas](https://github.com/FilipeMolinariMoura/fabrica-de-criativos/issues) | conforme o item |

Para mudança grande, abra uma issue antes e descreva a proposta. Assim a conversa sobre o desenho acontece antes do código.

## A regra que não tem exceção: nunca material de cliente

Este repositório é público. **Nada** que pertença a um trabalho para terceiros entra aqui:

- nenhum logotipo, nome, tela, texto ou roteiro de cliente;
- nenhum áudio ou vídeo gerado para um trabalho;
- nenhuma chave de API, nem em exemplo, nem em captura de tela;
- nenhum caminho de pasta do seu computador.

Os exemplos anunciam um aplicativo fictício ou o próprio projeto. Se o seu filme nasceu num trabalho real, refaça-o com conteúdo fictício antes de propor. O `.gitignore` já exclui `.env`, `voz/`, `entrega/`, áudio e vídeo; não force a inclusão.

## O contrato do render

Todo filme, 2D ou 3D, obedece a três regras. Um pull request que quebre uma delas não entra.

1. **O filme é função pura do tempo.** `window.seek(t)` produz sempre o mesmo quadro para o mesmo *t*.
2. **Nada de relógio, nada de acaso, nada de memória.** Sem `setTimeout`, `requestAnimationFrame`, `Date.now`, `Math.random` ou estado guardado entre quadros. Para ruído, use função com semente.
3. **Os quadros podem ser pedidos fora de ordem.** No motor 3D, `update(t)` é chamada muitas vezes por quadro, em instantes diferentes.

E uma quarta, do método: **todo corte e todo evento saem de uma palavra do `vo.json`**, nunca de segundos escritos à mão.

## Como adicionar um filme

1. Copie o exemplo mais próximo: `exemplos/demo` (2D) ou `exemplos/bancada` (3D).
2. Use conteúdo fictício ou do próprio projeto.
3. Mantenha no repositório: `index.html`, `film.js`, `film.json`, `roteiro.json`, `vo.json`, `trilha.json`, e uma pasta `preview/` com GIF curto, pôster e folha de contato.
4. **Não** inclua `audio/` nem MP4. Descreva em `narracao.json` como a voz foi feita, para outra pessoa conseguir refazer.
5. Escreva um `README.md` do filme com a lista de planos, os comandos para rodar (`npm run contato`, `previa`, `final`) e as notas de acabamento.
6. Registre as rodadas de revisão em `docs/critica.md` do filme, a partir de [`templates/critica.md`](templates/critica.md).
7. Materiais de terceiros: só com licença aberta (CC0, OFL, MIT ou equivalente), listados com origem e licença.

## Como adicionar uma primitiva 2D

1. A função vai em `lib/cena.js`, recebe o contexto do canvas e o tempo, e não guarda estado.
2. Nome em português, curto, no padrão das que já existem.
3. Um comentário de uma linha dizendo o que desenha e quais parâmetros aceita.
4. Use a primitiva em um dos exemplos, ou mostre um quadro no pull request.
5. Acrescente uma linha na tabela de receitas de [`docs/06-tecnicas-de-motion.md`](docs/06-tecnicas-de-motion.md), com o erro comum que ela evita.

## Como adicionar ao motor 3D

1. Objetos são modelados em código, em centímetros, **sem marca e sem modelo de terceiros**.
2. Toda aresta tem raio. Use `slab()` de `lib/3d/models.js`.
3. Superfície polida recebe brilho só do ambiente (`envSpecOnly`), para não imprimir um ponto por amostra.
4. O que emite luz e deve gerar bloom vai na camada 1 (`mesh.layers.enable(1)`).
5. Meça antes e depois: tempo por quadro a 192 amostras, com leitura de pixel no fim do quadro.
6. Se descobrir uma boa prática nova, acrescente uma linha em [`docs/11-3d-fotorrealista.md`](docs/11-3d-fotorrealista.md#116-armadilhas-conhecidas-e-como-evitar).

## Como adicionar um motor de voz

1. Um script `scripts/voz_<motor>.py` ou `.mjs`, com o modo de uso no cabeçalho.
2. **A mesma saída dos outros motores**, para o resto do método não mudar:
   - `voz/<id>/texto.txt` com o texto limpo;
   - `voz/<id>/<rótulo>-<n>.wav` (e `.mp3`, se houver).
3. A chave, se houver, vem de variável de ambiente ou do `.env`. Acrescente o nome dela em `.env.example`, sem valor.
4. Registre os caracteres gastos em `voz/caracteres.log`, se o serviço cobrar por caractere.
5. Declare a **licença de uso comercial** do modelo ou do serviço no cabeçalho do script e em [`docs/02-ferramentas.md`](docs/02-ferramentas.md).
6. Descreva o motor em [`docs/12-voz-dirigida.md`](docs/12-voz-dirigida.md): em que ele se destaca, quando usá-lo e como dirigi-lo.

## Portões de qualidade

Antes de abrir o pull request:

- [ ] `npm run check` passa (sintaxe de JavaScript, Python, shell e JSON; é o mesmo que a CI roda; no macOS e no Linux, `make sintaxe` faz o mesmo)
- [ ] Nenhum material de cliente, chave, áudio, vídeo ou caminho local
- [ ] Contrato do render respeitado
- [ ] Para filmes: folha de contato olhada (`npm run contato -- <pasta>`), contraste das legendas ≥ 4,5:1, e `npm run checar -- <arquivo.mp4>` passando no MP4 que você gerou localmente
- [ ] Para filmes: a crítica foi feita por alguém, pessoa ou agente, que **não** construiu o filme
- [ ] Números na documentação marcados como medidos ou estimados
- [ ] Comandos da documentação conferidos contra o `package.json`, o `fabrica.mjs`, o `Makefile` e os scripts, e testados no seu sistema
- [ ] Documentação em português do Brasil, com acentuação correta; citações em ABNT em [`docs/referencias.md`](docs/referencias.md)

`npm run check` confere o código. `npm run checar` confere os vídeos entregues. São coisas diferentes.

## Fluxo

1. Faça um fork e crie um ramo a partir de `main`: `feat/…`, `fix/…` ou `docs/…`.
2. Commits pequenos, com mensagem no imperativo dizendo o que muda e por quê.
3. Abra o pull request preenchendo o modelo. Se a mudança altera imagem, inclua um quadro antes e depois.
4. Acrescente uma linha em `CHANGELOG.md`, na seção da próxima versão.

## Estilo

- **Texto:** frases curtas, voz ativa, tom de quem ensina. Prefira recomendações ("faça X porque Y") e marque o que foi medido. Comandos na forma `npm run …`, que funciona nos três sistemas.
- **Código:** siga o estilo do arquivo que você está mexendo. Comentários explicam o porquê.
- **Nomes:** em português para o que o usuário vê (scripts, opções, documentação).

## Licença das contribuições

Ao contribuir, você concorda em licenciar o código sob [MIT](LICENSE) e a documentação sob [CC BY 4.0](LICENSE-docs.md).
