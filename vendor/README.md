# vendor/

Código de terceiros copiado para dentro do repositório, para o projeto funcionar sem instalar nada além
das dependências de sistema.

## motion-reel

| | |
| --- | --- |
| Origem | https://github.com/Aries-Spring/motion-reel |
| Versão | 1.3.0 (ver `motion-reel/CHANGELOG.md`) |
| Autor | Aries Spring |
| Licença | MIT (`motion-reel/LICENSE`) |
| Modificações | nenhuma: a pasta é uma cópia fiel do plugin |

O motion-reel é um plugin do Claude Code que transforma código em vídeo: o filme é um canvas que é função
pura do tempo, renderizado quadro a quadro pelo Chromium (Playwright), com trilha e efeitos sintetizados e
mixagem em -14 LUFS. Daqui a fábrica usa principalmente:

- `skills/motion-reel/scripts/render.mjs`: render quadro a quadro (prévia, final, folhas de contato, stills);
- `skills/motion-reel/scripts/sfx.mjs`: efeitos sonoros a partir da lista de acentos (`HITS`) do filme;
- `skills/motion-reel/scripts/mix.mjs`: mixagem música + efeitos + voz, master em -14 LUFS / -1 dBTP;
- `skills/motion-reel/scripts/dsp.py`: os instrumentos sintetizados que `scripts/trilha.py` usa.

`lib/motion.js` é derivado de `skills/motion-reel/assets/lib/motion.js` (comentários traduzidos e o gancho
`FONTES_EXTRA`).

### Onde os scripts procuram o skill

Todos os scripts da fábrica leem a variável de ambiente `SKILL` e, se ela não existir, usam
`vendor/motion-reel/skills/motion-reel`:

```bash
SKILL=~/.claude/skills/motion-reel scripts/finalizar.sh exemplos/demo previa
```

### Usar o plugin instalado em vez da cópia

Se você usa o Claude Code, pode instalar o plugin oficial (e receber atualizações) em vez de usar esta cópia:

```bash
claude plugin marketplace add Aries-Spring/motion-reel
claude plugin install motion-reel@aries-spring
```

Depois aponte `SKILL` para a pasta `skills/motion-reel` do plugin instalado. Com o plugin instalado, o
Claude Code também passa a conhecer o fluxo completo (roteiro de planos, crítica por folhas de contato etc.).
