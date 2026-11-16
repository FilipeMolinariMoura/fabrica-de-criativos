# Changelog

Todas as mudanças relevantes deste projeto ficam registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o projeto adota o [versionamento semântico](https://semver.org/lang/pt-BR/).

## [2.0.1] — 2026-11-16

### Adicionado

- `scripts/trilha_eleven.py`: trilha gerada na ElevenLabs Music a partir de um plano de seções (`musica.json`) e alinhada à fala, medindo no áudio a virada e o impacto final.
- `exemplos/bancada/musica.json`: o plano de composição da trilha do anúncio.

### Alterado

- O vídeo de A bancada passa a usar a trilha gerada por IA (estilo trailer), escolhida de ouvido pelo autor entre três opções. A imagem é a mesma: só o áudio foi refeito.
- Capítulo 13 da documentação: seção sobre a alternativa paga de música e o que ela não resolve.

## [2.0.0] — 2026-11-16

A versão 2 responde a uma reprovação. O anúncio do próprio projeto, feito com o motor 2D da versão 1, passou em todas as conferências e foi recusado pelo autor como "cru". O método ganhou as peças que faltavam para mirar em qualidade percebida, e para verificá-la.

### Adicionado

- **Motor 3D fotorrealista** em `lib/3d/` (three.js, WebGL): profundidade de campo de lente fina, desfoque de movimento e sombra de luz de área por acumulação de 192 a 768 amostras por quadro; estúdio com HDRI e softboxes posicionados por cálculo; chão com reflexo renderizado; materiais físicos; bloom só de emissivos; aparelhos genéricos modelados em código.
- **Renderizador 3D** `lib/3d/render.mjs`: metadados de tempo e som (`--meta`), folha de contato (`--contact`), contraste medido das legendas (`--contrast`), quadros avulsos (`--at`), trecho em MP4 (`--range`) e master sem acabamento (`--limpo`).
- **Filme novo** `exemplos/bancada/` ("A bancada"): 16 planos em 35 s, cortes secos, três mundos de luz, cada corte e cada evento presos à palavra falada.
- **Voz dirigida** `scripts/voz_dirigida.py` (ElevenLabs): amostras de tom, bloco com marcações de direção e sementes, modo diálogo e junção de vozes. Campos `falas_dirigidas` e `vozes` no roteiro.
- **`scripts/finalizar3d.sh`** e os atalhos `make contato3d`, `contraste3d`, `audio3d`, `previa3d`, `final3d`, `voz-amostras` e `voz-dirigida`.
- **Duas etapas novas no método**: pesquisa de referências (etapa 2) e look-dev (etapa 6). O método passa de 8 para 10 etapas.
- **Crítica independente**: dois críticos que não construíram o filme, um de imagem e um de montagem e som, com medições objetivas e correções numéricas. Rubrica ampliada.
- **Documentação**: manual renumerado de 0 a 14, com capítulos novos sobre pesquisa de referências, look-dev, 3D fotorrealista, voz dirigida, som e o estudo de caso; índice com caminhos de leitura; relatório técnico na versão 2; bibliografia ampliada.
- **Modelos novos** em `templates/`: quadro de referências e quadros de estilo.
- **Padrão de repositório**: código de conduta, política de segurança, formulários de issue e modelo de pull request.

### Alterado

- **A crítica do construtor deixa de ser aprovação.** O critério de saída passa a ser "todos os critérios ≥ 8 pela crítica independente, ou exceção registrada por escrito".
- **A etapa de voz muda de ordem**: o tom é aprovado em amostras curtas antes de gerar o roteiro inteiro. A conferência automática passa a ser descrita como filtro, e a aprovação é de ouvido.
- **Roteiro do anúncio do projeto** reescrito no meio (de 84 para 78 palavras); o gancho ficou.
- **Mixagem**: o sidechain da música passa a ser configurável (`--duck-threshold`, `--duck-ratio`, `--duck-attack`, `--duck-release`, `--music-db`), por uma alteração local de uma linha em `vendor/motion-reel` (documentada em `vendor/README.md`).
- `scripts/voz_por_frase.py` aceita o motor ElevenLabs além da Fish Audio.
- `scripts/voz_avaliar.py` termina avisando que a nota não mede naturalidade nem emoção.
- README, guia em PDF e `CITATION.cff` reescritos para a versão 2.
- O campo `falas_v3` do roteiro dá lugar a `falas_dirigidas` (o antigo continua aceito).

### Lições

O que esta versão aprendeu, registrado para não ser esquecido.

- **Correto não é pronto.** O filme 2D reprovado tinha nota 8 em toda a rubrica do construtor. Medido depois: conteúdo em 3% a 21% do quadro, preto em 23/255, zero corte seco em 32 s.
- **O construtor não aprova o próprio trabalho.** Na primeira prévia do filme novo, os críticos independentes deram realismo 6 e desenho de som 5, com listas de correção que três rodadas do construtor não tinham produzido.
- **O filtro de voz não mede emoção.** Kokoro, Fish Audio frase a frase e ElevenLabs em modo diálogo passaram na conferência automática e foram reprovados de ouvido. A voz aprovada foi a ElevenLabs com direção, e ela é da trilha paga.
- **Loudness no padrão não quer dizer som audível.** A −14 LUFS, a música estava 14,8 LU abaixo da voz nos intervalos e cerca de 25 dos 44 efeitos não se ouviam.
- **O tempo da transcrição adianta.** O início de palavra do Whisper ficou de 50 a 235 ms antes do início audível. Impactos passaram a usar o início medido no áudio.
- **Contraste se mede.** Legendas que pareciam legíveis mediram de 1,0:1 a 3,8:1 antes da correção.
- **Um critério ficou abaixo da meta.** O realismo do mundo claro fechou em 7,5: o pipeline não calcula luz rebatida.

### Limites conhecidos

- O motor 3D só foi testado em macOS (Apple Silicon). O renderizador pede o backend gráfico Metal.
- Os scripts de logo em `ae/logo3d/` não foram testados nesta versão.
- Não há dados de desempenho de veiculação.

## [1.1.0] — 2026-11-16

### Adicionado

- Criativo de divulgação do próprio projeto (`exemplos/divulgacao`), feito com o kit: narração em diálogo, 60 fps, −14 LUFS.
- Voz: `voz_fish.mjs` (Fish Audio, modelo gratuito), `voz_por_frase.py` (entonação controlada frase a frase) e `voz_dialogo.py` (diálogo entre vozes).
- `lib/cena.js`: `vidro()` com desfoque real do fundo, fundo com campos de luz (`bgCampos`), `wt` com grafias alternativas, contraste automático do texto no tema escuro.

### Alterado

- `voz_avaliar.py`: "60" e "sessenta" contam como a mesma palavra.

## [1.0.0] — 2026-11-16

### Adicionado

- Método em 8 etapas documentado (`docs/`), com relatório técnico e referências em ABNT.
- Duas trilhas: gratuita (Ollama com modelos abertos, Kokoro, three.js ou Blender) e paga (Claude, ElevenLabs, After Effects).
- Biblioteca `lib/cena.js` de primitivas de motion design e harness `lib/motion.js`.
- Scripts de voz, avaliação às cegas, montagem da narração, trilha, variações, finalização e conferência de entrega.
- Automação do logo 3D no After Effects (`ae/logo3d/`).
- Exemplo completo (`exemplos/demo/`) e guia em PDF (`dist/`).
- Motor `motion-reel` 1.3.0 incluído em `vendor/` (MIT).

[2.0.0]: https://github.com/FilipeMolinariMoura/fabrica-de-criativos/releases/tag/v2.0.0
[1.1.0]: https://github.com/FilipeMolinariMoura/fabrica-de-criativos/releases/tag/v1.1.0
[1.0.0]: https://github.com/FilipeMolinariMoura/fabrica-de-criativos/releases/tag/v1.0.0
