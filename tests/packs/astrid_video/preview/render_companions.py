"""Rasterise the same vector geometry used by the two Remotion components.
Standalone review renderer, not an Astrid or Remotion export.
"""
from pathlib import Path
import json, re, subprocess, sys, xml.etree.ElementTree as ET
import cairosvg
ROOT=Path(__file__).resolve().parents[1]; PRE=ROOT/'preview'
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else PRE/'renders'; OUT.mkdir(parents=True,exist_ok=True)
FPS=30
camel=re.compile(r'([A-Z])')
def attr(k):return camel.sub(lambda m:'-'+m.group(0).lower(),k)
frames=subprocess.Popen(['node',str(PRE/'vector-plan.cjs')],stdout=subprocess.PIPE,text=True)
proc=None; current=None; last_png=None; paths=[]
for line in frames.stdout:
 row=json.loads(line);id=row['id'];w,h=row['width'],row['height']
 if id!=current:
  if proc:
   proc.stdin.close();assert proc.wait()==0;(OUT/f'{current}.png').write_bytes(last_png)
  current=id;path=OUT/f'{id}.mp4';paths.append(path)
  proc=subprocess.Popen(['ffmpeg','-y','-v','error','-f','image2pipe','-framerate',str(FPS),'-vcodec','png','-i','-','-an','-c:v','libx264','-crf','17','-preset','fast','-threads','3','-pix_fmt','yuv420p','-movflags','+faststart',str(path)],stdin=subprocess.PIPE)
 root=ET.Element('svg',{'xmlns':'http://www.w3.org/2000/svg','width':str(w),'height':str(h),'viewBox':f'0 0 {w} {h}'})
 for shape in row['shapes']:
  element=ET.SubElement(root,shape['tag'],{attr(k):str(v) for k,v in shape['attrs'].items()})
  if 'text' in shape:element.text=shape['text']
 last_png=cairosvg.svg2png(bytestring=ET.tostring(root,encoding='utf-8'))
 proc.stdin.write(last_png)
assert frames.wait()==0
if proc:
 proc.stdin.close();assert proc.wait()==0;(OUT/f'{current}.png').write_bytes(last_png)
print('Wrote',*[str(p) for p in paths])
