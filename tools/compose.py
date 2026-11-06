#!/usr/bin/env python3
"""Setzt src/app.js aus src/tpl/t1..t4.js zusammen. Zeilen '//@KEEP a-b' werden durch
die Zeilen a..b aus src/app_orig.js (Unsergram-Vorlage) ersetzt; danach feste Ersetzungen."""
import pathlib, re, sys
R = pathlib.Path(__file__).resolve().parent.parent
orig = (R/'src/app_orig.js').read_text(encoding='utf-8').split('\n')
out = []
for f in sorted((R/'src/tpl').glob('t*.js')):
    for line in f.read_text(encoding='utf-8').split('\n'):
        m = re.fullmatch(r'//@KEEP (\d+)-(\d+)', line.strip())
        if m: a, b = int(m[1]), int(m[2]); out.extend(orig[a-1:b])
        else: out.append(line)
js = '\n'.join(out)
REPL = [
  ("indexedDB.open('anke-joerg-v2', 1)", "indexedDB.open('denisegram-v1', 1)"),
  ("`anke-joerg-${Date.now()}", "`denisegram-${Date.now()}"),
  ("          } else if (job.type === 'remove') {",
   "          } else if (job.type === 'patch') {\n            const r = await Sync.sb.from(job.table).update(job.set).eq('id', job.id); err = r.error;\n          } else if (job.type === 'remove') {"),
  ("'Der Moment erscheint bei euch beiden im Feed.'", "'Der Beitrag erscheint bei allen im Inner Circle.'"),
  ('placeholder="Momente durchsuchen"', 'placeholder="Beiträge durchsuchen"'),
  ("'Dein Moment …'", "'Dein Beitrag …'"),
]
for a, b in REPL:
    n = js.count(a)
    if n != 1: sys.exit(f'Ersetzung {a[:40]!r}: {n} Treffer statt 1')
    js = js.replace(a, b)
(R/'src/app.js').write_text(js, encoding='utf-8')
print('app.js', js.count('\n'), 'Zeilen')
