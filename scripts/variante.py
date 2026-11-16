"""Cria uma variação de um filme sem reescrever o filme.

uso: python3 scripts/variante.py <pasta-do-filme> <sufixo> [--tema escuro] [--estilo impacto] [--voz voz/<id>/tomada.wav]

  -> <pasta-do-filme>-<sufixo>/ com o mesmo film.js. Tema e estilo vão no index.html (window.TEMA / window.ESTILO);
     --voz troca a narração: refaz vo.json e audio/vo.wav (vo_montar.py) e remapeia os tempos da trilha
     (reveal / cta / hits) pelas palavras, para a música continuar casando com a fala nova.

Exemplos:
  python3 scripts/variante.py exemplos/demo escuro --tema escuro
  python3 scripts/variante.py exemplos/demo impacto --estilo impacto
  python3 scripts/variante.py criativos/c01 voz2 --voz voz/c01/pm_alex-2.wav

Depois rode scripts/finalizar.sh <pasta-nova> previa (trilha, efeitos, mixagem e render).
"""
import json
import os
import shutil
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def arg(nome):
    return sys.argv[sys.argv.index(nome) + 1] if nome in sys.argv else None


def remap(t, old, new):
    """Tempo t na narração antiga -> o mesmo momento falado na nova (linear por partes entre inícios de palavra)."""
    a = [w["t0"] for w in old["words"]] + [old["dur"]]
    b = [w["t0"] for w in new["words"]] + [new["dur"]]
    if t <= a[0]:
        return t - a[0] + b[0]
    for i in range(len(a) - 1):
        if a[i] <= t <= a[i + 1]:
            q = (t - a[i]) / max(1e-6, a[i + 1] - a[i])
            return b[i] + q * (b[i + 1] - b[i])
    return t - a[-1] + b[-1]


def main():
    if len(sys.argv) < 3 or sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0 if len(sys.argv) > 1 else 1)
    src = os.path.abspath(sys.argv[1].rstrip("/"))
    suf = sys.argv[2]
    tema, estilo, voz = arg("--tema"), arg("--estilo"), arg("--voz")
    dst = f"{src}-{suf}"
    if os.path.exists(dst):
        sys.exit(f"já existe: {dst}")
    # copia tudo menos áudio gerado e saídas; a narração tratada (vo.wav) vai junto
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns("audio", "out", "preview", "*.mp4"))
    if os.path.exists(os.path.join(src, "audio", "vo.wav")):
        os.makedirs(os.path.join(dst, "audio"), exist_ok=True)
        shutil.copy(os.path.join(src, "audio", "vo.wav"), os.path.join(dst, "audio", "vo.wav"))
    html = open(os.path.join(src, "index.html"), encoding="utf-8").read()
    sets = []
    if tema:
        sets.append(f"window.TEMA='{tema}';")
    if estilo:
        sets.append(f"window.ESTILO='{estilo}';")
    if estilo == "impacto":
        sets.append("window.FONTES_EXTRA=['italic 900 100px Display','900 100px Display'];")
    tag = '<script type="module" src="film.js"></script>'
    if sets:
        if tag not in html:
            sys.exit("index.html sem a linha do film.js; não sei onde pôr a variação")
        html = html.replace(tag, f"<script>{''.join(sets)}</script>\n{tag}")
    open(os.path.join(dst, "index.html"), "w", encoding="utf-8").write(html)
    if voz:
        vo_old = os.path.join(src, "vo.json")
        if not os.path.exists(vo_old):
            sys.exit("--voz precisa de um filme com vo.json (narração montada por vo_montar.py)")
        old = json.load(open(vo_old, encoding="utf-8"))
        subprocess.run(["uv", "run", "-q", os.path.join(RAIZ, "scripts/vo_montar.py"), dst, os.path.abspath(voz),
                        "--tempo", "1.06", "--pausa-max", "0.5"], check=True)
        new = json.load(open(os.path.join(dst, "vo.json"), encoding="utf-8"))
        tp = os.path.join(dst, "trilha.json")
        if os.path.exists(tp):
            tr = json.load(open(tp, encoding="utf-8"))
            tail = tr["dur"] - old["dur"]
            tr["reveal"] = round(remap(tr["reveal"], old, new), 3)
            if "cta" in tr:
                tr["cta"] = round(remap(tr["cta"], old, new), 3)
            tr["hits"] = [round(remap(h, old, new), 3) for h in tr.get("hits", [])]
            tr["dur"] = round(new["dur"] + tail, 3)
            json.dump(tr, open(tp, "w", encoding="utf-8"))
            fp = os.path.join(dst, "film.json")
            fj = json.load(open(fp, encoding="utf-8"))
            fj["duration"] = tr["dur"]
            json.dump(fj, open(fp, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print("ok", os.path.relpath(dst))


if __name__ == "__main__":
    main()
