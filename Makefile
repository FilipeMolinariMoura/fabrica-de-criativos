# Fábrica de Criativos: atalhos para o fluxo inteiro (macOS e Linux).
# Em qualquer sistema, inclusive Windows, o mesmo fluxo está em: node fabrica.mjs ajuda
#
#   make verificar                                confere Node, npm, uv, ffmpeg, Chromium, WebGL e Whisper (node fabrica.mjs verificar)
#   make setup                                    dependências (npm: three e Playwright + Chromium) e conferência das ferramentas
#   make demo                                     voz grátis + trilha + efeitos + mixagem + prévia do exemplos/demo (motor 2D)
#
# Voz
#   make voz-gratis   ID=c01 [VOZ=pf_dora] [TOMADAS=3] [ROTEIRO=roteiros/roteiros.json]
#   make voz-paga     ID=c01 ROTULO=grave-v3 VOICE=<voice_id> [MODELO=eleven_v3] [TOMADAS=2] [ROTEIRO=...]
#   make voz-amostras VOICE=<voice_id> ROTULO=ana ID=c01 [PRESETS=v3-natural,v3-dirigida] [ROTEIRO=...] [DRY=1]
#                     amostras curtas de TOM (gancho + CTA) em vários ajustes; ou TEXTO="..." [DIRIGIDO="[serious] ..."] no lugar de ID
#   make voz-dirigida ID=c01 VOICE=<voice_id> ROTULO=ana [MODELO=eleven_v3|eleven_multilingual_v2] [TOMADAS=5]
#                     [SEMENTE=1] [SO_VOZ=f1] [ESTABILIDADE=0.5] [ESTILO=0.55] [ROTEIRO=...] [DRY=1]
#                     ElevenLabs: o texto dirigido inteiro numa geração, N tomadas com sementes diferentes
#                     (diálogo e emenda de vozes: uv run scripts/voz_dirigida.py dialogo|juntar --help)
#   make avaliar      ID=c01                      filtro às cegas de voz/c01 (palavra errada e tom no fim da frase; aprovar é de ouvido)
#
# Filme 2D (lib/cena.js)
#   make previa     FILME=criativos/c01           30 fps sem desfoque -> entrega/previas/
#   make final      FILME=criativos/c01           60 fps com desfoque -> entrega/finais/
#
# Filme 3D (lib/3d, three.js na GPU)
#   make contato3d   FILME=exemplos/bancada [SPP=24]   folha de contato, 2 quadros por plano -> out/<filme>/contato.jpg
#   make contraste3d FILME=exemplos/bancada            contraste de cada legenda contra o quadro renderizado
#   make audio3d     FILME=exemplos/bancada            eventos -> trilha -> efeitos -> mixagem -> <filme>/audio/mix.wav
#   make previa3d    FILME=exemplos/bancada            áudio + 30 fps, 128 amostras por quadro -> entrega/previas/
#   make final3d     FILME=exemplos/bancada [LIMPO=1]  áudio + 60 fps, 192 amostras por quadro -> entrega/finais/
#                    [SPP= FPS= CRF= SEM_AUDIO=1] trocam a qualidade ou pulam o áudio (scripts/finalizar3d.sh --help)
#
# Conferência
#   make checar     [ARQS="entrega/finais/*.mp4"] resolução, fps, pixel, áudio, -14 LUFS, pico
#   make sintaxe                                  sintaxe de JS, Python, shell e JSON, imports e caminhos locais (o mesmo da CI)
SHELL := /bin/bash
SKILL ?= vendor/motion-reel/skills/motion-reel
export SKILL

VOZ ?= pf_dora
ROTEIRO ?= roteiros/roteiros.json
MODELO ?= eleven_v3
ARQS ?= entrega/finais/*.mp4

.PHONY: verificar setup demo voz-gratis voz-paga voz-amostras voz-dirigida avaliar previa final \
        contato3d contraste3d audio3d previa3d final3d checar sintaxe ajuda

ajuda:
	@awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' Makefile

verificar:
	node fabrica.mjs verificar

setup:
	npm install
	npx playwright install chromium
	@command -v ffmpeg >/dev/null || echo "FALTA: ffmpeg (macOS: brew install ffmpeg; Ubuntu: sudo apt install ffmpeg)"
	@command -v uv >/dev/null || echo "FALTA: uv (https://docs.astral.sh/uv/: curl -LsSf https://astral.sh/uv/install.sh | sh)"
	@command -v mlx_whisper >/dev/null || command -v whisper >/dev/null || echo "FALTA: Whisper (Mac Apple Silicon: uv tool install mlx-whisper; outros: uv tool install openai-whisper)"
	@echo "setup ok (conferência completa: make verificar)"

# O demo refaz a narração grátis (Kokoro, determinística) e o áudio; vo.json e beats.json já estão no repositório.
demo:
	uv run scripts/voz_kokoro.py demo pf_dora 1 --roteiros exemplos/demo/roteiro.json
	uv run scripts/vo_montar.py exemplos/demo voz/demo/pf_dora-1.wav --tempo 1.0 --pausa-max 0.45
	scripts/finalizar.sh exemplos/demo previa

voz-gratis:
	@test -n "$(ID)" || (echo "uso: make voz-gratis ID=<id> [VOZ=pf_dora|pm_alex|pm_santa] [TOMADAS=3]"; exit 1)
	uv run scripts/voz_kokoro.py $(ID) $(VOZ) $(or $(TOMADAS),1) --roteiros $(ROTEIRO)

voz-paga:
	@test -n "$(ID)" -a -n "$(ROTULO)" -a -n "$(VOICE)" || (echo "uso: make voz-paga ID=<id> ROTULO=<nome> VOICE=<voice_id> [MODELO=eleven_v3]"; exit 1)
	node scripts/voz_eleven.mjs $(ID) $(ROTULO) $(VOICE) $(MODELO) $(or $(TOMADAS),1) --roteiros $(ROTEIRO)

voz-amostras:
	@test -n "$(VOICE)" -a -n "$(ROTULO)" -a -n "$(ID)$(TEXTO)" || (echo 'uso: make voz-amostras VOICE=<voice_id> ROTULO=<nome> ID=<id> [PRESETS=...] [DRY=1]   (ou TEXTO="..." [DIRIGIDO="..."] no lugar de ID)'; exit 1)
	uv run scripts/voz_dirigida.py amostras $(VOICE) $(ROTULO) \
		$(if $(TEXTO),--texto "$(TEXTO)" $(if $(DIRIGIDO),--texto-dirigido "$(DIRIGIDO)"),--id $(ID) --roteiros $(ROTEIRO)) \
		$(if $(PRESETS),--presets $(PRESETS)) $(if $(DRY),--dry-run)

voz-dirigida:
	@test -n "$(ID)" -a -n "$(VOICE)" -a -n "$(ROTULO)" || (echo "uso: make voz-dirigida ID=<id> VOICE=<voice_id> ROTULO=<nome> [MODELO=eleven_v3] [TOMADAS=5] [DRY=1]"; exit 1)
	uv run scripts/voz_dirigida.py bloco $(ID) $(VOICE) $(ROTULO) --modelo $(MODELO) --tomadas $(or $(TOMADAS),5) --roteiros $(ROTEIRO) \
		$(if $(SEMENTE),--semente $(SEMENTE)) $(if $(SO_VOZ),--so-voz $(SO_VOZ)) $(if $(ESTABILIDADE),--estabilidade $(ESTABILIDADE)) \
		$(if $(ESTILO),--estilo $(ESTILO)) $(if $(DRY),--dry-run)

avaliar:
	@test -n "$(ID)" || (echo "uso: make avaliar ID=<id>"; exit 1)
	uv run scripts/voz_avaliar.py voz/$(ID)

previa:
	@test -n "$(FILME)" || (echo "uso: make previa FILME=<pasta>"; exit 1)
	scripts/finalizar.sh $(FILME) previa

final:
	@test -n "$(FILME)" || (echo "uso: make final FILME=<pasta>"; exit 1)
	scripts/finalizar.sh $(FILME) final

contato3d contraste3d audio3d previa3d final3d:
	@test -n "$(FILME)" || (echo "uso: make $@ FILME=<pasta> (ex.: exemplos/bancada)"; exit 1)
	scripts/finalizar3d.sh $(FILME) $(@:3d=)

checar:
	scripts/checar_entrega.sh $(ARQS)

sintaxe:
	node scripts/checar_sintaxe.mjs
