"""Find the body page (1-based, as printed in the footer) where each chapter starts, via invisible QQ<mark>QQ markers."""
import json, sys, fitz
doc = fitz.open(sys.argv[1]); res = {}
for i in range(doc.page_count):
    for k in __import__("re").findall(r"QQ([a-z0-9]+)QQ", doc[i].get_text()):
        key = k if k.startswith("c") else "ap-" + k[2:]
        res.setdefault(key, str(i + 1))
print(json.dumps(res))
