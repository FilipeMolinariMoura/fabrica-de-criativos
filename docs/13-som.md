# 13. Som: trilha, efeitos e mixagem

[← 12. Voz dirigida](12-voz-dirigida.md) · [Índice](README.md) · Próximo: [14. Estudo de caso →](14-estudo-de-caso-a-bancada.md)

No método, todo o som que não é voz sai de código: a música é composta por um script, os efeitos são sintetizados a partir da lista de eventos do filme, e a mixagem fecha num padrão medido. Nada de banco de música, nada de direito autoral, e o som cai no quadro certo por construção.

O segredo de um som que prende é **medir**. Estar em −14 LUFS garante o padrão de entrega; medir a música nos intervalos da voz e o nível de cada efeito garante que tudo o que você compôs seja de fato ouvido. Este capítulo traz os dois.

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

### Alternativa paga: música gerada por IA, alinhada à fala

A trilha sintetizada casa sozinha com a fala e é grátis, com timbre eletrônico. Quando o anúncio pede uma música de mais impacto, com textura de produção, gere-a na **ElevenLabs Music** e alinhe-a à narração com `scripts/trilha_eleven.py`. Foi assim a trilha publicada de A bancada.

O processo tem três passos:

1. **Planejar sobre a fala.** O arquivo `musica.json` do filme descreve a música em seções: introdução tensa, queda em "Ele foi programado", respiro nas três perguntas, subida, tensão e final no CTA. O plano usado está em [`exemplos/bancada/musica.json`](../exemplos/bancada/musica.json).
2. **Gerar tomadas e escolher de ouvido.** Em A bancada, seis faixas em três estilos (trailer, bass house e trap); as favoritas foram ouvidas já no vídeo, e a de trailer ficou.
3. **Alinhar medindo.** A geração não garante os tempos exatos pedidos (uma introdução de 3,0 s pode sair com 3,9 a 4,5 s), e é por isso que o script mede: acha no áudio a virada (o maior salto de energia no começo) e o impacto final, leva a virada para `reveal` e o impacto para `cta`, e estica o tempo de cada trecho sem mudar o tom.

```bash
uv run scripts/trilha_eleven.py gerar   exemplos/bancada --tomadas 2
uv run scripts/trilha_eleven.py alinhar exemplos/bancada exemplos/bancada/audio/musica-1.raw.wav
npm run audio -- exemplos/bancada        # refaz efeitos e mixagem com a música nova
```

No macOS e no Linux, a última linha também pode ser `make audio3d FILME=exemplos/bancada`.

Na tomada publicada, a virada foi medida em 4,12 s e o impacto final em 30,32 s. Para caírem em 2,40 s e 29,02 s, os dois trechos foram esticados em 1,6% e 2,0%. Quando uma tomada pede mais de 8%, o script usa um esticamento único e avisa onde o impacto final caiu.

Boas práticas:

- **Trocar a música não exige novo render.** A imagem é a mesma; refaz-se a mixagem e junta-se o áudio ao vídeo pronto, em minutos.
- **Guarde a tomada escolhida.** A geração não é determinística: a mesma semente pode dar outra música. O áudio não vai para o repositório.
- **Anime na batida da música final.** O que pulsa no tempo (como o botão do cartão final) segue a grade de batidas da trilha usada no render. Se trocar a música depois, renderize de novo só aquele trecho para o pulso cair na batida nova.
- **A medição alinha, o ouvido aprova.** O script avisa quando o salto de energia da virada é menor que 6 dB: sinal de que vale ouvir outra tomada.
- **Licença.** Exige plano pago. Confira os termos de uso comercial do seu plano antes de veicular.

`finalizar3d.sh` só recompõe a música sintetizada se `audio/music.wav` não existir ou se o `trilha.json` mudar. Uma música alinhada por este script é mantida.

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

## 13.5 Mixagem que se ouve: os ajustes recomendados

Três ajustes, todos medidos, fazem a diferença entre uma mixagem no padrão e uma mixagem que prende.

### Deixe a música respirar

O sidechain padrão do motion-reel abaixa a música com força e a solta devagar: nos intervalos entre as frases, ela fica 14,8 LU abaixo da voz, e o filme soa como voz sobre silêncio. Com os ajustes recomendados, a música volta a preencher os respiros.

| Parâmetro | Padrão do motion-reel | Recomendado |
|---|---|---|
| Limiar (`threshold`) | 0,02 | **0,08** |
| Razão (`ratio`) | 6 | **3** |
| Ataque | 12 ms | **15 ms** |
| Soltura (`release`) | 280 ms | **350 ms** |
| Ganho da música | 0 dB | **+2 dB** |

| Medida | Padrão | Recomendado |
|---|---|---|
| Música nos intervalos da voz | 14,8 LU abaixo | **9,0 LU abaixo** |
| Voz acima da música, em média, durante a fala | — | **14,3 dB** |
| Loudness integrado | −14 LUFS | −14 LUFS |

A música ganha presença, a voz continua inteligível, e o padrão de entrega se mantém. Os parâmetros entram na linha de comando:

```bash
node vendor/motion-reel/skills/motion-reel/scripts/mix.mjs exemplos/bancada --no-mux \
  --music-db 2 --duck-threshold 0.08 --duck-ratio 3 --duck-attack 15 --duck-release 350
```

As quatro opções `--duck-*` e a `--music-db` são uma extensão de uma linha na cópia do motion-reel incluída no kit; sem elas, valem os valores padrão. O registro está em [`vendor/README.md`](../vendor/README.md).

### Faça cada efeito ser ouvido

Efeito que fica de 15 a 27 dB abaixo da voz some na prática. Meça o pico de cada evento contra a voz e ajuste. Em A bancada, com 44 eventos de som, a mixagem final segue estas escolhas:

| Situação | Escolha |
|---|---|
| Vários deslizes pequenos seguidos | Um deslize só, da esquerda para a direita |
| Golpe perto de uma palavra-chave ("clipe") | Logo depois da palavra, nunca em cima |
| Sons das fichas | +8 dB |
| A tampa do notebook | Sincronizada com o movimento visível, +10 dB |
| A subida antes do CTA | Começa uns 1,2 s antes, +8 dB |
| Cortes secos | Um clique leve em cada corte |
| O giro do celular | O deslize dura o que o giro dura na tela |

### Mantenha o filme vivo depois da última palavra

O cartão final é parte do anúncio. Em A bancada, um acorde entra logo depois de "hoje", a música se mantém até o fim, e o botão pulsa em duas batidas com um som suave.

## 13.6 As regras do som

1. **Todo evento visual tem som, e todo som se ouve.** Efeito mais de 15 dB abaixo da voz não existe.
2. **Nenhum golpe em cima de palavra.** Efeitos fortes vão nos intervalos e no fechamento das consoantes. Sob a fala, o pico de qualquer efeito fica perto de −8 dBFS.
3. **O som dura o que a imagem dura.** Um giro de 0,65 s pede um deslize de 0,65 s.
4. **O impacto vai no início audível da palavra**, e não no tempo da transcrição, que fica de 50 a 235 ms adiantado.
5. **Quase silêncio antes da virada.** De 150 a 250 ms. O contraste faz a virada bater.
6. **A música respira nos intervalos da voz.** Perto de 9 LU abaixo da voz, e não 15.
7. **O filme não acaba quando a voz acaba.** Acorde, cama e um último gesto no cartão final.
8. **Master em −14 LUFS e pico ≤ −1 dBTP.** Confira com `npm run checar -- <arquivo.mp4>`.

## 13.7 Como medir o seu

| Pergunta | Medida | Ferramenta |
|---|---|---|
| Está no padrão de entrega? | Loudness integrado e pico verdadeiro | `npm run checar` (usa o filtro `ebur128` do ffmpeg) |
| A voz está parelha? | Loudness de cada frase, usando os tempos do `vo.json` | Um script curto com o mesmo filtro, trecho a trecho |
| A música existe? | Loudness da música já abaixada, nos intervalos entre frases, contra a voz | Idem, sobre os arquivos separados |
| Os efeitos se ouvem? | Pico de cada efeito em `sfx.wav` contra o nível da voz naquele instante | Idem |
| Algum efeito cobre palavra? | Início de cada efeito contra o início audível de cada palavra | Lista de eventos (`hits.json`) contra os inícios medidos |
| O som cai no quadro? | Início do efeito contra o corte | `sync.py` do motion-reel |

Os arquivos separados (`vo.wav`, `music.wav`, `sfx.wav`) são o que torna essas medidas possíveis. Guarde-os.

## 13.8 Para ir além

- **Estéreo.** A mixagem sai, na prática, em mono, que é o que a maioria dos celulares reproduz. Para fone de ouvido, abrir os efeitos no panorama dá mais espaço.
- **Timbre das vozes.** Com duas vozes, além de igualar o nível, uma equalização leve aproxima o brilho das duas.
- **Escuta final.** A medição garante o padrão; a pessoa que aprova o filme dá a palavra final sobre o som, de ouvido, de preferência no celular.
- **Sons gravados.** Tudo no kit é sintetizado. Para estalo de chave, tecla e papel, gravar com o celular ou usar um acervo CC0 acrescenta matéria.

## 13.9 Comandos

Os comandos `npm run …` funcionam igual no Windows, no macOS e no Linux.

Motor 2D, o exemplo completo:

```bash
npm run demo                                   # narração grátis, trilha, efeitos, mixagem e prévia
```

Motor 3D, todo o som de uma vez:

```bash
npm run audio -- exemplos/bancada              # eventos -> trilha -> efeitos -> mixagem
```

No macOS e no Linux, os atalhos equivalentes são `make demo` e `make audio3d FILME=exemplos/bancada`.

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
