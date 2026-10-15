"""Pack a published .NET WASM runtime and reference pack for offline browser use."""
import argparse, base64, gzip, hashlib, json, shutil
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('publish_wwwroot',type=Path)
p.add_argument('--reference-dir',type=Path,required=True,help='SDK packs/Microsoft.NETCore.App.Ref/<version>/ref/net10.0')
a=p.parse_args();root=Path(__file__).resolve().parent.parent
source=a.publish_wwwroot/'_framework';target=root/'app/csharp-runtime'
if not source.is_dir() or not list(a.reference_dir.glob('*.dll')):p.error('Need published _framework and reference assemblies')
shutil.rmtree(target,ignore_errors=True);shutil.copytree(source,target)
for f in list(target.rglob('*')):
    if f.is_file() and f.suffix in ('.dll','.wasm','.dat'):
        f.with_name(f.name+'.bin').write_bytes(gzip.compress(f.read_bytes(),mtime=0));f.unlink()
refs=root/'app/csharp-refs';refs.mkdir(exist_ok=True)
refs.joinpath('references.bin').write_bytes(gzip.compress(json.dumps([base64.b64encode(f.read_bytes()).decode() for f in sorted(a.reference_dir.glob('*.dll'))]).encode(),mtime=0))
manifest={str(f.relative_to(root/'app')):hashlib.sha256(f.read_bytes()).hexdigest() for d in (target,refs) for f in sorted(d.rglob('*')) if f.is_file()}
(root/'browser-runner/runtime-sha256.json').write_text(json.dumps(manifest,indent=2)+'\n')
