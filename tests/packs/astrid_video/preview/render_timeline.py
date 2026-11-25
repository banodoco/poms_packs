"""Standalone rendering of actual TypeScript timeline frame plans, not an Astrid export."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from functools import lru_cache
import cv2,numpy as np,json,subprocess,sys
P=Path(__file__).resolve().parent;A=P/'timeline-media';fontroot=Path('/usr/share/fonts/truetype/dejavu');cv2.setNumThreads(1)
def configure(compiled,rate):
 global c,s,k,tracks,timeline,w,h,fps
 c=compiled;s=c['style'];k=c['scale'];tracks=c['tracks'];timeline=c['timeline'];w=c['width'];h=c['height'];fps=rate
@lru_cache(None)
def font(size,kind='sans'):return ImageFont.truetype(str(fontroot/({'serif':'DejaVuSerif.ttf','sans':'DejaVuSans.ttf','bold':'DejaVuSans-Bold.ttf','mono':'DejaVuSansMono.ttf'}[kind])),max(8,round(size)))
def ft(size,kind='sans'):return font(max(8,round(size*k)),kind)
def timecode(t):cs=int(max(0,t)*100+1e-6);return f'{cs//6000:02d}:{cs//100%60:02d}.{cs%100:02d}'
def box(b):return (b['x'],b['y'],b['x']+b['width']-1,b['y']+b['height']-1)
def rgb(hex):return tuple(bytes.fromhex(hex.lstrip('#')))
@lru_cache(None)
def media(asset,kind):
 if kind=='image':return cv2.cvtColor(cv2.imread(str(A/(asset+'.png'))),cv2.COLOR_BGR2RGB)
 cap=cv2.VideoCapture(str(A/(asset+'.mp4')));rate=cap.get(cv2.CAP_PROP_FPS);frames=[]
 while True:
  ok,f=cap.read()
  if not ok:break
  frames.append(cv2.cvtColor(f,cv2.COLOR_BGR2RGB))
 cap.release();assert frames,asset;return rate,frames

def source_image(asset,kind,frame,bw,bh,fit='cover'):
 src=media(asset,kind)
 if kind=='video':rate,frames=src;src=frames[min(len(frames)-1,max(0,int(frame/fps*rate+1e-7)))]
 sh,sw=src.shape[:2];ratio=(max if fit=='cover' else min)(bw/sw,bh/sh);rw,rh=max(1,round(sw*ratio)),max(1,round(sh*ratio));res=cv2.resize(src,(rw,rh),interpolation=cv2.INTER_AREA if ratio<1 else cv2.INTER_LINEAR)
 if fit=='cover':x,y=(rw-bw)//2,(rh-bh)//2;return Image.fromarray(res[y:y+bh,x:x+bw])
 im=Image.new('RGB',(bw,bh),s['panel']);im.paste(Image.fromarray(res),((bw-rw)//2,(bh-rh)//2));return im

def line(d,xy,fill,width=1):d.line(xy,fill=fill,width=max(1,round(width)))
def shorten(d,text,face,limit):
 if d.textlength(text,font=face)<=limit:return text
 while text and d.textlength(text+'…',font=face)>limit:text=text[:-1]
 return text+'…' if text else ''
def draw_block(im,b):
 x,y,bw,bh=(b['box'][v] for v in ('x','y','width','height'));p=b['p'];strip=p>.8;placed=p==1
 card=Image.new('RGB',(bw,bh),b['color']);d=ImageDraw.Draw(card);dp=max(0,min(1,(p-.78)/.22));dock=dp*dp*(3-2*dp);thumb=bw+(min(bw*.4,bh*1.65)-bw)*dock;thumb=max(1,round(thumb));ih=max(1,round(bh-20*k*(1-dock)))
 if b['kind']!='label':card.paste(source_image(b['asset'],b['kind'],b['sourceFrame'],thumb,ih,'contain'),(0,0))
 start=round(thumb+5*k) if strip and b['kind']!='label' else round(6*k);face=ft(12,'bold');baseline=bh/2-face.size*.56 if strip else bh-face.size-3*k
 title=shorten(d,b['label'],face,bw-start-4*k)
 if title:d.text((start,max(0,baseline)),title,font=face,fill='#25241F')
 d.rectangle((0,0,bw-1,bh-1),outline=s['accent'] if b['active'] else s['border'],width=2 if b['active'] else 1)
 im.paste(card,(x,y))
def draw(f,visible_ids=None):
 im=Image.new('RGB',(w,h),s['background']);d=ImageDraw.Draw(im);margin=c['margin'];titleY=c['titleY'];sysfont=ft(11,'mono');small=ft(14);titlefont=font(min(35*k,w*.065),'serif')
 d.text((margin,titleY),c['eyebrow'],font=sysfont,fill=s['accentText']);d.text((margin,titleY+19*k),c['title'],font=titlefont,fill=s['foreground']);v=f"{f['assembled']} / {len(c['clips'])} placed" if c['mode']=='assemble' and not f['playing'] else f"{timecode(f['timelineTime'])} / {timecode(c['duration'])}";d.text((w-margin-d.textlength(v,font=sysfont),titleY+22*k),v,font=sysfont,fill=s['muted'])
 if f['playerOpacity']>0:
  playerLayer=im.copy();pd=ImageDraw.Draw(playerLayer)
  for p in f['players']:
   b=p['box'];x,y,bw,bh=(b[q] for q in ('x','y','width','height'));playerLayer.paste(source_image(p['asset'],'video',p['sourceFrame'],bw,bh,'contain'),(x,y));pd.rectangle(box(b),outline=s['border']);cy=y+bh+5*k;xx=x
   for tr in tracks:
    if tr['id'] in p.get('tracks',[]):pd.rectangle((xx,cy+4*k,xx+6*k,cy+11*k),fill=tr['color']);xx+=9*k
   pd.text((xx,cy),p['label'],font=small,fill=s['muted']);t=timecode(f['timelineTime']);pd.text((x+bw-pd.textlength(t,font=sysfont),cy+2*k),t,font=sysfont,fill=s['muted'])
  if not f['players']:pd.text((w/2,c['pool']['y']+c['pool']['height']/2),'The timeline is ready.',font=ft(28,'serif'),fill=s['muted'],anchor='mm')
  im=Image.blend(im,playerLayer,f['playerOpacity']);d=ImageDraw.Draw(im)
 title='Timeline';d.text((margin,timeline['y']-26*k),title,font=ft(14,'bold'),fill=s['foreground']);d.text((margin+d.textlength(title,font=ft(14,'bold'))+9*k,timeline['y']-25*k),f"{len(tracks)} tracks · {len(c['clips'])} clips",font=sysfont,fill=s['muted']);d.rectangle(box(timeline),fill=s['panel'],outline=s['border']);active={b['track'] for b in f['blocks'] if b['active']}
 for tr in tracks:
  b=tr['box'];x,y,bw,bh=(b[q] for q in ('x','y','width','height'))
  if tr['id'] in active:d.rectangle(box(b),fill=tuple(round(a*.84+v*.16) for a,v in zip(rgb(s['panel']),rgb(tr['color']))))
  line(d,[(x,y),(x+bw,y)],s['border']);d.rectangle((x+10*k,y+bh/2-6*k,x+15*k,y+bh/2+6*k),fill=tr['color']);d.text((x+22*k,y+bh/2),shorten(d,tr['label'],ft(13),c['x0']-x-26*k),font=ft(13),fill=s['foreground'],anchor='lm')
 line(d,[(c['x0'],timeline['y']),(c['x0'],timeline['y']+timeline['height'])],s['border'])
 for t in c['ticks']:
  tx=t['x'];line(d,[(tx,timeline['y']),(tx,timeline['y']+timeline['height'])],s['border']);
  if c['showTimecodes']:
   label=f"{t['at']:g}s";tx=min(tx+4*k,c['x1']-6*k-d.textlength(label,font=sysfont));d.text((tx,timeline['y']+4*k),label,font=sysfont,fill=s['muted'])
 for cell in f['cells']:d.rectangle(box(cell),fill={'body':s['accent'],'shadow':s['accentText'],'light':'#FFBE79'}[cell['tone']])
 for b in f['blocks']:
  if visible_ids is None or b['id'] in visible_ids:draw_block(im,b)
 d=ImageDraw.Draw(im)
 if f['playing']:
  x=f['playhead'];line(d,[(x,timeline['y']),(x,timeline['y']+timeline['height'])],s['accent'],1.7*k);d.polygon([(x-4*k,timeline['y']-4*k),(x+4*k,timeline['y']-4*k),(x,timeline['y']+2*k)],fill=s['accent'])
 return im
def main():
 source=Path(sys.argv[1]);output=Path(sys.argv[2]);width,height,rate=map(int,sys.argv[3:6]) if len(sys.argv)>3 else (1280,720,24)
 proc=subprocess.Popen(['node',str(P/'timeline-plan.cjs'),str(source),str(width),str(height),str(rate)],stdout=subprocess.PIPE,text=True);configure(json.loads(proc.stdout.readline()),rate)
 enc=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(fps),'-i','-','-an','-c:v','libx264','-crf','18','-preset','fast','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
 samples=[0,round(c['frames']*.15),round(c['frames']*.30),min(c['frames']-1,round(c['playbackAt']*fps)+5),round(c['frames']*.75),c['frames']-1] if c['mode']=='assemble' else [0,round(c['frames']*.15),round(c['frames']*.32),round(c['frames']*.5),round(c['frames']*.73),c['frames']-1];stills={}
 for i,raw in enumerate(proc.stdout):
  f=json.loads(raw);im=draw(f);enc.stdin.write(im.tobytes());
  if i in samples:stills[i]=im.copy()
 enc.stdin.close();assert enc.wait()==0 and proc.wait()==0 and i+1==c['frames']
 W=1280;pad=20;tw=(W-3*pad)//2;th=round(tw*h/w);H=(th+34)*((len(stills)+1)//2)+pad+48;sheet=Image.new('RGB',(W,H),'#F7F4ED');d=ImageDraw.Draw(sheet);d.text((pad,12),'ASTRID / '+('TIMELINE ASSEMBLY' if c['mode']=='assemble' else 'SYNCHRONIZED PLAYERS'),font=font(20,'mono'),fill='#A94714')
 for j,(f,im) in enumerate(stills.items()):
  x=pad+(j%2)*(tw+pad);y=48+(j//2)*(th+34);d.text((x,y),f'{f/fps:.2f}s',font=font(16,'mono'),fill='#615E55');sheet.paste(im.resize((tw,th),Image.Resampling.LANCZOS),(x,y+24))
 sheet.save(output.with_name(output.stem+'-contact.jpg'),quality=94)
 print(f'{output.name}: {c["frames"]} frames, {len(tracks)} tracks, {len(c["clips"])} clips, {len(c["panels"])} player(s)')

if __name__=='__main__':main()
