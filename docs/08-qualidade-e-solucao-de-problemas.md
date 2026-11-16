# 8. Qualidade, entrega e solução de problemas

## 8.1 Rubrica de crítica (por rodada)

| Critério | 1–4 | 5–7 | 8–10 |
|---|---|---|---|
| Gancho | Nada legível no primeiro quadro | Texto aparece depois de 1 s | Texto e movimento no primeiro quadro, ideia clara em 1,5 s |
| Leitura no celular | Texto some na folha em meio tamanho | Lê com esforço | Lê de relance |
| Movimento | Fades e velocidade linear | Molas, mas tudo igual | Molas com peso, antecipação e direção |
| Variedade | Mesma composição o tempo todo | Troca a cada 5 s ou mais | Algo novo a cada 2 a 4 s |
| Marca | Cores ou fontes fora do padrão | Correto, mas genérico | Reconhecível sem o logo |
| Sincronia | Cena antes da fala | Atrasos pequenos | Texto e som no quadro da palavra |

O critério de saída é ter pelo menos 3 rodadas, todas as notas ≥ 8, registradas no `critica.md` do filme.

## 8.2 Especificação de entrega

| Item | Valor |
|---|---|
| Resolução | 1080×1920 (9:16) |
| Quadros | 60 fps no final, 30 fps na prévia |
| Vídeo | H.264, yuv420p, CRF 16 |
| Áudio | AAC, -14 LUFS integrados, -1 dBTP |
| Nome | `A01-NOME-CURTO.mp4`, com sufixo de variação (`-ESCURO`, `-IMPACTO`, `-VOZ2`) |

Antes de enviar, confira com `scripts/checar_entrega.sh entrega/finais/*.mp4`.

## 8.3 Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| Título sai em fonte com serifa | O peso ou o itálico não foi carregado | Liste a variação em `FONTES_EXTRA` ou no carregamento do `motion.js` |
| Cenas fora do lugar depois de trocar a voz | Tempos fixos em segundos | Prenda as cenas às palavras com `wt()` |
| O vídeo acaba antes do cartão final | A mixagem antiga é mais curta que o filme | Refaça a mixagem antes do render |
| Quadros diferentes a cada render | `Math.random` ou estado entre quadros | Use ruído com semente e calcule tudo a partir de *t* |
| "Permissão negada" no After Effects | O AE não deixa scripts gravarem arquivos | Ative a opção em *Script e expressões* e reabra o AE |
| A janela "Salvar como" trava a automação | O script não suprime diálogos | `app.beginSuppressDialogs()` e salvar com caminho absoluto |
| Erro de formato na ElevenLabs | O formato de 192 kbps não está no seu plano | Use `mp3_44100_128` |
| A cota da ElevenLabs acabou | Limite mensal do plano | Some os caracteres do lote antes e confira com `eleven.mjs conta` |
| Palavra pronunciada errada | Grafia ambígua para a voz | Escreva como se fala e gere de novo só aquela frase |
| Modelo aberto se perde no meio da tarefa | Contexto curto ou tarefa longa demais | Contexto de 32 mil tokens ou mais; peça uma etapa por vez |
| Claude Code ignora o Ollama | `ANTHROPIC_API_KEY` está definida | Deixe essa variável vazia |
