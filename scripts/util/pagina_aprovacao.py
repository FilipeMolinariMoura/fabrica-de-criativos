"""Gera a página de aprovação de roteiros para o cliente (HTML estático, abre no celular).

uso: python3 scripts/util/pagina_aprovacao.py [roteiros/roteiros.json] [entrega/aprovacao/index.html]

Lê o roteiro (formato em templates/roteiro.json): o texto aprovado aqui é exatamente o que vai para a voz.
Campos usados de cada criativo: id, titulo, frente (opcional), publico, falas (com "CTA"), tela, fonte.
Campos opcionais da raiz do roteiro:
  "projeto":    título da página
  "decisoes":   {"Formato": "Reels 9:16 ...", "Voz": "...", ...}   cartões de decisões
  "quadros":    [{"arquivo": "quadro-1.jpg", "legenda": "Problema"}] imagens de estilo (ao lado do index.html)
  "pendencias": ["pergunta para o cliente", ...]
Depois, para mandar em PDF: node scripts/util/html2pdf.mjs entrega/aprovacao/index.html aprovacao.pdf "Roteiros"
"""
import html
import json
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    if len(sys.argv) > 1 and sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        return
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, "roteiros/roteiros.json")
    dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(RAIZ, "entrega/aprovacao/index.html")
    if not os.path.exists(src):
        sys.exit(f"roteiro não encontrado: {src} (modelo em templates/roteiro.json)")
    d = json.load(open(src, encoding="utf-8"))
    e = html.escape
    cta = d.get("cta_fala", "")
    projeto = d.get("projeto", "Roteiros para aprovação")

    cards = []
    for i, c in enumerate(d["criativos"], 1):
        falas_txt = [cta if f == "CTA" else f for f in c["falas"]]
        falas = "".join(f"<li>{e(f)}</li>" for f in falas_txt)
        tela = "".join(f"<span class=chip>{e(t)}</span>" for t in c.get("tela", []))
        palavras = sum(len(f.split()) for f in falas_txt)
        seg = round(palavras / 2.6)
        frente = " · ".join(x for x in (c.get("frente", ""), c.get("papel", "")) if x)
        fonte = f"<h4>De onde vem cada afirmação</h4><p class=fonte>{e(c['fonte'])}</p>" if c.get("fonte") else ""
        publico = f"Público: {e(c['publico'])} · " if c.get("publico") else ""
        cards.append(f"""
<article class=roteiro id="{e(c['id'])}">
  <header>
    <span class=num>{i:02d}</span>
    <div>{f'<p class=frente>{e(frente)}</p>' if frente else ''}<h3>{e(c.get('titulo', c['id']))}</h3>
    <p class=meta>{publico}cerca de {seg} s de narração</p></div>
  </header>
  <div class=cols>
    <div><h4>Narração</h4><ol class=falas>{falas}</ol></div>
    <div><h4>Texto na tela</h4><div class=chips>{tela or '<span class=fonte>(a definir)</span>'}</div>{fonte}</div>
  </div>
</article>""")

    decisoes = "".join(f"<div><b>{e(k)}</b>{e(v)}</div>" for k, v in d.get("decisoes", {}).items())
    quadros = "".join(f'<figure><img src="{e(q["arquivo"])}" alt="{e(q.get("legenda", ""))}"><figcaption>{e(q.get("legenda", ""))}</figcaption></figure>'
                      for q in d.get("quadros", []))
    pend = "".join(f"<li>{e(p)}</li>" for p in d.get("pendencias", []))

    pagina = f"""<!doctype html>
<html lang="pt-BR">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(projeto)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Urbanist:wght@700;800&family=Inter:wght@400;500;600&display=swap">
<style>
:root {{
  --bg: #F6F3F1; --surface: #FFFFFF; --ink: #1B1718; --ink2: #5C5455; --line: #E6DFDC; --acc: #D7263D; --accsoft: #FBE4E7;
  --display: 'Urbanist', system-ui, sans-serif; --body: 'Inter', system-ui, sans-serif;
}}
@media (prefers-color-scheme: dark) {{ :root {{ --bg: #121011; --surface: #1C1819; --ink: #F3EEEC; --ink2: #B5ABA9; --line: #2E2728; --acc: #EF4259; --accsoft: #3A1D22; color-scheme: dark }} }}
body {{ background: var(--bg); color: var(--ink); font: 16px/1.55 var(--body); margin: 0; }}
.wrap {{ max-width: 980px; margin: 0 auto; padding: 40px 16px 80px; display: grid; gap: 48px; }}
h1, h2, h3 {{ font-family: var(--display); font-weight: 800; line-height: 1.05; text-wrap: balance; margin: 0; }}
h1 {{ font-size: clamp(40px, 8vw, 68px); letter-spacing: -0.02em; }}
h2 {{ font-size: 30px; }}
h3 {{ font-size: 26px; }}
h4 {{ font: 600 12px/1.2 var(--body); text-transform: uppercase; letter-spacing: .12em; color: var(--ink2); margin: 0 0 10px; }}
.lead {{ font-size: 19px; color: var(--ink2); max-width: 62ch; margin: 14px 0 0; }}
.decisoes {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; }}
.decisoes div {{ background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 16px; }}
.decisoes b {{ display: block; font: 600 12px var(--body); text-transform: uppercase; letter-spacing: .1em; color: var(--acc); margin-bottom: 4px; }}
.quadros {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }}
.quadros figure {{ margin: 0; display: grid; gap: 8px; }}
.quadros img {{ width: 100%; aspect-ratio: 9/16; object-fit: cover; border-radius: 18px; border: 1px solid var(--line); display: block; }}
figcaption {{ font-size: 14px; color: var(--ink2); }}
.roteiros {{ display: grid; gap: 20px; }}
.roteiro {{ background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 24px; display: grid; gap: 18px; }}
.roteiro header {{ display: flex; gap: 16px; align-items: flex-start; }}
.num {{ font: 800 40px/1 var(--display); color: var(--acc); min-width: 56px; }}
.frente {{ margin: 0 0 4px; font: 600 12px var(--body); text-transform: uppercase; letter-spacing: .12em; color: var(--acc); }}
.meta {{ margin: 6px 0 0; font-size: 14px; color: var(--ink2); }}
.cols {{ display: grid; grid-template-columns: 1.35fr 1fr; gap: 24px; }}
.falas {{ margin: 0; padding-left: 20px; display: grid; gap: 6px; }}
.chips {{ display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }}
.chip {{ background: var(--accsoft); color: var(--acc); border-radius: 999px; padding: 4px 12px; font-size: 14px; font-weight: 500; }}
.fonte {{ font-size: 14px; color: var(--ink2); margin: 0; }}
.pend {{ background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 24px; }}
.pend ul {{ margin: 12px 0 0; padding-left: 20px; display: grid; gap: 6px; }}
@media (max-width: 720px) {{ .cols {{ grid-template-columns: 1fr; }} }}
</style>
<main class=wrap>
  <section>
    <h1>{e(projeto)}</h1>
    <p class=lead>Roteiros para aprovar antes da produção. Os textos abaixo são exatamente o que a voz vai falar e o que aparece na tela.</p>
  </section>
  {f'<section class=decisoes>{decisoes}</section>' if decisoes else ''}
  {f'<section><h2>Quadros de estilo</h2><div class=quadros style="margin-top:20px">{quadros}</div></section>' if quadros else ''}
  <section class=roteiros>
    <h2>Roteiros</h2>
    {''.join(cards)}
  </section>
  {f'<section class=pend><h2>Para confirmar</h2><ul>{pend}</ul></section>' if pend else ''}
</main>
</html>
"""
    os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
    open(dst, "w", encoding="utf-8").write(pagina)
    print("ok", dst)


if __name__ == "__main__":
    main()
