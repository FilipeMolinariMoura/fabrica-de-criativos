# Fontes

As duas famílias usadas pelos filmes. Ambas são fontes variáveis (eixo de peso 100 a 900), com todos os
acentos do português, distribuídas sob a **SIL Open Font License 1.1** (texto completo em `OFL.txt`).

| Arquivo | Família | Uso no código | Autoria |
| --- | --- | --- | --- |
| `urbanist.woff2` | Urbanist 1.303 | `Display` (títulos) | Copyright 2021 The Urbanist Project Authors — Corey Hu, https://github.com/coreyhu/Urbanist |
| `inter.woff2` | Inter 4.001 | `UI` (interface, textos) | Copyright 2016 The Inter Project Authors — Rasmus Andersson, https://github.com/rsms/inter |

Os arquivos são cópias sem modificação, apenas no formato WOFF2. Para usar a fonte da sua marca, troque os
`@font-face` no `index.html` do filme (mantendo os nomes `Display` e `UI`, ou mudando `fontes` em
`lib/marca.json`) e confira a licença dela antes de distribuir.
