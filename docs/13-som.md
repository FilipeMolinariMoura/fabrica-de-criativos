# 13. Som: trilha, efeitos e mixagem

[← 12. Voz dirigida](12-voz-dirigida.md) · [Índice](README.md) · Próximo: [14. Estudo de caso →](14-estudo-de-caso-a-bancada.md)

No método, todo o som que não é voz sai de código: a música é composta por um script, os efeitos são sintetizados a partir da lista de eventos do filme, e a mixagem fecha num padrão medido. Nada de banco de música, nada de direito autoral.

A versão 2 acrescentou uma coisa a esse desenho: **medir**. A primeira prévia de A bancada estava no padrão de loudness e, mesmo assim, o crítico de som deu nota 5. A música tinha sumido debaixo da voz, e mais da metade dos efeitos não se ouvia.

## 13.1 A cadeia

```
vo.json ──► filme ──► eventos (HITS) ──► sfx.mjs ──► sfx.wav ─┐
   │                                                          ├─► mix.mjs ─► mix.wav (−14 LUFS)
   └─► trilha.json ──► trilha.py ──► music.wav + beats.json ──┤
                                                   vo.wav ────┘
```

| Peça | Faz | Entrada | Saída |
|---|---|---|---|
| `scripts/trilha.py` | Compõe a música sob a narração | `trilha.json` (duração, virada, CTA, acentos, clima) | `audio/music.wav`, `beats.json` |
| `sfx.mjs` (motion-reel) | Sintetiza cada efeito no instante do evento | Lista de eventos do filme | `audio/sfx.wav` |
| `mix.mjs` (motion-reel) | Junta voz, música e efeitos; abaixa a música sob a voz; masteriza | Os três arquivos | `audio/mix.wav` |

## 13.2 A música

`trilha.py` lê quatro tempos, todos vindos da fala: a duração, a **virada** (`reveal`), o **CTA** e os acentos extras.

```json
{ "dur": 33.9, "reveal": 1.78, "cta": 27.16, "hits": [2.26, 16.62, 20.92, 31.22], "mood": "energetico" }
```

O formato é este; os valores do seu filme saem do seu `vo.json`.

O que o script garante:

- **O tempo forte cai exatamente na virada.** A grade de batidas é deslocada para isso.
- **O andamento é escolhido para o CTA cair num tempo forte.** Com `--bpm auto`, ele procura o andamento mais perto de 100 que faz isso acontecer.
- **A forma segue o roteiro:** tensão antes da virada, abertura depois, impacto no CTA.
- **É uma cama.** A música sai num nível baixo de propósito. O padrão de loudness vem na mixagem.

Climas disponíveis: `tenso`, `corporativo`, `tech`, `energetico` e `suave`.

No motor 2D, `trilha.json` é escrito à mão. No motor 3D, o filme o calcula a partir das palavras, e o renderizador grava com `--meta`.

## 13.3 Os efeitos

Cada evento visual do filme tem uma linha: instante, rótulo e som.

```js
[T.editor, 'tampa fecha', 'thud', { gain: 0.5 }],
[T.segundo - 0.36, 'giro', 'whoosh', { len: 0.65, from: 400, to: 2800, gain: 0.5 }],
[T.segundo, 'trava', 'click+thud', { gain: 0.45 }],
[T.fim + 0.14, 'acorde final', 'impact', { gain: 0.6 }],
```

Os instantes são os **mesmos** que movem a imagem (`T.editor` é o início audível de "editor"). Por construção, o som cai no quadro do evento.

Sons usados em A bancada: `whoosh` (deslize, com duração e faixa de frequência), `click`, `tick`, `thud` (batida grave), `blip`, `pop` e `impact`.

## 13.4 A mixagem

`mix.mjs` soma voz, música e efeitos, abaixa a música enquanto há voz (*sidechain*) e masteriza em **−14 LUFS integrados e pico verdadeiro de até −1 dBTP**, conforme ITU-R BS.1770 e EBU R 128.

O arquivo final de A bancada mediu −14,0 LUFS e −1,3 dBTP.

## 13.5 O que a medição encontrou

O crítico de montagem e som mediu a prévia 1 em vez de só ouvir. Três achados.

### A música tinha sumido

O sidechain padrão abaixava a música com tanta força e a soltava tão devagar que, nos intervalos entre as frases, ela continuava 14,8 LU abaixo da voz. O filme soava como voz sobre silêncio.

| Parâmetro | Antes (padrão) | Depois |
|---|---|---|
| Limiar (`threshold`) | 0,02 | **0,08** |
| Razão (`ratio`) | 6 | **3** |
| Ataque | 12 ms | **15 ms** |
| Soltura (`release`) | 280 ms | **350 ms** |
| Ganho da música | 0 dB | **+2 dB** |

| Medida | Antes | Depois |
|---|---|---|
| Música nos intervalos da voz | 14,8 LU abaixo | **9,0 LU abaixo** |
| Voz acima da música, em média, durante a fala | — | **14,3 dB** |
| Loudness integrado | −14 LUFS | −14 LUFS (inalterado) |

A música voltou a existir, a voz continuou inteligível, e o padrão de entrega não mudou. Os parâmetros entram na linha de comando:

```bash
node vendor/motion-reel/skills/motion-reel/scripts/mix.mjs exemplos/bancada --no-mux \
  --music-db 2 --duck-threshold 0.08 --duck-ratio 3 --duck-attack 15 --duck-release 350
```

Essas quatro opções `--duck-*` e a `--music-db` são uma alteração local de uma linha na cópia do motion-reel. Sem elas, os valores antigos continuam valendo. O registro está em [`vendor/README.md`](../vendor/README.md).

### Mais da metade dos efeitos não se ouvia

Dos 44 eventos de som, cerca de 25 estavam de 15 a 27 dB abaixo da voz. Na prática, inaudíveis. Ao mesmo tempo, os três efeitos mais fortes caíam em cima de palavras-chave.

O que foi feito:

| Problema | Correção |
|---|---|
| Seis deslizes pequenos, um por bloco, viravam ruído | Um deslize só, da esquerda para a direita |
| Um golpe em cima da palavra "clipe" | Movido para depois da palavra |
| Sons das fichas quase mudos | +8 dB |
| O som da tampa não acompanhava o movimento visível | Sincronizado com o movimento, +10 dB |
| A subida antes do CTA mal se ouvia | Começa uns 1,2 s antes, +8 dB |
| Cortes secos sem som nenhum | Um clique leve em cada corte seco |
| O giro tinha som mais curto que a imagem | O deslize dura o que o giro dura na tela |

### O filme morria depois da última palavra

O cartão final ficava em silêncio. Agora há um acorde logo depois de "hoje", a música se mantém até o fim, e o botão pulsa em duas batidas com um som suave.

## 13.6 As regras que ficaram

1. **Todo evento visual tem som, e todo som se ouve.** Efeito mais de 15 dB abaixo da voz não existe.
2. **Nenhum golpe em cima de palavra.** Efeitos fortes vão nos intervalos e no fechamento das consoantes. Sob a fala, o pico de qualquer efeito fica perto de −8 dBFS.
3. **O som dura o que a imagem dura.** Um giro de 0,65 s pede um deslize de 0,65 s.
4. **O impacto vai no início audível da palavra**, e não no tempo da transcrição, que fica de 50 a 235 ms adiantado.
5. **Quase silêncio antes da virada.** De 150 a 250 ms. O contraste faz a virada bater.
6. **A música respira nos intervalos da voz.** Perto de 9 LU abaixo da voz, e não 15.
7. **O filme não acaba quando a voz acaba.** Acorde, cama e um último gesto no cartão final.
8. **Master em −14 LUFS e pico ≤ −1 dBTP.** Confira com `scripts/checar_entrega.sh`.

## 13.7 Como medir o seu

| Pergunta | Medida | Ferramenta |
|---|---|---|
| Está no padrão de entrega? | Loudness integrado e pico verdadeiro | `scripts/checar_entrega.sh` (usa o filtro `ebur128` do ffmpeg) |
| A voz está parelha? | Loudness de cada frase, usando os tempos do `vo.json` | Um script curto com o mesmo filtro, trecho a trecho |
| A música existe? | Loudness da música já abaixada, nos intervalos entre frases, contra a voz | Idem, sobre os arquivos separados |
| Os efeitos se ouvem? | Pico de cada efeito em `sfx.wav` contra o nível da voz naquele instante | Idem |
| Algum efeito cobre palavra? | Início de cada efeito contra o início audível de cada palavra | Lista de eventos (`hits.json`) contra os inícios medidos |
| O som cai no quadro? | Início do efeito contra o corte | `sync.py` do motion-reel |

Os arquivos separados (`vo.wav`, `music.wav`, `sfx.wav`) são o que torna essas medidas possíveis. Guarde-os.

## 13.8 O que não foi feito

- **Estéreo.** A mixagem é, na prática, mono. O crítico apontou e deu prioridade baixa. Ficou assim.
- **Timbre das duas vozes.** O nível foi igualado; o brilho, não.
- **Escuta crítica final.** A mixagem foi corrigida e conferida por medida. A nota de som registrada depois das correções é nota de construção. Quem aprova o som de ouvido é a pessoa que aprova o filme.
- **Sons gravados.** Tudo é sintetizado. Para estalo de chave, tecla e papel, gravar com o celular ou usar um acervo CC0 daria mais matéria. Não foi feito.

## 13.9 Comandos

Motor 2D, tudo de uma vez:

```bash
scripts/finalizar.sh exemplos/demo previa      # trilha, efeitos, mixagem e render
```

Motor 3D, tudo de uma vez:

```bash
make audio3d FILME=exemplos/bancada            # eventos -> trilha -> efeitos -> mixagem
```

O mesmo, passo a passo:

```bash
node lib/3d/render.mjs --film exemplos/bancada --meta        # tempos da fala -> trilha.json e hits.json
uv run scripts/trilha.py exemplos/bancada                    # música e beats.json
node lib/3d/render.mjs --film exemplos/bancada --meta        # de novo, agora com as batidas
node vendor/motion-reel/skills/motion-reel/scripts/sfx.mjs exemplos/bancada
node vendor/motion-reel/skills/motion-reel/scripts/mix.mjs exemplos/bancada --no-mux \
  --music-db 2 --duck-threshold 0.08 --duck-ratio 3 --duck-attack 15 --duck-release 350
```

---

Próximo: [14. Estudo de caso: A bancada →](14-estudo-de-caso-a-bancada.md)
