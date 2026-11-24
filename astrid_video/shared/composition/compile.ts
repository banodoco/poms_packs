import {LAYOUTS} from '../../extensions/layouts';
import {BEHAVIOURS} from '../../extensions/behaviours';
import {ACCENTS} from '../../extensions/accents';
import type {Composition,Compiled,Motion,Rect,ResolvedPose,Cargo,Placement} from './types';
export const MOTION:Required<Motion>={transitionDuration:.8,transitionSpeed:1,stagger:.10,restJitter:.12,restSpeed:.55,organismFlow:1,organismIntensity:.86,organismSpread:.62,organismPixelSize:3,edgeReveal:false,randomness:.7,pixelSize:16,crawlStyle:'ragged',seed:17,direction:'bottom-to-top',compositionScale:1};
/** Canonical public scalar controls live at the top level so Astrid's inspector can expose them.
 * Legacy v0.10 defaults remain readable. Pose and transition overrides still win. */
export function normalizeControls(input:Composition):Composition {
 const defaults={...input.defaults};
 for(const key of Object.keys(MOTION) as (keyof Motion)[]){
  if(input[key]!==undefined)Object.assign(defaults,{[key]:input[key]});
 }
 if(input.behaviour!==undefined)defaults.behaviour=input.behaviour;
 return {...input,defaults};
}
export const idHash=(s:string)=>{let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return n|0;};
const finite=(v:number,lo:number,hi:number,name:string)=>{if(!Number.isFinite(v)||v<lo||v>hi)throw Error(`${name} must be in ${lo}..${hi}`);return v;};
const known=(o:object,k:string)=>Object.prototype.hasOwnProperty.call(o,k);
const rectValid=(r:Rect,label:string)=>{if(!r||![r.x,r.y,r.width,r.height].every(Number.isFinite)||r.x< -1e-8||r.y< -1e-8||r.width<.025||r.height<.025||r.x+r.width>1+1e-8||r.y+r.height>1+1e-8)throw Error(`${label}: normalized rectangle must fit canvas`);};
const dirs=['left-to-right','right-to-left','top-to-bottom','bottom-to-top'];
function validateMotion(m:Required<Motion>){
 for(const [k,lo,hi] of [['transitionDuration',0,5],['transitionSpeed',.1,4],['stagger',0,1],['restJitter',0,1],['restSpeed',0,3],['organismFlow',0,3],['organismIntensity',0,1],['organismSpread',0,1],['organismPixelSize',3,18],['randomness',0,1.5],['pixelSize',8,100],['compositionScale',.2,1.5]] as const)finite(m[k],lo,hi,k);
 if(!dirs.includes(m.direction)||!['clean','ragged','noisy','chunky'].includes(m.crawlStyle)||!Number.isInteger(m.seed)||typeof m.edgeReveal!=='boolean')throw Error('invalid direction, crawlStyle, seed or edgeReveal');
}
const resize=(r:Rect,scale:number,cx=r.x+r.width/2,cy=r.y+r.height/2):Rect=>({x:cx+(r.x-cx)*scale,y:cy+(r.y-cy)*scale,width:r.width*scale,height:r.height*scale});
const intersection=(a:Rect,b:Rect)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
export const pixels=(r:Rect,w:number,h:number):Rect=>{const x=Math.round(r.x*w),y=Math.round(r.y*h);return {x,y,width:Math.max(1,Math.round((r.x+r.width)*w)-x),height:Math.max(1,Math.round((r.y+r.height)*h)-y)};};
export function compile(input:Composition,fps:number,width:number,height:number,frames:number):Compiled{
 input=normalizeControls(input);
 if(input.version!==1||!input.items||!Array.isArray(input.poses)||!input.poses.length)throw Error('Expected composition v1 with items and poses');
 if(![fps,width,height,frames].every(Number.isInteger)||fps<1||width<1||height<1||frames<1)throw Error('Invalid frame geometry');
 for(const [id,item] of Object.entries(input.items)){
  if(!id||!item||!['image','video','text'].includes(item.kind))throw Error(`Invalid item ${id}`);
  if(item.kind==='text'?!item.text?.trim():!item.asset?.trim())throw Error(`Missing content for ${id}`);
  if(item.aspect!==undefined)finite(item.aspect,.2,5,`${id} aspect`);
  if(item.scale!==undefined)finite(item.scale,.2,1.5,`${id} scale`);
  if(item.kind==='video'&&(!Number.isFinite(item.sourceEnd)||!Number.isFinite(item.sourceStart??0)||(item.sourceStart??0)<0||item.sourceEnd!<=(item.sourceStart??0)))throw Error(`${id}: video needs explicit sourceEnd > sourceStart`);
 }
 const safe=input.safeArea??{x:.065,y:.075,width:.87,height:.75};rectValid(safe,'safeArea');
 const poses:ResolvedPose[]=[],warnings:string[]=[];
 for(let i=0;i<input.poses.length;i++){
  const p=input.poses[i],at=Math.round(finite(p.at,0,(frames-1)/fps,`pose ${i+1} at`)*fps),prev=poses[i-1];
  if(prev&&at<=prev.at)throw Error('Pose arrivals must increase by at least one frame');
  const t=typeof p.transition==='string'?{type:p.transition}:p.transition??{};
  const motion={...MOTION,...input.defaults,...p.motion};
  for(const k of ['seed','organismPixelSize','organismFlow'] as const)if(p.motion?.[k]!==undefined&&p.motion[k]!== (input.defaults?.[k]??MOTION[k]))throw Error(`${k} is scene-wide to preserve continuous tissue motion`);
  if(t.duration!==undefined)motion.transitionDuration=t.duration;if(t.speed!==undefined)motion.transitionSpeed=t.speed;if(t.stagger!==undefined)motion.stagger=t.stagger;if(t.direction!==undefined)motion.direction=t.direction;if(t.edgeReveal!==undefined)motion.edgeReveal=t.edgeReveal;
  validateMotion(motion);
  const transition=t.type??'auto';if(!['auto','exchange','rearrange','replace','cut'].includes(transition))throw Error(`Unknown transition ${transition}`);
  const length=transition==='cut'?0:Math.round(motion.transitionDuration/motion.transitionSpeed*fps);
  const start=Math.max(0,at-length);
  if(prev&&start<prev.at)throw Error(`Transition to pose ${i+1} overlaps preceding arrival; shorten duration or move arrival`);
  const behaviour=p.behaviour??input.defaults?.behaviour??'carry';if(!known(BEHAVIOURS,behaviour))throw Error(`Unknown behaviour ${behaviour}`);
  if(!Array.isArray(p.items)||p.items.length>12)throw Error('Pose supports 0..12 items');
  const placements:Placement[]=p.items.map(v=>typeof v==='string'?{id:v}:v);
  if(new Set(placements.map(x=>x.id)).size!==placements.length)throw Error(`Duplicate item identity in pose ${i+1}`);
  const data=placements.map(x=>{if(!known(input.items,x.id)||!known(input.items,x.media??x.id))throw Error(`Unknown item/media ${x.id}/${x.media??x.id}`);return {id:x.id,aspect:input.items[x.media??x.id].aspect??(input.items[x.media??x.id].kind==='text'?1.55:16/9)};});
  let rects:Rect[]=[];
  if(p.layout==='custom'){rects=placements.map(x=>{if(!x.rect)throw Error('custom layout needs every item rect');return x.rect;});}
  else{if(!known(LAYOUTS,p.layout))throw Error(`Unknown layout ${p.layout}`);if(data.length)rects=LAYOUTS[p.layout]({items:data,area:safe,canvasAspect:width/height});}
  if(rects.length!==placements.length)throw Error('Layout returned wrong rectangle count');
  rects=rects.map((r,j)=>{const x=placements[j],item=input.items[x.media??x.id];const actual=x.rect??r;rectValid(actual,`pose ${i+1}/${x.id}`);return resize(actual,finite(x.scale??item.scale??1,.2,1.5,`${x.id} scale`));});
  const group=finite(p.scale??motion.compositionScale,.2,1.5,'pose scale');
  if(rects.length&&group!==1){const l=Math.min(...rects.map(r=>r.x)),r=Math.max(...rects.map(r=>r.x+r.width)),top=Math.min(...rects.map(r=>r.y)),b=Math.max(...rects.map(r=>r.y+r.height));rects=rects.map(v=>resize(v,group,(l+r)/2,(top+b)/2));}
  const items:Cargo[]=placements.map((x,j)=>{const media=x.media??x.id,old=prev?.items.find(v=>v.id===x.id&&v.media===media),rect=rects[j];rectValid(rect,`resolved pose ${i+1}/${x.id}`);return {id:x.id,media,content:input.items[media],rect,seed:idHash(x.id),since:old?.since??start,key:old?.key??`${x.id}@${i}:${media}`,order:j};});
  for(let j=0;j<items.length;j++)for(let k=j+1;k<items.length;k++)if(intersection(items[j].rect,items[k].rect)>.001)warnings.push(`Pose ${i+1}: ${items[j].id} and ${items[k].id} overlap`);
  if(prev&&transition==='rearrange'&&items.some(x=>!prev.items.some(v=>v.id===x.id)))warnings.push(`Pose ${i+1}: rearrange includes new objects; entrances inferred`);
  poses.push({at,start,name:p.name??`Pose ${i+1}`,items,behaviour,motion,transition,index:i});
 }
 const accents=(input.accents??[]).map(a=>{if(!known(ACCENTS,a.effect)||!known(input.items,a.target)||(a.to!==undefined&&!known(input.items,a.to))||(a.effect==='pixel-connect'&&!a.to))throw Error(`Invalid accent ${a.effect}/${a.target}`);const start=Math.round(finite(a.at,0,(frames-1)/fps,'accent time')*fps),end=start+Math.max(1,Math.round(finite(a.duration??.65,.04,5,'accent duration')*fps));if(end>frames)throw Error('Accent extends past composition');finite(a.intensity??1,0,1,'accent intensity');return {...a,start,end};});
 return {input,fps,width,height,frames,poses,accents,warnings};
}
