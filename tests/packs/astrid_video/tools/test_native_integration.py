"""Local checks of the installation/preparation tools; not an Astrid admission test."""
from pathlib import Path
import json, shutil, subprocess, tempfile, unittest
from unittest.mock import patch
import yaml
import install_astrid_video as install
from source_closure import fingerprint

ROOT=Path(__file__).resolve().parents[1]

class SourceTests(unittest.TestCase):
    def test_shared_import_changes_fingerprint(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)
            (root/'component.tsx').write_text("import {step} from './shared';\nexport default step;")
            (root/'shared.ts').write_text('export const step=1;')
            a,_=fingerprint(root,root/'component.tsx')
            (root/'guide.md').write_text('new documentation')
            self.assertEqual(a,fingerprint(root,root/'component.tsx')[0])
            (root/'shared.ts').write_text('export const step=2;')
            self.assertNotEqual(a,fingerprint(root,root/'component.tsx')[0])
    def test_actual_shared_import_revises_dependent_element(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)/'astrid_video';shutil.copytree(install.SOURCE,root)
            entry=root/'rendering/elements/effects/living-composition/component.tsx'
            a,paths=fingerprint(root,entry)
            self.assertIn('shared/organism.ts',{r['path'] for r in paths})
            p=root/'shared/organism.ts';p.write_text(p.read_text()+'\n// change\n')
            self.assertNotEqual(a,fingerprint(root,entry)[0])
    def test_refuse_unrelated_source_and_upgrade_explicit(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);source=root/'new';old=root/'old';dest=root/'astrid_video'
            for folder,content in [(source,'new'),(old,'old'),(dest,'old')]:
                folder.mkdir();(folder/'pack.yaml').write_text(content)
            with patch.object(install,'SOURCE',source),patch.object(install,'validate',return_value={}):
                with self.assertRaises(RuntimeError):install.install_source(dest)
                self.assertEqual((dest/'pack.yaml').read_text(),'old')
                self.assertTrue(install.install_source(dest,old))
                self.assertEqual((dest/'pack.yaml').read_text(),'new')
                self.assertFalse(install.install_source(dest))
    def test_rejected_validation_preserves_old_source(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);source=root/'new';old=root/'old';dest=root/'astrid_video'
            for folder,content in [(source,'new'),(old,'old'),(dest,'old')]:
                folder.mkdir();(folder/'pack.yaml').write_text(content)
            with patch.object(install,'SOURCE',source),patch.object(install,'validate',side_effect=RuntimeError('rejected')):
                with self.assertRaises(RuntimeError):install.install_source(dest,old)
            self.assertEqual((dest/'pack.yaml').read_text(),'old')
    def test_receipt_scope_and_completeness(self):
        entries=[{'descriptor':{'packId':install.PACK,'id':i,'kind':'effect','revision':'host-returned-test-revision'},'authoring':{'status':'admitted'}} for i in sorted(install.EFFECTS)]
        self.assertEqual(len(install.refs({'elements':entries})),9)
        with self.assertRaises(RuntimeError):install.refs({'elements':entries[:-1]})
        entries[0]['descriptor']['packId']='wrong'
        with self.assertRaises(RuntimeError):install.refs({'elements':entries})
    def test_prepare_rejects_unbound_media(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);wrapper=json.loads((ROOT/'preview/examples/native-smoke.json').read_text());wrapper['composition']['items']['a']={'kind':'image','asset':'not-bound'}
            p=root/'bad.json';p.write_text(json.dumps(wrapper))
            r=subprocess.run(['python',str(ROOT/'tools/prepare_composition.py'),str(p),'--out',str(root/'out')],capture_output=True,text=True)
            self.assertNotEqual(r.returncode,0);self.assertIn('Unbound media slot',r.stderr)
            self.assertFalse((root/'out').exists())
if __name__=='__main__':unittest.main(verbosity=2)
