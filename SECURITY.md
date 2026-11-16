# Política de segurança

A Fábrica de Criativos roda na sua máquina. Não há servidor nem dado de usuário mantido pelo projeto. Os riscos reais são três: **chaves de API vazadas**, **material privado enviado por engano** e **dependências de terceiros**.

## Chaves nunca entram no repositório

O kit usa, no máximo, duas chaves, ambas opcionais:

| Variável | Serviço | Para quê |
|---|---|---|
| `ELEVENLABS_API_KEY` | ElevenLabs | Voz da trilha paga |
| `FISH_API_KEY` | Fish Audio | Voz do modelo gratuito na nuvem |

Regras:

- A chave fica **só** no arquivo `.env`, na raiz do repositório, ou numa variável de ambiente. O `.gitignore` já exclui `.env` e `.env.*`.
- O arquivo `.env.example` traz os nomes das variáveis, **sem valor**. É ele que vai para o repositório.
- **Não cole a chave no chat com o agente de IA**, nem em issue, pull request, captura de tela ou registro de terminal.
- Antes de qualquer `git add`, confira com `git status` que nenhum `.env` está na lista.
- Use chaves com o menor escopo que o serviço permitir, e defina limite de gasto na conta.

### Se uma chave vazou

1. **Revogue a chave agora**, no painel do serviço. Apagar o commit não basta: o histórico e os forks guardam cópia.
2. Gere uma chave nova e atualize o `.env`.
3. Confira o consumo recente da conta.
4. Se o vazamento foi neste repositório, avise conforme a seção "Como relatar".

## Material privado

- Áudio, vídeo, narrações e pastas de entrega são excluídos pelo `.gitignore` (`voz/`, `entrega/`, `out/`, `*.wav`, `*.mp3`, `*.mp4`, `*.mov`, `*.aep`). Não force a inclusão.
- Material de cliente nunca entra no repositório. Veja [CONTRIBUTING.md](CONTRIBUTING.md).
- Não deixe caminhos de pasta do seu computador em código ou documentação.

## Agentes de IA e execução de comandos

O método usa agentes que leem arquivos e rodam comandos. Cuidados:

- Revise os comandos antes de aprovar, sobretudo os que apagam, enviam para a rede ou instalam pacotes.
- Trate o conteúdo de páginas e arquivos de terceiros como dado, e não como instrução.
- Na trilha gratuita com modelo hospedado, o seu código e o seu roteiro saem da máquina. Para material sensível, use um modelo local.

## Dependências

- O motor de render e de áudio está copiado em `vendor/motion-reel` (versão fixada, com uma alteração local documentada em `vendor/README.md`).
- `three` e `playwright` vêm do npm, e as dependências de Python são declaradas no cabeçalho de cada script e resolvidas pelo `uv`.
- HDRI, texturas e fontes ficam no repositório. Nada é carregado de rede na hora do render.

## Versões com correção

| Versão | Recebe correção de segurança |
|---|---|
| 2.x | Sim |
| 1.x | Não |

## Como relatar

1. **Não publique os detalhes.** Não cole chave, comando de exploração nem dado privado em issue aberta.
2. Use o relato privado do GitHub: aba **Security** do repositório, botão **Report a vulnerability**.
3. Se essa opção não estiver disponível, abra uma issue pedindo apenas um canal reservado, sem descrever a falha: <https://github.com/FilipeMolinariMoura/fabrica-de-criativos/issues>

Inclua, no relato reservado: o que você encontrou, como reproduzir, a versão ou o commit, e o impacto que você vê. Quem mantém o projeto responde assim que possível. O projeto é mantido por uma pessoa, em tempo livre, e não promete prazo.
