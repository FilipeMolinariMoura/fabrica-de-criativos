# Changelog

## 1.1.0 — 2026-11-16
- Criativo de divulgação do próprio projeto (`exemplos/divulgacao`), feito com o kit: narração em diálogo, 60 fps, -14 LUFS.
- Voz: `voz_fish.mjs` (Fish Audio, modelo gratuito), `voz_por_frase.py` (entonação controlada frase a frase) e `voz_dialogo.py` (diálogo entre vozes).
- `lib/cena.js`: `vidro()` com desfoque real do fundo (glassmorphism), fundo com campos de luz (`bgCampos`), `wt` com grafias alternativas, contraste automático do texto no tema escuro.
- `voz_avaliar.py`: "60" e "sessenta" contam como a mesma palavra.

## 1.0.0 — 2026-11-16
- Método em 8 etapas documentado (`docs/`), com relatório técnico e referências em ABNT.
- Duas trilhas: gratuita (Ollama + modelos abertos, Kokoro TTS, three.js/Blender) e paga (Claude, ElevenLabs, After Effects).
- Biblioteca `lib/cena.js` de primitivas de motion design e harness `lib/motion.js`.
- Scripts de voz, avaliação às cegas, montagem da narração, trilha, variações, finalização e conferência de entrega.
- Automação do logo 3D no After Effects (`ae/logo3d/`).
- Exemplo completo (`exemplos/demo/`) e e-book em PDF (`dist/`).
- Motor `motion-reel` 1.3.0 incluído em `vendor/` (MIT).
