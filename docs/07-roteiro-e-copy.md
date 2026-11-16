# 7. Roteiro e copy

## 7.1 Fórmula de 30 segundos

| Bloco | Tempo | Função | Exemplo genérico |
|---|---|---|---|
| Gancho | 0–3 s | Fazer o público se reconhecer | "Quanto tempo você perde por dia procurando informação?" |
| Problema | 3–9 s | Mostrar a dor numa cena concreta | "Planilha desatualizada. Mensagem perdida no grupo." |
| Virada | ~10 s | Apresentar o produto com a maior mudança visual | "Com o Fluxo, tudo fica num lugar só." |
| Produto em ação | 11–21 s | Mostrar a interface real resolvendo | "Toque, atribua, acompanhe." |
| Prova | 21–25 s | Dar um detalhe verificável | "Cada etapa com responsável e horário." |
| CTA | 25–30 s | Pedir uma ação | "Chama no WhatsApp e peça seu diagnóstico gratuito." |

## 7.2 Tipos de gancho

| Tipo | Quando usar |
|---|---|
| Pergunta de dor | O público já sente o problema |
| Número concreto | Existe um dado com fonte |
| Contraste antes/depois | O produto tem efeito visual claro |
| Afirmação contraintuitiva | O mercado tem uma crença errada que o produto derruba |
| "Você sabia" | Há um recurso pouco conhecido |

Gere de 5 a 10 ganchos por criativo (`marketing:content-creation`) e escolha com o cliente.

## 7.3 Escrever para a voz

| Evite | Prefira |
|---|---|
| Frase longa com vírgulas | Frases de 4 a 9 palavras |
| Siglas ("QR", "CRM") | Escreva como se fala ("quiu-ár", "cê-érre-ême") |
| "R$ 25 mil", "10s" | "vinte e cinco mil reais", "dez segundos" |
| Jargão ("solução robusta") | A palavra que o cliente usa |
| Três ideias numa cena | Uma ideia por cena |

## 7.4 Texto da tela
- Na tela vai a palavra-chave, não a frase inteira (princípio da redundância).
- Título com no máximo 6 palavras e legível na folha em meio tamanho.
- Sem travessão nem pontuação decorativa.

## 7.5 Conformidade
- Nenhum número sem fonte. Se houver fonte, ela aparece na tela.
- Nada de logos de clientes sem autorização escrita.
- Narração sintética: siga as políticas da plataforma de anúncios sobre conteúdo gerado por IA.
- Antes de veicular, confira a licença comercial da voz (veja [04-trilha-paga.md](04-trilha-paga.md)).

## 7.6 Esquema do `roteiros.json`

```json
{
  "cta_fala": "Chama no WhatsApp e peça seu diagnóstico gratuito.",
  "criativos": [
    {
      "id": "a01-tudo-num-lugar",
      "titulo": "Tudo num lugar só",
      "falas": ["Quanto tempo você perde por dia procurando informação?", "..."],
      "tela":  ["Quanto tempo?", "..."]
    }
  ]
}
```
