"""Render the actual v0.13 TS plans with Pillow/FFmpeg. Not a native Astrid export."""
from pathlib import Path
import json,subprocess,sys,math
from PIL import Image,ImageDraw,ImageOps
import render_timeline as tl
P=Path(__file__).resolve().parent;ROOT=P.parent;A=ROOT/'astrid_video/rendering/elements/effects/mink-performer/assets'
source=Path(sys.argv[1]);output=Path(sys.argv[2]);w,h,fps=map(int,sys.argv[3:6]) if len(sys.argv)>3 else (1280,720,24);tl.A=Path(sys.argv[6]).resolve() if len(sys.argv)>6 else tl.A;mink_only='mink' in source.stem and 'agent' not in source.stem
p=subprocess.Popen(['node',str(P/'activity-plan.cjs'),str(source),str(w),str(h),str(fps),'mink' if mink_only else 'activity'],stdout=subprocess.PIPE,text=True);c=json.loads(p.stdout.readline());k=min(w/1280,h/720);style=c.get('style',{'background':'#F7F4ED','foreground':'#25241F','panel':'#FFFEFA','muted':'#615E55','border':'#D5D0C5','accent':'#ED6B23','accentText':'#A94714'});sheet={n:Image.open(A/(n+'.png')).convert('RGBA') for n in ['run','wave','idle','settle']}
if c.get('timeline'):tl.configure(c['timeline'],fps)
else:tl.fps=fps;tl.s=style

def font(s,kind='sans'):return tl.font(max(8,round(s*k)),kind)
def bounds(b):return tuple(round(b[x]) for x in ('x','y','width','height'))
def rect(b):x,y,bw,bh=bounds(b);return (x,y,x+bw-1,y+bh-1)
def paste_mink(im,f):
 m=f.get('mink');b=f.get('minkBox');
 if not m or not m['visible']:return
 i=m['index'];sp=sheet[m['sprite']].crop((i*96,0,(i+1)*96,88));x,y,bw,bh=bounds(b);sp=sp.resize((bw,bh),Image.Resampling.NEAREST)
 if m['facing']=='left':sp=ImageOps.mirror(sp)
 im.paste(sp,(x,y),sp)

def wrap(d,text,ft,width,max_lines=3):
 words=text.split();lines=[];line=''
 for word in words:
  new=(line+' '+word).strip()
  if d.textlength(new,font=ft)<=width:line=new
  else:
   if line:lines.append(line)
   line=word
 if line:lines.append(line)
 if len(lines)>max_lines:lines=lines[:max_lines];lines[-1]=tl.shorten(d,lines[-1]+'…',ft,width)
 return lines

def term(im,f):
 b=c['left'];x,y,bw,bh=bounds(b);terminal=Image.new('RGBA',(bw,bh),(0,0,0,0));d=ImageDraw.Draw(terminal);r=max(2,round(8*k));d.rounded_rectangle((0,0,bw-1,bh-1),r,fill='#202127');small=font(12,'mono');body=font(14,'mono');head=font(10,'mono');pad=round(15*k)
 d.ellipse((pad,12*k,pad+8*k,20*k),fill='#ED6B23');d.text((pad+15*k,8*k),'astrid / session',font=small,fill='#BDB7AD');d.line((0,34*k,bw,34*k),fill='#46464A');yy=48*k;d.text((pad,yy),'CREATIVE DIRECTION',font=head,fill='#A7A6A2');yy+=20*k;d.text((pad,yy),'>',font=body,fill='#FFB176')
 for line in wrap(d,c['request'],body,bw-2*pad-19*k,4):d.text((pad+19*k,yy),line,font=body,fill='#F6F0E5');yy+=20*k
 yy+=10*k;d.line((pad,yy,bw-pad,yy),fill='#46464A');yy+=13*k;footer=bh-43*k;row_height=50*k;maxrows=max(1,int((footer-yy)/row_height));log=f['events'][-maxrows:]
 for e in log:
  mark={'done':'✓','failed':'×','waiting':'·','working':'›'}[e['status']];col={'done':'#A2C5A4','failed':'#F39A91','waiting':'#BDB7AD','working':'#FFB176'}[e['status']];d.text((pad,yy),mark,font=font(14,'sans'),fill=col);tx=pad+19*k;message=e['text']+(' ▌' if e['status']=='working' and int(f['t']*2)%2==0 else '')
  lines=wrap(d,message,body,bw-tx-pad,2)
  for j,line in enumerate(lines):d.text((tx,yy+j*17*k),line,font=body,fill=col if e['status']=='working' else '#F6F0E5')
  if e.get('detail') and len(lines)==1:d.text((tx,yy+20*k),tl.shorten(d,e['detail'],small,bw-tx-pad),font=small,fill='#A7A6A2')
  yy+=row_height
 d.line((pad,footer,bw-pad,footer),fill='#46464A');stat='working' if any(e['status']=='working' for e in f['events']) else 'needs attention' if any(e['status']=='failed' for e in f['events']) else 'waiting' if any(e['status']=='waiting' for e in f['events']) else 'ready';d.text((pad,footer+11*k),stat,font=small,fill='#FFB176' if stat=='working' else '#BDB7AD');d.text((bw-pad,footer+11*k),'DEMO REPLAY',font=font(10,'mono'),fill='#A7A6A2',anchor='ra');terminal.putalpha(terminal.getchannel('A').point(lambda a:round(a*f['terminalOpacity'])));im.paste(terminal,(x,y),terminal)

def draw(f):
 im=Image.new('RGB',(w,h),style['background']);d=ImageDraw.Draw(im)
 if mink_only:
  d.text((w*.06,h*.06),'ASTRID / MINK PERFORMER',font=font(14,'mono'),fill='#A94714');d.text((w*.06,h*.11),'A little character.',font=font(44,'serif'),fill='#25241F');d.line((w*.04,h*.8,w*.96,h*.8),fill='#D5D0C5',width=max(1,round(k)));d.text((w*.06,h*.88),'run  →  settle  →  wave  →  run',font=font(15,'mono'),fill='#615E55');d.text((w*.94,h*.88),f"{f['mink']['sprite']}  /  {f['t']:.2f}s",font=font(15,'mono'),fill='#A94714',anchor='ra');paste_mink(im,f);return im
 if f['expand']<1:
  d.text((c['margin'],h*.035),'ASTRID / CREATIVE PROCESS',font=font(12,'mono'),fill=style['accentText']);d.text((c['margin'],h*.065),c['title'],font=font(36,'serif'),fill=style['foreground'])
  if f.get('mink') and f['mink']['depth']=='behind':paste_mink(im,f)
  term(im,f)
 if f.get('timeline'):
  tl.configure(f['timelineLayout'],fps);ti=tl.draw(f['timeline'],f['visibleIds']);x,y,bw,bh=bounds(f['outputBox']);im.paste(ti,(x,y));
  if f['expand']<1:ImageDraw.Draw(im).rounded_rectangle((x,y,x+bw-1,y+bh-1),radius=max(1,round(6*k*(1-f['expand']))),outline=style['border'])
 else:
  x,y,bw,bh=bounds(c['right']);d=ImageDraw.Draw(im);d.rectangle((x,y,x+bw,y+bh),fill=style['panel'],outline=style['border']);d.text((x+18*k,y+15*k),c['outputTitle'],font=font(24,'serif'),fill=style['foreground']);cols=1 if len(c['cards'])==1 else 2 if len(c['cards'])<=4 else 3;rows=math.ceil(len(c['cards'])/cols);gap=12*k;cw=(bw-36*k-(cols-1)*gap)/cols;ch=max(20*k,min(bw/cols*.57,(bh-86*k-(rows-1)*gap)/rows-24*k));active={v['id']:v for v in f['cards']}
  for i,card in enumerate(c['cards']):
   if card['id'] not in active:continue
   card=active[card['id']];cx=round(x+18*k+(i%cols)*(cw+gap));cy=round(y+65*k+(i//cols)*(ch+24*k+gap));ww,hh=round(cw),round(ch);d.rectangle((cx,cy,cx+ww,cy+hh+round(24*k)),fill=style['background'],outline=style['border'])
   if card['kind']=='text':
    for j,line in enumerate(wrap(d,card['text'],font(18,'serif'),ww-20*k,4)):d.text((cx+10*k,cy+12*k+j*23*k),line,font=font(18,'serif'),fill=style['foreground'])
   else:im.paste(tl.source_image(card['asset'],card['kind'],card['sourceFrame'],ww,hh),(cx,cy))
   d.text((cx+7*k,cy+hh+4*k),tl.shorten(d,card['label'],font(12),ww-14*k),font=font(12),fill=style['foreground'])
 if f.get('mink') and f['mink']['depth']=='front':paste_mink(im,f)
 return im
enc=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(fps),'-i','-','-an','-c:v','libx264','-crf','18','-preset','fast','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
ss=[.4,1.4,2.1,3,4.7,5.8,6.8] if mink_only else [1,2.5,5.5,7.6,9.9,10.9,12.2,16.5] if c.get('timeline') else [.5,1.5,2.8,4.5];indices={min(c['frames']-1,round(t*fps)) for t in ss};stills={}
for i,row in enumerate(p.stdout):
 f=json.loads(row);im=draw(f);enc.stdin.write(im.tobytes());
 if i in indices:stills[i]=im.copy()
enc.stdin.close();assert p.wait()==0 and enc.wait()==0 and i+1==c['frames'];W=1280;pad=20;tw=(W-3*pad)//2;th=round(tw*h/w);H=48+(th+32)*math.ceil(len(stills)/2)+pad;out=Image.new('RGB',(W,H),'#F7F4ED');d=ImageDraw.Draw(out);d.text((pad,12),'ASTRID / MINK PERFORMER' if mink_only else 'ASTRID / AGENT AT WORK',font=tl.font(20,'mono'),fill='#A94714')
for j,(i,img) in enumerate(stills.items()):
 x=pad+j%2*(tw+pad);y=48+j//2*(th+32);d.text((x,y),f'{i/fps:.2f}s',font=tl.font(16,'mono'),fill='#615E55');out.paste(img.resize((tw,th),Image.Resampling.LANCZOS),(x,y+23))
out.save(output.with_name(output.stem+'-contact.jpg'),quality=94);print(output,c['frames'],'frames')
