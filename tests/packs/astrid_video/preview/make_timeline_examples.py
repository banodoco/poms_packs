"""Build a reproducible illustrative six-second source edit from existing pack demo assets."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import cv2,numpy as np,json,subprocess
root=Path(__file__).resolve().parents[1];a=root/'astrid_video/rendering/elements/effects/living-composition/assets';out=root/'preview/timeline-media';out.mkdir(exist_ok=True)
W,H,FPS=960,540,24
paper='#F7F4ED';ink='#25241F';accent='#A94714'
serif='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf';sans='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def plate(name,eyebrow,title):
 im=Image.new('RGB',(640,184),paper);d=ImageDraw.Draw(im);d.rectangle((0,0,7,184),fill='#ED6B23');d.text((30,22),eyebrow,font=ImageFont.truetype(sans,19),fill=accent);d.text((30,62),title,font=ImageFont.truetype(serif,41),fill=ink);im.save(out/(name+'.png'));return cv2.cvtColor(np.array(im),cv2.COLOR_RGB2BGR)
opening=plate('opening','01 / THE CHOICE','Into the minkhole');ending=plate('ending','02 / THE RESULT','A new world awaits')
def resize(im,w,h):return cv2.resize(im,(w,h),interpolation=cv2.INTER_AREA)
def decode(p):
 cap=cv2.VideoCapture(str(p));rate=cap.get(cv2.CAP_PROP_FPS);frames=[]
 while True:
  ok,im=cap.read()
  if not ok:break
  frames.append(resize(im,W,H))
 cap.release();return rate,frames
room=resize(cv2.imread(str(a/'room.png')),W,H);mink=cv2.imread(str(a/'mink.png'));portal=decode(a/'portal.mp4');ascent=decode(a/'ascent.mp4')
for k in ('room.png','mink.png','portal.mp4','ascent.mp4'):
 import shutil
 shutil.copyfile(a/k,out/k)
def writer(name):return subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','19','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',str(out/(name+'.mp4'))],stdin=subprocess.PIPE)
base=writer('picture-only');final=writer('final-cut')
for f in range(6*FPS):
 t=f/FPS
 if t<1.75:frame=room.copy()
 elif t<3.875:frame=portal[1][min(len(portal[1])-1,int((t-1.75)*portal[0]))].copy()
 else:frame=ascent[1][min(len(ascent[1])-1,int((t-3.875)*ascent[0]))].copy()
 base.stdin.write(frame.tobytes())
 if t<1.75:
  graphic=resize(opening,480,138);frame[H-170:H-32,32:512]=graphic
 if 3.875<=t<6:
  graphic=resize(ending,480,138);frame[H-170:H-32,32:512]=graphic
 if 2.5<=t<3.875:
  icon=resize(mink,224,126);frame[24:150,W-248:W-24]=icon
 final.stdin.write(frame.tobytes())
for p in (base,final):p.stdin.close();assert p.wait()==0
tracks=[{'id':'inset','label':'Inset','kind':'graphics','color':'#D7BDB2'},{'id':'graphics','label':'Titles','kind':'graphics','color':'#DFC29B'},{'id':'picture','label':'Picture','kind':'picture','color':'#B6C9B0'}]
clips=[{'id':'room','track':'picture','at':0,'duration':1.75,'label':'Opening shot','kind':'image','asset':'room'},{'id':'opening','track':'graphics','at':0,'duration':1.75,'label':'Opening title','kind':'image','asset':'opening'},{'id':'portal','track':'picture','at':1.75,'duration':2.125,'label':'Portal','kind':'video','asset':'portal'},{'id':'mink','track':'inset','at':2.5,'duration':1.375,'label':'Mink inset','kind':'image','asset':'mink'},{'id':'ascent','track':'picture','at':3.875,'duration':2.125,'label':'Ascent','kind':'video','asset':'ascent'},{'id':'ending','track':'graphics','at':3.875,'duration':2.125,'label':'Closing title','kind':'image','asset':'ending'}]
slots={k:'demo-'+k for k in ['room','opening','portal','mink','ascent','ending','picture-only','final-cut']}
common={'theme':'day','eyebrow':'ASTRID / EDITING','timelineDuration':6,'tracks':tracks,'clips':clips,'mediaBindings':slots,'playbackRate':1,'pixelSize':2.4,'organismIntensity':.82,'organismFlow':1.1,'organismSpread':.65,'seed':47,'showTimecodes':True}
finalPlayer={'id':'final','label':'Final cut','asset':'final-cut','tracks':['inset','graphics','picture']}
examples={'assembly':{'mode':'assemble','duration':10.8,'params':{**common,'title':'The edit takes shape.','assemblySeconds':4.2,'travelSeconds':.82,'players':[finalPlayer]}},'player':{'mode':'play','duration':6,'params':{**common,'title':'One cut. Three layers.','players':[{'id':'base','label':'Picture only','asset':'picture-only','tracks':['picture']},finalPlayer]}}}
for key,v in examples.items(): (root/'preview'/('timeline-'+key+'.json')).write_text(json.dumps(v,indent=2)+'\n')
print('Prepared source edit: 6 actual component clips / 3 tracks / picture-only and final-cut video outputs.')
