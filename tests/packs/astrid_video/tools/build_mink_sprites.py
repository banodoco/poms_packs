"""Make candidate performer sheets from existing Astrid sprites (nearest-neighbour only)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps
import hashlib, json, shutil
ROOT=Path(__file__).resolve().parents[1];PACK=ROOT/'astrid_video';A=PACK/'rendering/elements/effects/mink-performer/assets'
W,H=96,88;ANCHOR=(48,80);INK=(21,19,17,255);ORANGE=(255,122,46,255);CLEAR=(0,0,0,0)

def normalize(im,scale=1,anchor_x=None):
    im=im.convert('RGBA'); im=im.crop(im.getbbox())
    if scale!=1: im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.NEAREST)
    out=Image.new('RGBA',(W,H));out.alpha_composite(im,(ANCHOR[0]-im.width//2 if anchor_x is None else anchor_x,ANCHOR[1]-im.height));return out

def sheet(name,frames):
    im=Image.new('RGBA',(W*len(frames),H));
    for i,f in enumerate(frames):im.alpha_composite(f,(i*W,0))
    im.save(A/(name+'.png'));return im

def wave_body(src,tip):
    im=ImageOps.mirror(src.crop((0,0,47,77)).convert('RGBA'));d=ImageDraw.Draw(im)
    # Restore the body contour under the two original juggling paws. Preserve head,
    # chest, feet, tail and palette; animate a single forepaw over the same body.
    for y in range(21,42):
        l=21 if y<=29 else 20 if y<=37 else 22
        r=33 if y<=24 else 34 if y<=27 else 35 if y<=31 else 36 if y<=34 else 37 if y<=40 else 36
        if y>=23:
            d.rectangle((0,y,l-1,y),fill=CLEAR);d.point((l,y),fill=INK)
            for x in range(l+1,min(l+3,r)):
                if im.getpixel((x,y))[3]==0 or im.getpixel((x,y))==INK:d.point((x,y),fill=ORANGE)
        d.rectangle((r+1,y,46,y),fill=CLEAR);d.point((r,y),fill=INK)
        # Fill any small original outline gap inside the cream chest, not the face.
        for x in range(r-2,r):
            if im.getpixel((x,y))[3]==0 or im.getpixel((x,y))==INK:d.point((x,y),fill=(247,230,207,255))
    # The far forepaw stays forward and down, separate from the near waving
    # forepaw. Both originate at the shoulders; the moving paw is on the
    # viewer-facing orange side. Keep the head, hips, feet and tail fixed.
    def paw(points, width=7):
        x,y=points[-1]
        d.line(points,fill=INK,width=width,joint='curve')
        d.ellipse((x-3,y-3,x+3,y+3),fill=INK)
        d.line(points,fill=ORANGE,width=4,joint='curve')
        d.ellipse((x-1,y-1,x+1,y+1),fill=ORANGE)
    paw([(34,34),(39,38),(40,42)])
    if tip:
        x,y=tip
        paw([(25,37),(17,32),(x,y)])
        d.line([(24,38),(28,36)],fill=ORANGE,width=3)
    else:
        paw([(25,36),(22,42),(24,46)])
    # Fixed source-cell placement, NOT per-frame bbox centering: waving cannot
    # shift the face, feet or body even when the paw changes the silhouette.
    out=Image.new('RGBA',(W,H)); scaled=im.resize((38,62),Image.Resampling.NEAREST)
    out.alpha_composite(scaled,(48-19,80-62));return out

def main():
    run=Image.open(A/'runner-original.png').convert('RGBA');poses=Image.open(A/'juggler-original.png').convert('RGBA');assert run.size==(891,44) and poses.size==(141,77)
    runner=[]
    for i in range(11):
        f=run.crop((i*81,0,(i+1)*81,44));out=Image.new('RGBA',(W,H));out.alpha_composite(f,(48-40,80-40));runner.append(out)
    # Original cycle preserved at 70 ms per frame. Keep full fixed cell positions.
    idle=wave_body(poses,None);raised=[wave_body(poses,t) for t in [(14,26),(12,21),(10,16),(7,20),(10,16),(7,20),(12,21),(16,28)]]
    waving=[idle,*raised,idle]
    # Three stepped settling poses: original run endpoint, compressed sit, planted sit.
    compact=idle.crop(idle.getbbox());low=compact.resize((round(compact.width*1.22),round(compact.height*.72)),Image.Resampling.NEAREST)
    mid=normalize(low);settle=[runner[-1],mid,idle]
    files={'run':runner,'idle':[idle],'wave':waving,'settle':settle}
    for name,frames in files.items():sheet(name,frames)
    manifest={'cellWidth':W,'cellHeight':H,'anchorX':48,'anchorY':80,'clips':{n:{'frames':len(f),'frameMs':70 if n=='run' else 100 if n=='wave' else 90 if n=='settle' else 1000,'loop':n in ('run','idle','wave')} for n,f in files.items()}}
    (A/'sprite-registry.json').write_text(json.dumps(manifest,indent=2)+'\n')
    for n,frames in files.items():
        frames=[f.resize((W*3,H*3),Image.Resampling.NEAREST) for f in frames]
        frames[0].save(ROOT/'review'/('mink-'+n+'.gif'),save_all=True,append_images=frames[1:],duration=manifest['clips'][n]['frameMs'],loop=0,disposal=2)
    print('Generated aligned candidate sheets',manifest)
if __name__=='__main__':main()
