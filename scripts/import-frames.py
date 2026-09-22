#!/usr/bin/env python3
"""Validate and import the user's authoritative 150 PNG frames without altering pixels."""
from pathlib import Path, PurePosixPath
import argparse, json, struct, zipfile
parser=argparse.ArgumentParser()
parser.add_argument('archive',nargs='?',default='public/frames_150.zip')
args=parser.parse_args();archive=Path(args.archive)
if not archive.is_file():
 raise SystemExit(f'Archive missing: {archive}. Supply the original frame-001.png through frame-150.png archive.')
expected={f'frame-{n:03}.png' for n in range(1,151)}
with zipfile.ZipFile(archive) as z:
 entries={}
 for info in z.infolist():
  p=PurePosixPath(info.filename)
  if p.is_absolute() or '..' in p.parts: raise SystemExit('Unsafe archive path rejected')
  if info.is_dir() or p.name.startswith('.') or p.name not in expected: continue
  if p.name in entries: raise SystemExit(f'Duplicate frame: {p.name}')
  if info.file_size>20*1024*1024: raise SystemExit('Frame exceeds 20 MB')
  entries[p.name]=info
 if set(entries)!=expected: raise SystemExit('Missing frames: '+', '.join(sorted(expected-set(entries))))
 if sum(i.file_size for i in entries.values())>500*1024*1024: raise SystemExit('Archive exceeds 500 MB uncompressed')
 frames={}
 for name,info in entries.items():
  data=z.read(info)
  if data[:8]!=b'\x89PNG\r\n\x1a\n': raise SystemExit(f'Not a PNG: {name}')
  width,height=struct.unpack('>II',data[16:24])
  if not(0<width<=10000 and 0<height<=10000) or width*height>40000000: raise SystemExit(f'Invalid dimensions: {name}')
  frames[name]=data
 out=Path('public/frames');out.mkdir(parents=True,exist_ok=True)
 # Write manifest last: the public page activates only after the complete set exists.
 for name,data in frames.items(): (out/name).write_bytes(data)
 (out/'manifest.json').write_text(json.dumps({'count':150,'pattern':'frame-%03d.png','source':archive.name},indent=2)+'\n')
print('Imported 150 original PNG frames. Cinematic scrolling is now enabled.')
