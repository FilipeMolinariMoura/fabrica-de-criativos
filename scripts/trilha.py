# /// script
# requires-python = ">=3.10"
# dependencies = ["librosa>=0.10", "numpy", "scipy", "soundfile"]
# ///
"""Trilha sob medida para anúncios no formato problema escuro -> virada -> solução clara -> CTA.

    uv run scripts/trilha.py <pasta-do-filme> [--bpm auto|100] [--key A]
        [--mood tenso|corporativo|tech|energetico|suave] [--lufs -20] [--contraste 4] [--seed N] [--checar]

Lê   <filme>/trilha.json  {"dur": 15.0, "reveal": 4.8, "cta": 11.5, "hits": [2.1], "mood": "tech"}
       dur    duração total (s); reveal: a virada (o golpe que separa problema e solução);
       cta    início do cartão final; hits: acentos extras (s); mood: instrumentação (ver MOODS)
Grava <filme>/audio/music.wav (48 kHz, estéreo, 24 bits, pico < -1 dBTP; é uma CAMA, o -14 LUFS vem no mix.mjs)
      <filme>/beats.json      (bpm, period, offset, beats, downbeats, sections, ... no formato do motion-reel)
--checar grava também <filme>/audio/checagem/: espectrogramas, uma VO fictícia (ruído na faixa da voz)
e a cama abafada por ela com os mesmos parâmetros do mix.mjs, e mede o espaço que sobra para a voz.

Grid: o downbeat cai EXATAMENTE na virada (offset = reveal - k*period, k múltiplo de 4, offset em
[0, compasso)), então o beat 0 é um downbeat e a virada é o beat 4k. Com --bpm auto, o andamento mais
perto de 100 que faz o CTA cair num tempo forte (compasso inteiro depois da virada, senão meio
compasso, senão um tempo).

Os instrumentos vêm de dsp.py do motion-reel: a pasta do skill é a variável SKILL (ou MOTION_REEL_SKILL),
senão vendor/motion-reel/skills/motion-reel, senão ~/.claude/skills/motion-reel.
"""
# Comentários de código em inglês (DSP herdado do motion-reel); tudo o que aparece para o usuário em português.
import argparse
import json
import math
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf
from scipy import signal


def _skill_dir():
    for var in ("SKILL", "MOTION_REEL_SKILL"):
        if os.environ.get(var):
            return Path(os.environ[var]).expanduser().resolve()
    for cand in (Path(__file__).resolve().parent.parent / "vendor/motion-reel/skills/motion-reel",
                 Path.home() / ".claude/skills/motion-reel"):
        if (cand / "scripts/dsp.py").exists():
            return cand
    sys.exit("não achei o skill motion-reel: defina SKILL com a pasta que tem o SKILL.md "
             "(o padrão é vendor/motion-reel/skills/motion-reel)")


SKILL = _skill_dir()
sys.path.insert(0, str(SKILL / "scripts"))
import dsp  # noqa: E402
from dsp import (SR, Bus, bass_note, crash, ebur128, filt, hat, keys, kick, ks_pluck, limit,  # noqa: E402
                 measure_beats, pad_chord, peq, pluck, reverb_ir, riser, sidechain, sub_drop, tvec, whoosh)

NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6,
        "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}

# Small instrumentation changes per mood; the form and harmony stay the same.
MOODS = {
    "tenso":       dict(arp="pluck", hat="hat", hat16=False, bass8=False, kick=1.0, pad=1.0, arp_g=1.0),
    "corporativo": dict(arp="keys", hat="hat", hat16=False, bass8=False, kick=0.9, pad=1.0, arp_g=1.1),
    "tech":        dict(arp="pluck", hat="hat", hat16=True, bass8=False, kick=1.0, pad=0.9, arp_g=1.0),
    "energetico":  dict(arp="pluck", hat="hat", hat16=True, bass8=True, kick=1.1, pad=0.9, arp_g=1.0),
    "suave":       dict(arp="ks", hat=None, hat16=False, bass8=False, kick=0.75, pad=1.3, arp_g=0.85),
}
PADRAO_MOOD = "corporativo"

# Harmony as semitone offsets from the minor tonic T0 (octave 2, e.g. A2). The problem section is
# in the minor key (i - VI - iv - V, harmonic-minor dominant for the pull into the reveal); the
# solution lifts to the relative major (I - V/3 - vi - IV, add9 voicings), the CTA resolves on I.
# Each chord: bass (offset from T0, played an octave below), pad voicing, arpeggio tones (offset
# from T0 + 24, i.e. octave 4/5).
MINOR = {
    "i":    dict(bass=0,  pad=[0, 7, 12, 15]),
    "VI":   dict(bass=-4, pad=[-4, 3, 7, 12]),
    "iv":   dict(bass=5,  pad=[5, 8, 12, 19]),
    "Vsus": dict(bass=-5, pad=[-5, 2, 7, 12]),
    "V":    dict(bass=-5, pad=[-5, 2, 7, 11]),
}
MAJOR = {
    "I":  dict(bass=3,  pad=[3, 10, 17, 19],  arp=[3, 7, 10, 17]),
    "V":  dict(bass=2,  pad=[10, 14, 17, 24], arp=[2, 5, 10, 14]),
    "vi": dict(bass=0,  pad=[7, 12, 15, 22],  arp=[0, 3, 7, 12]),
    "IV": dict(bass=-4, pad=[8, 12, 15, 19],  arp=[8, 12, 15, 19]),
}
ARP_PATTERN = [0, 2, 1, 3, 0, 2, 1, 3]


def m2hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- instruments

def env_end(n, release):
    """Linear ramp to zero over the last `release` seconds (so a sound ends exactly at its length)."""
    t = tvec(n)
    return np.clip((n / SR - t) / max(release, 1e-4), 0, 1)


def sub_pulse(f, length=0.55, decay=0.2, drop=1.7):
    """Low sine thump with a short pitch drop: the problem section's heartbeat."""
    n = int(length * SR)
    t = tvec(n)
    fr = f * (1 + (drop - 1) * np.exp(-t / 0.03))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / decay) * (1 - np.exp(-t / 0.002))
    return np.tanh(1.6 * x) / np.tanh(1.6) * env_end(n, 0.03)


def tick(tock=False):
    """Clock tick: a dry click with metallic resonances kept above ~3 kHz (out of the voice)."""
    n = int(0.06 * SR)
    t = tvec(n)
    fr = (3400, 5150, 7300) if tock else (4200, 6350, 8800)
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.007) for f, a in zip(fr, (1.0, 0.6, 0.35)))
    x += filt(dsp.rng.standard_normal(n), "bandpass", [3000, 10000]) * np.exp(-t / 0.0025) * 0.9
    return filt(x, "highpass", 2600, 2) * (1 - np.exp(-t / 0.0003)) * env_end(n, 0.01)


def shaker():
    n = int(0.09 * SR)
    t = tvec(n)
    return filt(dsp.rng.standard_normal(n), "highpass", 5500) * np.sin(np.pi * np.clip(t / 0.09, 0, 1)) ** 2


def bell(f, length=3.5, bright=1.0):
    """FM bell (inharmonic partials) for the CTA and the light accents."""
    n = int(length * SR)
    t = tvec(n)
    idx = 2.2 * bright * np.exp(-t / 0.35)
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * 3.5 * f * t)) * np.exp(-t / (length * 0.38))
    x += 0.35 * np.sin(2 * np.pi * 2.756 * f * t) * np.exp(-t / 0.6)
    x += 0.18 * np.sin(2 * np.pi * 5.404 * f * t) * np.exp(-t / 0.22)
    return x * (1 - np.exp(-t / 0.0015)) * env_end(n, 0.05)


def drone(f, length):
    """Dark sustained low tone for the problem section: sine + a filtered saw, slow breathing."""
    n = int(length * SR)
    t = tvec(n)
    x = np.sin(2 * np.pi * f * t) * 0.8 + filt(dsp.saw(f * 2, n), "lowpass", 220, 2) * 0.5
    breath = 0.8 + 0.2 * np.sin(2 * np.pi * 0.21 * t - np.pi / 2)
    return x * breath * np.clip(t / 1.2, 0, 1) * env_end(n, 0.03)


def impact():
    """The reveal hit's body: a low boom + pitched punch, no harsh top."""
    n = int(2.6 * SR)
    t = tvec(n)
    boom = filt(dsp.rng.standard_normal(n), "lowpass", 160, 2) * np.exp(-t / 0.16) * 2.2
    body = np.sin(2 * np.pi * np.cumsum(50 + 110 * np.exp(-t / 0.035)) / SR) * np.exp(-t / 0.4)
    x = np.tanh(1.4 * (boom + body)) * (1 - np.exp(-t / 0.0006))
    air = filt(crash(2.6)[:n], "lowpass", 7500, 2) * 0.22
    return x + air


def suck(n, length=0.045, floor=0.3):
    """Gain curve that dips to `floor` over the last `length` s (the breath before a hit)."""
    g = np.ones(n)
    m = min(n, int(length * SR))
    g[n - m:] = np.linspace(1, floor, m) ** 1.5
    return g


def snap():
    """Broadband, very short transient so the reveal reads as a clean attack."""
    n = int(0.25 * SR)
    t = tvec(n)
    x = filt(dsp.rng.standard_normal(n), "highpass", 1200, 2) * np.exp(-t / 0.018)
    x += filt(dsp.rng.standard_normal(n), "bandpass", [300, 1200]) * np.exp(-t / 0.008) * 0.6
    return x * (1 - np.exp(-t / 0.0004))


def arp_note(kind, f, length):
    if kind == "keys":
        return keys([f], length) * 1.2
    if kind == "ks":
        return ks_pluck(f, length, bright=0.45, buzz=0.0) * 0.9
    return pluck([f], length, cutoff=2600)


# ---------------------------------------------------------------- grid

def choose_bpm(arg, reveal, cta, target=100.0):
    if arg != "auto":
        return float(arg), "fixo"
    gap = cta - reveal
    if gap <= 0:
        return target, "padrão (sem CTA depois da virada)"
    for unit, label, tol in ((4, "compasso inteiro", 9), (2, "meio compasso", 9), (1, "tempo", 12)):
        n = max(1, round(gap * target / 60 / unit))
        best = min((abs(60 * unit * k / gap - target), 60 * unit * k / gap) for k in (n - 1, n, n + 1) if k > 0)
        if best[0] <= tol:
            return round(best[1], 4), f"auto: CTA a {round(gap * best[1] / 60 / unit)} x {label} da virada"
    return target, "padrão"


# ---------------------------------------------------------------- measurement helpers

def lufs_of(x, tmpdir, name):
    """Integrated loudness (EBU R128 via ffmpeg) of a stereo array (2, n)."""
    p = Path(tmpdir) / f"{name}.wav"
    sf.write(p, x.T, SR, subtype="FLOAT")
    return ebur128(p)


def band_power_db(x, mask, lo=300, hi=3000):
    """Mean power (dB) of x in the [lo, hi] band, over the samples where mask is true."""
    y = filt(x, "bandpass", [lo, hi], 4)
    return 10 * np.log10(np.mean(y[mask] ** 2) + 1e-20)


# ---------------------------------------------------------------- the score

def build(cfg, bpm, key, mood_name):
    dur, reveal, cta = cfg["dur"], cfg["reveal"], cfg["cta"]
    hits = cfg.get("hits", [])
    mood = MOODS[mood_name]
    P = 60.0 / bpm
    BAR = 4 * P
    k_bars = math.floor(reveal / BAR + 1e-9)
    OFF = reveal - k_bars * BAR              # beat 0 is a downbeat; the reveal is beat 4*k_bars
    RB = 4 * k_bars

    def T(b):
        return OFF + b * P

    n = int(round(dur * SR))
    b_first = math.ceil(-OFF / P - 1e-9)     # first beat at t >= 0 (a negative pickup beat)
    b_last_sol = math.ceil((cta - OFF) / P - 1e-9)   # first beat at or after the CTA

    tonic_pc = NOTE[key]
    T0 = 45 + ((tonic_pc - 9 + 6) % 12) - 6  # minor tonic in octave 2 (A2 = 45), nearest to A2
    rel = T0 + 3                              # relative major tonic

    kick_b, low, bass_b, perc, prob, ton, fx = (Bus(dur, bpm) for _ in range(7))
    grid_b = Bus(dur, bpm)   # silent stem with only on-grid hits, for measuring the grid

    def add(bus, sig, t, gain=1.0, pan=0.0):
        bus.add(sig, 0, gain, pan, at=t)

    def add_ending_at(bus, sig, t_end, gain=1.0, pan=0.0):
        """Place a sound so its last sample lands exactly on t_end (risers, reverse swells)."""
        ln = sig.shape[-1]
        start = int(round(t_end * SR)) - ln
        if start < 0:
            sig = sig[..., -start:]
            start = 0
        bus.add(sig, 0, gain, pan, at=start / SR)

    # ================= PROBLEM (0 .. reveal): minor, dark, sparse, building
    # chord per bar, counted back from the reveal: ... i  VI  iv  V | reveal
    j_first = math.floor(b_first / 4)
    prob_chords = {}
    n_prob_bars = k_bars - j_first
    tail_seq = {1: ["i"], 2: ["i", "V"], 3: ["i", "iv", "V"]}.get(n_prob_bars, ["i", "VI", "iv", "V"])
    for j in range(j_first, k_bars):
        back = k_bars - 1 - j
        if back < len(tail_seq):
            prob_chords[j] = tail_seq[len(tail_seq) - 1 - back]
        else:   # earlier bars: i and VI in pairs of bars, landing on the tail's opening i
            prob_chords[j] = "VI" if ((back - len(tail_seq)) // 2) % 2 == 0 else "i"

    def prog(t):
        return float(np.clip(t / max(reveal, 1e-6), 0, 1))

    # drone on the tonic under the whole problem section, ends exactly on the reveal
    add(low, drone(m2hz(T0 - 12), reveal), 0.0, 0.2)

    # dark pad, one chord per bar; the filter opens toward the reveal (the build)
    for j in range(j_first, k_bars):
        t0 = max(0.0, T(4 * j))
        t1 = min(reveal, T(4 * j + 4))
        if t1 - t0 < 0.05:
            continue
        name = prob_chords[j]
        notes = [m2hz(T0 + s) for s in MINOR[name]["pad"]]
        c0, c1 = 320 + 700 * prog(t0) ** 1.5, 320 + 700 * prog(t1) ** 1.5
        last = j == k_bars - 1
        ln = (t1 - t0) if last else (t1 - t0) + 0.35
        if last and name == "V" and t1 - t0 > 2 * P:      # the final bar: sus4 for half, then the major third
            half = t0 + (t1 - t0) / 2
            notes_s = [m2hz(T0 + s) for s in MINOR["Vsus"]["pad"]]
            add(prob, pad_chord(notes_s, half - t0 + 0.3, (c0, (c0 + c1) / 2), 0.25, 0.3, 5, 0.08), t0, 0.6)
            add(prob, pad_chord(notes, t1 - half, ((c0 + c1) / 2, c1), 0.25, 0.03, 5, 0.08), half, 0.6)
        else:
            add(prob, pad_chord(notes, ln, (c0, c1), 0.6 if t0 == 0 else 0.3, 0.35 if not last else 0.03, 5, 0.08),
                t0, 0.6)

    # sub pulses: lub-dub on beat 1, a weaker pulse on beat 3; every beat in the second half
    for b in range(b_first, RB):
        t = T(b)
        if t < 0 or t >= reveal - 0.02:
            continue
        p = prog(t)
        root = m2hz(T0 - 12 + MINOR[prob_chords[math.floor(b / 4)]]["bass"])
        root = root * 2 if root < 41 else root
        if b % 4 == 0:
            add(low, sub_pulse(root, 0.6, 0.22), t, 0.7 + 0.15 * p)
            if T(b + 0.5) < reveal - 0.05:
                add(low, sub_pulse(root, 0.4, 0.12), T(b + 0.5), 0.38 + 0.1 * p)
        elif b % 4 == 2 or p > 0.5:
            add(low, sub_pulse(root, 0.5, 0.18), t, 0.45 + 0.25 * p)

    # the ticking clock: tick-tock on every beat; the last bar accelerates into the reveal
    roll_start = max(0.0, reveal - BAR)
    for b in range(b_first, RB):
        t = T(b)
        if t < 0:
            continue
        add(grid_b, tick(), t, 1.0)
        if t >= roll_start - 1e-6:
            continue
        p = prog(t)
        add(perc, tick(tock=b % 2 == 1), t, (0.30 if b % 2 == 0 else 0.22) + 0.12 * p, pan=0.12 if b % 2 else -0.12)
        # the hi-hat motif joins on the off-beats once the build starts
        if p > 0.35:
            add(perc, hat(), T(b + 0.5), 0.05 + 0.07 * p, pan=0.3)
    K = 22
    for i in range(K):
        q = i / K
        t = roll_start + (reveal - roll_start) * (1 - (1 - q) ** 1.6)
        add(perc, tick(tock=i % 2 == 1), t, 0.2 + 0.25 * q, pan=0.25 * (1 if i % 2 else -1))

    # riser + reverse cymbal, both END exactly on the reveal
    # A short "suck" in the last 45 ms (down to 30 %) makes the hit punch; the sound still ends on the reveal.
    r_len = min(2 * BAR, 0.7 * reveal)
    rs = riser(r_len) * suck(int(r_len * SR))
    add_ending_at(fx, rs, reveal, 0.3)
    rc = filt(crash(min(BAR, r_len))[::-1].copy(), "lowpass", 9000, 2)
    add_ending_at(fx, rc * suck(len(rc)), reveal, 0.2)

    # ================= THE REVEAL HIT: sub drop + soft impact + a broadband transient
    add(low, sub_drop(1.8, m2hz(T0 - 12 + 3) * 2, m2hz(T0 - 12 + 3) * 0.75), reveal, 0.95)
    add(low, impact(), reveal, 0.55)
    add(fx, snap(), reveal, 0.35)
    add(ton, bell(m2hz(rel + 36), 2.2, 0.6), reveal, 0.10, pan=0.15)   # a glint on top of the hit

    # ================= SOLUTION (reveal .. cta): relative major, confident, never busy
    sol_chords = {}
    j_cta = math.ceil((cta - OFF) / BAR - 1e-9)       # bar index at/after the CTA
    for j in range(k_bars, j_cta):
        sol_chords[j] = ["I", "V", "vi", "IV"][(j - k_bars) % 4]

    def sol_chord_at(b):
        j = math.floor(b / 4)
        if j == j_cta - 1 and j > k_bars:              # the cadence bar: IV for 2 beats, then V
            return "IV" if (b - 4 * j) < 2 else "V"
        return sol_chords[j]

    kick_times = []
    for b in range(RB, b_last_sol):
        t = T(b)
        if t >= cta - 1e-6:
            break
        add(kick_b, kick(soft=True), t, 0.5 * mood["kick"])
        add(grid_b, kick(), t, 1.0)
        kick_times.append(t)
        # off-beat hats from the second bar, 16ths for "tech" / "energetico"
        if b >= RB + 4 and mood["hat"]:
            h = hat() if mood["hat"] == "hat" else shaker()
            add(perc, h, T(b + 0.5), 0.09, pan=0.25)
            if mood["hat16"]:
                add(perc, hat(), T(b + 0.25), 0.035, pan=-0.25)
                add(perc, hat(), T(b + 0.75), 0.035, pan=-0.25)

    # bass: the chord root, one note per chord (8ths for "energetico"), pumped by the kick
    b = RB
    while T(b) < cta - 1e-6:
        name = sol_chord_at(b)
        step = 0.5 if mood["bass8"] else 1.0
        nb = 1
        if not mood["bass8"]:
            while T(b + nb) < cta - 1e-6 and sol_chord_at(b + nb) == name and (b + nb) % 4 != 0:
                nb += 1
        ln = min(nb * step * P, cta - T(b))
        root = T0 - 12 + MAJOR[name]["bass"]
        add(bass_b, bass_note(m2hz(root), ln * 0.97, 520), T(b), 0.7)
        b += nb * step

    # warm pad, one per chord change
    b = RB
    while T(b) < cta - 1e-6:
        name = sol_chord_at(b)
        nb = 1
        while T(b + nb) < cta - 1e-6 and sol_chord_at(b + nb) == name:
            nb += 1
        ln = min(nb * P, cta - T(b))
        end_at_cta = T(b + nb) >= cta - 1e-6
        notes = [m2hz(T0 + s) for s in MAJOR[name]["pad"]]
        add(ton, pad_chord(notes, ln + (0.0 if end_at_cta else 0.3), 1900, 0.12, 0.04 if end_at_cta else 0.3, 5, 0.1),
            T(b), 0.8 * mood["pad"])
        b += nb

    # plucked arpeggio in 8ths over the chord tones
    h = 0
    while True:
        bb = RB + h * 0.5
        t = T(bb)
        if t >= cta - 1e-6:
            break
        tones = MAJOR[sol_chord_at(bb)]["arp"]
        f = m2hz(T0 + 24 + tones[ARP_PATTERN[h % 8]])
        accent = 1.0 if h % 2 == 0 else 0.78
        ln = 0.5 if mood["arp"] == "keys" else (0.6 if mood["arp"] == "ks" else 0.24)
        add(ton, arp_note(mood["arp"], f, ln), t, 0.36 * accent * mood["arp_g"], pan=0.28 * (1 if h % 4 < 2 else -1))
        h += 1

    # a short reverse swell that ends exactly on the CTA
    if cta < dur:
        add_ending_at(fx, whoosh(min(P * 1.5, cta - reveal), 500, 6000, 0.97, 1.2, 2.2), cta, 0.12)

    # ================= CTA (cta .. dur): resolving I(add9) + bell, energy down, clean tail
    if cta < dur:
        tail = dur - cta + 0.6
        notes = [m2hz(T0 + s) for s in (3, 10, 15, 17, 19, 22)]     # C3 G3 C4 D4 E4 G4 for A minor
        add(ton, pad_chord(notes, tail, (2600, 700), 0.015, 1.2, 5, 0.1), cta, 0.62 * mood["pad"])
        add(low, bass_note(m2hz(T0 - 12 + 3), min(2.4, tail), 380) * env_end(int(min(2.4, tail) * SR), 1.5),
            cta, 0.6)
        # a warm sustained root under the end card (sine, slow decay to the end)
        nt = int(tail * SR)
        tt = tvec(nt)
        root_f = m2hz(T0 - 12 + 3)
        warm = (np.sin(2 * np.pi * root_f * tt) + 0.25 * np.sin(2 * np.pi * 2 * root_f * tt)) * np.exp(-tt / 2.2)
        add(low, warm * (1 - np.exp(-tt / 0.01)) * env_end(nt, 0.3), cta, 0.4)
        add(kick_b, kick(soft=True), cta, 0.5 * mood["kick"])
        add(ton, bell(m2hz(rel + 24), 4.0, 1.0), cta, 0.24, pan=-0.05)
        add(ton, bell(m2hz(rel + 31), 3.2, 0.7), cta + P / 2, 0.10, pan=0.25)

    # ================= extra accents from trilha.json
    for th in hits:
        if not (0 <= th < dur):
            continue
        if th < reveal:     # dark: low thump + a cold metallic ping
            add(low, sub_pulse(m2hz(T0 - 12) * (2 if m2hz(T0 - 12) < 41 else 1), 0.9, 0.35, 2.2), th, 0.8)
            add(prob, filt(bell(m2hz(T0 + 24 + 7), 1.0, 0.5), "lowpass", 3500, 2), th, 0.14, pan=-0.2)
        else:               # light: a glass ding
            add(ton, bell(m2hz(rel + 36 + 7), 1.6, 0.5), th, 0.08, pan=0.2)

    # ================= mix
    N_all = kick_b.x.shape[1]
    pump = sidechain(kick_times, N_all, 0.38, 0.11)

    # problem room: darker and longer; gated at the reveal so the hit lands clean
    ir_dark = reverb_ir(2.4, 0.7, seed_=11)
    ir_dark = np.stack([filt(c, "lowpass", 2500) for c in ir_dark])
    prob_wet = np.stack([signal.fftconvolve(prob.x[c], ir_dark[c])[:N_all] for c in range(2)])
    prob_all = prob.x * 0.9 + prob_wet * 0.55
    g = np.zeros(N_all)
    r_i = int(round(reveal * SR))
    fade = int(0.03 * SR)
    g[: r_i - fade] = 1
    g[r_i - fade: r_i] = np.linspace(1, 0, fade)
    prob_all *= g

    ir = reverb_ir(1.8, 0.45, seed_=7)
    ton_src = ton.x * pump + fx.x * 0.3 + perc.x * 0.12
    ton_wet = np.stack([signal.fftconvolve(ton_src[c], ir[c])[:N_all] for c in range(2)])

    tonal = prob_all + ton.x * pump * 0.85 + ton_wet * 0.32 + fx.x * 0.8
    # leave room for the voice: a broad dip in the 0.4-3 kHz band of the tonal layers
    tonal = np.stack([peq(peq(c, 1500, -3.5, 0.7), 500, -1.5, 1.0) for c in tonal])

    bed = (kick_b.x * 0.9 + low.x * 0.8 + bass_b.x * pump * 0.75 + perc.x * 0.8 + tonal)
    bed = np.stack([filt(c, "highpass", 28, 2) for c in bed])[:, :n]
    fi = int(0.004 * SR)
    bed[:, :fi] *= np.linspace(0, 1, fi)
    fo = int(0.4 * SR)
    bed[:, -fo:] *= np.linspace(1, 0, fo) ** 2

    drums = grid_b.x[:, :n].mean(axis=0)
    grid = dict(bpm=bpm, P=P, OFF=OFF, RB=RB, b_first=b_first, k_bars=k_bars,
                prob_chords=prob_chords, sol_chords=sol_chords, T0=T0)
    return bed, drums, grid


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description="Trilha sob medida (problema -> virada -> solução -> CTA).")
    ap.add_argument("film", help="pasta do filme (com trilha.json)")
    ap.add_argument("--bpm", default="auto", help="andamento; 'auto' (padrão) acha o mais perto de 100 que põe o CTA no grid")
    ap.add_argument("--key", default="A", help="tônica menor da parte do problema (a solução vai para a relativa maior)")
    ap.add_argument("--mood", default=None, help="sobrepõe o mood do trilha.json: " + ", ".join(MOODS))
    ap.add_argument("--lufs", type=float, default=-20.0, help="loudness integrado da cama (padrão -20 LUFS)")
    ap.add_argument("--contraste", type=float, default=4.0,
                    help="quantos dB a solução fica acima do problema (padrão 4; o problema é ajustado)")
    ap.add_argument("--seed", type=int, default=20261114)
    ap.add_argument("--checar", action="store_true", help="espectrogramas + teste com VO fictícia em audio/checagem/")
    a = ap.parse_args()

    film = Path(a.film).resolve()
    cfg_path = film / "trilha.json"
    if not cfg_path.exists():
        sys.exit(f"faltou {cfg_path}")
    cfg = json.loads(cfg_path.read_text(encoding="utf-8"))
    dur = float(cfg["dur"])
    reveal = float(cfg["reveal"])
    cta = float(cfg.get("cta", dur))
    if not (0 < reveal < dur):
        sys.exit("reveal precisa estar entre 0 e dur")
    if not (reveal < cta <= dur):
        sys.exit("cta precisa estar entre reveal e dur")
    cfg.update(dur=dur, reveal=reveal, cta=cta, hits=[float(h) for h in cfg.get("hits", [])])
    key = a.key.strip().capitalize() if len(a.key.strip()) == 1 else a.key.strip()[0].upper() + a.key.strip()[1:]
    if key not in NOTE:
        sys.exit(f"tom desconhecido: {a.key}")
    mood = (a.mood or cfg.get("mood") or PADRAO_MOOD).lower()
    if mood not in MOODS:
        print(f"aviso: mood '{mood}' desconhecido ({', '.join(MOODS)}), usando {PADRAO_MOOD}")
        mood = PADRAO_MOOD

    dsp.seed(a.seed)
    bpm, why = choose_bpm(a.bpm, reveal, cta)
    print(f"trilha: {film.name} | {dur:.2f} s | virada {reveal:.3f} s | CTA {cta:.3f} s | tom {key} menor -> "
          f"relativa maior | mood {mood}")
    print(f"andamento: {bpm:g} bpm ({why})")

    bed, drums, gi = build(cfg, bpm, key, mood)
    P, OFF = gi["P"], gi["OFF"]
    n = bed.shape[1]

    audio = film / "audio"
    audio.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        # section contrast: scale the problem section so the solution sits --contraste dB above it
        # (only problem material exists before the reveal; the gain eases back to 1 over 40 ms after
        # the hit so tails crossing the reveal don't step)
        r_i, c_i = int(round(reveal * SR)), int(round(cta * SR))
        Ip0, _ = lufs_of(bed[:, :r_i], tmp, "prob0")
        Is0, _ = lufs_of(bed[:, r_i:c_i], tmp, "sol0")
        g_db = float(np.clip(Is0 - a.contraste - Ip0, -8, 3))
        g = np.ones(n)
        g[:r_i] = 10 ** (g_db / 20)
        ramp = int(0.04 * SR)
        g[r_i:r_i + ramp] = np.linspace(10 ** (g_db / 20), 1, ramp)
        bed = bed * g
        print(f"contraste: problema {Ip0:.1f} / solução {Is0:.1f} LUFS antes; problema {g_db:+.1f} dB")
        # loudness: bring the bed to the target, then a true-peak-safe limiter, re-measure
        I0, _ = lufs_of(bed, tmp, "pre")
        gain = 10 ** ((a.lufs - I0) / 20)
        ceiling = -1.5
        for _ in range(4):
            out = limit(bed * gain, ceiling_db=ceiling)
            I, TP = lufs_of(out, tmp, "post")
            if TP < -1.0:
                break
            ceiling -= 0.3
        sf.write(audio / "music.wav", out.T, SR, subtype="PCM_24")
        I, TP = ebur128(audio / "music.wav")
        sample_peak = 20 * np.log10(np.abs(out).max() + 1e-12)

        Ip, _ = lufs_of(out[:, :r_i], tmp, "prob")
        Is, _ = lufs_of(out[:, r_i:c_i], tmp, "sol")
        Ic, _ = lufs_of(out[:, c_i:], tmp, "cta") if n - c_i > int(0.5 * SR) else (float("nan"), 0)

    # ---------------- beats.json (the designed grid; checked against the drum stem below)
    i0 = gi["b_first"]
    i1 = math.floor((dur + 0.5 - OFF) / P)
    beats = [round(OFF + P * i, 5) for i in range(i0, i1 + 1)]
    downbeats = [round(OFF + P * i, 5) for i in range(i0, i1 + 1) if i % 4 == 0]
    meas = measure_beats(drums, SR, bpm)
    d_off = ((meas["offset"] - OFF + P / 2) % P) - P / 2
    mono = out.mean(axis=0)
    BAR = 4 * P
    o = max(0.0, OFF)
    bar_energy = [round(float(np.sqrt(np.mean(mono[int((o + i * BAR) * SR):int((o + (i + 1) * BAR) * SR)] ** 2) + 1e-12)), 4)
                  for i in range(int((dur - o) / BAR))]
    U = lambda t: round((t - OFF) / P, 4)  # noqa: E731
    grid = {
        "bpm": round(bpm, 4), "period": round(P, 6), "offset": round(OFF, 5),
        "beats": beats, "downbeats": downbeats,
        "sections": [{"name": "problema", "beat": U(0.0), "t": 0.0},
                     {"name": "virada", "beat": U(reveal), "t": reveal},
                     {"name": "solucao", "beat": U(reveal), "t": reveal},
                     {"name": "cta", "beat": U(cta), "t": cta}],
        "reveal": reveal, "reveal_beat": U(reveal), "cta": cta, "cta_beat": U(cta),
        "hits": [{"t": h, "beat": U(h)} for h in cfg["hits"]],
        "bar_energy": bar_energy, "duration": dur, "designed_bpm": round(bpm, 4),
        "detected": meas["detected"], "fit_inliers": meas["fit_inliers"], "fit_residual_ms": meas["fit_residual_ms"],
        "measured": {"bpm": meas["bpm"], "offset_error_ms": round(d_off * 1000, 2)},
        "key": f"{key} menor -> relativa maior", "mood": mood,
        "source": "scripts/trilha.py: grid projetado (downbeat na virada), conferido no stem de bateria com measure_beats",
    }
    (film / "beats.json").write_text(json.dumps(grid, indent=1), encoding="utf-8")

    # ---------------- checks
    # onset at the reveal and at the CTA (librosa, on the finished bed)
    hop = 128
    env = librosa.onset.onset_strength(y=mono.astype(np.float32), sr=SR, hop_length=hop)
    ons = librosa.onset.onset_detect(onset_envelope=env, sr=SR, hop_length=hop, units="time")
    onsb = librosa.onset.onset_detect(onset_envelope=env, sr=SR, hop_length=hop, units="time", backtrack=True)

    def nearest(arr, t):
        return float(arr[np.argmin(np.abs(arr - t))]) if len(arr) else float("nan")

    et = librosa.times_like(env, sr=SR, hop_length=hop)
    win = (et > reveal - 0.5) & (et < reveal + 0.5)
    peak_t = float(et[win][np.argmax(env[win])])
    rel_strength = float(env[win].max() / (np.median(env) + 1e-9))

    print(f"grid: período {P:.4f} s, offset {OFF:.4f} s, virada no beat {gi['RB']} (downbeat, compasso {gi['k_bars']}), "
          f"CTA no beat {U(cta):g}")
    print(f"      medido no stem de bateria: {meas['bpm']} bpm, erro de fase {d_off * 1000:+.1f} ms, "
          f"{meas['fit_inliers']}/{len(meas['detected'])} inliers, rms {meas['fit_residual_ms']} ms")
    print(f"acordes problema: " + " ".join(f"c{j}:{c}" for j, c in sorted(gi["prob_chords"].items())))
    print(f"acordes solução:  " + " ".join(f"c{j}:{c}" for j, c in sorted(gi["sol_chords"].items())) + " | CTA: I(add9)")
    print(f"loudness: total {I:.1f} LUFS, pico real {TP:.1f} dBTP, pico de amostra {sample_peak:.2f} dBFS")
    print(f"          problema {Ip:.1f} LUFS | solução {Is:.1f} LUFS ({Is - Ip:+.1f} dB) | CTA {Ic:.1f} LUFS")
    print(f"onset na virada: pico do onset em {peak_t:.3f} s ({(peak_t - reveal) * 1000:+.0f} ms, força {rel_strength:.1f}x a mediana); "
          f"onset detectado mais próximo {nearest(ons, reveal):.3f} s, com backtrack {nearest(onsb, reveal):.3f} s")
    print(f"onset no CTA: detectado mais próximo {nearest(ons, cta):.3f} s ({(nearest(ons, cta) - cta) * 1000:+.0f} ms)")
    for h in cfg["hits"]:
        print(f"acento {h:.3f} s: onset mais próximo {nearest(ons, h):.3f} s; beat {U(h):.2f} (fora do grid "
              f"{(U(h) - round(U(h))) * P * 1000:+.0f} ms)")
    if TP >= -1.0:
        print("AVISO: pico real >= -1 dBTP")
    print(f"-> {audio / 'music.wav'}\n-> {film / 'beats.json'}")

    if a.checar:
        check(film, out, reveal, cta, dur)


def check(film, music, reveal, cta, dur):
    """Spectrograms + a dummy mid-range 'voice' to see the room the bed leaves (same duck as mix.mjs)."""
    d = film / "audio" / "checagem"
    d.mkdir(parents=True, exist_ok=True)
    n = music.shape[1]
    r = np.random.default_rng(7)
    t = tvec(n)
    # speech-like noise: pink-ish noise band-limited to 300 Hz-3 kHz, syllable rate ~4.5 Hz,
    # phrases of ~2.4 s with ~0.5 s pauses, starting at 0.4 s
    white = r.standard_normal(n)
    pink = signal.lfilter([0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400], white)
    v = filt(pink, "bandpass", [300, 3000], 4)
    syl = 0.5 + 0.5 * np.sin(2 * np.pi * 4.5 * t + 1.3 * np.sin(2 * np.pi * 0.7 * t))
    phrase = ((t - 0.4) % 2.9 < 2.4) & (t > 0.4) & (t < dur - 0.6)
    gate = signal.lfilter([1 - 0.995], [1, -0.995], phrase.astype(float))
    v = v * syl ** 1.5 * gate
    with tempfile.TemporaryDirectory() as tmp:
        vv = np.stack([v, v])
        Iv, _ = lufs_of(vv, tmp, "v")
        vv *= 10 ** ((-11.3 - Iv) / 20)           # a treated vo.wav (vo_montar.py) sits at about -11 LUFS
        vv = limit(vv, -1.0)
    sf.write(d / "vo_ficticia.wav", vv.T, SR, subtype="PCM_24")
    sf.write(d / "musica.wav", music.T, SR, subtype="PCM_24")

    def ff(*argv):
        rr = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *argv], capture_output=True, text=True)
        if rr.returncode:
            sys.exit(rr.stderr)

    # the duck exactly as mix.mjs does it (vo +2 dB, sidechaincompress), then sum
    graph = ("[0:a]volume=0dB[m];[1:a]volume=2dB[vo];[vo]asplit=3[vo1][vokey][vo2];"
             "[m][vokey]sidechaincompress=threshold=0.02:ratio=6:attack=12:release=280:makeup=1[md];"
             "[md]asplit=2[md1][md2];[md1][vo1]amix=inputs=2:normalize=0[mix]")
    ff("-i", str(d / "musica.wav"), "-i", str(d / "vo_ficticia.wav"), "-filter_complex", graph,
       "-map", "[mix]", "-c:a", "pcm_s24le", str(d / "mix_com_vo.wav"),
       "-map", "[md2]", "-c:a", "pcm_s24le", str(d / "musica_abafada.wav"),
       "-map", "[vo2]", "-c:a", "pcm_s24le", str(d / "vo_mais2db.wav"))
    for src, png in (("musica.wav", "espectro_musica.png"), ("mix_com_vo.wav", "espectro_mix_com_vo.png")):
        ff("-i", str(d / src), "-lavfi", "showspectrumpic=s=1600x700:mode=combined:color=intensity:scale=log:fscale=log:"
           "start=20:stop=16000:drange=90:legend=1", str(d / png))

    md, _ = sf.read(d / "musica_abafada.wav", always_2d=True)
    vo, _ = sf.read(d / "vo_mais2db.wav", always_2d=True)
    md, vo, mu = md.mean(axis=1), vo.mean(axis=1), music.mean(axis=0)
    act = phrase[: len(vo)]
    print("checagem com VO fictícia (ruído 300 Hz-3 kHz a -11.3 LUFS, +2 dB e duck do mix.mjs):")
    for name, a0, a1 in (("problema", 0, reveal), ("solução", reveal, cta), ("CTA", cta, dur)):
        m = act & (t[: len(vo)] >= a0) & (t[: len(vo)] < a1)
        if m.sum() < SR * 0.5:
            continue
        vb = band_power_db(vo, m)
        mb_raw = band_power_db(mu[: len(vo)], m)
        mb = band_power_db(md, m)
        full_raw = 10 * np.log10(np.mean(mu[: len(vo)][m] ** 2) + 1e-20)
        print(f"  {name:9s} voz/música na faixa 300-3k: {vb - mb:+.1f} dB com duck ({vb - mb_raw:+.1f} dB sem); "
              f"duck {mb_raw - mb:.1f} dB; fração da cama na faixa da voz {10 ** ((mb_raw - full_raw) / 10) * 100:.0f}%")
    print(f"-> {d}/ (espectro_musica.png, espectro_mix_com_vo.png, mix_com_vo.wav, vo_ficticia.wav)")


if __name__ == "__main__":
    main()
