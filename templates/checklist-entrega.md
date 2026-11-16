# Checklist de entrega

## Técnico (rode `scripts/checar_entrega.sh entrega/finais/*.mp4`)
- [ ] 1080×1920 (9:16), H.264, `yuv420p`
- [ ] 30 ou 60 fps (final em 60 fps com desfoque de movimento: `make final FILME=<filme>` no 2D, `make final3d FILME=<filme>` no 3D)
- [ ] Áudio presente, AAC
- [ ] Loudness integrado em -14 LUFS (± 1) e pico real ≤ -1 dBTP
- [ ] Duração conferida com o briefing
- [ ] Nome do arquivo: `<id>-<variação>.mp4`, sem espaços nem acentos

## Conteúdo
- [ ] Texto da narração idêntico ao roteiro aprovado (`voz_avaliar.py` com fidelidade 1,0)
- [ ] Voz aprovada **de ouvido** por uma pessoa (o `voz_avaliar.py` só filtra palavra errada e tom no fim da frase; não mede naturalidade nem emoção)
- [ ] Toda afirmação tem fonte registrada no roteiro
- [ ] Ortografia e acentos conferidos em todo texto na tela
- [ ] Nada importante sob a interface das redes (topo 250 px, base 430 px, lateral direita 150 px)
- [ ] CTA falado e CTA na tela batem com a campanha (link, WhatsApp, loja)
- [ ] Crítica (`templates/critica.md`) com todos os critérios em 8 ou mais; o que ficou abaixo está escrito na entrega
- [ ] Um crítico independente (quem não construiu o vídeo) avaliou a última versão e suas correções foram respondidas item por item

## Direitos e licenças
- [ ] Voz: licença comercial da voz usada (Kokoro: Apache-2.0; ElevenLabs: plano pago permite uso comercial)
- [ ] Fontes com licença que permite uso em vídeo (as de `lib/fonts` e `lib/3d/assets/fonts` são SIL OFL)
- [ ] Logo, marcas e telas usados com autorização do cliente
- [ ] Trilha e efeitos: sintetizados pelo próprio projeto (sem licença de terceiros)

## Pacote
- [ ] `entrega/finais/` com os vídeos finais
- [ ] Poster (quadro de capa) de cada vídeo, se a plataforma pedir
- [ ] Página de aprovação atualizada (`python3 scripts/util/pagina_aprovacao.py`)
- [ ] Projeto do After Effects (se houve logo 3D) salvo fora do repositório público
