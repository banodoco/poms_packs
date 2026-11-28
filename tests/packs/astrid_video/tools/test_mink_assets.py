from pathlib import Path
import tempfile,hashlib,json,unittest
from PIL import Image,ImageDraw
from import_mink_sheet import prepare,write
R=Path(__file__).resolve().parents[1];A=R/'astrid_video/rendering/elements/effects/mink-performer/assets';B=A.parent.parent/'agent-at-work/assets'
class Assets(unittest.TestCase):
 def test_exact_source_and_frame_alignment(self):
  for n,sha in [('runner-original.png','8196435068d7d6d7e99b3402167b6d4ce7e6f377'),('juggler-original.png','e2a0f019c33e3f0b2351bb1a8806fd83652c912b')]:
   data=(A/n).read_bytes();self.assertEqual(hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest(),sha)
  meta=json.loads((A/'sprite-registry.json').read_text());self.assertEqual((meta['cellWidth'],meta['cellHeight'],meta['anchorX'],meta['anchorY']),(96,88,48,80))
  runner=Image.open(A/'runner-original.png').convert('RGBA');strip=Image.open(A/'run.png').convert('RGBA')
  for i in range(11):self.assertEqual(strip.crop((i*96+8,40,i*96+89,84)).tobytes(),runner.crop((i*81,0,(i+1)*81,44)).tobytes())
  for n,s in meta['clips'].items():
   im=Image.open(A/(n+'.png')).convert('RGBA');self.assertEqual(im.size,(96*s['frames'],88));self.assertEqual((A/(n+'.png')).read_bytes(),(B/(n+'.png')).read_bytes())
   for i in range(s['frames']):
    f=im.crop((i*96,0,(i+1)*96,88));bb=f.getbbox();self.assertTrue(bb);self.assertEqual(f.getpixel((0,0))[3],0);self.assertLessEqual(bb[3],88)
 def test_wave_retains_both_forepaws_and_fixed_body(self):
  idle=Image.open(A/'idle.png').convert('RGBA'); wave=Image.open(A/'wave.png').convert('RGBA')
  poses=[wave.crop((i*96,0,(i+1)*96,88)) for i in range(10)]
  self.assertEqual(poses[0].tobytes(),idle.tobytes());self.assertEqual(poses[-1].tobytes(),idle.tobytes())
  for f in poses:
   # All three unaffected landmarks remain pixel-identical, including the
   # second resting forepaw. The wave is on the other side of the torso.
   for box in ((0,0,96,28),(52,45,65,56),(0,59,96,88)):
    self.assertEqual(f.crop(box).tobytes(),idle.crop(box).tobytes())
   self.assertEqual(f.getpixel((61,51)),(255,122,46,255))
   self.assertEqual(f.getbbox()[3],80)
   for xy in ((52,19),(53,19),(54,19),(55,19),(56,20)):self.assertEqual(f.getpixel(xy),(21,19,17,255))
  for i in (3,4,5,6):
   self.assertTrue(poses[i].crop((32,29,44,43)).getbbox(),'Raised near paw is visible')
  self.assertGreater(len({f.tobytes() for f in poses}),4)
 def test_regular_grid_and_refusals(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'grid.png';im=Image.new('RGBA',(200,100));d=ImageDraw.Draw(im);d.rectangle((35,20,65,75),fill='#ED6B23');d.rectangle((135,20,165,75),fill='#ED6B23');im.save(p);f=prepare(p,2,1,2,(50,80),.8);self.assertEqual(f[0].tobytes(),f[1].tobytes());self.assertEqual(f[0].size,(96,88));self.assertEqual(len(write(f,'test',100,True,Path(tmp)/'out')),3)
   with self.assertRaises(FileExistsError):write(f,'test',100,True,Path(tmp)/'out')
   with self.assertRaises(ValueError):prepare(p,3,1,2,(50,80),.8)
   with self.assertRaises(ValueError):prepare(p,2,1,2,(1,1),3)
   Image.new('RGB',(200,100),'white').save(p)
   with self.assertRaises(ValueError):prepare(p,2,1,2,(50,80),.8)
if __name__=='__main__':unittest.main(verbosity=2)
