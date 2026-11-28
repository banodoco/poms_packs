#!/usr/bin/env python3
"""Install this exact source bundle through the existing Astrid project-pack contract.

Run with the Python executable/environment of the user's authenticated local Astrid installation.
Without --apply it only inspects. Never alters timelines or product source.
"""
from __future__ import annotations
import argparse, hashlib, json, os, shutil, subprocess, sys, tempfile
from pathlib import Path

SOURCE=Path(__file__).resolve().parents[1]/'astrid_video'
PACK='astrid_video'
EFFECTS={'chapter-card','pixel-network','pixel-card-shuffle','pixel-arm-display','living-composition','timeline-assembly','timeline-player-visualizer','mink-performer','agent-at-work', 'continuous-sequence'}

def run_json(argv):
    result=subprocess.run(argv,check=False,capture_output=True,text=True)
    if result.returncode:
        raise RuntimeError(f"{argv[2]} failed ({result.returncode}): {(result.stderr or result.stdout).strip()[-4000:]}")
    try: return json.loads(result.stdout)
    except json.JSONDecodeError as exc: raise RuntimeError('Astrid did not return a structured receipt') from exc

def scoped(args,action):
    row=run_json([sys.executable,'-m','astrid.core.element.cli','project-pack',action,'--realm',args.realm,'--project',args.project,'--collection',PACK])
    if not isinstance(row,dict) or (row.get('realmId'),row.get('projectId'),row.get('packId'))!=(args.realm,args.project,PACK):
        raise RuntimeError('Project-pack receipt has a different owner or scope')
    path=Path(row['packRoot'])
    if not path.is_absolute() or path.name!=PACK or path.is_symlink() or path.resolve()!=path:
        raise RuntimeError('Unsafe or noncanonical pack root from host')
    return row,path

def tree(root):
    if root.is_symlink() or not root.is_dir():raise RuntimeError(f'Not a regular source tree: {root}')
    result={}
    for item in sorted(root.rglob('*')):
        if item.is_symlink():raise RuntimeError(f'Symlink refused: {item}')
        if item.is_file():result[item.relative_to(root).as_posix()]=hashlib.sha256(item.read_bytes()).hexdigest()
        elif not item.is_dir():raise RuntimeError(f'Unsupported filesystem entry: {item}')
    return result

def is_scaffold(root):
    # Only the actual stock empty project-pack init shape; never replace arbitrary source.
    import yaml
    if set(tree(root))!={'pack.yaml','docs/SKILL.md'}:return False
    m=yaml.safe_load((root/'pack.yaml').read_text())
    expected={'schema_version':3,'id':PACK,'name':'Project drafts','version':'0.1.0','status':'active','domain':'media','stability':'experimental','support':'project','visibility':'visible','description':'Editable project-owned visual elements.','permissions':[{'id':'project_files','reason':'Provides project-owned visual source.'}],'documentation':{'kind':'skill','path':'docs/SKILL.md'},'rendering':{}}
    return m==expected and (root/'docs/SKILL.md').read_text()==('---\nname: project-drafts\ndescription: Ordinary project-owned draft rendering source.\n---\n\n# Project drafts\n\nEdit declared source files, validate/admit, then update exact timeline refs. Keep files while timelines use them.\n')

def validate(path):
    result=subprocess.run([sys.executable,'-m','astrid.core.pack.cli','validate',str(path),'--json'],check=False,capture_output=True,text=True)
    if result.returncode:raise RuntimeError('Native Astrid pack validation failed: '+(result.stderr or result.stdout)[-4000:])
    # Don't interpret a home-made validation as a host receipt; retain actual native stdout.
    try:return json.loads(result.stdout)
    except json.JSONDecodeError:raise RuntimeError('Native validator did not return JSON')

def install_source(dest,replace_from=None):
    desired=tree(SOURCE)
    current=tree(dest)
    if current==desired:return False
    if not is_scaffold(dest) and (replace_from is None or current!=tree(replace_from)):
        raise RuntimeError('Existing pack has edits or another revision. Refusing overwrite; supply --replace-from with its exact unmodified source, or merge changes deliberately.')
    # Stage next to the receiving root and use canonical basename for validation.
    with tempfile.TemporaryDirectory(prefix='.astrid-video-install-',dir=dest.parent) as temp:
        stage=Path(temp)/PACK;shutil.copytree(SOURCE,stage)
        if tree(stage)!=desired:raise RuntimeError('Source changed during copy')
        validate(stage)
        if tree(dest)!=current:raise RuntimeError('Receiving source changed during preparation')
        backup=Path(temp)/'previous';dest.rename(backup)
        try:stage.rename(dest)
        except BaseException:
            backup.rename(dest);raise
        if tree(dest)!=desired:
            dest.rename(stage);backup.rename(dest);raise RuntimeError('Installed source differs; prior tree restored')
    return True

def refs(row):
    result=[]
    for entry in row.get('elements',[]):
        descriptor=entry.get('descriptor',{});authoring=entry.get('authoring',{})
        if descriptor.get('packId')!=PACK or descriptor.get('kind')!='effect' or authoring.get('status')!='admitted' or not descriptor.get('revision'):
            raise RuntimeError('Native admission did not return the exact requested effect revisions')
        result.append({k:descriptor[k] for k in ('packId','id','kind','revision')})
    if len(result)!=len(EFFECTS) or {x['id'] for x in result}!=EFFECTS:raise RuntimeError('Native receipt is missing one or more effects')
    return result

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--realm',required=True);p.add_argument('--project',required=True);p.add_argument('--apply',action='store_true',help='Initialize dedicated collection, install checked source and admit');p.add_argument('--replace-from',type=Path,help='Exact previous unmodified source pack for a deliberate upgrade');a=p.parse_args()
    row,dest=scoped(a,'inspect')
    if not a.apply:
        print(json.dumps({'mode':'inspect-only','packRoot':str(dest),'status':row.get('status'),'source':str(SOURCE),'next':'Run again with --apply only after checking the project and collection'},indent=2));return
    from source_closure import fingerprint
    import yaml
    manifest=yaml.safe_load((SOURCE/'pack.yaml').read_text())
    for d in manifest['rendering'].values():
        file=SOURCE/d['path'];descriptor=yaml.safe_load(file.read_text());digest,_=fingerprint(SOURCE,file.parent/'component.tsx')
        if descriptor['metadata'].get('sourceClosureSha256')!=digest:raise RuntimeError('Stale shared-source fingerprint; regenerate, validate and inspect before installing')
    native_validation=validate(SOURCE)
    # Inspect before creating anything; initialization may require the configured compiler.
    row,checked=scoped(a,'init')
    if checked!=dest:raise RuntimeError('Project source binding moved during init; inspect again')
    changed=install_source(dest,a.replace_from)
    if changed or row.get('status')!='admitted':scoped(a,'admit')
    confirmed,readback=scoped(a,'inspect')
    if readback!=dest or confirmed.get('status')!='admitted':raise RuntimeError('Source installed but native admission is not confirmed')
    expected=refs(confirmed)
    print(json.dumps({'mode':'native-admission','sourceChanged':changed,'projectId':a.project,'realmId':a.realm,'packId':PACK,'packRoot':str(dest),'nativeValidation':native_validation,'elements':expected,'next':'Use exact refs with supported timeline placement/editing. Admission is not a saved timeline or render.'},indent=2))
if __name__=='__main__':
    try:main()
    except (RuntimeError,OSError,subprocess.SubprocessError) as exc:
        print(str(exc),file=sys.stderr);sys.exit(1)
