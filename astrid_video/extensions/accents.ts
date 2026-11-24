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
export const ACCENTS:Readonly<Record<string,AccentFn>>={'pixel-pulse':pulse,'pixel-underline':underline,'pixel-connect':connect};
