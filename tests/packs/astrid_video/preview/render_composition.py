"""Standalone frame-plan preview, not a Remotion/Astrid export. JSON or YAML wrapper input."""
from pathlib import Path
from collections import OrderedDict
import subprocess, sys, json, tempfile
import cv2, numpy as np, yaml
from PIL import Image, ImageDraw, ImageFont
R=Path(__file__).resolve().parents[1];PRE=R/'preview';AS=R/'astrid_video/rendering/elements/effects/living-composition/assets'
file=Path(sys.argv[1]);output=Path(sys.argv[2]);w,h,fps=(map(int,sys.argv[3:6]) if len(sys.argv)>=6 else (960,540,24));cv2.setNumThreads(1)
AS=Path(sys.argv[6]).resolve() if len(sys.argv)>6 else AS
ex=yaml.safe_load(file.read_text());output.parent.mkdir(parents=True,exist_ok=True)
with tempfile.NamedTemporaryFile(suffix='.json',mode='w',delete=False) as tmp:
 json.dump(ex,tmp);tmpfile=tmp.name
plan=subprocess.Popen(['node',str(PRE/'composition-plan.cjs'),tmpfile,str(w),str(h),str(fps)],stdout=subprocess.PIPE,text=True)
meta=json.loads(plan.stdout.readline());(output.parent/(output.stem+'-resolved.json')).write_text(json.dumps(meta,indent=2));frames=meta['frames']
assets={};videos={};cache=OrderedDict();fonts={}
def bgr(c):return tuple(int(c[i:i+2],16) for i in (5,3,1))
def font(size,serif=False):
 size=max(8,int(size));key=(size,serif)
 if key not in fonts:fonts[key]=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf' if serif else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',size)
 return fonts[key]
def src(c,frame):
 key=c['asset'];typ=c['kind']
 if typ=='image':
  if key not in assets:
   assets[key]=cv2.imread(str(AS/(key+'.png')));assert assets[key] is not None,key
  return assets[key]
 if key not in videos:
  cap=cv2.VideoCapture(str(AS/(key+'.mp4')));assert cap.isOpened(),key
  rate=cap.get(cv2.CAP_PROP_FPS);images=[]
  while True:
   ok,img=cap.read()
   if not ok:break
   images.append(img)
  cap.release();videos[key]=(rate,images)
 rate,images=videos[key];i=round((frame/fps+c.get('sourceStart',0))*rate);assert 0<=i<len(images),(key,i,len(images));return images[i]
def get_card(layer,pal):
 b=layer['box'];ww,hh=b['width'],b['height'];c=layer['content'];kind=c.get('fit','contain');f=layer['sourceFrame'];key=(json.dumps(c,sort_keys=True),ww,hh,f if c['kind']=='video' else 0,pal['panel'])
 if key in cache:cache.move_to_end(key);return cache[key]
 if c['kind']=='text':
  im=Image.new('RGB',(ww,hh),pal['panel']);d=ImageDraw.Draw(im);size=max(9,min(ww*.095,hh*.22,ww/max(3,len(c['text']))*1.55));title=font(size,True);body=font(size*.43);pad=round(min(ww,hh)*.08)
  def wrap(t,face):
   lines=[];line=''
   for word in t.split():
    n=(line+' '+word).strip()
    if line and d.textlength(n,font=face)>ww-2*pad:lines.append(line);line=word
    else:line=n
   if line:lines.append(line)
   return '\n'.join(lines)
  text=wrap(c['text'],title);sub=wrap(c.get('subtitle',''),body);th=d.multiline_textbbox((0,0),text,font=title,spacing=2)[3];sh=d.multiline_textbbox((0,0),sub,font=body,spacing=2)[3] if sub else 0;y=(hh-th-sh-size*.24)/2;d.multiline_text((pad,y),text,fill=pal['foreground'],font=title,spacing=2);d.multiline_text((pad,y+th+size*.24),sub,fill=pal['muted'],font=body,spacing=2);im=cv2.cvtColor(np.array(im),cv2.COLOR_RGB2BGR)
 else:
  raw=src(c,f);sh,sw=raw.shape[:2];scale=(max if kind=='cover' else min)(ww/sw,hh/sh);rw,rh=max(1,round(sw*scale)),max(1,round(sh*scale));res=cv2.resize(raw,(rw,rh),interpolation=cv2.INTER_AREA if scale<1 else cv2.INTER_LINEAR)
  if kind=='cover':x,y=(rw-ww)//2,(rh-hh)//2;im=res[y:y+hh,x:x+ww].copy()
  else:im=np.full((hh,ww,3),bgr(pal['panel']),np.uint8);x,y=(ww-rw)//2,(hh-rh)//2;im[y:y+rh,x:x+rw]=res
 cv2.rectangle(im,(0,0),(ww-1,hh-1),bgr(pal['frameColor']),1)
 cache[key]=im
 while len(cache)>32:cache.popitem(last=False)
 return im
def tissue(out,cells,pal,tile):
 if not cells:return
 cols=(w+tile-1)//tile;rows=(h+tile-1)//tile;grid=np.zeros((rows,cols),np.uint8);idx={'body':1,'shadow':2,'light':3}
 a=np.array([(c['x']//tile,c['y']//tile,idx[c['tone']]) for c in cells],dtype=np.int32);grid[a[:,1],a[:,0]]=a[:,2];mask=cv2.resize(grid,(cols*tile,rows*tile),interpolation=cv2.INTER_NEAREST)[:h,:w]
 for i,col in enumerate([pal['accent'],pal['accentText'],'#FFBE79'],1):out[mask==i]=bgr(col)
def draw(out,l,pal):
 b=l['box'];x,y=b['x'],b['y'];r=l['reveal'];im=get_card(l,pal)
 for rect in r['revealed']:
  sx,sy,rw,rh=(rect[k] for k in ('x','y','width','height'));x0,y0,x1,y1=max(0,x+sx),max(0,y+sy),min(w,x+sx+rw),min(h,y+sy+rh)
  if x1>x0 and y1>y0:out[y0:y1,x0:x1]=im[y0-y:y1-y,x0-x:x1-x]
 for rect in r['sparks']:
  x0,y0,x1,y1=max(0,x+rect['x']),max(0,y+rect['y']),min(w,x+rect['x']+rect['width']),min(h,y+rect['y']+rect['height'])
  if x1>x0 and y1>y0:roi=out[y0:y1,x0:x1];roi[:]=np.rint(roi*.28+np.array(bgr(pal['accent']))*.72).astype(np.uint8)
enc=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s',f'{w}x{h}','-r',str(fps),'-i','-','-an','-c:v','libx264','-crf','18','-preset','fast','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
poses={p['arrival']:p for p in meta['poses']};still={};mid={};middles={round((p['start']+p['arrival'])/2):p for p in meta['poses'] if p['start']<p['arrival']}
try:
 for k,line in enumerate(plan.stdout):
  f=json.loads(line);pal=f['palette'];out=np.full((h,w,3),bgr(pal['background']),np.uint8);tile=f['tile'];tissue(out,f['back'],pal,tile)
  for l in f['layers']:draw(out,l,pal)
  for l in f['layers']:tissue(out,l['front'],pal,tile)
  tissue(out,f['overlay'],pal,tile);enc.stdin.write(out.tobytes())
  if k in poses:still[k]=Image.fromarray(cv2.cvtColor(out,cv2.COLOR_BGR2RGB))
  if k in middles:mid[k]=Image.fromarray(cv2.cvtColor(out,cv2.COLOR_BGR2RGB))
 enc.stdin.close();assert enc.wait()==0 and plan.wait()==0 and k+1==frames
finally:Path(tmpfile).unlink(missing_ok=True)
paper='#F7F4ED';ink='#25241F';muted='#615E55';orange='#ED6B23';line='#D5D0C5';margin=54;W=1500;gap=26;tw=(W-margin*2-gap)//2;th=round(tw*h/w);n=len(poses);rows=(n+1)//2;H=190+rows*(th+73)+170
sheet=Image.new('RGB',(W,H),paper);d=ImageDraw.Draw(sheet)
d.text((margin,35),'ASTRID / LIVING COMPOSITION',font=font(18),fill='#A94714');d.text((margin,70),output.stem.replace('Astrid_','').replace('_',' '),font=font(43,True),fill=ink);d.text((margin,133),'Resolved destinations · actual preview frames · time = arrival',font=font(21),fill=muted)
for i,(k,p) in enumerate(poses.items()):
 x=margin+(i%2)*(tw+gap);y=180+(i//2)*(th+73);d.text((x,y),f'{k/fps:05.2f}s  /  {p["name"]}',font=font(23,True),fill=ink);sheet.paste(still[k].resize((tw,th),Image.Resampling.LANCZOS),(x,y+35));d.rectangle((x,y+35,x+tw-1,y+35+th-1),outline=line,width=1);d.text((x,y+th+43),f'{p["behaviour"]}  ·  {len(p["items"])} item'+('s' if len(p['items'])!=1 else ''),font=font(16),fill=muted)
y=190+rows*(th+73);d.line((margin,y,W-margin,y),fill=line,width=2);d.text((margin,y+17),'TIMING / ORANGE = TRANSITION',font=font(17),fill='#A94714');left=margin;right=W-margin;scale=(right-left)/frames;barY=y+66
for i,p in enumerate(meta['poses']):
 a,b=p['start'],p['arrival'];end=meta['poses'][i+1]['start'] if i+1<len(meta['poses']) else frames
 d.rectangle((left+a*scale,barY,left+b*scale,barY+32),fill=orange);d.rectangle((left+b*scale,barY,left+end*scale,barY+32),fill=['#E6EDDF','#F3EAD6','#E2E8EE'][i%3]);d.line((left+b*scale,barY-7,left+b*scale,barY+40),fill='#A94714',width=2);d.text((left+b*scale+4,barY+42),f'{b/fps:.2f}s',font=font(15),fill=muted)
sheet.save(output.parent/(output.stem+'-storyboard.jpg'),quality=93)
if mid:
 mw=640;mh=round(mw*h/w);n=len(mid);cs=Image.new('RGB',(mw*2,(mh+28)*((n+1)//2)),paper);cd=ImageDraw.Draw(cs)
 for i,(k,image) in enumerate(mid.items()):
  p=middles[k]
  x=i%2*mw;y=i//2*(mh+28);cs.paste(mid[k].resize((mw,mh),Image.Resampling.LANCZOS),(x,y+28));cd.text((x+12,y+4),f'{k/fps:.2f}s → {p["name"]}',font=font(15),fill=ink)
 cs.save(output.parent/(output.stem+'-transitions.jpg'),quality=92)
print(f'{output.name}: {frames} frames, {len(still)} destinations, {len(mid)} transition witnesses, {len(meta["warnings"])} warnings')
