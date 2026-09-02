#!/usr/bin/env python3
"""Build the private gallery.

Reads originals from --src (folders named by brand slug, e.g. src/jude/01.jpg),
writes for each photo a tiny blurred public placeholder and an AES-GCM encrypted
copy under a random name, an encrypted manifest, and rewrites the placeholder
grid in gallery/index.html. Nothing readable ships to the browser until the
password is known; the key is derived from it with PBKDF2 (see js/gallery.js).

  python3 tools/encrypt-gallery.py --src ~/Pictures/boshra-gallery --password 191

Keep the originals outside the repo. Requires: pillow, cryptography.
"""
import argparse, json, pathlib, re, secrets, shutil
from PIL import Image, ImageFilter
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

SALT, ITER = b"boshra-gallery-v1", 300_000   # must match js/gallery.js
BRANDS = {  # slug -> display name, in gallery order
  "jude": "Jude × Judelle", "tajan": "Tajan Hijab", "blackcloset": "The Black Closet",
  "sumaya": "Sumaya Couture", "haize": "Haize the Label", "bynusayba": "By Nusayba",
  "hayaa": "Hayaa Fashion", "ibriz": "Ibriz Abaya", "jamila": "Jamila", "lilly": "Lilly",
  "modesty": "Modesty Abaya", "qibla": "Qibla", "sjaal": "Sjaal",
}
ROOT = pathlib.Path(__file__).resolve().parent.parent

ap = argparse.ArgumentParser()
ap.add_argument("--src", required=True); ap.add_argument("--password", required=True)
a = ap.parse_args()
src = pathlib.Path(a.src).expanduser()

key = PBKDF2HMAC(hashes.SHA256(), 32, SALT, ITER).derive(a.password.encode())
aes = AESGCM(key)
def enc(data: bytes) -> bytes:
    iv = secrets.token_bytes(12); return iv + aes.encrypt(iv, data, None)

blur_dir, enc_dir = ROOT / "assets/gallery-blur", ROOT / "assets/gallery-enc"
for d in (blur_dir, enc_dir):
    shutil.rmtree(d, ignore_errors=True); d.mkdir(parents=True)

manifest, figs, i = [], [], 0
for slug, name in BRANDS.items():
    for p in sorted((src / slug).glob("*.jp*g")):
        i += 1
        im = Image.open(p); w, h = im.size
        tw = 24; th = max(1, round(h * tw / w))
        im.convert("RGB").resize((tw, th), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2)).save(blur_dir / f"{i:03d}.jpg", quality=60)
        fname = secrets.token_hex(12) + ".bin"
        (enc_dir / fname).write_bytes(enc(p.read_bytes()))
        manifest.append({"brand": slug, "name": name, "alt": f"Boshra for {name}", "file": fname, "w": w, "h": h})
        figs.append(
            f'        <figure class="gitem is-locked" style="aspect-ratio: {w} / {h}">\n'
            f'          <img src="/assets/gallery-blur/{i:03d}.jpg" alt="" aria-hidden="true" width="{w}" height="{h}" decoding="async" />\n'
            f'          <figcaption></figcaption>\n'
            f'        </figure>')
(enc_dir / "manifest.bin").write_bytes(enc(json.dumps(manifest, ensure_ascii=False).encode()))

page = ROOT / "gallery/index.html"; html = page.read_text()
start = html.index('<div class="ggrid" id="ggrid">') + len('<div class="ggrid" id="ggrid">')
end = html.index("\n      </div>", start)
page.write_text(html[:start] + "\n" + "\n".join(figs) + html[end:])
print(f"{i} photos → {enc_dir.relative_to(ROOT)} (+ manifest), placeholders → {blur_dir.relative_to(ROOT)}")
