# 4. Trilha paga: qualidade de estúdio e licença comercial

Esta é a trilha recomendada para o cliente que vai veicular os anúncios: voz de locutor, agente mais confiável e licença de uso comercial em dia.

## 4.1 O que assinar

| Serviço | Plano mínimo para anúncio | Por quê |
|---|---|---|
| Claude (Anthropic) | Pro ou Max, ou a API com cobrança por uso | O agente conduz roteiro, código, revisão e paralelismo. Os planos maiores aguentam vários agentes ao mesmo tempo. |
| ElevenLabs | Starter ou superior | O plano gratuito **não** permite uso comercial e tem cota mensal pequena. O Starter libera o uso comercial. |
| Adobe After Effects | Creative Cloud (app avulso ou pacote) | Só para o logo 3D. É opcional (veja a trilha gratuita). |

Os preços mudam. Confira nas páginas oficiais antes de orçar o projeto.

## 4.2 Configuração

```bash
npm install -g @anthropic-ai/claude-code   # ou o app desktop
claude                                     # login na conta Claude

cp .env.example .env                       # cole a chave da ElevenLabs em ELEVENLABS_API_KEY
node scripts/eleven.mjs conta              # confere a cota de caracteres
```

No After Effects, ative *Configurações → Script e expressões → Permitir que scripts gravem arquivos e acessem a rede*.

## 4.3 Narração com a ElevenLabs

```bash
node scripts/eleven.mjs vozes                                    # lista as vozes
node scripts/voz_eleven.mjs all locutor-v3 <voice_id> eleven_v3 3 # 3 tomadas por roteiro
uv run scripts/voz_avaliar.py voz/<criativo>
```

| Parâmetro | Ponto de partida | Efeito |
|---|---|---|
| `eleven_v3` | padrão | O mais expressivo; aceita marcações de tom (`[confident]`, `[curious]`) |
| `eleven_multilingual_v2` | alternativa | Mais estável; bom para a variação de voz |
| `stability` | 0,5 | Mais baixo varia mais; mais alto fica uniforme |
| Formato | `mp3_44100_128` | 192 kbps só nos planos pagos maiores |

Escolha a voz **de ouvido**, com a mesma frase lida por 4 ou 5 vozes prontas da biblioteca. Nos testes, as vozes prontas venceram os clones caseiros em português.

## 4.4 Orçamento de caracteres

Um roteiro de 30 segundos tem de 350 a 500 caracteres. Com 3 tomadas, mais uma variação de voz, conte uns 2.000 caracteres por criativo. Some o lote inteiro antes de começar e confira com `node scripts/eleven.mjs conta`.

## 4.5 Quando misturar as trilhas

| Situação | Combinação |
|---|---|
| Rascunho para aprovar o roteiro | Voz gratuita (Kokoro); troca pela paga só no final |
| Pouco orçamento de tokens | Piloto com Claude, demais criativos com o modelo aberto copiando o piloto |
| Cliente sem Creative Cloud | Logo em three.js |
