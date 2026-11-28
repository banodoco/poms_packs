"""A compact editorial reference using actual standalone effect frames; no new mascot artwork."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import subprocess
root=Path(__file__).resolve().parents[1]; preview=root/'preview'; refs=root/'astrid_video/docs/references'
W,H=1800,1120
paper='#F7F4ED'; panel='#FFFEFA'; ink='#25241F'; muted='#615E55'; rule='#D5D0C5'; orange='#ED6B23'; rust='#A94714'
im=Image.new('RGB',(W,H),paper); d=ImageDraw.Draw(im)
def face(family,size):
 path=subprocess.check_output(['fc-match','-f','%{file}',family],text=True).strip();return ImageFont.truetype(path,size)
serif=lambda n:face('Georgia, Liberation Serif',n)
sans=lambda n:face('Inter',n)
mono=lambda n:face('DejaVu Sans Mono',n)
def t(x,y,s,f,c=ink):d.text((x,y),s,font=f,fill=c,anchor='lt')
def line(x,y,x2,y2,c=rule,w=1):d.line((x,y,x2,y2),fill=c,width=w)
def frame(path,x,y,w,h):
 p=Image.open(path).convert('RGB').resize((w,h),Image.Resampling.LANCZOS);im.paste(p,(x,y));d.rectangle((x-1,y-1,x+w,y+h),outline=rule,width=2)
margin=72; right=W-margin
# quiet masthead
for i in range(3):d.rectangle((margin+i*13,52,margin+i*13+8,60),fill=orange)
t(margin+52,44,'Astrid',serif(33));t(right-354,53,'VIDEO / VISUAL GRAMMAR 01',mono(18),rust);line(margin,100,right,100)
t(margin,132,'Sophisticated editorial design.',serif(69));t(margin,213,'Playful pixelated physics.',serif(69),rust)
t(margin,310,'The content is slick. The pixels act. The mink inhabits the world.',sans(27),muted)
# Examples, with enough white space around the real frame samples.
fw=536; fh=302; gap=24; y=402
examples=[('01 / THE CONTENT','Editorial typography','Clean hierarchy. Let the idea breathe.',preview/'renders/chapter-style.png'),('02 / THE MOTION','A travelling pixel edge','Reveal the new image; preserve the old.',preview/'transition-frame.png'),('03 / THE RELATIONSHIP','Information comes together','Smooth layouts, stepped signals.',preview/'renders/network-style.png')]
for i,(label,title,desc,path) in enumerate(examples):
 x=margin+i*(fw+gap);t(x,y-30,label,mono(16),rust);frame(path,x,y,fw,fh);t(x,y+fh+19,title,serif(34));t(x,y+fh+63,desc,sans(20),muted)
line(margin,817,right,817)
# palette + font roles; few words, no duplicate brand-manual information.
t(margin,846,'COLOUR',mono(17),rust)
for i,(name,c) in enumerate([('Paper',paper),('Ink',ink),('Panel',panel),('Orange',orange),('Rust',rust)]):
 x=margin+i*139; d.rectangle((x,887,x+116,935),fill=c,outline=rule,width=1);t(x,949,name,sans(20));t(x,978,c,mono(15),muted)
line(814,846,814,1002)
t(850,846,'TYPE',mono(17),rust);t(850,885,'A little imagination.',serif(37));t(850,934,'Georgia · Editorial statements',sans(18),muted)
t(1260,887,'Clear, useful information.',sans(24));t(1260,925,'Inter · Body and labels',sans(18),muted);t(1260,969,'01 / SYSTEM',mono(21),rust);t(1260,998,'Departure Mono · Pixel accents',sans(17),muted)
line(margin,1047,right,1047);t(margin,1067,'COMPANION TO THE APPROVED MINK CHARACTER GUIDE',mono(15),rust);t(right-700,1067,'Illustrative frames · Type uses local fallback where needed.',sans(16),muted)
refs.mkdir(exist_ok=True); im.save(refs/'visual-grammar.png',optimize=True);print(refs/'visual-grammar.png')
