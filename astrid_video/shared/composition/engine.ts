import {Tissue,nest,ease,hash,type Bounds,type Point} from '../organism';
import {frontier} from '../organism';
import {resolveStyle} from '../style';
import {crawlAtProgress,clamp,type Settings} from '../deck/motion';
import {BEHAVIOURS} from '../../extensions/behaviours';
import {ACCENTS} from '../../extensions/accents';
import {pixels} from './compile';
import type {Cargo,Compiled,FramePlan,Layer,Motion,ResolvedPose,Rect} from './types';
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const lerp=(a:Bounds,b:Bounds,p:number):Bounds=>({x:Math.round(mix(a.x,b.x,p)),y:Math.round(mix(a.y,b.y,p)),width:Math.max(1,Math.round(mix(a.width,b.width,p))),height:Math.max(1,Math.round(mix(a.height,b.height,p)))});
const outside=(b:Bounds,dir:Required<Motion>['direction'],w:number,h:number,exit=false):Bounds=>{
 const pad=Math.round(Math.min(w,h)*.04),d=exit?({'left-to-right':'right-to-left','right-to-left':'left-to-right','top-to-bottom':'bottom-to-top','bottom-to-top':'top-to-bottom'} as const)[dir]:dir;
 return {...b,x:d==='left-to-right'?-b.width-pad:d==='right-to-left'?w+pad:b.x,y:d==='top-to-bottom'?-b.height-pad:d==='bottom-to-top'?h+pad:b.y};
};
function stagger(p:number,i:number,n:number,seconds:number,window:number){const offset=Math.min(.36,Math.max(0,seconds*(n-1)/Math.max(.001,window)));return clamp((p-offset*(n<2?0:i/(n-1)))/(1-offset));}
function rest(b:Bounds,id:number,frame:number,pose:ResolvedPose,next:ResolvedPose|undefined,c:Compiled){
 const m=pose.motion;if(!m.restJitter||!m.restSpeed)return b;
 const env=ease((frame-pose.at)/(c.fps*.28))*ease(next?(next.start-frame)/(c.fps*.28):1);
 const t=frame/c.fps*m.restSpeed,ph=hash(m.seed,id,19)*Math.PI*2,amp=Math.min(c.width,c.height)*.014*m.restJitter*env;
 return {...b,x:Math.round(clamp(b.x+amp*(.75*Math.sin(t*4+ph)+.25*Math.sin(t*7+ph)),0,c.width-b.width)),y:Math.round(clamp(b.y+amp*(.72*Math.cos(t*3+ph)+.28*Math.sin(t*6+ph)),0,c.height-b.height))};
}
function sourceFrame(cargo:Cargo,frame:number,fps:number){const n=Math.max(0,frame-cargo.since);return cargo.content.kind==='video'?Math.min(n,Math.max(0,Math.ceil((cargo.content.sourceEnd!-(cargo.content.sourceStart??0))*fps)-1)):0;}
function smoothSettings(a:ResolvedPose|undefined,b:ResolvedPose,p:number):Required<Motion>{
 const m={...b.motion};if(a&&p<1){for(const k of ['organismIntensity','organismSpread','organismFlow'] as const)m[k]=mix(a.motion[k],b.motion[k],p);}return m;
}
/** Exact frame plan. No previous-frame state. One absolute clock and identity seed
 * per load; the existing full-footprint swimmers/tendrils generate the tissue. */
export function framePlan(c:Compiled,frame:number):FramePlan{
 const {width:w,height:h,fps}=c;if(!Number.isInteger(frame)||frame<0||frame>=c.frames)throw Error('Frame outside composition');
 const palette=resolveStyle(c.input),layers:Layer[]=[],poses=c.poses;
 const current=poses.findIndex(x=>frame<x.at),idx=current<0?poses.length-1:current;
 let pose=poses[idx],prev=poses[idx-1],next=poses[idx+1];
 if(frame<pose.start&&prev){next=pose;pose=prev;prev=poses[pose.index-1];}
 const active=frame<pose.at&&frame>=pose.start,p=active?clamp((frame-pose.start)/Math.max(1,pose.at-pose.start)):1;
 const m=smoothSettings(active?prev:undefined,pose,ease(p));
 // A fixed grid and clock across the scene; changes in strength/spread do not rebuild the grid.
 const tile=Math.max(2,Math.round((c.input.defaults?.organismPixelSize??3)*Math.min(w,h)/720));
 const back=new Tissue(tile,w,h),overlay=new Tissue(tile,w,h),root={x:w*.5,y:h*.94};
 const positions=new Map<string,Bounds>();let rootStrength=0;
 const drawBody=(cargo:Cargo,b:Bounds,strength:number,effort:number,move:Point,growth:number)=>{
  const args={tissue:back,box:b,root,frame,fps,seed:c.input.defaults?.seed??17,idSeed:cargo.seed,effort,strength:m.organismIntensity*strength,movement:move,growth,flow:m.organismFlow,spread:m.organismSpread};
  const weight=active&&prev&&prev.behaviour!==pose.behaviour?ease(p):1;
  if(weight<1&&prev){const old=BEHAVIOURS[prev.behaviour];old.draw({...args,strength:args.strength*(1-weight)});if(old.root)rootStrength=Math.max(rootStrength,args.strength*(1-weight)*growth);}
  const behaviour=BEHAVIOURS[pose.behaviour];behaviour.draw({...args,strength:args.strength*weight});if(behaviour.root)rootStrength=Math.max(rootStrength,args.strength*weight*growth);
 };
 const draw=(cargo:Cargo,box:Bounds,progress:number,z:number,freezeAt?:number)=>{
  if(box.x+box.width<=0||box.y+box.height<=0||box.x>=w||box.y>=h||progress<=0)return;
  const maskSettings:Settings={seed:(c.input.defaults?.seed??17)^cargo.seed,direction:m.direction,pixelSize:m.pixelSize,randomness:m.randomness,crawlStyle:m.crawlStyle};
  const reveal=crawlAtProgress(progress,1,box.width,box.height,maskSettings,Math.min(w,h));
  const f=new Tissue(tile,w,h);if(progress<1&&pose.behaviour!=='none')frontier(f,box,reveal.revealed,m.direction,frame,fps,c.input.defaults?.seed??17,cargo.seed,m.organismIntensity);
  layers.push({id:cargo.id,key:cargo.key,content:cargo.content,box,sourceFrame:sourceFrame(cargo,freezeAt??frame,fps),reveal,front:f.values(),z});
 };
 if(frame<pose.start){return {frame,layers,back:[],overlay:[],palette,tile};}
 if(!active){
  for(const x of pose.items){const b=rest(pixels(x.rect,w,h),x.seed,frame,pose,next,c);positions.set(x.id,b);drawBody(x,b,1,0,{x:0,y:0},1);draw(x,b,1,x.order);}
 }else{
  const old=prev?.items??[],fresh=pose.items,oldMap=new Map(old.map(x=>[x.id,x])),newMap=new Map(fresh.map(x=>[x.id,x]));
  const departures=old.filter(x=>!newMap.has(x.id)),arrivals=fresh.filter(x=>!oldMap.has(x.id));
  // Where destinations exchange entirely, send departing cargo out before most of the incoming travel.
  const exchange=departures.length>0&&arrivals.length>0;
  const win=(pose.at-pose.start)/fps;
  for(const [i,x] of departures.entries()){
   const t=stagger(exchange?clamp(p/.56):p,i,departures.length,m.stagger,win),b0=pixels(x.rect,w,h),end=outside(b0,m.direction,w,h,true),b=lerp(b0,end,ease(t));
   if(t<1){drawBody(x,b,1,Math.sin(t*Math.PI),{x:Math.sign(end.x-b0.x),y:Math.sign(end.y-b0.y)},1);draw(x,b,1,x.order,frame);positions.set(x.id,b);}
  }
  for(const x of fresh){
   const oldX=oldMap.get(x.id),target=pixels(x.rect,w,h);
   if(oldX){
    const from=pixels(oldX.rect,w,h),u=ease(p),b=lerp(from,target,u);positions.set(x.id,b);
    const changed=oldX.media!==x.media;
    // Stable identity is carried/resized; when the payload changes use a local membrane if enabled.
    if(changed&&!m.edgeReveal&&pose.transition!=='replace'){
     const end=outside(from,m.direction,w,h,true),start=outside(target,m.direction,w,h),a=clamp(p/.52),q=clamp((p-.48)/.52);
     if(a<1){const ob=lerp(from,end,ease(a));drawBody(oldX,ob,1,Math.sin(a*Math.PI),{x:Math.sign(end.x-from.x),y:Math.sign(end.y-from.y)},1);draw(oldX,ob,1,x.order);positions.set(x.id,ob);}
     if(q>0){const nb=lerp(start,target,ease(q));drawBody(x,nb,1,Math.sin(q*Math.PI),{x:Math.sign(target.x-start.x),y:Math.sign(target.y-start.y)},1);draw(x,nb,1,100+x.order);positions.set(x.id,nb);}
    }else{
     drawBody(x,b,1,Math.sin(p*Math.PI),{x:Math.sign(target.x-from.x),y:Math.sign(target.y-from.y)},1);
     if(changed){draw(oldX,b,1,x.order,pose.start);draw(x,b,u,100+x.order);}else draw(x,b,1,50+x.order);
    }
   }else{
    const raw=exchange?clamp((p-.35)/.65):p,i=arrivals.indexOf(x),t=stagger(raw,i,arrivals.length,m.stagger,win),lift=pose.behaviour==='present',travel=lift?clamp((t-.14)/.86):t;
    const from=outside(target,m.direction,w,h),b=lerp(from,target,ease(travel));positions.set(x.id,b);
    if(t>0){drawBody(x,b,1,Math.sin(travel*Math.PI),{x:Math.sign(target.x-from.x),y:Math.sign(target.y-from.y)},lift?ease(t/.14):Math.min(1,t*3));draw(x,b,m.edgeReveal?ease(travel):1,100+x.order);}
   }
  }
 }
 if(rootStrength>0)nest(back,root,frame,fps,rootStrength,c.input.defaults?.seed??17,m.organismFlow);
 for(const a of c.accents){if(frame<a.start||frame>=a.end)continue;const target=positions.get(a.target),to=a.to?positions.get(a.to):undefined;if(!target||(a.to&&!to))continue;ACCENTS[a.effect]({tissue:overlay,target,to,progress:(frame-a.start)/Math.max(1,a.end-a.start-1),frame,fps,seed:(c.input.defaults?.seed??17)^a.start,intensity:a.intensity??1});}
 layers.sort((a,b)=>a.z-b.z);
 // Cull only pixels fully obscured by opaque revealed content; the organism is built first.
 const cols=Math.ceil(w/tile),rows=Math.ceil(h/tile),hidden=new Uint8Array(cols*rows);
 for(const l of layers)for(const r of l.reveal.revealed){const left=Math.max(0,Math.ceil((l.box.x+r.x)/tile)),top=Math.max(0,Math.ceil((l.box.y+r.y)/tile)),right=Math.min(cols,Math.floor((l.box.x+r.x+r.width)/tile)),bottom=Math.min(rows,Math.floor((l.box.y+r.y+r.height)/tile));for(let y=top;y<bottom;y++)if(right>left)hidden.fill(1,y*cols+left,y*cols+right);}
 const visible=(cells:ReturnType<Tissue['values']>)=>cells.filter(v=>!hidden[v.y/tile*cols+v.x/tile]);
 return {frame,layers,back:visible(back.values()),overlay:visible(overlay.values()),palette,tile};
}
export function inspect(c:Compiled){return {width:c.width,height:c.height,fps:c.fps,frames:c.frames,warnings:c.warnings,poses:c.poses.map(p=>({name:p.name,start:p.start,arrival:p.at,behaviour:p.behaviour,items:p.items.map(x=>({id:x.id,media:x.media,key:x.key,rect:pixels(x.rect,c.width,c.height)}))})),accents:c.accents.map(a=>({effect:a.effect,target:a.target,start:a.start,end:a.end}))};}
