"""Standalone compositor for the exact living-deck TypeScript geometry.
No Astrid or Remotion host is simulated; the output is a design-review sample."""
from pathlib import Path
import subprocess, sys, json
import cv2
import numpy as np
ROOT=Path(__file__).resolve().parents[1];PRE=ROOT/'preview';A=ROOT/'astrid_video/rendering/elements/effects/pixel-card-shuffle/assets'
mode=sys.argv[1];output=Path(sys.argv[2]);cv2.setNumThreads(2)
if mode=='arms':A=A.parent.parent/'pixel-arm-display'/'assets'
plan=subprocess.Popen(['node',str(PRE/'living-plan.cjs'),mode],stdout=subprocess.PIPE,text=True)
header=json.loads(plan.stdout.readline());w,h,fps,frames=(header[k] for k in ('width','height','fps','frames'));p=header['params'];cards=p['cards']
assets={};videos={};fitted={}
for i,card in enumerate(cards):
    if card['kind']=='image':
        assets[i]=cv2.imread(str(A/(card['asset']+'.png')));assert assets[i] is not None
    else:
        cap=cv2.VideoCapture(str(A/(card['asset']+'.mp4')));assert cap.isOpened();vs=[]
        source_fps=cap.get(cv2.CAP_PROP_FPS)
        while True:
            ok,frame=cap.read()
            if not ok:break
            vs.append(frame)
        cap.release();videos[i]=(source_fps,vs)
def bgr(c):return tuple(int(c[i:i+2],16) for i in (5,3,1))
def fit(i,layer,pal):
    b=layer['box'];ww,hh=b['width'],b['height'];card=cards[i];kind=card.get('fit',p.get('fit','cover'))
    f=layer['sourceFrame'];key=(i,ww,hh,kind)
    if i in assets and key in fitted:return fitted[key]
    if i in assets:src=assets[i]
    else:
        source_fps,vs=videos[i];n=round((f/fps+card.get('sourceStart',0))*source_fps);assert n<len(vs),(i,n,len(vs));src=vs[n]
    sh,sw=src.shape[:2];scale=(max if kind=='cover' else min)(ww/sw,hh/sh);rw,rh=max(1,round(sw*scale)),max(1,round(sh*scale))
    res=cv2.resize(src,(rw,rh),interpolation=cv2.INTER_AREA if scale<1 else cv2.INTER_LINEAR)
    if kind=='cover':x,y=(rw-ww)//2,(rh-hh)//2;im=res[y:y+hh,x:x+ww].copy()
    else:
        im=np.full((hh,ww,3),bgr(pal['panel']),np.uint8);x,y=(ww-rw)//2,(hh-rh)//2;im[y:y+rh,x:x+rw]=res
    cv2.rectangle(im,(0,0),(ww-1,hh-1),bgr(pal['frameColor']),1)
    if i in assets:fitted[key]=im
    return im

def put_rect(out,r,color):
    x,y,ww,hh=(r[k] for k in ('x','y','width','height'));x0,y0,x1,y1=max(0,x),max(0,y),min(w,x+ww),min(h,y+hh)
    if x1>x0 and y1>y0:out[y0:y1,x0:x1]=color

def tissue(out,cells,pal):
    tones={'body':bgr(pal['accent']),'shadow':bgr(pal['accentText']),'light':bgr('#FFBE79')}
    for c in cells:put_rect(out,c,tones[c['tone']])

def layer_draw(out,layer,pal):
    b=layer['box'];x,y=b['x'],b['y'];reveal=layer['reveal']
    if reveal['progress']>0:
        im=fit(layer['index'],layer,pal)
        for r in reveal['revealed']:
            sx,sy,rw,rh=(r[k] for k in ('x','y','width','height'));x0,y0,x1,y1=max(0,x+sx),max(0,y+sy),min(w,x+sx+rw),min(h,y+sy+rh)
            if x1>x0 and y1>y0:out[y0:y1,x0:x1]=im[y0-y:y1-y,x0-x:x1-x]
    for r in reveal['sparks']:
        x0,y0,x1,y1=max(0,x+r['x']),max(0,y+r['y']),min(w,x+r['x']+r['width']),min(h,y+r['y']+r['height'])
        if x1>x0 and y1>y0:
            roi=out[y0:y1,x0:x1];roi[:]=np.rint(roi*.28+np.array(bgr(pal['accent']))*.72).astype(np.uint8)

output.parent.mkdir(parents=True,exist_ok=True)
enc=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s',f'{w}x{h}','-r',str(fps),'-i','-','-an','-c:v','libx264','-crf','17','-preset','fast','-threads','4','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
thumbs=[];shots=[12,36,67,96,123,154,183,222] if mode in ('carry','slide') else [12,28,49,69,100,131]
for k,line in enumerate(plan.stdout):
    f=json.loads(line);pal=f['palette'];out=np.full((h,w,3),bgr(pal['background']),np.uint8)
    tissue(out,f['back'],pal)
    for layer in f['layers']:
        layer_draw(out,layer,pal);tissue(out,layer['front'],pal)
    enc.stdin.write(out.tobytes())
    if k in shots:thumbs.append(cv2.resize(out,(640,360),interpolation=cv2.INTER_AREA));cv2.imwrite(str(PRE/f'{mode}-frame-{k:03}.png'),out)
enc.stdin.close();assert enc.wait()==0 and plan.wait()==0 and k+1==frames
cv2.imwrite(str(PRE/f'{mode}-contact.jpg'),np.vstack([np.hstack(thumbs[i:i+2]) for i in range(0,len(thumbs),2)]),[cv2.IMWRITE_JPEG_QUALITY,94])
print(f'Wrote {output}: {frames} frames, {mode}')
