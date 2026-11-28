"""Offline review rasterizer of the same frame plan used by ContinuousSequence.
Project media lives outside the source pack; the local mapping is preview-only.
"""
from pathlib import Path
import sys,subprocess as sp,json
from PIL import Image,ImageDraw,ImageFont
import cv2
P=Path(__file__).resolve().parent
spec,out,assets=map(Path,sys.argv[1:4]);w,h,fps=map(int,sys.argv[4:7]);out.parent.mkdir(parents=True,exist_ok=True)
cv2.setNumThreads(1);p=sp.Popen(['node',str(P/'sequence-plan.cjs'),str(spec),str(w),str(h),str(fps)],stdout=sp.PIPE,text=True);meta=json.loads(p.stdout.readline());s=meta['style'];(out.with_suffix('.cues.json')).write_text(json.dumps(meta['sounds'],indent=2))
from functools import lru_cache
@lru_cache(None)
def font(size,kind):return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/'+{'serif':'DejaVuSerif.ttf','sans':'DejaVuSans.ttf','mono':'DejaVuSansMono.ttf'}[kind],max(1,round(size)))
class Video:
 def __init__(self,path):
  self.cap=cv2.VideoCapture(str(path));self.rate=self.cap.get(cv2.CAP_PROP_FPS);self.count=int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT));self.last=-1;self.im=None
  if not self.cap.isOpened() or not self.count:raise ValueError(str(path))
 def get(self,i):
  i=min(self.count-1,max(0,i))
  if i==self.last:return self.im
  if i!=self.last+1:self.cap.set(cv2.CAP_PROP_POS_FRAMES,i)
  ok,f=self.cap.read();assert ok,i;self.last=i;self.im=Image.fromarray(cv2.cvtColor(f,cv2.COLOR_BGR2RGB));return self.im
@lru_cache(None)
def source(slot,kind):return Video(assets/(slot+'.mp4')) if kind=='video' else Image.open(assets/(slot+'.png')).convert('RGBA')
@lru_cache(None)
def title(title,eyebrow,subtitle):
 im=Image.new('RGB',(960,540),s['background']);d=ImageDraw.Draw(im);d.text((74,69),eyebrow or '',font=font(16,'mono'),fill=s['accentText']);d.text((69,148),title,font=font(118,'serif'),fill=s['foreground']);d.text((78,303),subtitle or '',font=font(29,'sans'),fill=s['muted']);return im
spr={n:Image.open(P.parent/'astrid_video/rendering/elements/effects/continuous-sequence/assets'/f'{n}.png').convert('RGBA') for n in ['idle','run','wave','settle']}
def paste(im,src,b,nearest=False,fit='contain'):
 x,y,bw,bh=[round(b[k]) for k in ('x','y','width','height')];bw=max(1,bw);bh=max(1,bh)
 if x>=w or y>=h or x+bw<=0 or y+bh<=0:return
 if fit=='stretch':target=src.resize((bw,bh),Image.Resampling.NEAREST if nearest else Image.Resampling.BILINEAR)
 else:
  r=(max if fit=='cover' else min)(bw/src.width,bh/src.height);sw,sh=max(1,round(src.width*r)),max(1,round(src.height*r));res=src.resize((sw,sh),Image.Resampling.NEAREST if nearest else Image.Resampling.BILINEAR);target=Image.new('RGB',(bw,bh),s['background']);target.paste(res,((bw-sw)//2,(bh-sh)//2),res if res.mode=='RGBA' else None)
 im.paste(target,(x,y),target if target.mode=='RGBA' else None)
def mink(im,m):
 if not m:return
 st=m['state'];i=st['index'];sp=spr[st['sprite']].crop((i*96,0,(i+1)*96,88));sp=sp.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if st['facing']=='left' else sp;paste(im,sp,m['box'],True,'stretch')
enc=sp.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(fps),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','19','-threads','2','-pix_fmt','yuv420p',str(out)],stdin=sp.PIPE)
for line in p.stdout:
 f=json.loads(line);im=Image.new('RGB',(w,h),s['background']);actor=f.get('mink');drawn=False
 for n in f['layers']:
  if actor and actor.get('behind')==n['id']:mink(im,actor);drawn=True
  if n['kind']=='title':src=title(n['title'],n.get('eyebrow'),n.get('subtitle'))
  else:
   src=source(n['asset'],n['kind'])
   if n['kind']=='video':src=src.get(round((n['sourceStart']+n['sourceFrame']/fps)*src.rate))
  paste(im,src,n['box'],False,'stretch' if n['kind']=='title' else n.get('fit','contain'))
  if n.get('frame'):
   b=n['box'];ImageDraw.Draw(im).rectangle((b['x'],b['y'],b['x']+b['width']-1,b['y']+b['height']-1),outline=s['border'],width=2)
 if not drawn:mink(im,actor)
 enc.stdin.write(im.tobytes())
enc.stdin.close();assert p.wait()==0 and enc.wait()==0
print(out,meta['frames'],'frames')
