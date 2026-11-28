import {Tissue,swarm,ease,clamp01,type Bounds,type Cell} from '../organism';
import {resolveStyle,type ColorSettings} from '../style';
import type {MediaSettings} from '../media';
export type Track={id:string;label:string;kind?:'picture'|'graphics'|'audio'|'other';color?:string};
export type TimelineItem={id:string;track:string;at:number;duration:number;label:string;kind:'image'|'video'|'label';asset?:string;sourceStart?:number;arrival?:number;initiallyDocked?:boolean;entryRect?:Bounds;color?:string};
export type Revision={at:number;duration:number;clips:{id:string;at?:number;duration?:number;asset?:string;label?:string}[]};
export type Player={id:string;label:string;asset:string;sourceStart?:number;tracks?:string[]};
export type Settings=ColorSettings&MediaSettings&{title?:string;eyebrow?:string;timelineDuration:number;tracks:Track[];clips:TimelineItem[];players?:Player[];assemblySeconds?:number;travelSeconds?:number;playbackRate?:number;pixelSize?:number;organismIntensity?:number;organismFlow?:number;organismSpread?:number;seed?:number;showTimecodes?:boolean;entryChromeSeconds?:number;revision?:Revision;};
export type Mode='assemble'|'play';
const colors=['#B8C9B1','#D9B67B','#B4C3D8','#D8B6AA','#C6BDDA','#A9C9C4','#E7C7A2','#C3C2AE'];
const num=(v:unknown,label:string,lo:number,hi:number)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw Error(`Invalid ${label}: expected ${lo}–${hi}`);return v;};
const id=(v:unknown,label:string)=>{if(typeof v!=='string'||! /^[A-Za-z0-9_-]{1,64}$/.test(v))throw Error(`Invalid ${label}`);return v;};
const label=(v:unknown,k:string)=>{if(typeof v!=='string'||!v.trim()||v.length>100)throw Error(`Invalid ${k}`);return v;};
const rect=(x:number,y:number,width:number,height:number):Bounds=>({x:Math.round(x),y:Math.round(y),width:Math.max(1,Math.round(width)),height:Math.max(1,Math.round(height))});
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const between=(a:Bounds,b:Bounds,p:number)=>rect(lerp(a.x,b.x,p),lerp(a.y,b.y,p),lerp(a.width,b.width,p),lerp(a.height,b.height,p));
const color=(value:unknown,fallback:string)=>typeof value==='string'&&/^#[0-9a-fA-F]{6}$/.test(value)?value:fallback;
function fit(area:Bounds,aspect:number):Bounds{const w=Math.min(area.width,area.height*aspect),h=w/aspect;return rect(area.x+(area.width-w)/2,area.y+(area.height-h)/2,w,h);}
export function formatTime(t:number){const hundredths=Math.max(0,Math.floor(t*100+1e-6));return `${String(Math.floor(hundredths/6000)).padStart(2,'0')}:${String(Math.floor(hundredths/100)%60).padStart(2,'0')}.${String(hundredths%100).padStart(2,'0')}`;}
export function compileTimeline(input:Settings,mode:Mode,width:number,height:number,fps:number,frames:number){
 num(width,'width',240,8192);num(height,'height',240,8192);num(fps,'fps',1,240);num(frames,'frames',1,360000);
 if(!input||typeof input!=='object')throw Error('Missing timeline settings');
 const duration=num(input.timelineDuration,'timelineDuration',.25,3600),rate=num(input.playbackRate??1,'playbackRate',.1,4);
 const sceneSeconds=frames/fps,assembly=mode==='assemble'?num(input.assemblySeconds??3.2,'assemblySeconds',.3,sceneSeconds-1/fps):0;
 const travel=mode==='assemble'?num(input.travelSeconds??.85,'travelSeconds',.1,assembly):0;
 const players=input.players??[];if(!Array.isArray(players)||players.length>3)throw Error('Use zero to three players');
 if(!Array.isArray(input.tracks)||input.tracks.length<1||input.tracks.length>8)throw Error('Use one to eight tracks');
 if(!Array.isArray(input.clips)||input.clips.length<1||input.clips.length>16)throw Error('Use one to sixteen clips');
 const scale=Math.min(width/1280,height/720),margin=width*.055,titleY=height*.035,pool=rect(margin,height*.139,width-2*margin,height*.372),timeline=rect(margin,height*.56,width-2*margin,height*.368),labelW=Math.min(timeline.width*.22,Math.max(68*scale,123*scale)),rulerHeight=Math.max(19*scale,14),rowStart=timeline.y+rulerHeight,rowH=(timeline.height-rulerHeight)/input.tracks.length;
 if(rowH<12)throw Error('Too many tracks for this canvas; reduce tracks or enlarge the canvas');
 const x0=timeline.x+labelW,x1=timeline.x+timeline.width,span=x1-x0;
 const tracks=input.tracks.map((t,i)=>({...t,id:id(t.id,'track id'),label:label(t.label,'track label'),color:color(t.color,colors[i]),box:rect(timeline.x,rowStart+i*rowH,timeline.width,rowH)}));
 if(new Set(tracks.map(t=>t.id)).size!==tracks.length)throw Error('Duplicate track id');
 const byTrack=new Map(tracks.map(t=>[t.id,t]));
 const cols=Math.min(input.clips.length,width/height<.9?3:input.clips.length>8?5:input.clips.length>4?4:3),rows=Math.ceil(input.clips.length/cols);
 const slotW=pool.width/cols,slotH=pool.height/rows;
 const clips=input.clips.map((c,i)=>{
  id(c.id,'clip id');label(c.label,'clip label');const t=byTrack.get(c.track);if(!t)throw Error(`Unknown track ${c.track}`);
  const at=num(c.at,`${c.id}.at`,0,duration),length=num(c.duration,`${c.id}.duration`,1/fps,duration);
  if(at+length>duration+1e-7)throw Error(`Clip ${c.id} exceeds timelineDuration`);
  if(!['image','video','label'].includes(c.kind))throw Error(`Invalid kind for ${c.id}`);
  if(c.kind!=='label')id(c.asset,`${c.id}.asset`);
  const sourceStart=num(c.sourceStart??0,`${c.id}.sourceStart`,0,3600);
  const row=Math.floor(i/cols),col=i%cols,n=Math.min(cols,input.clips.length-row*cols),ox=pool.x+(cols-n)*slotW/2;
  let from=fit(rect(ox+col*slotW+slotW*.09,pool.y+row*slotH+slotH*.055,slotW*.82,slotH*.84),16/9);
  const bx=x0+span*at/duration,be=x0+span*(at+length)/duration,gap=Math.min(2*scale,(be-bx)*.12);
  const to=rect(bx+gap,t.box.y+rowH*.1,Math.max(1,be-bx-2*gap),rowH*.8);
  if(c.initiallyDocked!==undefined&&typeof c.initiallyDocked!=='boolean')throw Error('Invalid initiallyDocked');
  if(c.entryRect!==undefined){const q=c.entryRect;if(mode!=='assemble'||c.kind!=='image'||c.initiallyDocked||!q||![q.x,q.y,q.width,q.height].every(Number.isFinite)||q.x<0||q.y<0||q.width<=0||q.height<=0||q.x+q.width>1+1e-8||q.y+q.height>1+1e-8)throw Error('Invalid entryRect');from=rect(q.x*width,q.y*height,q.width*width,q.height*height);}
  if(c.initiallyDocked&&c.arrival!==undefined)throw Error('Initially docked clips cannot have an arrival');
  const arrival=mode==='assemble'&&!c.initiallyDocked?num(c.arrival??(travel+(assembly-travel)*i/Math.max(1,input.clips.length-1)),`${c.id}.arrival`,travel,assembly):0;
  return {...c,at,duration:length,sourceStart,from,to,arrival,start:Math.max(0,arrival-travel),color:color(c.color,t.color),index:i};
 });
 if(new Set(clips.map(c=>c.id)).size!==clips.length)throw Error('Duplicate clip id');
 for(const t of tracks){const a=clips.filter(c=>c.track===t.id).sort((x,y)=>x.at-y.at);for(let i=1;i<a.length;i++)if(a[i].at<a[i-1].at+a[i-1].duration-1e-7)throw Error(`Overlapping clips on track ${t.id}`);}
 // One authored revision, applied atomically to content and eased geometrically. It is
 // a depiction of a supplied edit, never an editing/generation operation.
 const revision=input.revision;const changes:Record<string,{at:number;duration:number;asset?:string;label:string;to:Bounds}>=Object.create(null);
 if(revision){
  if(mode!=='assemble')throw Error('Revision requires assemble mode');
  num(revision.at,'revision.at',Math.max(...clips.map(c=>c.arrival)),sceneSeconds-1/fps);
  num(revision.duration,'revision.duration',1/fps,sceneSeconds-revision.at-1/fps);
  if(!Array.isArray(revision.clips)||!revision.clips.length||revision.clips.length>clips.length)throw Error('Invalid revision clips');
  for(const patch of revision.clips){const old=clips.find(c=>c.id===patch.id);if(!old||changes[patch.id])throw Error('Unknown or duplicate revision clip');
   const at=num(patch.at??old.at,'revision clip at',0,duration),length=num(patch.duration??old.duration,'revision clip duration',1/fps,duration);if(at+length>duration+1e-7)throw Error('Revision exceeds timeline');
   const asset=patch.asset??old.asset;if(patch.asset!==undefined){if(old.kind==='label')throw Error('Label clip cannot receive media');id(patch.asset,'revision asset');}
   const bx=x0+span*at/duration,be=x0+span*(at+length)/duration,gap=Math.min(2*scale,(be-bx)*.12);
   changes[old.id]={at,duration:length,asset,label:label(patch.label??old.label,'revision label'),to:rect(bx+gap,old.to.y,Math.max(1,be-bx-2*gap),old.to.height)};
  }
  for(const t of tracks){const before=clips.filter(c=>c.track===t.id).sort((a,b)=>a.at-b.at);for(let i=1;i<before.length;i++){const a=changes[before[i-1].id]??before[i-1],b=changes[before[i].id]??before[i];if(b.at<a.at+a.duration-1e-7)throw Error('Revision overlaps or crosses clips');}}
 }
 const playbackAt=mode==='assemble'?Math.max(Math.max(...clips.map(c=>c.arrival)),revision?revision.at+revision.duration:0)+.24:0;
 if(playbackAt>=sceneSeconds)throw Error('No time remains to display the assembled cut');
 const playerArea=rect(pool.x,pool.y+pool.height*.035,pool.width,pool.height*.92),pgap=width*.025,pw=(playerArea.width-pgap*Math.max(0,players.length-1))/Math.max(1,players.length);
 const panels=players.map((p,i)=>{id(p.id,'player id');id(p.asset,'player asset');label(p.label,'player label');const sourceStart=num(p.sourceStart??0,'player sourceStart',0,3600);if(p.tracks!==undefined&&(!Array.isArray(p.tracks)||new Set(p.tracks).size!==p.tracks.length||p.tracks.some(t=>!byTrack.has(t))))throw Error(`Unknown player track for ${p.id}`);return {...p,sourceStart,box:fit(rect(playerArea.x+i*(pw+pgap),playerArea.y,pw,playerArea.height-22*scale),16/9)};});
 if(new Set(panels.map(p=>p.id)).size!==panels.length)throw Error('Duplicate player id');
 const tile=Math.max(1,Math.round(num(input.pixelSize??2.4,'pixelSize',1,12)*scale));
 const style=resolveStyle(input),intensity=num(input.organismIntensity??.78,'organismIntensity',0,1),flow=num(input.organismFlow??1,'organismFlow',0,3),spread=num(input.organismSpread??.6,'organismSpread',0,1),seed=num(input.seed??47,'seed',-2147483648,2147483647);
 const targetTicks=Math.max(3,Math.min(9,Math.floor(span/(95*Math.max(.6,scale))))),raw=duration/targetTicks,pow=Math.pow(10,Math.floor(Math.log10(raw))),step=[1,2,2.5,5,10].map(n=>n*pow).find(n=>n>=raw)??10*pow;
 const ticks=Array.from({length:Math.floor(duration/step+1e-7)+1},(_,i)=>({at:i*step,x:x0+i*step/duration*span}));
 const entryChromeSeconds=num(input.entryChromeSeconds??0,'entryChromeSeconds',0,Math.min(3,sceneSeconds));
 return {entryChromeSeconds,mode,width,height,fps,frames,duration,rate,scale,margin,titleY,pool,timeline,rulerHeight,rowStart,rowH,x0,x1,span,tracks,clips,panels,revision,changes,playbackAt,style,tile,intensity,flow,spread,seed,ticks,title:input.title??(mode==='assemble'?'The edit takes shape.':'Inside the edit.'),eyebrow:input.eyebrow??'ASTRID / EDITING',showTimecodes:input.showTimecodes!==false};
}
export type Compiled=ReturnType<typeof compileTimeline>;
export function timelineFrame(c:Compiled,frame:number){
 if(!Number.isInteger(frame)||frame<0||frame>=c.frames)throw Error('Frame outside visualizer');
 const seconds=frame/c.fps,playing=seconds>=c.playbackAt,timelineTime=Math.max(0,Math.min(c.duration-1/c.fps,(seconds-c.playbackAt)*c.rate));
 const tissue=new Tissue(c.tile,c.width,c.height);
 const blocks=c.clips.map(clip=>{
  const p=c.mode==='play'||clip.initiallyDocked?1:clamp01((seconds-clip.start)/Math.max(1e-9,clip.arrival-clip.start)),e=ease(p);
  const change=c.changes[clip.id],r=change&&c.revision?clamp01((seconds-c.revision.at)/c.revision.duration):0,updated=r===1&&change?change:clip;
  const box=change&&r>0?between(clip.to,change.to,ease(r)):between(clip.from,clip.to,e);if(p>0&&p<1)box.y-=Math.round(Math.sin(Math.PI*p)*c.height*.035);
  const moving=(p>0&&p<1)||(r>0&&r<1),active=playing&&p===1&&timelineTime>=updated.at&&timelineTime<updated.at+updated.duration;
  if(moving&&c.intensity>0){const effort=Math.sin(Math.PI*(r>0&&r<1?r:p)),dx=r>0&&change?change.to.x-clip.to.x:clip.to.x-clip.from.x,dy=r>0&&change?change.to.y-clip.to.y:clip.to.y-clip.from.y,mag=Math.max(1,Math.hypot(dx,dy));swarm(tissue,box,frame,c.fps,c.seed,clip.index,effort,c.intensity*Math.min(1,effort*2.8),{x:dx/mag,y:dy/mag},1,c.spread,c.flow,effort);}
  return {entry:!!clip.entryRect,id:clip.id,track:clip.track,kind:clip.kind,asset:updated.asset,label:updated.label,color:clip.color,box,p,active,moving,sourceFrame:clip.kind==='video'?Math.max(0,Math.floor((clip.sourceStart+(active?Math.max(0,timelineTime-updated.at):0))*c.fps+1e-7)):0};
 });
 // Fixed track blocks are painted first, then waiting/moving objects. Every moving
 // card keeps its identity and travels to its own actual time interval.
 blocks.sort((a,b)=>Number(a.p<1)-Number(b.p<1)||Number(a.moving)-Number(b.moving));
 const cells:Cell[]=tissue.values().filter(v=>!blocks.some(b=>v.x>=b.box.x&&v.y>=b.box.y&&v.x+v.width<=b.box.x+b.box.width&&v.y+v.height<=b.box.y+b.box.height));
 return {chromeOpacity:c.entryChromeSeconds?ease(seconds/c.entryChromeSeconds):1,frame,seconds,playing,timelineTime,playhead:c.x0+c.span*timelineTime/c.duration,playerOpacity:c.mode==='play'?1:ease((seconds-c.playbackAt+.12)/.25),blocks,cells,players:c.panels.map(p=>({...p,sourceFrame:Math.round(p.sourceStart*c.fps)+Math.max(0,Math.floor(timelineTime*c.fps+1e-7))})),assembled:blocks.filter(b=>b.p===1).length};
}
export type TimelineFrame=ReturnType<typeof timelineFrame>;
