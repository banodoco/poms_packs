from pathlib import Path
import json, subprocess
from PIL import Image,ImageDraw,ImageFont
p=Path(__file__).resolve().parent
r=json.loads(subprocess.check_output(['node',str(p/'colony-diagnostic.cjs')]))
bg=r['palette']['background'];fg=r['palette']['foreground'];accent=r['palette']['accent'];muted=r['palette']['accentText']
colors={'body':accent,'shadow':muted,'light':'#FFBE79'}
body=Image.new('RGB',(r['width'],r['height']),bg);d=ImageDraw.Draw(body)
for c in r['cells']:
    x,y,w,h=(c[k] for k in ('x','y','width','height'));d.rectangle((x,y,x+w-1,y+h-1),fill=colors[c['tone']])
composed=Image.open(p/'carry-frame-222.png').convert('RGB')
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';serif='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf';mono='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
canvas=Image.new('RGB',(1568,620),bg);d=ImageDraw.Draw(canvas)
d.text((26,18),'ASTRID / LIVING PIXELS',font=ImageFont.truetype(mono,16),fill=muted)
d.text((26,48),'A living body, mostly hidden.',font=ImageFont.truetype(serif,34),fill=fg)
for x,img,heading in [(26,body,'01  /  THE BODY ALONE'),(798,composed,'02  /  THE CARD ABOVE IT')]:
    d.text((x,110),heading,font=ImageFont.truetype(mono,17),fill=muted)
    canvas.paste(img.resize((744,419),Image.Resampling.LANCZOS),(x,143))
    d.rectangle((x,143,x+743,561),outline=r['palette']['frameColor'],width=1)
d.text((26,580),f"Same frame and geometry. {len(r['cells']):,} square cells before occlusion; {len(r['visible']):,} remain visible in the composed rear layer.",font=ImageFont.truetype(font,18),fill=fg)
canvas.save(p.parent/'astrid_video/docs/references/living-colony.jpg',quality=95,subsampling=0)
canvas.save('/mnt/data/Astrid_Living_Pixels_Body_Diagnostic.png')
print(len(r['cells']),len(r['visible']))
