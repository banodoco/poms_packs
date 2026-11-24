#!/usr/bin/env python3
"""Generate/check element metadata fingerprint for transitive shared source.

At the inspected Agent revision, element revision hashes the descriptor, component,
local helpers and assets, but not relative imports outside the element directory.
The descriptor digest below makes external shared changes visible to that existing
revision calculation. This is a pack build step, not a replacement for admission.
"""
import argparse,hashlib,json,re
from pathlib import Path
import yaml
ROOT=Path(__file__).resolve().parents[1]/'astrid_video'
SUFFIXES={'.ts','.tsx','.js','.jsx','.mjs','.cjs','.css'}
ALLOWED={'react','react/jsx-runtime','remotion'}
PATTERN=re.compile(r"\b(?:from\s*|import\s*)(?:[\w*{},\s]+\s+from\s*)?['\"]([^'\"]+)['\"]")

def closure(root,entry):
    root=root.resolve();seen=set();stack=[entry.resolve()]
    while stack:
        path=stack.pop()
        if path in seen:continue
        if not path.is_relative_to(root) or not path.is_file():raise ValueError(f'Import outside pack: {path}')
        seen.add(path)
        if path.suffix not in SUFFIXES:continue
        text=path.read_text()
        if re.search(r"\b(?:import\s*\(|require\s*\(|eval\s*\(|new\s+Function\s*\()",text):raise ValueError(f'Dynamic code in {path}')
        imports=PATTERN.findall(text)
        if path.suffix=='.css':imports+=re.findall(r"@import\s+['\"]([^'\"]+)['\"]",text)
        for spec in imports:
            if spec in ALLOWED:continue
            if not spec.startswith('.'):raise ValueError(f'Unapproved dependency {spec}')
            target=(path.parent/spec.split('?',1)[0]).resolve()
            candidates=[target,*[Path(str(target)+ext) for ext in ('.ts','.tsx','.js','.jsx','.css')],target/'index.ts',target/'index.tsx']
            found=next((p for p in candidates if p.is_file() and p.is_relative_to(root)),None)
            if found is None:raise ValueError(f'Missing import {spec} from {path}')
            stack.append(found)
    return sorted(seen)

def fingerprint(root,entry):
    paths=closure(root,entry);rows=[{'path':p.relative_to(root.resolve()).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths]
    return 'sha256:'+hashlib.sha256(json.dumps(rows,sort_keys=True,separators=(',',':')).encode()).hexdigest(),rows

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');parser.add_argument('--root',type=Path,default=ROOT);args=parser.parse_args();root=args.root.resolve()
    manifest=yaml.safe_load((root/'pack.yaml').read_text());declared={r['path'] for r in manifest.get('resources',[])}
    for d in manifest['rendering'].values():declared.update(r['path'] for r in d.get('resources',[]));declared.add(d['path'])
    for d in manifest['rendering'].values():
        file=root/d['path'];e=yaml.safe_load(file.read_text());digest,rows=fingerprint(root,file.parent/'component.tsx')
        if any(r['path'] not in declared for r in rows):raise ValueError(f'Undeclared shared source in {e["id"]}')
        if args.write:
            e['metadata']['sourceClosureSha256']=digest;file.write_text(yaml.safe_dump(e,sort_keys=False,allow_unicode=True))
        elif e['metadata'].get('sourceClosureSha256')!=digest:raise ValueError(f'Stale source fingerprint in {e["id"]}; regenerate and validate before admission')
        print(e['id'],digest,len(rows),'sources')
if __name__=='__main__':main()
