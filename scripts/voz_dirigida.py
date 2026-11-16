# /// script
# requires-python = ">=3.10"
# dependencies = ["numpy", "soundfile"]
# ///
"""Voz dirigida pela ElevenLabs (caminho PAGO): aprova o TOM em amostras curtas e só depois gera o roteiro inteiro.

O fluxo que funcionou, na ordem:

  1. amostras  o gancho e o CTA (uns 10 s) em vários ajustes, numerados, para alguém aprovar o TOM de ouvido
  2. bloco     uma voz lê o texto dirigido inteiro numa geração só; N tomadas, cada uma com uma semente
     dialogo   (alternativa) várias vozes numa geração só, pelo /v1/text-to-dialogue
  3. juntar    emenda as melhores tomadas de vozes diferentes, na ordem, num WAV só
  4. depois    uv run scripts/voz_avaliar.py voz/<id>   (filtro às cegas; a aprovação final é de ouvido)
               uv run scripts/vo_montar.py <filme> voz/<id>/<tomada>.wav

  uv run scripts/voz_dirigida.py amostras <voz> <rotulo> --id <id> [--roteiros arq.json]
  uv run scripts/voz_dirigida.py amostras <voz> <rotulo> --texto "..." [--texto-dirigido "[serious] ..."]
  uv run scripts/voz_dirigida.py bloco    <id> <voz> <rotulo> [--tomadas 5] [--modelo eleven_v3]
  uv run scripts/voz_dirigida.py dialogo  <id> <rotulo> [--tomadas 3]
  uv run scripts/voz_dirigida.py juntar   <id> <rotulo> <parte.wav> <parte.wav> [...] [--pausa 0.36]
  uv run scripts/voz_dirigida.py <subcomando> --help

Texto dirigido: marcações de tom entre colchetes ([serious], [warmly], [short pause], ...; só o eleven_v3
obedece), ênfase em CAIXA ALTA e reticências para pausa. Ele vem do campo "falas_dirigidas" do roteiro
(templates/roteiro.json); sem esse campo, usa "falas". O texto LIMPO (sem os colchetes, com a caixa alta
como está) vai para voz/<id>/texto.txt, que é o que voz_avaliar.py e vo_montar.py conferem.

Saída: voz/<id>/<rotulo>-<n>.mp3, o mesmo em .wav (48 kHz, mono) e voz/<id>/texto.txt.
Os caracteres gastos vão para voz/caracteres.log (no eleven_v3, 1 crédito por caractere).
A chave vem de ELEVENLABS_API_KEY, no ambiente ou no arquivo .env (veja .env.example).
--dry-run mostra as requisições e não chama a API (não gasta crédito e não precisa de chave).
Rode da raiz do repositório. Precisa de ffmpeg no PATH.
"""
import argparse
import datetime
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
import urllib.error
import urllib.request

API = "https://api.elevenlabs.io"
SR = 48000
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V3 = "eleven_v3"
V2 = "eleven_multilingual_v2"
FORMATO = "mp3_44100_128"
TAG = re.compile(r"\[[^\[\]]*\]")

# Ajustes das amostras de tom. "dirigido" usa o texto com marcações; os outros usam o texto limpo.
PRESETS = {
    "v3-natural": {"modelo": V3, "estabilidade": 0.5, "dirigido": False, "nota": "v3, estabilidade 0.5"},
    "v3-estavel": {"modelo": V3, "estabilidade": 1.0, "dirigido": False, "nota": "v3, estabilidade 1.0"},
    "v3-dirigida": {"modelo": V3, "estabilidade": 0.5, "dirigido": True, "nota": "v3, estabilidade 0.5, com marcações de tom"},
    "v2": {"modelo": V2, "estabilidade": 0.30, "similaridade": 0.8, "estilo": 0.55, "dirigido": False,
           "nota": "multilingual v2 expressivo (stability 0.30, style 0.55)"},
    "v3-criativa": {"modelo": V3, "estabilidade": 0.0, "dirigido": True, "nota": "v3, estabilidade 0.0 (mais solta), com marcações"},
}
PRESETS_PADRAO = "v3-natural,v3-estavel,v3-dirigida,v2"


# ------------------------------------------------------------------ texto

def limpar(texto):
    """Tira as marcações entre colchetes; a caixa alta e a pontuação ficam como estão."""
    t = TAG.sub(" ", texto)
    t = re.sub(r"\s+", " ", t)
    t = re.sub(r"\s+([,.;:!?…])", r"\1", t)
    return t.strip()


def palavras(texto):
    s = unicodedata.normalize("NFD", limpar(texto).lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.findall(r"[a-z0-9]+", s)


def faixa(spec):
    """'1-11,13' -> {1, ..., 11, 13} (números das falas, começando em 1)."""
    nums = set()
    for parte in spec.split(","):
        parte = parte.strip()
        if not parte:
            continue
        m = re.fullmatch(r"(\d+)(?:-(\d+))?", parte)
        if not m:
            sys.exit(f"--falas: não entendi '{parte}' (use algo como 1-11 ou 12,13)")
        a, b = int(m.group(1)), int(m.group(2) or m.group(1))
        nums.update(range(min(a, b), max(a, b) + 1))
    return nums


def mapa(spec):
    """'f1=ID,m5=ID' -> {'f1': 'ID', 'm5': 'ID'}"""
    out = {}
    for par in (spec or "").split(","):
        if par.strip():
            if "=" not in par:
                sys.exit(f"--vozes: esperava apelido=voice_id, veio '{par}'")
            k, v = par.split("=", 1)
            out[k.strip()] = v.strip()
    return out


# ------------------------------------------------------------------ roteiro

def criativo(caminho, id_):
    if not os.path.exists(caminho):
        sys.exit(f"roteiro não encontrado: {caminho} (modelo em templates/roteiro.json; use --roteiros)")
    rot = json.load(open(caminho, encoding="utf-8"))
    c = next((x for x in rot.get("criativos", []) if x.get("id") == id_), None)
    if c is None:
        ids = ", ".join(x.get("id", "?") for x in rot.get("criativos", []))
        sys.exit(f"criativo '{id_}' não está em {caminho} (ids: {ids})")
    return rot, c


def itens_do(rot, c, campo):
    """Falas do campo pedido como [{'k', 'texto', 'voz'}]. Aceita texto puro ou {"texto"|"frase", "voz"}."""
    usado = campo
    if not c.get(campo):
        usado = next((alt for alt in ("falas_dirigidas", "falas_v3", "falas") if c.get(alt)), None)
        if usado is None:
            sys.exit(f"o criativo '{c.get('id')}' não tem o campo '{campo}' nem 'falas'")
        if usado != campo:
            print(f"aviso: o roteiro não tem '{campo}'; usando '{usado}'", file=sys.stderr)
    bruto = c[usado]
    if isinstance(bruto, str):
        bruto = [bruto]
    itens = []
    for k, f in enumerate(bruto, 1):
        if isinstance(f, dict):
            texto, voz = f.get("texto") or f.get("frase") or f.get("fala"), f.get("voz")
            if not texto:
                sys.exit(f"a fala {k} de '{usado}' não tem 'texto'")
        else:
            texto, voz = f, None
        if texto == "CTA":
            texto = rot.get("cta_fala") or sys.exit("a fala 'CTA' pede o campo cta_fala no roteiro")
        itens.append({"k": k, "texto": texto, "voz": voz})
    return itens, usado


def vozes_de(rot, c, extra):
    v = dict(rot.get("vozes") or {})
    v.update(c.get("vozes") or {})
    v.update(mapa(extra))
    return v


def conferir_voz(voice_id, dry):
    if not dry and (not voice_id or "<" in voice_id or " " in voice_id):
        sys.exit(f"voice_id inválido: '{voice_id}'. Troque pelo id real (liste com: node scripts/eleven.mjs vozes)")
    return voice_id


# ------------------------------------------------------------------ API

def chave():
    if os.environ.get("ELEVENLABS_API_KEY", "").strip():
        return os.environ["ELEVENLABS_API_KEY"].strip()
    for env in (".env", os.path.join(RAIZ, ".env")):
        if os.path.exists(env):
            m = re.search(r"^[ \t]*ELEVENLABS_API_KEY[ \t]*=[ \t]*(.+)$", open(env, encoding="utf-8").read(), re.M)
            if m and m.group(1).strip().strip("\"'"):
                return m.group(1).strip().strip("\"'")
    sys.exit("Falta ELEVENLABS_API_KEY (no ambiente ou no .env; veja .env.example). "
             "Para só ver as requisições, use --dry-run.")


def req_fala(voice_id, texto, modelo, semente, formato, idioma, estabilidade, similaridade, estilo):
    """Uma voz, um texto. v3: language_code + stability. v2: stability, similarity_boost e style."""
    corpo = {"text": texto, "model_id": modelo}
    if modelo == V3:
        if idioma:
            corpo["language_code"] = idioma
        ajustes = {"stability": estabilidade}
    else:
        ajustes = {"stability": estabilidade, "similarity_boost": similaridade, "style": estilo, "use_speaker_boost": True}
    if semente is not None:
        corpo["seed"] = semente
    corpo["voice_settings"] = ajustes
    return f"{API}/v1/text-to-speech/{voice_id}?output_format={formato}", corpo


def req_dialogo(entradas, semente, formato, estabilidade, idioma=None):
    corpo = {"inputs": entradas, "model_id": V3, "settings": {"stability": estabilidade}}
    if idioma:
        corpo["language_code"] = idioma
    if semente is not None:
        corpo["seed"] = semente
    return f"{API}/v1/text-to-dialogue?output_format={formato}", corpo


def explicar(codigo, corpo, formato):
    status = msg = ""
    try:
        d = json.loads(corpo).get("detail", corpo)
        if isinstance(d, dict):
            status, msg = str(d.get("status", "")), str(d.get("message", ""))
        else:
            msg = d if isinstance(d, str) else json.dumps(d, ensure_ascii=False)
    except (ValueError, AttributeError):
        msg = corpo
    tudo = f"{status} {msg}".lower()
    dica = None
    if "output_format" in tudo or ("format" in tudo and any(p in tudo for p in ("tier", "subscription", "plan", "upgrade"))):
        dica = (f"o formato {formato} não está liberado no seu plano. Use --formato mp3_44100_128 (vale em todo plano); "
                "mp3_44100_192 exige o plano Creator e PCM em 44,1 kHz ou mais exige o Pro.")
    elif "missing_permissions" in tudo or "permission" in tudo:
        dica = ("a chave não tem a permissão necessária. Em Developers → API Keys, edite a chave e libere "
                "Text to Speech (e Voices, leitura, para listar vozes).")
    elif "quota" in tudo or "credits" in tudo:
        dica = "os créditos do mês não cobrem esta geração. Veja o saldo com: node scripts/eleven.mjs conta"
    elif "voice_not_found" in tudo or ("voice" in tudo and "not found" in tudo):
        dica = "voice_id não existe nesta conta. Liste as vozes com: node scripts/eleven.mjs vozes"
    elif codigo == 402 or "payment_required" in tudo or "free users" in tudo or "library" in tudo:
        dica = "esta voz ou este recurso pede plano pago (vozes da biblioteca não rodam pela API no plano grátis)."
    elif "language" in tudo:
        dica = "o modelo recusou o language_code. Tente --idioma \"\" para não enviar o idioma."
    elif "stability" in tudo:
        dica = "no eleven_v3 a estabilidade aceita só 0.0, 0.5 ou 1.0."
    elif codigo == 429:
        dica = "muitas requisições ao mesmo tempo. Espere um minuto e rode de novo (as tomadas prontas são puladas)."
    elif codigo == 401 or "invalid_api_key" in tudo:
        dica = "chave recusada. Confira ELEVENLABS_API_KEY no .env (sem aspas, sem espaço sobrando)."
    linha = f"ElevenLabs recusou (HTTP {codigo}{', ' + status if status else ''}): {msg[:500]}"
    return linha + (f"\ndica: {dica}" if dica else "")


def chamar(url, corpo, key, formato):
    req = urllib.request.Request(url, data=json.dumps(corpo).encode("utf-8"), method="POST",
                                 headers={"xi-api-key": key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        sys.exit(explicar(e.code, e.read().decode("utf-8", "replace"), formato))
    except urllib.error.URLError as e:
        sys.exit(f"sem conexão com a ElevenLabs: {e.reason}")


def mostrar(url, corpo, saida):
    print(f"POST {url}\n{json.dumps(corpo, ensure_ascii=False, indent=1)}\n  -> {saida}\n")


def ffmpeg(*argv):
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", *argv], capture_output=True)
    if r.returncode != 0:
        sys.exit(f"ffmpeg falhou: {r.stderr.decode('utf-8', 'replace').strip()[:400]}")
    return r.stdout


def exigir_ffmpeg():
    if not shutil.which("ffmpeg"):
        sys.exit("faltou o ffmpeg no PATH (macOS: brew install ffmpeg; Ubuntu: sudo apt install ffmpeg)")


def extensao(formato):
    if formato.startswith("mp3_"):
        return ".mp3"
    if formato.startswith("pcm_"):
        return ".wav"
    sys.exit(f"formato '{formato}' não é tratado por este script: use mp3_<taxa>_<kbps> (padrão {FORMATO}) ou pcm_<taxa>")


def salvar(dados, base, formato, com_wav=True):
    """Grava a resposta da API em <base>.mp3 (+ <base>.wav 48 kHz mono). PCM vira direto o .wav."""
    if formato.startswith("pcm_"):
        cru = base + ".pcm"
        open(cru, "wb").write(dados)
        ffmpeg("-f", "s16le", "-ar", formato.split("_")[1], "-ac", "1", "-i", cru, "-ar", str(SR), "-ac", "1", base + ".wav")
        os.remove(cru)
        return base + ".wav"
    open(base + ".mp3", "wb").write(dados)
    if com_wav:
        ffmpeg("-i", base + ".mp3", "-ar", str(SR), "-ac", "1", base + ".wav")
    return base + ".mp3"


def registrar(sub, id_, rotulo, modelo, n):
    os.makedirs("voz", exist_ok=True)
    agora = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    open(os.path.join("voz", "caracteres.log"), "a", encoding="utf-8").write(f"{agora} voz_dirigida {sub} {id_} {rotulo} {modelo} {n}\n")


def gravar_texto(pasta, limpo, dry):
    arq = os.path.join(pasta, "texto.txt")
    if dry:
        print(f"{arq} (texto limpo, para a conferência às cegas):\n  {limpo}\n")
        return
    os.makedirs(pasta, exist_ok=True)
    if os.path.exists(arq) and open(arq, encoding="utf-8").read().strip() != limpo:
        print(f"aviso: {arq} mudou; as tomadas antigas desta pasta passam a ser conferidas contra o texto novo", file=sys.stderr)
    open(arq, "w", encoding="utf-8").write(limpo + "\n")


def avisar_v3(modelo, estabilidade):
    if modelo == V3 and estabilidade not in (0.0, 0.5, 1.0):
        print(f"aviso: no eleven_v3 a estabilidade costuma aceitar só 0.0, 0.5 ou 1.0 (veio {estabilidade})", file=sys.stderr)


def resumo(feitas, puladas, chars, dry, modelo):
    if dry:
        print(f"(dry-run) nada foi enviado. Seriam {chars} caracteres"
              + (" (1 crédito por caractere no eleven_v3)." if modelo == V3 else "."))
    else:
        print(f"geradas: {feitas}; já existiam: {puladas}; caracteres gastos nesta rodada: {chars} (voz/caracteres.log).")


# ------------------------------------------------------------------ amostras

def cmd_amostras(a):
    if a.texto:
        limpo, dirigido = a.texto.strip(), (a.texto_dirigido or "").strip()
    elif a.id:
        rot, c = criativo(a.roteiros, a.id)
        base, _ = itens_do(rot, c, "falas")
        pontas = lambda itens: " ".join(dict.fromkeys(x["texto"] for x in (itens[0], itens[-1])))  # noqa: E731
        limpo = limpar(pontas(base))
        dirigido = ""
        if c.get(a.campo):
            dirigido = pontas(itens_do(rot, c, a.campo)[0])
        if a.texto_dirigido:
            dirigido = a.texto_dirigido.strip()
    else:
        sys.exit("amostras: passe --texto \"...\" ou --id <id> (usa a primeira e a última fala do roteiro)")
    nomes = [p.strip() for p in a.presets.split(",") if p.strip()]
    for p in nomes:
        if p not in PRESETS:
            sys.exit(f"preset desconhecido: {p} (há: {', '.join(PRESETS)})")
    voz = conferir_voz(a.voz, a.dry_run)
    ext = extensao(a.formato)
    key = None if a.dry_run else chave()
    if not a.dry_run:
        exigir_ffmpeg()
        os.makedirs(a.pasta, exist_ok=True)
    nums = [int(m.group(1)) for f in (os.listdir(a.pasta) if os.path.isdir(a.pasta) else []) if (m := re.match(r"(\d+)-", f))]
    n = max(nums, default=0)
    indice_arq = os.path.join(a.pasta, "amostras.json")
    indice = json.load(open(indice_arq, encoding="utf-8")) if os.path.exists(indice_arq) else []
    chars = feitas = 0
    for p in nomes:
        cfg = PRESETS[p]
        if cfg["dirigido"] and not TAG.search(dirigido) and dirigido in ("", limpo):
            print(f"pulando {p}: não há texto dirigido (passe --texto-dirigido ou preencha '{a.campo}' no roteiro)")
            continue
        texto = dirigido if cfg["dirigido"] else limpo
        n += 1
        base = os.path.join(a.pasta, f"{n}-{a.rotulo}-{p}")
        url, corpo = req_fala(voz, texto, cfg["modelo"], a.semente, a.formato, a.idioma, cfg["estabilidade"],
                              cfg.get("similaridade", 0.8), cfg.get("estilo", 0.0))
        chars += len(texto)
        if a.dry_run:
            mostrar(url, corpo, base + ext)
            continue
        arq = salvar(chamar(url, corpo, key, a.formato), base, a.formato, com_wav=False)
        registrar("amostras", a.id or "-", f"{a.rotulo}-{p}", cfg["modelo"], len(texto))
        indice.append({"n": n, "arquivo": os.path.basename(arq), "voz": a.rotulo, "preset": p, "ajuste": cfg["nota"],
                       "semente": a.semente, "texto": texto})
        feitas += 1
        print(f"{n}. {arq}   {cfg['nota']}", flush=True)
    if not a.dry_run and feitas:
        json.dump(indice, open(indice_arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"Ouça as amostras de {a.pasta} e aprove o TOM antes de gerar o roteiro inteiro (o que é cada número: {indice_arq}).")
    resumo(feitas, 0, chars, a.dry_run, V3)


# ------------------------------------------------------------------ bloco

def cmd_bloco(a):
    avisar_v3(a.modelo, a.estabilidade)
    parcial = bool(a.falas or a.so_voz)
    if a.texto:
        itens, vozes, c, usado = [{"k": 1, "texto": a.texto.strip(), "voz": None}], mapa(a.vozes), None, "--texto"
        if parcial:
            sys.exit("--falas e --so-voz escolhem falas do roteiro; não combinam com --texto")
    else:
        rot, c = criativo(a.roteiros, a.id)
        itens, usado = itens_do(rot, c, a.campo)
        vozes = vozes_de(rot, c, a.vozes)
        total = len(itens)
        if a.so_voz:
            itens = [x for x in itens if x["voz"] == a.so_voz]
        if a.falas:
            quais = faixa(a.falas)
            if max(quais) > total:
                sys.exit(f"--falas pede a fala {max(quais)}, mas '{usado}' tem {total}")
            itens = [x for x in itens if x["k"] in quais]
        if not itens:
            sys.exit("nenhuma fala sobrou depois de --falas/--so-voz")
    voz = conferir_voz(vozes.get(a.voz, a.voz), a.dry_run)
    dirigido = " ".join(x["texto"] for x in itens)
    if a.modelo != V3 and TAG.search(dirigido):
        print(f"aviso: {a.modelo} não entende marcações entre colchetes; elas foram tiradas do texto enviado", file=sys.stderr)
        dirigido = limpar(dirigido)
    limpo = limpar(dirigido)
    if a.limpo_de_falas:
        if c is None or not c.get("falas"):
            sys.exit("--limpo-de-falas pede um roteiro com o campo 'falas'")
        base, _ = itens_do(rot, c, "falas")
        if parcial and len(base) != total:
            sys.exit(f"--limpo-de-falas com --falas/--so-voz pede 'falas' e '{usado}' com o mesmo número de itens "
                     f"({len(base)} e {total})")
        escolhidas = {x["k"] for x in itens}
        limpo = limpar(" ".join(x["texto"] for x in base if not parcial or x["k"] in escolhidas))
    if c is not None and c.get("falas") and usado != "falas" and not parcial:
        if palavras(" ".join(x["texto"] for x in itens_do(rot, c, "falas")[0])) != palavras(dirigido):
            print(f"aviso: '{usado}' e 'falas' não têm as mesmas palavras; confira o roteiro", file=sys.stderr)
    pasta = a.pasta or os.path.join("voz", f"{a.id}-{a.rotulo}" if parcial else a.id)
    ext = extensao(a.formato)
    key = None if a.dry_run else chave()
    if not a.dry_run:
        exigir_ffmpeg()
    gravar_texto(pasta, limpo, a.dry_run)
    feitas = puladas = chars = 0
    sementes = {}
    for n in range(1, a.tomadas + 1):
        base = os.path.join(pasta, f"{a.rotulo}-{n}")
        semente = a.semente + n - 1
        sementes[f"{a.rotulo}-{n}"] = semente
        if os.path.exists(base + ".wav") or os.path.exists(base + ".mp3"):
            puladas += 1
            continue
        url, corpo = req_fala(voz, dirigido, a.modelo, semente, a.formato, a.idioma, a.estabilidade, a.similaridade, a.estilo)
        chars += len(dirigido)
        if a.dry_run:
            mostrar(url, corpo, f"{base}{ext}" + ("" if ext == ".wav" else f" + {base}.wav"))
            continue
        arq = salvar(chamar(url, corpo, key, a.formato), base, a.formato)
        registrar("bloco", a.id, a.rotulo, a.modelo, len(dirigido))
        feitas += 1
        print(f"ok {arq} (semente {semente})", flush=True)
    if not a.dry_run:
        ajustes = {"stability": a.estabilidade} if a.modelo == V3 else {"stability": a.estabilidade, "similarity_boost": a.similaridade, "style": a.estilo}
        json.dump({"modo": "bloco", "voice_id": voz, "modelo": a.modelo, "idioma": a.idioma if a.modelo == V3 else None,
                   "ajustes": ajustes, "campo": usado, "falas": [x["k"] for x in itens], "sementes": sementes,
                   "texto_enviado": dirigido}, open(os.path.join(pasta, f"{a.rotulo}.geracao.json"), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
    resumo(feitas, puladas, chars, a.dry_run, a.modelo)
    if not a.dry_run:
        print(f"Próximo passo: uv run scripts/voz_avaliar.py {pasta}   (filtra erro de palavra e de tom no fim da frase; "
              "naturalidade e emoção, só de ouvido)")


# ------------------------------------------------------------------ diálogo

def cmd_dialogo(a):
    avisar_v3(V3, a.estabilidade)
    rot, c = criativo(a.roteiros, a.id)
    itens, usado = itens_do(rot, c, a.campo)
    vozes = vozes_de(rot, c, a.vozes)
    if not vozes:
        sys.exit("diálogo pede o mapa 'vozes' no roteiro ({\"f1\": \"<voice_id>\", ...}) ou --vozes f1=ID,m5=ID")
    for x in itens:
        if not x["voz"]:
            sys.exit(f"a fala {x['k']} de '{usado}' não diz quem fala: use {{\"texto\": \"...\", \"voz\": \"f1\"}}")
        if x["voz"] not in vozes:
            sys.exit(f"a fala {x['k']} usa a voz '{x['voz']}', que não está no mapa 'vozes' ({', '.join(vozes)})")
    entradas = []
    for x in itens:
        vid = conferir_voz(vozes[x["voz"]], a.dry_run)
        if entradas and entradas[-1]["voice_id"] == vid and not a.uma_por_fala:
            entradas[-1]["text"] += " " + x["texto"]
        else:
            entradas.append({"text": x["texto"], "voice_id": vid})
    enviado = sum(len(e["text"]) for e in entradas)
    pasta = a.pasta or os.path.join("voz", a.id)
    ext = extensao(a.formato)
    key = None if a.dry_run else chave()
    if not a.dry_run:
        exigir_ffmpeg()
    gravar_texto(pasta, limpar(" ".join(x["texto"] for x in itens)), a.dry_run)
    feitas = puladas = chars = 0
    sementes = {}
    for n in range(1, a.tomadas + 1):
        base = os.path.join(pasta, f"{a.rotulo}-{n}")
        semente = a.semente + n - 1
        sementes[f"{a.rotulo}-{n}"] = semente
        if os.path.exists(base + ".wav") or os.path.exists(base + ".mp3"):
            puladas += 1
            continue
        url, corpo = req_dialogo(entradas, semente, a.formato, a.estabilidade, a.idioma)
        chars += enviado
        if a.dry_run:
            mostrar(url, corpo, f"{base}{ext}" + ("" if ext == ".wav" else f" + {base}.wav"))
            continue
        arq = salvar(chamar(url, corpo, key, a.formato), base, a.formato)
        registrar("dialogo", a.id, a.rotulo, V3, enviado)
        feitas += 1
        print(f"ok {arq} (semente {semente})", flush=True)
    if not a.dry_run:
        json.dump({"modo": "dialogo", "modelo": V3, "ajustes": {"stability": a.estabilidade}, "campo": usado, "sementes": sementes,
                   "falas": [{"frase": limpar(x["texto"]), "voz": x["voz"]} for x in itens], "vozes": vozes},
                  open(os.path.join(pasta, f"{a.rotulo}.geracao.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    resumo(feitas, puladas, chars, a.dry_run, V3)
    if not a.dry_run:
        print(f"Próximo passo: uv run scripts/voz_avaliar.py {pasta}   (a aprovação final é de ouvido)")


# ------------------------------------------------------------------ juntar

def ler_audio(caminho):
    import numpy as np
    if not os.path.exists(caminho):
        sys.exit(f"não achei {caminho}")
    cru = ffmpeg("-i", caminho, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-")
    return np.frombuffer(cru, dtype="<f4").astype(np.float64)


def envelope(a, win):
    import numpy as np
    n = len(a) // win
    if n == 0:
        return np.zeros(0)
    return 20 * np.log10(np.sqrt(np.mean(a[:n * win].reshape(n, win) ** 2, axis=1)) + 1e-12)


def aparar(a, limiar_db=-42.0, folga=0.03):
    """Tira o silêncio do começo e do fim, com uma folga curta (um pouco maior no fim, para a cauda)."""
    import numpy as np
    win = int(0.01 * SR)
    ativos = np.where(envelope(a, win) > limiar_db)[0]
    if not len(ativos):
        return a
    return a[max(0, ativos[0] * win - int(folga * SR)):min(len(a), (ativos[-1] + 1) * win + int(folga * 2 * SR))]


def nivelar(a, alvo_db=-20.0, limiar_db=-42.0):
    """Leva o RMS dos trechos com voz (sem contar as pausas) ao alvo. Devolve (áudio, ganho em dB)."""
    import numpy as np
    win = int(0.01 * SR)
    db = envelope(a, win)
    ativos = np.where(db > limiar_db)[0]
    if not len(ativos):
        return a, 0.0
    n = len(db)
    quadros = a[:n * win].reshape(n, win)[ativos]
    ganho = alvo_db - 20 * np.log10(np.sqrt(np.mean(quadros ** 2)) + 1e-12)
    return a * 10 ** (ganho / 20), float(ganho)


def cmd_juntar(a):
    import numpy as np
    import soundfile as sf
    exigir_ffmpeg()
    k = len(a.partes)
    if a.pausas:
        pausas = [float(x) for x in a.pausas.split(",") if x.strip()]
        if len(pausas) != k - 1:
            sys.exit(f"--pausas pede {k - 1} valor(es) (um por emenda); vieram {len(pausas)}")
    else:
        pausas = [a.pausa] * (k - 1)
    if a.texto:
        textos = [a.texto.strip()]
    else:
        arqs = [os.path.join(os.path.dirname(os.path.abspath(p)), "texto.txt") for p in a.partes]
        if len(set(arqs)) != len(arqs):
            sys.exit("duas partes vêm da mesma pasta (o mesmo texto.txt): passe o texto completo em --texto \"...\"")
        faltam = [t for t in arqs if not os.path.exists(t)]
        if faltam:
            sys.exit(f"faltou o texto de uma parte ({os.path.relpath(faltam[0])}): passe o texto completo em --texto \"...\"")
        textos = [open(t, encoding="utf-8").read().strip() for t in arqs]
    pedacos, relato = [], []
    for i, p in enumerate(a.partes):
        x = ler_audio(p)
        if not a.sem_aparar:
            x = aparar(x)
        x, ganho = nivelar(x, a.alvo_db)
        relato.append({"parte": os.path.relpath(p), "dur": round(len(x) / SR, 2), "ganho_db": round(ganho, 1)})
        pedacos.append(x)
        if i < k - 1:
            pedacos.append(np.zeros(int(pausas[i] * SR)))
    final = np.concatenate([np.zeros(int(0.12 * SR))] + pedacos + [np.zeros(int(0.3 * SR))])
    final = final / max(1e-9, float(np.max(np.abs(final)))) * 0.89
    pasta = a.pasta or os.path.join("voz", a.id)
    os.makedirs(pasta, exist_ok=True)
    n = a.n
    if n is None:
        n = 1
        while os.path.exists(os.path.join(pasta, f"{a.rotulo}-{n}.wav")):
            n += 1
    saida = os.path.join(pasta, f"{a.rotulo}-{n}.wav")
    sf.write(saida, final, SR)
    gravar_texto(pasta, " ".join(textos), False)
    json.dump({"partes": relato, "pausas": pausas, "alvo_db": a.alvo_db}, open(saida[:-4] + ".partes.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    for r in relato:
        print(f"  {r['parte']}  {r['dur']:.2f} s  ganho {r['ganho_db']:+.1f} dB")
    print(f"ok {saida} ({len(final) / SR:.2f} s) + {os.path.join(pasta, 'texto.txt')}")
    print(f"Próximo passo: uv run scripts/voz_avaliar.py {pasta}   e, aprovada de ouvido, uv run scripts/vo_montar.py <filme> {saida}")


# ------------------------------------------------------------------ linha de comando

class Ajuda(argparse.RawDescriptionHelpFormatter):
    def add_usage(self, usage, actions, groups, prefix=None):
        super().add_usage(usage, actions, groups, "uso: " if prefix is None else prefix)


class Analisador(argparse.ArgumentParser):
    def __init__(self, *args, **kw):
        kw.setdefault("formatter_class", Ajuda)
        kw["add_help"] = False
        super().__init__(*args, **kw)
        self._positionals.title = "argumentos"
        self._optionals.title = "opções"
        self.add_argument("-h", "--help", action="help", help="mostra esta ajuda e sai")

    def error(self, message):
        for en, pt in (("the following arguments are required:", "faltou:"), ("unrecognized arguments:", "não conheço:"),
                       ("invalid choice:", "opção inválida:"), ("expected one argument", "faltou o valor"),
                       ("invalid float value:", "não é número:"), ("invalid int value:", "não é número inteiro:"),
                       ("argument ", "")):
            message = message.replace(en, pt)
        self.print_usage(sys.stderr)
        self.exit(2, f"erro: {message}\n(ajuda: {self.prog} --help)\n")


def comuns(p, tomadas=None, campo=True):
    if campo:
        p.add_argument("--roteiros", default="roteiros/roteiros.json", metavar="ARQ",
                       help="arquivo do roteiro (padrão roteiros/roteiros.json; formato em templates/roteiro.json)")
        p.add_argument("--campo", default="falas_dirigidas",
                       help="campo do roteiro com o texto dirigido (padrão falas_dirigidas; se faltar, usa falas)")
        p.add_argument("--vozes", default="", metavar="f1=ID,m5=ID",
                       help="apelido=voice_id; soma ao mapa \"vozes\" do roteiro e ganha dele")
    if tomadas:
        p.add_argument("--tomadas", type=int, default=tomadas, help=f"quantas gerações (padrão {tomadas}); as que já existem são puladas")
    p.add_argument("--semente", type=int, default=1,
                   help="semente da primeira tomada (padrão 1); a tomada n usa semente + n - 1")
    p.add_argument("--formato", default=FORMATO,
                   help=f"output_format da API (padrão {FORMATO}, que vale em todo plano; mp3_44100_192 exige Creator)")
    p.add_argument("--pasta", default=None, help="pasta de saída (padrão: voz/<id>)")
    p.add_argument("--dry-run", action="store_true", help="mostra as requisições e não chama a API (não gasta crédito)")


def main():
    ap = Analisador(prog="voz_dirigida.py", description=__doc__)
    sub = ap.add_subparsers(dest="cmd", metavar="<subcomando>", parser_class=Analisador)
    sub.required = True

    p = sub.add_parser("amostras", help="amostras curtas de tom, numeradas, em vários ajustes", description=(
        "Amostras curtas de TOM: o mesmo trecho (gancho e CTA, uns 10 s) em vários ajustes, em mp3 numerados,\n"
        "para alguém aprovar o tom de ouvido ANTES de gerar o roteiro inteiro.\n\n"
        "presets:\n" + "\n".join(f"  {k:<12} {v['nota']}" for k, v in PRESETS.items()) + "\n\n"
        "Saída: <pasta>/<n>-<rotulo>-<preset>.mp3 e <pasta>/amostras.json (o que é cada número).\n"
        "A numeração continua de onde parou: rode de novo com outra voz para comparar lado a lado.\n\n"
        "exemplos:\n"
        "  uv run scripts/voz_dirigida.py amostras <voice_id> ana --id c01 --roteiros roteiros/roteiros.json\n"
        "  uv run scripts/voz_dirigida.py amostras <voice_id> ana --texto \"Esse vídeo não foi editado. Crie o seu hoje.\" \\\n"
        "      --texto-dirigido \"[serious] Esse vídeo... NÃO foi editado. [excited] Crie o seu hoje!\""))
    p.add_argument("voz", help="voice_id da ElevenLabs (liste com: node scripts/eleven.mjs vozes)")
    p.add_argument("rotulo", help="nome curto da voz; entra no nome do arquivo (ex.: ana)")
    p.add_argument("--texto", help="texto limpo da amostra (curto: gancho + CTA)")
    p.add_argument("--texto-dirigido", help="o mesmo texto com marcações de tom, para os presets dirigidos")
    p.add_argument("--id", help="em vez de --texto: usa a primeira e a última fala deste criativo do roteiro")
    p.add_argument("--roteiros", default="roteiros/roteiros.json", metavar="ARQ", help="arquivo do roteiro (com --id)")
    p.add_argument("--campo", default="falas_dirigidas", help="campo do roteiro com o texto dirigido (padrão falas_dirigidas)")
    p.add_argument("--presets", default=PRESETS_PADRAO, help=f"lista separada por vírgula (padrão {PRESETS_PADRAO})")
    p.add_argument("--idioma", default="pt", help="language_code enviado ao eleven_v3 (padrão pt; \"\" não envia)")
    p.add_argument("--semente", type=int, default=1, help="a mesma semente em todas as amostras (padrão 1)")
    p.add_argument("--formato", default=FORMATO, help=f"output_format da API (padrão {FORMATO})")
    p.add_argument("--pasta", default=os.path.join("voz", "amostras"), help="pasta de saída (padrão voz/amostras)")
    p.add_argument("--dry-run", action="store_true", help="mostra as requisições e não chama a API (não gasta crédito)")
    p.set_defaults(func=cmd_amostras)

    p = sub.add_parser("bloco", help="uma voz lê o texto dirigido inteiro numa geração; N tomadas com sementes diferentes", description=(
        "Uma voz lê o texto dirigido INTEIRO numa geração só (a entonação atravessa as frases).\n"
        "N tomadas, cada uma com uma semente: a tomada n usa --semente + n - 1.\n\n"
        "  eleven_v3               obedece às marcações entre colchetes; envia language_code e stability (0.0, 0.5 ou 1.0)\n"
        "  eleven_multilingual_v2  não entende marcações (são tiradas); envia stability, similarity_boost e style\n\n"
        "Saída: voz/<id>/<rotulo>-<n>.mp3 + .wav (48 kHz mono), voz/<id>/texto.txt (texto limpo) e\n"
        "voz/<id>/<rotulo>.geracao.json (modelo, ajustes, sementes e o texto enviado).\n"
        "Com --falas ou --so-voz (só uma parte do roteiro) a pasta padrão vira voz/<id>-<rotulo>, para o texto.txt\n"
        "bater com a parte; depois emende as partes com o subcomando juntar.\n\n"
        "exemplos:\n"
        "  uv run scripts/voz_dirigida.py bloco c01 <voice_id> ana --tomadas 5\n"
        "  uv run scripts/voz_dirigida.py bloco c01 f1 ana --so-voz f1 --tomadas 5\n"
        "  uv run scripts/voz_dirigida.py bloco c01 m5 beto --so-voz m5 --modelo eleven_multilingual_v2 \\\n"
        "      --estabilidade 0.30 --estilo 0.55 --tomadas 3\n"
        "  uv run scripts/voz_dirigida.py bloco teste <voice_id> ana --texto \"[warmly] Um texto qualquer.\" --dry-run"))
    p.add_argument("id", help="id do criativo no roteiro (vira a pasta voz/<id>)")
    p.add_argument("voz", help="voice_id da ElevenLabs ou um apelido do mapa \"vozes\" do roteiro (ex.: f1)")
    p.add_argument("rotulo", help="nome curto da voz e do ajuste; vira o nome do arquivo (ex.: ana-v3)")
    p.add_argument("--modelo", default=V3, choices=[V3, V2], help=f"padrão {V3}")
    p.add_argument("--idioma", default="pt", help="language_code enviado ao eleven_v3 (padrão pt; \"\" não envia)")
    p.add_argument("--estabilidade", type=float, default=0.5, help="stability (padrão 0.5; no v3: 0.0, 0.5 ou 1.0)")
    p.add_argument("--similaridade", type=float, default=0.8, help="similarity_boost, só no v2 (padrão 0.8)")
    p.add_argument("--estilo", type=float, default=0.55, help="style, só no v2 (padrão 0.55)")
    p.add_argument("--falas", default="", metavar="1-11", help="só estas falas do campo (ex.: 1-11 ou 12,13)")
    p.add_argument("--so-voz", default="", metavar="APELIDO", help="só as falas marcadas com esta voz (\"voz\": \"f1\")")
    p.add_argument("--texto", help="texto dirigido direto na linha de comando, em vez do roteiro")
    p.add_argument("--limpo-de-falas", action="store_true",
                   help="grava o texto.txt a partir do campo falas (a pontuação do roteiro) em vez do texto dirigido sem as marcações")
    comuns(p, tomadas=5)
    p.set_defaults(func=cmd_bloco)

    p = sub.add_parser("dialogo", help="várias vozes numa geração só (/v1/text-to-dialogue, eleven_v3)", description=(
        "Diálogo: duas ou mais vozes numa geração só, pelo /v1/text-to-dialogue (eleven_v3).\n"
        "Cada fala do campo dirigido diz quem fala, e o mapa \"vozes\" do roteiro liga o apelido ao voice_id:\n\n"
        "  \"vozes\": {\"f1\": \"<voice_id>\", \"m5\": \"<voice_id>\"},\n"
        "  \"falas_dirigidas\": [{\"texto\": \"[curious] Quer outra voz?\", \"voz\": \"f1\"},\n"
        "                      {\"texto\": \"[confident] Um comando só.\", \"voz\": \"m5\"}]\n\n"
        "Falas seguidas da mesma voz viram uma entrada só (use --uma-por-fala para mandar uma a uma).\n"
        "Saída: voz/<id>/<rotulo>-<n>.mp3 + .wav, voz/<id>/texto.txt e voz/<id>/<rotulo>.geracao.json.\n\n"
        "exemplo:\n"
        "  uv run scripts/voz_dirigida.py dialogo c01 dueto --tomadas 3 --vozes f1=<voice_id>,m5=<voice_id>"))
    p.add_argument("id", help="id do criativo no roteiro (vira a pasta voz/<id>)")
    p.add_argument("rotulo", help="nome curto; vira o nome do arquivo (ex.: dueto)")
    p.add_argument("--estabilidade", type=float, default=0.5, help="settings.stability (padrão 0.5; aceita 0.0, 0.5 ou 1.0)")
    p.add_argument("--idioma", default="", help="language_code (padrão: não envia)")
    p.add_argument("--uma-por-fala", action="store_true", help="não junta falas seguidas da mesma voz numa entrada")
    comuns(p, tomadas=3)
    p.set_defaults(func=cmd_dialogo)

    p = sub.add_parser("juntar", help="emenda as melhores tomadas de vozes diferentes num WAV só", description=(
        "Emenda tomadas já escolhidas, na ordem dada, num WAV só: tira o silêncio das pontas de cada parte,\n"
        "iguala o volume (RMS dos trechos com voz) e põe uma pausa em cada emenda. Não chama a API.\n"
        "É assim que se monta \"voz 1 nas primeiras frases + voz 2 no fecho\".\n\n"
        "O texto vem do texto.txt ao lado de cada parte, na ordem (ou de --texto).\n"
        "Saída: voz/<id>/<rotulo>-<n>.wav (48 kHz mono), voz/<id>/texto.txt e <rotulo>-<n>.partes.json.\n\n"
        "exemplo:\n"
        "  uv run scripts/voz_dirigida.py juntar c01-final narracao voz/c01-ana/ana-3.wav voz/c01-beto/beto-1.wav --pausa 0.36"))
    p.add_argument("id", help="id da narração montada (vira a pasta voz/<id>)")
    p.add_argument("rotulo", help="nome do arquivo de saída (ex.: narracao)")
    p.add_argument("partes", nargs="+", metavar="parte", help="tomadas (.wav ou .mp3), na ordem em que são faladas")
    p.add_argument("--pausa", type=float, default=0.36, help="silêncio em cada emenda, em segundos (padrão 0.36)")
    p.add_argument("--pausas", default="", metavar="0.36,0.5", help="uma pausa por emenda, quando não são iguais")
    p.add_argument("--alvo-db", type=float, default=-20.0, help="RMS de cada parte nos trechos com voz, em dBFS (padrão -20)")
    p.add_argument("--sem-aparar", action="store_true", help="não tira o silêncio das pontas")
    p.add_argument("--texto", help="texto completo, quando as partes não têm texto.txt ao lado")
    p.add_argument("--n", type=int, default=None, help="número da tomada de saída (padrão: o próximo livre)")
    p.add_argument("--pasta", default=None, help="pasta de saída (padrão: voz/<id>)")
    p.set_defaults(func=cmd_juntar)

    a = ap.parse_args()
    if getattr(a, "tomadas", 1) < 1:
        ap.error("--tomadas precisa ser 1 ou mais")
    a.func(a)


if __name__ == "__main__":
    main()
