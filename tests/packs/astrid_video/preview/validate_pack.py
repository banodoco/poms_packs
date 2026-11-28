"""Local structural and descriptor-parameter check, not Astrid pack admission."""
from pathlib import Path
import json, re
import yaml
import jsonschema

root=Path(__file__).resolve().parents[1]/'astrid_video'
pack=yaml.safe_load((root/'pack.yaml').read_text())
assert pack['schema_version']==3 and pack['id']==root.name and pack['version']=='0.19.0'
assert pack['documentation']['kind']=='skill' and (root/pack['documentation']['path']).is_file()
resources={r['path'] for r in pack.get('resources',[])}
for d in pack['rendering'].values():
 resources.add(d['path']); resources.update(r['path'] for r in d.get('resources',[]))
for r in resources:
 p=(root/r).resolve();assert p.is_relative_to(root.resolve()) and p.is_file(),r
companions=json.loads((root.parent/'preview/companion-params.json').read_text())
for name,d in pack['rendering'].items():
 assert d['type']=='element'; p=root/d['path']; e=yaml.safe_load(p.read_text())
 assert e['schema_version']==1 and e['kind']=='effect' and e['pack_id']==pack['id']
 assert 'dependencies' in e and isinstance(e['dependencies'],dict)
 assert not set(e['schema'].get('properties',{})) & {'opacity','fade_in','fade_out','entrance','exit','crop_top','crop_right','crop_bottom','crop_left','speed','volume','transition'}
 assert name=='effects/'+e['id'] and p.parent.name==e['id'] and e['runtime']['adapter']=='remotion'
 jsonschema.Draft202012Validator.check_schema(e['schema'])
 jsonschema.validate(e['defaults'],e['schema'])
 sample=json.loads((root.parent/'preview/demo-params.json').read_text()) if e['id']=='pixel-card-shuffle' else json.loads((root.parent/'preview/living-arms-params.json').read_text()) if e['id']=='pixel-arm-display' else json.loads((root.parent/'preview/examples/journey.json').read_text())['composition'] if e['id']=='living-composition' else json.loads((root.parent/'preview'/('timeline-assembly.json' if e['id']=='timeline-assembly' else 'timeline-player.json')).read_text())['params'] if e['id'] in ('timeline-assembly','timeline-player-visualizer') else json.loads((root.parent/'preview'/('mink-performance.json' if e['id']=='mink-performer' else 'agent-at-work.json')).read_text())['params'] if e['id'] in ('mink-performer','agent-at-work') else json.loads((root.parent/'preview/sequence-demo.json').read_text())['params'] if e['id']=='continuous-sequence' else companions[e['id']]
 jsonschema.validate(sample,e['schema'])
 if e['id']=='living-composition':
  for example in (root.parent/'preview/examples').glob('*.json'):
   spec=json.loads(example.read_text())['composition'];jsonschema.validate(spec,e['schema']);assert all(i.get('asset') in e['assets'] or i.get('asset') in spec.get('mediaBindings',{}) for i in spec['items'].values() if i['kind']!='text')
 for v in e.get('assets',{}).values():
  assert str((p.parent/v).relative_to(root)) in resources
 if e['id']=='pixel-card-shuffle':
  for mode in ('carry','hold','slide'):
   living=json.loads((root.parent/f'preview/living-{mode}-params.json').read_text());jsonschema.validate(living,e['schema'])
   for c in living['cards']:
    assert c['asset'] in e['assets'];l=c['layout'];assert l['x']+l['width']<=1 and l['y']+l['height']<=1
  assert all(c['asset'] in e['assets'] for c in sample['cards'])
  assert len(sample['cards'])-1==len(sample['directions'])==len(sample['transitionDurations'])==len(sample['crawlStyles'])
 for r in [x for x in resources if x.endswith(('.ts','.tsx'))]:
  src=root/r
  for spec in re.findall(r'''(?:\bfrom\s+|\bimport\s*)['"]([^'"]+)['"]''',src.read_text()):
   if spec in {'react','remotion'}:continue
   assert spec.startswith('.'),(r,spec)
   candidates=[(src.parent/spec).resolve(),(src.parent/(spec+'.ts')).resolve(),(src.parent/(spec+'.tsx')).resolve()]
   assert any(c.is_relative_to(root.resolve()) and c.is_file() and str(c.relative_to(root.resolve())) in resources for c in candidates),(r,spec)
assert len([r for r in pack['resources'] if r['kind']=='skill'])==8
for r in pack['resources']:
 if r['kind']=='skill':
  s=(root/r['path']).read_text();assert s.startswith('---\n');meta=yaml.safe_load(s.split('---',2)[1]);assert meta['name'] and meta['description']
for d in pack['rendering'].values():
 e=yaml.safe_load((root/d['path']).read_text());assert e['defaults']['theme']=='day';assert 'background' not in e['defaults']
 jsonschema.validate({**e['defaults'],'theme':'night'},e['schema'])
print('PASS: 10 effect descriptors, 8 supporting skills, defaults, theme settings, example parameters, resource paths and import closure.')
