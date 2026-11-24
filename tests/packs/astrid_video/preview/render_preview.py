"""Standalone raster preview of the exact TypeScript motion and reveal mask.
Not an Astrid/Remotion render. The outgoing card remains visible until each tile
is replaced by the incoming card. Both image and moving media are demonstrated.
"""
from pathlib import Path
import json, subprocess, sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
PRE=ROOT/'preview'; A=ROOT/'astrid_video/rendering/elements/effects/pixel-card-shuffle/assets'
P=json.loads(subprocess.check_output(['node',str(PRE/'frame-plan.cjs')]))
w,h,fps=P['width'],P['height'],P['fps'];params=P['params']
cv2.setNumThreads(2)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',14)
def bgr(s):return tuple(int(s[i:i+2],16) for i in (5,3,1))
assets={}; caps={}
for i,card in enumerate(params['cards']):
 k=card['asset']
 if card['kind']=='image':assets[i]=cv2.imread(str(A/(k+'.png')));assert assets[i] is not None
 else:
  cap=cv2.VideoCapture(str(A/(k+'.mp4')));assert cap.isOpened();caps[i]=cap
  cap.set(cv2.CAP_PROP_POS_MSEC,card.get('sourceStart',0)*1000)
output=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'sample.mp4'
output.parent.mkdir(parents=True,exist_ok=True)
proc=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s',f'{w}x{h}','-r',str(fps),'-i','-','-an','-c:v','libx264','-crf','17','-preset','fast','-threads','4','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
thumbs=[]; strip=[]; previous=None; last_card=None; prior_idx=-1
for row in P['states']:
 i=row['index'];fr=row['frame'];s=row['state'];reveal=row['reveal'];card=params['cards'][i]
 bg=bgr(s['background']);accent=bgr(s['accent']);border=bgr(s['frameColor'])
 if i!=prior_idx:previous=last_card;prior_idx=i
 if i in assets:src=assets[i]
 else:
  ok,src=caps[i].read();assert ok,(card['asset'],fr)
 sh,sw=src.shape[:2];scale=(max if params['fit']=='cover' else min)(w/sw,h/sh)
 rw,rh=round(sw*scale),round(sh*scale);res=cv2.resize(src,(rw,rh))
 if params['fit']=='cover':
  x,y=(rw-w)//2,(rh-h)//2;src=res[y:y+h,x:x+w]
 else:
  src=np.full((h,w,3),bg,np.uint8);x,y=(w-rw)//2,(h-rh)//2;src[y:y+rh,x:x+rw]=res
 M=cv2.getRotationMatrix2D((w/2,h/2),-s['angle'],s['scale']);M[0,2]+=s['x'];M[1,2]+=s['y']
 new=cv2.warpAffine(src,M,(w,h),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT,borderValue=bg)
 corners=cv2.transform(np.array([[[0.,0.],[w-1.,0.],[w-1.,h-1.],[0.,h-1.]]],dtype=np.float32),M)[0]
 cv2.polylines(new,[np.round(corners).astype(np.int32)],True,border,s['frameWidth'],cv2.LINE_AA)
 if params['showCounter']:
  img=Image.fromarray(cv2.cvtColor(new,cv2.COLOR_BGR2RGB));d=ImageDraw.Draw(img);d.text((int(w*.055),h-int(h*.015)-16),f'{i+1:02d} / {len(params["cards"]):02d}  ·  {card.get("label", "")}',fill=tuple(reversed(bgr(s['foreground']))),font=font);new=cv2.cvtColor(np.asarray(img),cv2.COLOR_RGB2BGR)
 last_card=new
 if reveal['progress']<1:
  assert previous is not None
  out=previous.copy()
  for r in reveal['revealed']:
   x,y,ww,hh=r['x'],r['y'],r['width'],r['height'];out[y:y+hh,x:x+ww]=new[y:y+hh,x:x+ww]
  for r in reveal['sparks']:
   x,y,ww,hh=r['x'],r['y'],r['width'],r['height'];roi=out[y:y+hh,x:x+ww];roi[:]=np.rint(roi*.18+np.array(accent)*.82).astype(np.uint8)
 else:out=new
 if fr==P['schedule'][i]['length']-1:thumbs.append(out.copy())
 if i==1 and fr in [0,3,6,9,12]:strip.append(out.copy())
 if i==1 and fr==6:cv2.imwrite(str(PRE/'transition-frame.png'),out)
 proc.stdin.write(out.tobytes())
proc.stdin.close();assert proc.wait()==0
for cap in caps.values():cap.release()
if len(thumbs)==6:
 grid=np.vstack([np.hstack([cv2.resize(thumbs[i+j],(640,360)) for j in range(2)]) for i in range(0,6,2)]);cv2.imwrite(str(PRE/'contact-sheet.jpg'),grid,[cv2.IMWRITE_JPEG_QUALITY,93])
if strip:
 grid=np.vstack([cv2.resize(f,(640,360)) for f in strip]);cv2.imwrite(str(PRE/'reveal-strip.jpg'),grid,[cv2.IMWRITE_JPEG_QUALITY,95])
print(f'Wrote {output} ({P["frames"]} frames)')
