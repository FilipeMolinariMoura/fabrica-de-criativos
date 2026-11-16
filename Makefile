# Fábrica de Criativos: atalhos para o fluxo inteiro.
#
#   make setup                                    dependências (npm + Chromium do Playwright) e conferência das ferramentas
#   make demo                                     voz grátis + trilha + efeitos + mixagem + prévia do exemplos/demo
#   make voz-gratis ID=c01 [VOZ=pf_dora] [TOMADAS=3] [ROTEIRO=roteiros/roteiros.json]
#   make voz-paga   ID=c01 ROTULO=grave-v3 VOICE=<voice_id> [MODELO=eleven_v3] [TOMADAS=2] [ROTEIRO=...]
#   make avaliar    ID=c01                        ordena as tomadas de voz/c01 (Whisper + análise de tom e ritmo)
#   make previa     FILME=criativos/c01           30 fps sem desfoque -> entrega/previas/
#   make final      FILME=criativos/c01           60 fps com desfoque -> entrega/finais/
#   make checar     [ARQS="entrega/finais/*.mp4"] resolução, fps, pixel, áudio, -14 LUFS, pico
#   make sintaxe                                  node --check e py_compile em tudo
SHELL := /bin/bash
SKILL ?= vendor/motion-reel/skills/motion-reel
export SKILL

VOZ ?= pf_dora
TOMADAS ?= 1
ROTEIRO ?= roteiros/roteiros.json
MODELO ?= eleven_v3
ARQS ?= entrega/finais/*.mp4

.PHONY: setup demo voz-gratis voz-paga avaliar previa final checar sintaxe ajuda

ajuda:
	@sed -n '2,12p' Makefile | sed 's/^# \{0,1\}//'

setup:
	npm install
	npx playwright install chromium
	@command -v ffmpeg >/dev/null || echo "FALTA: ffmpeg (macOS: brew install ffmpeg; Ubuntu: sudo apt install ffmpeg)"
	@command -v uv >/dev/null || echo "FALTA: uv (https://docs.astral.sh/uv/: curl -LsSf https://astral.sh/uv/install.sh | sh)"
	@command -v mlx_whisper >/dev/null || command -v whisper >/dev/null || echo "FALTA: Whisper (Mac Apple Silicon: uv tool install mlx-whisper; outros: uv tool install openai-whisper)"
	@echo "setup ok"

# O demo refaz a narração grátis (Kokoro, determinística) e o áudio; vo.json e beats.json já estão no repositório.
demo:
	uv run scripts/voz_kokoro.py demo pf_dora 1 --roteiros exemplos/demo/roteiro.json
	uv run scripts/vo_montar.py exemplos/demo voz/demo/pf_dora-1.wav --tempo 1.0 --pausa-max 0.45
	scripts/finalizar.sh exemplos/demo previa

voz-gratis:
	@test -n "$(ID)" || (echo "uso: make voz-gratis ID=<id> [VOZ=pf_dora|pm_alex|pm_santa] [TOMADAS=3]"; exit 1)
	uv run scripts/voz_kokoro.py $(ID) $(VOZ) $(TOMADAS) --roteiros $(ROTEIRO)

voz-paga:
	@test -n "$(ID)" -a -n "$(ROTULO)" -a -n "$(VOICE)" || (echo "uso: make voz-paga ID=<id> ROTULO=<nome> VOICE=<voice_id> [MODELO=eleven_v3]"; exit 1)
	node scripts/voz_eleven.mjs $(ID) $(ROTULO) $(VOICE) $(MODELO) $(TOMADAS) --roteiros $(ROTEIRO)

avaliar:
	@test -n "$(ID)" || (echo "uso: make avaliar ID=<id>"; exit 1)
	uv run scripts/voz_avaliar.py voz/$(ID)

previa:
	@test -n "$(FILME)" || (echo "uso: make previa FILME=<pasta>"; exit 1)
	scripts/finalizar.sh $(FILME) previa

final:
	@test -n "$(FILME)" || (echo "uso: make final FILME=<pasta>"; exit 1)
	scripts/finalizar.sh $(FILME) final

checar:
	scripts/checar_entrega.sh $(ARQS)

sintaxe:
	node scripts/checar_sintaxe.mjs
