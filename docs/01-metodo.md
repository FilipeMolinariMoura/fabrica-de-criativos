# 1. O método em 8 etapas

```
Briefing → Roteiro → Voz → Narração no tempo → Trilha e efeitos → Filme → Crítica → Render e variações
   1          2        3            4                  5             6        7              8
```

Cada etapa produz um arquivo que a próxima consome. Por isso dá para voltar a qualquer ponto sem refazer o resto.

| # | Etapa | Entra | Sai | Portão de qualidade |
|---|---|---|---|---|
| 1 | Briefing | conversa com o cliente | `templates/briefing.md` preenchido | Produto, público, dor, CTA e telas reais confirmados |
| 2 | Roteiro | briefing | `roteiros/roteiros.json` | O cliente aprovou o texto **antes** da voz |
| 3 | Voz | roteiro | `voz/<id>/<rótulo>-<n>.(mp3\|wav)` | Transcrição às cegas 100% fiel, finais de frase corretos |
| 4 | Narração no tempo | tomada escolhida | `<filme>/audio/vo.wav` + `vo.json` | Pausas naturais; nenhuma frase cortada |
| 5 | Trilha e efeitos | `vo.json`, `trilha.json` | `music.wav`, `beats.json`, `sfx.wav`, `mix.wav` | -14 LUFS, voz inteligível acima da trilha |
| 6 | Filme | tudo acima + capturas | `film.js` | Contrato do render respeitado (função pura do tempo) |
| 7 | Crítica | folhas de contato | `docs/critica.md` do filme | 3 rodadas no mínimo, todas as notas ≥ 8 |
| 8 | Render e variações | filme aprovado | `entrega/finais/*.mp4` | `scripts/checar_entrega.sh` passa |

## 1.1 Briefing
Colete, numa só rodada de perguntas:
- produto, para quem é e a dor que resolve;
- telas reais (site, App Store, capturas);
- logo, cores e fontes;
- CTA e canal;
- 2 ou 3 vídeos de referência;
- duração e formato.

Use `templates/briefing.md`.

**Erro mais caro do método:** entender errado o escopo. Antes de escrever o roteiro, confirme com o cliente *o que* está sendo anunciado: o produto específico ou a empresa como um todo.

## 1.2 Roteiro
Estrutura de 30 s:

| Tempo | Bloco | O que faz |
|---|---|---|
| 0–3 s | **Gancho** | Pergunta ou afirmação que o público reconhece como sua, com texto na tela já no primeiro quadro |
| 3–9 s | **Problema** | Uma cena concreta |
| ~10 s | **Virada** | O nome do produto entra junto com a maior mudança visual |
| 11–21 s | **Produto em ação** | Interface real |
| 21–25 s | **Prova** | Um detalhe verificável |
| 25–30 s | **CTA** | Verbo + canal + benefício |

Regras de texto:
- frases de 4 a 9 palavras;
- uma ideia por cena;
- números por extenso na fala;
- nenhum número sem fonte.

Veja [07-roteiro-e-copy.md](07-roteiro-e-copy.md).

## 1.3 Voz
Gere o roteiro inteiro de uma vez, para a entonação fluir, em 3 tomadas. Avalie às cegas com `voz_avaliar.py`:
1. **Fidelidade:** o Whisper transcreve sem ver o texto; qualquer palavra diferente é erro de pronúncia.
2. **Fim de frase:** afirmação termina descendo; pergunta termina subindo (F0 medido com Praat).
3. **Expressividade:** variação de tom sem gritar.

## 1.4 Narração no tempo
`vo_montar.py` trata a voz e grava cada palavra no tempo. No filme, as cenas começam em palavras, não em segundos:

```js
const VO = await loadVO();
const tVirada = wt(VO, 'produto', { after: 8 });   // primeira ocorrência depois de 8 s
const tCTA    = ph(VO, -1).t0;                      // início da última frase
```

É isso que permite trocar a voz e manter o filme sincronizado.

## 1.5 Trilha e efeitos
`trilha.json` marca a virada (`reveal`) e o CTA em segundos. `trilha.py` compõe tensão antes da virada, abertura depois e impacto no CTA. Cada acento visual vai em `HITS` com o som que leva, e `sfx.mjs` sintetiza tudo no quadro exato. `mix.mjs` masteriza em -14 LUFS / -1 dBTP.

## 1.6 Filme
O filme é `window.seek(t)`: desenha o quadro *t* num canvas 1080×1920. As técnicas estão em [06-tecnicas-de-motion.md](06-tecnicas-de-motion.md).

Construa **um piloto completo**, aprove com o cliente e só então escale os demais criativos, um agente por roteiro.

## 1.7 Crítica
Para cada rodada:
1. Renderize as folhas de contato (um quadro por batida) e a versão em meio tamanho, que simula o celular na mão.
2. Dê notas de 1 a 10 em seis critérios: gancho, leitura no celular, movimento, variedade, marca e sincronia de som. A rubrica está em `templates/critica.md`.
3. Corrija os três piores pontos e repita.

## 1.8 Render, variações e entrega
1. Gere a prévia a 30 fps sem desfoque para o cliente aprovar.
2. Gere o final a 60 fps, com desfoque de movimento por subquadros.
3. Faça as variações com `variante.py`, nos três eixos:
   - **cor:** tema escuro;
   - **estilo:** títulos pesados em itálico;
   - **voz:** outra narração, com as cenas se reposicionando pelas palavras.
4. Rode `checar_entrega.sh` em tudo antes de enviar.
