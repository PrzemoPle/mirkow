#!/usr/bin/env python3
"""Konwersja źródeł PNG (art-src/art) do WebP w public/art. Uruchom po każdej nowej paczce grafik.
Ikony do 128 px: bezstratnie. Reszta: q90 (różnica niewidoczna, paczka trzy razy lżejsza)."""
import glob, os
from PIL import Image
SRC, DST = "art-src/art", "public/art"
for f in sorted(glob.glob(SRC + "/**/*.png", recursive=True)):
    rel = os.path.relpath(f, SRC)
    out = os.path.join(DST, rel[:-4] + ".webp")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im = Image.open(f)
    if max(im.size) <= 128:
        im.save(out, "WEBP", lossless=True, quality=100, method=6)
    else:
        im.convert("RGBA").save(out, "WEBP", quality=90, method=6)
    print(out)
