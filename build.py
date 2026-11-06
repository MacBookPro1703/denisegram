#!/usr/bin/env python3
"""Denisegram – baut index.html aus src/shell.html + src/style.css + src/app.js.
Supabase-URL und anon-Key kommen aus config.json (anon-Key ist öffentlich, gehört in die App).
Aufruf: python3 build.py   → schreibt index.html ins Repo-Hauptverzeichnis."""
import json, hashlib, re, pathlib
R = pathlib.Path(__file__).resolve().parent
cfg = json.loads((R/'config.json').read_text(encoding='utf-8'))
shell = (R/'src/shell.html').read_text(encoding='utf-8')
css = (R/'src/style.css').read_text(encoding='utf-8')
js = (R/'src/app.js').read_text(encoding='utf-8')
js = js.replace('__SUPABASE_URL__', cfg['SUPABASE_URL'], 1).replace('__SUPABASE_ANON_KEY__', cfg['SUPABASE_ANON_KEY'], 1)
assert shell.count('/*__CSS__*/') == 1 and shell.count('/*__JS__*/') == 1, 'Platzhalter in shell.html fehlen'
html = shell.replace('/*__CSS__*/', css, 1).replace('/*__JS__*/', js, 1)
(R/'index.html').write_text(html, encoding='utf-8')
ver = re.search(r"APP_VERSION = '([^']*)'", js)
print(f"index.html {len(html.encode())} Byte, MD5 {hashlib.md5(html.encode()).hexdigest()}, APP_VERSION {ver.group(1) if ver else '?'}")
