import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from managed_element_media import project_media
ROOT=Path(__file__).resolve().parent

class Parity(unittest.TestCase):
    def test_same_fixtures(self):
        fixture=json.loads((ROOT/'fixtures.json').read_text())
        with tempfile.TemporaryDirectory() as tmp:
            subprocess.run(['tsc','--strict','--target','es2020','--module','commonjs','--outDir',tmp,str(ROOT/'managed-element-media.ts')],check=True)
            script="""const fs=require('fs');const {projectMedia}=require(process.argv[1]);const f=JSON.parse(fs.readFileSync(process.argv[2]));console.log(JSON.stringify(f.cases.map(c=>{try{return {ok:true,result:projectMedia(c.params,c.schema??f.schema,f.registry)}}catch(e){return {ok:false}}})))"""
            js=json.loads(subprocess.check_output(['node','-e',script,str(Path(tmp)/'managed-element-media.js'),str(ROOT/'fixtures.json')]))
            py=[]
            for c in fixture['cases']:
                try:
                    before=json.dumps(c['params'],sort_keys=True)
                    result=project_media(c['params'],c.get('schema',fixture['schema']),fixture['registry'])
                    self.assertEqual(json.dumps(c['params'],sort_keys=True),before)
                    self.assertFalse(c.get('error',False),c['name'])
                    py.append({'ok':True,'result':result})
                except ValueError:
                    self.assertTrue(c.get('error',False),c['name']);py.append({'ok':False})
            self.assertEqual(py,js)
            self.assertEqual(py[1]['result']['__astridMedia']['preview']['duration'],2.5)
            self.assertEqual(py[1]['result']['__astridMedia']['hero'],py[1]['result']['__astridMedia']['detail'])
            print('PASS: Python worker/browser TypeScript projection parity across',len(py),'positive/negative fixtures')
if __name__=='__main__':unittest.main()
