import {hash,tendril} from '../shared/organism';
import type {AccentFn} from '../shared/composition/types';
const pulse:AccentFn=({tissue:t,target:b,progress:p,seed,intensity})=>{
 const energy=Math.sin(p*Math.PI)*intensity;if(energy<=0)return;
 const count=Math.round(150*energy),s=t.tile;
 for(let i=0;i<count;i++){
  const u=hash(seed,43,i)*2*Math.PI,rad=1.03+p*.16+hash(seed,97,i)*.06;
  t.add(b.x+b.width/2+Math.cos(u)*(b.width*.5+3*s)*rad,b.y+b.height/2+Math.sin(u)*(b.height*.5+3*s)*rad,'light');
 }
};
const underline:AccentFn=({tissue:t,target:b,progress:p,seed,intensity})=>{
 const span=Math.min(1,p*3),strength=Math.min(1,(1-p)*5)*intensity,s=t.tile;
 for(let x=0;x<b.width*span;x+=s)if(hash(seed,3,x)<strength*.94)t.add(b.x+x,b.y+b.height+s*4+Math.sin(x/s*.24)*s,'body');
};
const connect:AccentFn=({tissue:t,target:b,to,progress:p,frame,fps,seed,intensity})=>{
 if(!to)return;const a={x:b.x+b.width/2,y:b.y+b.height*.85},d={x:to.x+to.width/2,y:to.y+to.height*.85};
 tendril(t,a,d,frame,fps,seed,711,Math.min(1,p*3),intensity*Math.min(1,(1-p)*6),1,.3);
};
/** A quiet pixel-grid connection. Unlike the organic connect accent, this
 * grows once, stays visible until its authored end, and follows live bounds. */
const link:AccentFn=({tissue:t,target:b,to,progress:p,intensity,route})=>{
 if(!to||intensity<=0)return;
 const cx=b.x+b.width/2,cy=b.y+b.height/2,dx=to.x+to.width/2-cx,dy=to.y+to.height/2-cy;
 if(dx===0&&dy===0)return;
 const edge=(r:typeof b,x:number,y:number)=>{const k=Math.min(x===0?Infinity:r.width/2/Math.abs(x),y===0?Infinity:r.height/2/Math.abs(y));return{x:r.x+r.width/2+x*k,y:r.y+r.height/2+y*k};};
 if(route){
  // Orthogonal edge ports and a channel inside the current horizontal gap.
  // Bend is relative to the gap so links track animated card geometry.
  const sign=dx>=0?1:-1,a={x:sign>0?b.x+b.width:b.x,y:cy},d={x:sign>0?to.x:to.x+to.width,y:to.y+to.height/2};
  if((d.x-a.x)*sign<=0)return;
  const x=a.x+(d.x-a.x)*route.bend,points=[a,{x,y:a.y},{x,y:d.y},d];
  const lengths=points.slice(1).map((v,i)=>Math.abs(v.x-points[i].x)+Math.abs(v.y-points[i].y));
  let left=lengths.reduce((a,b)=>a+b,0)*Math.min(1,p*8);
  for(let i=0;i<lengths.length&&left>0;i++){const len=lengths[i];if(!len)continue;const u=points[i],v=points[i+1],draw=Math.min(len,left),n=Math.max(1,Math.ceil(draw/(t.tile*.5)));for(let j=0;j<=n;j++){const q=draw/len*j/n;t.add(u.x+(v.x-u.x)*q,u.y+(v.y-u.y)*q,intensity<.45?'shadow':'body');}left-=draw;}return;
 }
 const a=edge(b,dx,dy),d=edge(to,-dx,-dy),vx=d.x-a.x,vy=d.y-a.y;
 if(vx*dx+vy*dy<=0)return; // overlapping/touching rectangles: no external gap
 const span=Math.min(1,p*8),count=Math.max(1,Math.ceil(Math.hypot(vx,vy)*span/(t.tile*.5)));
 for(let i=0;i<=count;i++){const u=span*i/count;t.add(a.x+vx*u,a.y+vy*u,intensity<.45?'shadow':'body');}
};
export const ACCENTS:Readonly<Record<string,AccentFn>>={'pixel-pulse':pulse,'pixel-underline':underline,'pixel-connect':connect,'pixel-link':link};
