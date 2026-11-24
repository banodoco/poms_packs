#!/usr/bin/env python3
"""Validate and normalize a YAML/JSON authored composition for native element params.
No project mutation, media download or fabricated renderer receipt."""
import argparse,json,subprocess,sys,tempfile
from pathlib import Path
import yaml,jsonschema
ROOT=Path(__file__).resolve().parents[1]

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',type=Path);p.add_argument('--out',type=Path,required=True);p.add_argument('--width',type=int,default=1920);p.add_argument('--height',type=int,default=1080);p.add_argument('--fps',type=int,default=30);a=p.parse_args()
 wrapper=yaml.safe_load(a.source.read_text());params=dict(wrapper['composition']);duration=wrapper['duration']
 descriptor=yaml.safe_load((ROOT/'astrid_video/rendering/elements/effects/living-composition/element.yaml').read_text())
 legacy=params.pop('defaults',{})
 if not isinstance(legacy,dict):raise ValueError('defaults must be an object')
 for k,v in legacy.items():
  if k not in descriptor['schema']['properties']['defaults']['properties']:raise ValueError(f'Unknown legacy default {k}')
  params.setdefault(k,v)
 # Fill scalar defaults explicitly; never accidentally inherit the demo content or poses.
 for k,v in descriptor['defaults'].items():
  if isinstance(v,(int,float,str,bool)):params.setdefault(k,v)
 jsonschema.validate(params,descriptor['schema'])
 # The user authors logical slots; only the real host can resolve registry keys.
 bindings=params.get('mediaBindings',{})
 assets=descriptor.get('assets',{})
 used=set()
 for item in params['items'].values():
  if item['kind']=='text':continue
  slot=item.get('asset');used.add(slot)
  if slot not in bindings and slot not in assets:raise ValueError(f'Unbound media slot: {slot!r}')
 if set(bindings)-used:raise ValueError(f'Unused media slots: {sorted(set(bindings)-used)}')
 if len(json.dumps(params,allow_nan=False,separators=(',',':')).encode())>16384:raise ValueError('Composition exceeds inspected native update-element parameter budget (16 KiB)')
 if not isinstance(duration,(int,float)) or isinstance(duration,bool) or duration<=0:raise ValueError('Positive clip duration required')
 # The shipped JS is compiled from the same source; rebuild before use if source changed.
 with tempfile.TemporaryDirectory() as temp:
  f=Path(temp)/'composition.json';f.write_text(json.dumps({'duration':duration,'composition':params}))
  inspect=json.loads(subprocess.check_output(['node',str(ROOT/'preview/composition-plan.cjs'),str(f),str(a.width),str(a.height),str(a.fps),'inspect'],text=True))
 a.out.mkdir(parents=True,exist_ok=True)
 (a.out/'params.json').write_text(json.dumps(params,indent=2)+'\n');(a.out/'resolved.json').write_text(json.dumps(inspect,indent=2)+'\n')
 print(json.dumps({'clipHoldSeconds':duration,'params':str(a.out/'params.json'),'resolved':str(a.out/'resolved.json'),'warnings':inspect['warnings'],'managedMediaHostRequired':bool(params.get('mediaBindings'))},indent=2))
if __name__=='__main__':main()
