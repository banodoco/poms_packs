import type {Composition,Item,Placement,Pose} from '../shared/composition/types';

/** An authoring recipe, not a live agent monitor. All supplied art is ordinary
 * managed image media. The reply header survives every body state. Times are
 * seconds from the start of the reply composition, quantized to output frames. */
export type ReplyReveal={question:string;identity:string;model?:string;thinking:string[];details:string[];answer:string;headerAt:number;modelAt?:number;detailsAt:number;answerAt:number;duration:number;fps:number;transition?:number};
export function replyRevealRecipe(r:ReplyReveal):Composition{
 const fps=r.fps,dt=r.transition??.38;
 if(!Number.isInteger(fps)||fps<12||fps>120||!Number.isFinite(dt)||dt<.15||dt>1||!Array.isArray(r.thinking)||r.thinking.length<2||r.thinking.length>4||!Array.isArray(r.details)||r.details.length<1||r.details.length>3)throw Error('Invalid reply reveal settings');
 const names=[r.question,r.identity,...(r.model?[r.model]:[]),...r.thinking,...r.details,r.answer];
 if(names.some(x=>typeof x!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(x))||new Set(names).size!==names.length)throw Error('Reply assets must have unique valid ids');
 const frame=(t:number)=>{if(!Number.isFinite(t)||t<0)throw Error('Invalid reply time');return Math.round(t*fps);};
 const header=frame(r.headerAt),model=r.model?frame(r.modelAt!):undefined,details=frame(r.detailsAt),answer=frame(r.answerAt),total=frame(r.duration),transition=Math.max(1,frame(dt));
 if(header<1||details-header<transition+2||answer-details<transition+2||total<=answer||total>90*fps||model!==undefined&&(model<=header||model>=details-transition))throw Error('Invalid reply phase order');
 const items:Record<string,Item>=Object.fromEntries(names.map(x=>[x,{kind:'image',asset:x,fit:'contain'}]));
 // Stable cargo identities are separate from replaceable image payloads.
 const place=(id:string,media:string,x:number,y:number,width:number,height:number):Placement=>({id,media,rect:{x,y,width,height}});
 const question=place(r.question,r.question,.27,.105,.62,.19);
 const identity=place(r.identity,r.identity,.12,.345,.40,.115);
 const badge=r.model?place(r.model,r.model,.54,.345,.34,.115):undefined;
 const body=(media:string)=>place(r.thinking[0],media,.12,.46,.76,.30);
 const poses:Pose[]=[];const put=(at:number,name:string,placements:Placement[],d=0)=>poses.push({at:at/fps,name,layout:'custom',items:placements,transition:{type:d?'replace':'cut',duration:d/fps}});
 const chrome=(at:number)=>[question,identity,...(badge&&model!==undefined&&at>=model?[badge]:[])];
 put(0,'Question',[question]);put(header,'Reply begins',[...chrome(header),body(r.thinking[0])]);
 const events=new Set<number>();const step=Math.max(1,Math.round(.32*fps));
 for(let t=header+step;t<details-transition;t+=step)events.add(t);
 if(model!==undefined)events.add(model);
 for(const at of [...events].sort((a,b)=>a-b))put(at,at===model?'Model identified':'Thinking',[...chrome(at),body(r.thinking[Math.floor((at-header)/step)%r.thinking.length])]);
 const gap=.014,w=(.76-gap*(r.details.length-1))/r.details.length;
 const cards=r.details.map((asset,i)=>place(i===0?r.thinking[0]:asset,asset,.12+i*(w+gap),.46,w,.30));
 put(details,'Pack capabilities',[...chrome(details),...cards],transition);
 put(answer,'Reply resolves',[...chrome(answer),body(r.answer)],transition);
 return {version:1,theme:'day',items,poses,behaviour:'none',restJitter:0,edgeReveal:true,organismIntensity:.08,organismSpread:.10,organismPixelSize:3,stagger:.02,pixelSize:12};
}
