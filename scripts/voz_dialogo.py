# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy", "soundfile", "praat-parselmouth"]
# ///
"""Monta uma narração em diálogo (duas ou mais vozes) a partir das frases já escolhidas por voz_por_frase.py.

  uv run scripts/voz_dialogo.py <pasta voz/id> <saida.wav> --vozes f1,m5,f1,m5,...
        [--pausa 0.30] [--pausa-troca 0.36] [--pausa-curta 0.20]

--vozes  um rótulo por frase do roteiro, na ordem (o mesmo rótulo usado em voz_por_frase.py). Cada rótulo precisa
         do relatório voz/<id>/<rotulo>-frases.relatorio.json. A melhor tomada de cada frase vem desse relatório.
Pausas: --pausa-troca quando a voz muda (dá respiro de diálogo), --pausa-curta entre frases curtas em sequência.
Grava também <saida>.texto.txt com o texto completo e <saida>.vozes.json com quem fala cada frase.
"""
import argparse
import importlib.util
import json
import os

import numpy as np
import soundfile as sf

AQUI = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("voz_por_frase", os.path.join(AQUI, "voz_por_frase.py"))
VPF = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(VPF)
SR = VPF.SR


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pasta"); ap.add_argument("saida")
    ap.add_argument("--vozes", required=True)
    ap.add_argument("--pausa", type=float, default=0.30)
    ap.add_argument("--pausa-troca", type=float, default=0.36)
    ap.add_argument("--pausa-curta", type=float, default=0.20)
    a = ap.parse_args()

    vozes = [v.strip() for v in a.vozes.split(",") if v.strip()]
    rel = {v: json.load(open(os.path.join(a.pasta, f"{v}-frases.relatorio.json"))) for v in set(vozes)}
    n = len(next(iter(rel.values())))
    if len(vozes) != n:
        raise SystemExit(f"--vozes tem {len(vozes)} rótulos, mas o roteiro tem {n} frases")

    itens = [rel[v][i] | {"voz": v} for i, v in enumerate(vozes)]
    partes = []
    for i, it in enumerate(itens):
        x, _ = sf.read(it["escolha"]["wav"])
        x = x.mean(axis=1) if x.ndim > 1 else x
        partes.append(VPF.nivelar(VPF.aparar(x)))
        if i + 1 < len(itens):
            prox = itens[i + 1]
            if it["curta"] and prox["curta"]:
                p = a.pausa_curta
            elif prox["voz"] != it["voz"]:
                p = a.pausa_troca
            else:
                p = a.pausa
            partes.append(np.zeros(int(p * SR)))
    final = np.concatenate([np.zeros(int(0.12 * SR))] + partes + [np.zeros(int(0.3 * SR))])
    final = final / max(1e-9, np.max(np.abs(final))) * 0.89
    sf.write(a.saida, final, SR)
    base = os.path.splitext(a.saida)[0]
    open(base + ".texto.txt", "w").write(" ".join(it["frase"] for it in itens) + "\n")
    json.dump([{"frase": it["frase"], "voz": it["voz"]} for it in itens], open(base + ".vozes.json", "w"), ensure_ascii=False, indent=1)
    print(f"ok {a.saida} ({len(final) / SR:.2f} s)")
    for it in itens:
        print(f"  {it['voz']:>4}  {it['frase']}")


if __name__ == "__main__":
    main()
