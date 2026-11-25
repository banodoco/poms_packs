#!/usr/bin/env python3
"""Prepare aligned transparent sprite cells for review; never modifies a live pack.
Use a manually verified common input anchor and scale. Reject clipped/opaque art.
"""
import argparse,json,math,re
from pathlib import Path
from PIL import Image
W,H,AX,AY=96,88,48,80

def prepare(source,cols,rows,frames,anchor,scale):
    im=Image.open(source).convert('RGBA')
    if cols<1 or rows<1 or not 1<=frames<=cols*rows or frames>64:raise ValueError('Invalid grid/count (max 64 frames)')
    if im.width%cols or im.height%rows:raise ValueError('Unequal source cell grid')
    if not math.isfinite(scale) or scale<=0:raise ValueError('Scale must be positive')
    cw,ch=im.width//cols,im.height//rows;ax,ay=anchor
    if not 0<=ax<=cw or not 0<=ay<=ch:raise ValueError('Input anchor must be within the source cell')
    dw,dh=round(cw*scale),round(ch*scale)
    if dw<1 or dh<1 or dw>4096 or dh>4096:raise ValueError('Invalid scaled cell size')
    ox,oy=AX-round(ax*scale),AY-round(ay*scale);out=[]
    for i in range(frames):
        x,y=(i%cols)*cw,(i//cols)*ch;f=im.crop((x,y,x+cw,y+ch));bbox=f.getbbox()
        if not bbox or bbox[0]==0 or bbox[1]==0 or bbox[2]==cw or bbox[3]==ch:raise ValueError(f'Frame {i} is empty, opaque or touches cell edge; review/crop the source manually')
        f=f.resize((dw,dh),Image.Resampling.NEAREST);bb=f.getbbox()
        if not bb or bb[0]+ox<0 or bb[1]+oy<0 or bb[2]+ox>W or bb[3]+oy>H:raise ValueError(f'Frame {i} would clip or disappear in normalized cell')
        cell=Image.new('RGBA',(W,H));cell.alpha_composite(f,(ox,oy));out.append(cell)
    return out

def write(frames,name,frame_ms,loop,dest):
    if not re.fullmatch(r'[a-z][a-z0-9-]{0,31}',name) or not 20<=frame_ms<=2000:raise ValueError('Invalid animation name/frame time')
    dest.mkdir(parents=True,exist_ok=True)
    paths=[dest/(name+s) for s in ('.png','.json','.gif')]
    if any(p.exists() for p in paths):raise FileExistsError('Refuse to overwrite an existing candidate')
    strip=Image.new('RGBA',(W*len(frames),H))
    for i,frame in enumerate(frames):strip.alpha_composite(frame,(i*W,0))
    strip.save(paths[0]);paths[1].write_text(json.dumps({'name':name,'cellWidth':W,'cellHeight':H,'anchorX':AX,'anchorY':AY,'frames':len(frames),'frameMs':frame_ms,'loop':loop},indent=2)+'\n')
    zoom=[f.resize((W*3,H*3),Image.Resampling.NEAREST) for f in frames];kw={'loop':0} if loop else {};zoom[0].save(paths[2],save_all=True,append_images=zoom[1:],duration=frame_ms,disposal=2,**kw)
    return paths

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source',type=Path);p.add_argument('--cols',type=int,required=True);p.add_argument('--rows',type=int,required=True);p.add_argument('--frames',type=int,required=True);p.add_argument('--anchor',type=float,nargs=2,required=True,metavar=('X','Y'));p.add_argument('--scale',type=float,required=True);p.add_argument('--name',required=True);p.add_argument('--frame-ms',type=int,default=100);p.add_argument('--loop',action='store_true');p.add_argument('--out',type=Path,required=True);a=p.parse_args();print('\n'.join(str(x) for x in write(prepare(a.source,a.cols,a.rows,a.frames,a.anchor,a.scale),a.name,a.frame_ms,a.loop,a.out)))
if __name__=='__main__':main()
