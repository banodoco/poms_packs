from pathlib import Path
import math, subprocess, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'astrid_video/rendering/elements/effects/pixel-card-shuffle/assets'
W,H=1280,720
rng=np.random.default_rng(104)
fontpath='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
font=lambda size:ImageFont.truetype(fontpath,size)
def gradient(top,bottom,w=W,h=H):
    t=np.linspace(0,1,h)[:,None,None]
    return Image.fromarray(np.uint8(np.broadcast_to(np.array(top)[None,None,:]*(1-t)+np.array(bottom)[None,None,:]*t,(h,w,3))))
def texture(img,amount=2, vignette=0.16):
    a=np.array(img.convert('RGB'),dtype=np.float32); h,w=a.shape[:2]; x,y=np.meshgrid(np.linspace(-1,1,w),np.linspace(-1,1,h));v=1-vignette*np.clip((x*x+y*y)/2,0,1);a=a*v[:,:,None]+rng.normal(0,amount,(h,w,1));return Image.fromarray(np.uint8(np.clip(a,0,255)))
def save(img,name):img.save(A/name,optimize=True)
def caption(d,pos,text,col,size=20):d.text(pos,text,fill=col,font=font(size))
# 01: a dark, cinematic, deliberately fictional scene reference.
im=gradient((20,38,33),(6,13,11));d=ImageDraw.Draw(im)
# Tall window with a wash of pale green light.
d.rectangle((455,0,825,427),fill='#243E35');d.rectangle((472,0,807,407),fill='#405A49')
for x in (548,640,732):d.rectangle((x,0,x+9,407),fill='#152820')
for y in (118,246):d.rectangle((472,y,807,y+9),fill='#1A3028')
d.polygon([(477,402),(802,402),(1164,720),(124,720)],fill='#24372C')
for x in range(-260,1600,140):d.line((640,402,x,720),fill='#1D2D24',width=2)
for y in (465,530,610,700):d.line((0,y,1280,y),fill='#192920',width=2)
# two angular armchairs and silhouettes
for cx,flip in [(365,1),(915,-1)]:
 d.rounded_rectangle((cx-155,260,cx+153,600),radius=38,fill='#101915',outline='#405044',width=4)
 d.rounded_rectangle((cx-126,291,cx+126,530),radius=24,fill='#202921',outline='#344237',width=3)
 d.ellipse((cx-70,199,cx+70,339),fill='#111A16',outline='#4A5847',width=3)
 d.polygon([(cx-90,325),(cx+91,325),(cx+117,518),(cx-113,518)],fill='#101713')
 d.rounded_rectangle((cx-167,425,cx-75,575),radius=30,fill='#202B23',outline='#3A483A',width=3)
 d.rounded_rectangle((cx+75,425,cx+167,575),radius=30,fill='#202B23',outline='#3A483A',width=3)
 d.rectangle((cx-116,590,cx-104,642),fill='#101612');d.rectangle((cx+103,590,cx+115,642),fill='#101612')
 # glasses
 d.rounded_rectangle((cx-55,253,cx-4,274),radius=5,fill='#080D0A',outline='#697265',width=2)
 d.rounded_rectangle((cx+4,253,cx+55,274),radius=5,fill='#080D0A',outline='#697265',width=2)
 d.line((cx-4,260,cx+4,260),fill='#697265',width=2)
d.ellipse((610,514,674,536),fill='#638A57');d.rounded_rectangle((628,515,656,532),radius=7,fill='#93BC62')
# light vignette/film grain
save(texture(im,2.0,.30),'room.png')
# 02: paper storyboard, rough sketch compositions rather than interface screenshot.
im=Image.new('RGB',(W,H),'#E6DFCB');d=ImageDraw.Draw(im);ink='#3C4039';muted='#8C8777';orange='#AF5D34'
for x in range(0,W,48):d.line((x,0,x,H),fill='#DBD4C0')
for y in range(0,H,48):d.line((0,y,W,y),fill='#DBD4C0')
caption(d,(57,38),'SEQUENCE STUDY  /  01',ink,29)
caption(d,(1001,47),'ROUGH / V001',orange,17)
for i in range(3):
 x=58+i*400;y=131;w=365;h=358
 d.rectangle((x,y,x+w,y+h),fill='#D4D0BC',outline=ink,width=3)
 d.line((x,y+h*.70,x+w,y+h*.70),fill=muted,width=2)
 # rough perspectives and character placeholders
 if i==0:
  for dx in (100,265):
   d.ellipse((x+dx-39,y+69,x+dx+39,y+147),outline=ink,width=4)
   d.polygon([(x+dx-64,y+153),(x+dx+60,y+153),(x+dx+83,y+300),(x+dx-83,y+300)],outline=ink,width=4)
   d.line((x+dx-28,y+105,x+dx+28,y+105),fill=ink,width=5)
 elif i==1:
  d.polygon([(x+24,y+280),(x+77,y+182),(x+170,y+174),(x+325,y+213),(x+334,y+275),(x+150,y+318)],outline=ink,width=5)
  d.ellipse((x+160,y+116,x+220,y+176),outline=orange,width=4);d.line((x+184,y+119,x+174,y+98),fill=orange,width=3)
  d.line((x+205,y+119,x+220,y+98),fill=orange,width=3)
 else:
  d.ellipse((x+94,y+51,x+268,y+232),outline=ink,width=4);d.line((x+120,y+116,x+248,y+116),fill=ink,width=5)
  d.arc((x+151,y+143,x+211,y+182),start=0,end=180,fill=ink,width=3)
  d.line((x+88,y+300,x+104,y+241,x+258,y+241,x+278,y+300),fill=ink,width=4)
 for k in range(12):
  yy=y+12+k*28;d.line((x+5,yy,x+16,yy-8),fill='#B6B1A1',width=1)
 caption(d,(x,y+h+16),f'0{i+1}   '+['ESTABLISH','ALTERNATIVE','REACTION'][i],ink,17)
 d.line((x,y+h+48,x+w,y+h+48),fill=muted,width=1)
for xx in [421,821]:
 d.line((xx,315,xx+27,315),fill=orange,width=3);d.polygon([(xx+27,315),(xx+18,309),(xx+18,321)],fill=orange)
caption(d,(60,617),'SHOT ORDER  /  TIMING  /  TEMP VOICE',orange,23)
caption(d,(60,659),'Working sketch. Not a final frame.',muted,16)
save(texture(im,1.6,.035),'storyboard.png')
# 03: original, blocky pixel mink. Designed on a low-res canvas.
PW,PH=320,180
pix=gradient((27,29,25),(13,16,13),PW,PH);d=ImageDraw.Draw(pix)
for x in range(8,PW,16):
 for y in range(8,PH,16):d.point((x,y),fill='#3E4036')
# orange character, long tapered tail, round ears, little feet.
# drawing in whole pixel blocks with carefully stepped silhouette
outline='#160F0B';dark='#96471F';mid='#E77B38';light='#FFAD61';cream='#F4D3A5'
# silhouette from tail to nose
body=[(49,101),(52,94),(66,94),(66,86),(83,86),(83,79),(105,79),(105,72),(135,72),(135,66),(185,66),(185,58),(198,58),(198,48),(210,48),(210,58),(221,58),(221,45),(233,45),(233,56),(244,56),(244,64),(256,64),(256,75),(267,75),(267,88),(256,88),(256,96),(243,96),(243,106),(226,106),(226,115),(231,115),(231,126),(208,126),(208,115),(201,115),(201,109),(159,109),(159,120),(167,120),(167,130),(143,130),(143,122),(137,122),(137,112),(103,112),(103,118),(82,118),(82,124),(62,124),(62,120),(49,120),(49,111),(42,111),(42,101)]
d.polygon(body,fill=outline)
# internal stepped body tail and head
for box in [(51,104,76,115),(66,96,101,112),(86,87,137,108),(110,79,193,109),(141,73,200,107),(191,66,242,103),(202,59,240,90),(209,53,215,65),(225,50,231,66),(238,68,251,91),(251,77,261,86),(207,104,222,121),(143,106,154,124)]:d.rectangle(box,fill=mid)
for box in [(70,98,101,105),(104,88,132,96),(132,80,184,86),(185,73,214,80),(216,64,237,71),(231,87,249,99)]:d.rectangle(box,fill=light)
for box in [(57,112,81,117),(96,107,126,111),(145,103,189,109),(206,102,223,107),(209,117,225,122),(148,120,162,125)]:d.rectangle(box,fill=dark)
d.rectangle((228,79,233,85),fill=outline);d.point((229,79),fill=cream);d.rectangle((257,78,263,83),fill=outline);d.rectangle((242,87,256,92),fill=cream);d.rectangle((210,54,214,60),fill=cream);d.rectangle((225,52,230,60),fill=cream)
# small floating orange squares
for x,y,s in [(283,66,3),(291,56,2),(275,46,2),(35,87,2),(28,74,3)]:d.rectangle((x,y,x+s,y+s),fill=light)
d.rectangle((101,145,219,146),fill='#4B3B2B')
# keep rendered sprite pixels crisp
save(pix.resize((W,H),Image.Resampling.NEAREST),'mink.png')
# 04 + 06: motion clips: two different pixel-world sequences.
def pixel_landscape(frame=0,ascent=False):
 w,h=320,180;t=frame/30
 if ascent:
  im=gradient((18,24,48),(118,71,108),w,h);d=ImageDraw.Draw(im)
  for k in range(95):
   rr=random.Random(k+808);x=rr.randrange(w);y=(rr.randrange(h)+int(t*32))%h;s=1+(k%13==0);d.rectangle((x,y,x+s-1,y+s-1),fill=('#FFE4B2' if k%5==0 else '#807EA1'))
  cx=161;cy=int(91-t*17)
  d.ellipse((cx-37,cy-37,cx+37,cy+37),fill='#F9B06D');d.ellipse((cx-30,cy-30,cx+30,cy+30),fill='#C97B67')
  d.ellipse((cx-23,cy-23,cx+23,cy+23),fill='#F5CE94')
  # a trailing arcade-like ascent path
  for k in range(9):
   yy=int(134+k*6+t*4);xx=int(160+math.sin(k*.55+t)*7);d.rectangle((xx-2,yy,xx+2,yy+4),fill='#F1A455' if k%3 else '#F7DDA4')
  d.polygon([(160,76),(168,88),(164,94),(156,94),(152,88)],fill='#FFF1CC');d.rectangle((158,92,162,100),fill='#F08A45')
  return im
 im=gradient((26,24,48),(91,59,93),w,h);d=ImageDraw.Draw(im)
 cx=160;cy=89;phase=t*.9
 for k in range(80):
  rr=random.Random(k+5);x=rr.randrange(w);y=rr.randrange(h);d.point((x,y),fill='#9479A2')
 for n in range(7,0,-1):
  r=12+n*9+int((t*16)%9);color=['#E9AA78','#DA825C','#A95E66','#79516C','#544260','#453850','#383147'][n-1]
  d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=color,width=2)
 for k in range(24):
  a=k*math.tau/24+phase*.32;r=25+(k*17+int(t*55))%88;x=int(cx+math.cos(a)*r);y=int(cy+math.sin(a)*r);s=2+(k%4==0);d.rectangle((x,y,x+s,y+s),fill='#FFC381' if k%3==0 else '#BD776B')
 d.ellipse((cx-12,cy-12,cx+12,cy+12),fill='#F9CC92');d.ellipse((cx-6,cy-6,cx+6,cy+6),fill='#FFF0BC')
 return im
# 05: pixel-art landscape, original and not source movie footage.
im=gradient((48,38,71),(238,143,112),PW,PH);d=ImageDraw.Draw(im)
d.ellipse((216,23,269,76),fill='#F9CF9B');d.rectangle((0,75,320,76),fill='#DC987E')
for layer,(base,amp,col) in enumerate([(107,20,'#92748C'),(125,28,'#6C6483'),(147,24,'#455D6F'),(170,25,'#263D4B')]):
 pts=[(x,int(base+amp*(math.sin(x/28+layer*1.9)*.65+math.sin(x/11+layer)*.35))) for x in range(0,321,4)]
 d.polygon(pts+[(320,180),(0,180)],fill=col)
# floating islands, waterfalls
for x,y,s in [(55,89,29),(135,109,38),(236,93,42),(290,139,22)]:
 d.polygon([(x-s,y),(x+s,y),(x+s-5,y+6),(x+int(s*.45),y+14),(x+3,y+31),(x-10,y+22),(x-s+5,y+9)],fill='#394F53')
 d.rectangle((x-s,y-2,x+s,y+3),fill='#92B191');d.rectangle((x-s+6,y-5,x+s-10,y-3),fill='#C6CB91')
 for xx in (x-s+8,x-6,x+s-15):
  d.rectangle((xx,y-13,xx+2,y-4),fill='#4B645A');d.polygon([(xx-5,y-7),(xx+1,y-19),(xx+7,y-7)],fill='#B7B87D')
 d.rectangle((x+int(s*.32),y+3,x+int(s*.32)+2,y+31),fill='#B7D5CB')
 d.rectangle((x+int(s*.32)+3,y+11,x+int(s*.32)+4,y+26),fill='#7BA5AF')
for i in range(32):
 rr=random.Random(i+105);x=rr.randrange(PW);y=rr.randrange(20,100);d.point((x,y),fill='#F5CBA0')
save(im.resize((W,H),Image.Resampling.NEAREST),'landscape.png')
# encode actual source videos for two cards. 2.5 seconds each, silent.
for name,ascent in [('portal.mp4',False),('ascent.mp4',True)]:
 cmd=['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','30','-i','-','-an','-c:v','libx264','-crf','18','-preset','fast','-pix_fmt','yuv420p','-movflags','+faststart',str(A/name)]
 p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
 for f in range(75):p.stdin.write(pixel_landscape(f,ascent).resize((W,H),Image.Resampling.NEAREST).tobytes())
 p.stdin.close();assert p.wait()==0
print('Generated',[(x.name,x.stat().st_size) for x in A.iterdir()])
