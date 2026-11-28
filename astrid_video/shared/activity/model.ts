import {ease,clamp01,type Bounds} from '../organism';
import {compileTimeline,timelineFrame,type Settings} from '../timeline/model';
import {compileMink,minkFrame,type PerformerSettings} from '../mink/model';
import {resolveStyle,type ColorSettings} from '../style';
import type {MediaSettings} from '../media';
export type Event={id:string;at:number;duration:number;text:string;detail?:string;status?:'done'|'failed'|'waiting';reveals?:string[]};
export type Card={id:string;kind:'image'|'video'|'text';label:string;asset?:string;text?:string;sourceStart?:number;sourceEnd?:number};
export type ActivitySettings=ColorSettings&MediaSettings&{title?:string;request:string;events:Event[];output:{kind:'cards';cards:Card[];title?:string}|{kind:'timeline';timeline:Settings;assembleAt:number;expandAt:number;expandSeconds?:number};mink?:PerformerSettings;panelRatio?:number;typeRate?:number;};
const finite=(v:unknown,a:number,b:number,n:string)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<a||v>b)throw Error(`Invalid ${n}`);return v;};
const validText=(v:unknown,n:string,max=300)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error(`Invalid ${n}`);return v;};
const key=(v:unknown)=>{if(typeof v!=='string'||! /^[A-Za-z0-9_-]{1,64}$/.test(v))throw Error('Invalid activity id');return v;};
const rect=(x:number,y:number,width:number,height:number):Bounds=>({x,y,width,height});
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export function compileActivity(input:ActivitySettings,width:number,height:number,fps:number,frames:number){
 const seconds=frames/fps;finite(width,480,8192,'width');finite(height,360,8192,'height');finite(fps,1,240,'fps');finite(frames,1,360000,'frames');validText(input.request,'request',240);
 if(!Array.isArray(input.events)||!input.events.length||input.events.length>20)throw Error('Use 1–20 activity events');if(!input.output||!['cards','timeline'].includes(input.output.kind))throw Error('Choose output cards or timeline');
 const k=Math.min(width/1280,height/720),margin=width*.045,top=height*.145,gap=width*.022,ratio=finite(input.panelRatio??.36,.27,.48,'panel ratio'),left=rect(margin,top,(width-margin*2-gap)*ratio,height*.75),right=rect(left.x+left.width+gap,top,width-margin-left.x-left.width-gap,height*.75);const style=resolveStyle(input),typeRate=finite(input.typeRate??45,8,120,'type rate');
 const ids=new Set<string>(),reveal:Record<string,number>=Object.create(null);const events=input.events.map((e,i)=>{key(e.id);if(ids.has(e.id))throw Error('Duplicate event id');ids.add(e.id);validText(e.text,'event text',96);if(e.detail!==undefined)validText(e.detail,'detail',110);const at=finite(e.at,0,seconds-1/fps,'event at'),duration=finite(e.duration,1/fps,seconds,'event duration');if(at+duration>seconds+1e-7)throw Error('Event exceeds scene');if(i&&at<input.events[i-1].at)throw Error('Events must be ordered');if(e.status!==undefined&&!['done','failed','waiting'].includes(e.status))throw Error('Unknown event status');for(const id of e.reveals??[]){key(id);if(e.status==='failed'||e.status==='waiting')throw Error('Failed or waiting event cannot reveal successful output');if(Object.prototype.hasOwnProperty.call(reveal,id))throw Error(`Duplicate output reveal ${id}`);reveal[id]=at+duration;}return{...e,at,duration,end:at+duration};});
 let timeline:ReturnType<typeof compileTimeline>|undefined,assembleAt=seconds,expandAt=seconds,expandSeconds=.65,cards:Card[]=[];
 if(input.output.kind==='timeline'){
   assembleAt=finite(input.output.assembleAt,0,seconds-1/fps,'assembleAt');expandAt=finite(input.output.expandAt,assembleAt,seconds-1/fps,'expandAt');expandSeconds=finite(input.output.expandSeconds??.65,.1,seconds-expandAt,'expandSeconds');
   timeline=compileTimeline(input.output.timeline,'assemble',Math.round(right.width),Math.round(right.height),fps,Math.max(1,frames-Math.round(assembleAt*fps)));if(expandAt<assembleAt+timeline.playbackAt-.3)throw Error('Expand at or near assembled playback');
   for(const c of timeline.clips)if(!Object.prototype.hasOwnProperty.call(reveal,c.id)||reveal[c.id]>assembleAt+1e-7)throw Error(`Reveal clip ${c.id} before assembly`);
   for(const id of Object.keys(reveal))if(!timeline.clips.some(c=>c.id===id))throw Error(`Unknown timeline output ${id}`);
 }else{
   cards=input.output.cards;if(!Array.isArray(cards)||!cards.length||cards.length>8)throw Error('Use 1–8 cards');const used=new Set<string>();for(const c of cards){key(c.id);if(used.has(c.id))throw Error('Duplicate card');used.add(c.id);validText(c.label,'card label',72);if(!['image','video','text'].includes(c.kind))throw Error('Invalid card kind');if(c.kind==='text')validText(c.text,'card text',240);else key(c.asset);if(c.kind==='video'){finite(c.sourceStart??0,0,3600,'source start');finite(c.sourceEnd, (c.sourceStart??0)+1/fps,3600,'source end');}if(!Object.prototype.hasOwnProperty.call(reveal,c.id))throw Error(`Card ${c.id} has no reveal event`);}for(const id of Object.keys(reveal))if(!used.has(id))throw Error(`Unknown card output ${id}`);
 }
 const mink=input.mink?compileMink(input.mink,frames,fps):undefined;
 return{width,height,fps,frames,k,margin,top,left,right,style,timelineSettings:input.output.kind==='timeline'?input.output.timeline:undefined,title:input.title??'Astrid at work.',request:input.request,events,reveal,typeRate,timeline,assembleAt,expandAt,expandSeconds,cards,outputTitle:input.output.kind==='cards'?input.output.title??'Creative output':'The emerging edit',mink};
}
export type ActivityPlan=ReturnType<typeof compileActivity>;
export function activityFrame(c:ActivityPlan,frame:number){if(!Number.isInteger(frame)||frame<0||frame>=c.frames)throw Error('Frame outside activity');const t=frame/c.fps,expand=c.timeline?ease(clamp01((t-c.expandAt)/c.expandSeconds)):0;
 const events=c.events.filter(e=>e.at<=t+1e-7).map(e=>{const finished=t>=e.end-1e-7;return{id:e.id,text:e.text.slice(0,finished?e.text.length:Math.floor((t-e.at)*c.typeRate)+1),detail:finished?e.detail:undefined,status:finished?e.status??'done':'working',reveals:e.reveals??[]};});
 const visibleIds=Object.keys(c.reveal).filter(id=>c.reveal[id]<=t+1e-7);
 const tlFrame=c.timeline?Math.min(c.timeline.frames-1,Math.max(0,frame-Math.round(c.assembleAt*c.fps))):0;
 const outputBox=c.timeline?rect(Math.round(mix(c.right.x,0,expand)),Math.round(mix(c.right.y,0,expand)),Math.round(mix(c.right.width,c.width,expand)),Math.round(mix(c.right.height,c.height,expand))):c.right;
 const layout=c.timeline?(expand===0?c.timeline:compileTimeline(c.timelineSettings!,'assemble',outputBox.width,outputBox.height,c.fps,c.timeline.frames)):undefined;
 return{frame,t,expand,events,visibleIds,outputBox,terminalOpacity:1-expand,timelineFrame:tlFrame,timelineLayout:layout,timeline:layout?timelineFrame(layout,tlFrame):undefined,cards:c.cards.filter(x=>visibleIds.includes(x.id)).map(x=>({...x,sourceFrame:x.kind==='video'?Math.min(Math.floor((x.sourceEnd!-1/c.fps)*c.fps+1e-7),Math.floor(((x.sourceStart??0)+Math.max(0,t-c.reveal[x.id]))*c.fps+1e-7)):0})),mink:c.mink?minkFrame(c.mink,frame):undefined};}
