# Como contribuir

Contribuições são bem-vindas: novas primitivas de motion, vozes abertas em português, correções e traduções.

1. Abra uma *issue* descrevendo a proposta antes de mudanças grandes.
2. Crie um branch a partir de `main` (`feat/…`, `fix/…`, `docs/…`).
3. Respeite o **contrato do render**: o filme é função pura do tempo (sem `Math.random`, `setTimeout` ou estado entre quadros).
4. Rode `make checar` (sintaxe de JS e Python) antes do *pull request*.
5. Nunca inclua material de cliente, chaves de API, áudio ou vídeo gerado.
6. Documentação em português do Brasil; citações em ABNT (`docs/referencias.md`).

Ao contribuir, você concorda em licenciar o código sob MIT e a documentação sob CC BY 4.0.
