import {framePlan} from './engine';
import type {Compiled, Placement, Accent, Pose} from './types';
import type {Settings} from '../timeline/model';
/** Author-time bridge: the outgoing image must be fully visible, with the
 * same stable id, asset slot and managed binding. No runtime host state. */
export function handoffToTimeline(source:Compiled,timeline:Settings,ids:string[]):Settings{
 if(!ids.length||new Set(ids).size!==ids.length)throw Error('Invalid handoff ids');
 const frame=framePlan(source,source.frames-1);
 const clips=timeline.clips.map(c=>{
  if(!ids.includes(c.id))return c;
  const layers=frame.layers.filter(l=>l.id===c.id);
  if(layers.length!==1||c.kind!=='image'||c.initiallyDocked||c.entryRect||!c.asset)throw Error(`Invalid handoff clip ${c.id}`);
  const l=layers[0],b=l.box,asset=c.asset;
  if(l.content.kind!=='image'||l.content.asset!==asset||l.content.fit==='cover'||source.input.mediaBindings?.[asset]!==timeline.mediaBindings?.[asset]||!source.input.mediaBindings?.[asset])throw Error(`Handoff media mismatch ${c.id}`);
  if(b.x<0||b.y<0||b.x+b.width>source.width||b.y+b.height>source.height||l.reveal.revealed.reduce((n,r)=>n+r.width*r.height,0)!==b.width*b.height)throw Error(`Incomplete handoff image ${c.id}`);
  return {...c,entryRect:{x:b.x/source.width,y:b.y/source.height,width:b.width/source.width,height:b.height/source.height}};
 });
 if(ids.some(id=>!clips.some(c=>c.id===id)))throw Error('Unknown destination clip');
 return {...timeline,clips};
}
/** Reusable three-column process authoring: explicitly supplied card positions,
 * branches and result reveal times. Expands to ordinary living-composition poses. */
export type ProcessRow={input:string;process:Placement;result:Placement;at:number;outputAt:number;bend:number};
export function processStages(base:Placement[],rows:ProcessRow[],end:number,transition=.3):{poses:Pose[];accents:Accent[]}{
 if(!rows.length||rows.length>6||!Number.isFinite(end)||transition<=0)throw Error('Invalid process stages');
 const seen=new Set(base.map(x=>x.id));if(seen.size!==base.length)throw Error('Duplicate process base');
 const events:{at:number;placement:Placement;name:string}[]=[],accents:Accent[]=[];
 for(const r of rows){if(!seen.has(r.input)||seen.has(r.process.id)||seen.has(r.result.id)||r.process.id===r.result.id||!Number.isFinite(r.at)||!Number.isFinite(r.outputAt)||r.at<=0||r.outputAt<=r.at||r.outputAt>=end||r.bend<.05||r.bend>.95)throw Error('Invalid process row');
  seen.add(r.process.id);seen.add(r.result.id);events.push({at:r.at,placement:r.process,name:`Process ${r.process.id}`},{at:r.outputAt,placement:r.result,name:`Result ${r.result.id}`});
  accents.push({at:r.at,duration:end-r.at,effect:'pixel-link',target:r.input,to:r.process.id,route:{bend:r.bend},intensity:.85},{at:r.outputAt,duration:end-r.outputAt,effect:'pixel-link',target:r.process.id,to:r.result.id,route:{bend:1-r.bend},intensity:.85});
 }
 const poses:Pose[]=[];let placed=[...base];events.sort((a,b)=>a.at-b.at);for(let i=0;i<events.length;){const at=events[i].at,group=events.filter(e=>e.at===at);placed=[...placed,...group.map(e=>e.placement)];poses.push({at,name:group.map(e=>e.name).join(' / '),layout:'custom',items:placed,transition:{type:'replace',duration:transition}});i+=group.length;}
 return {poses,accents};
}
