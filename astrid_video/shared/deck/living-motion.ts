/** Frame-pure layout, scheduling and choreographic connection of organism and load. */
import {clamp,spans,revealFrames,crawlAtProgress,directionFor,type Card,type Settings,type Span,type Direction,type Reveal} from './motion';
import {Tissue,swarm,tendril,nest,frontier,ease,hash,type Bounds,type Cell} from '../organism';
import {resolveStyle} from '../style';
export type LivingSpan=Span&{arrival:number;tail:number};
export type Layer={index:number;box:Bounds;target:Bounds;sourceFrame:number;reveal:Reveal;front:Cell[];effort:number;departing:boolean};
export type LivingPlan={layers:Layer[];back:Cell[];palette:ReturnType<typeof resolveStyle>;tile:number};
const finite=(x:unknown,d:number)=>typeof x==='number'&&Number.isFinite(x)?x:d;
export const presentationFor=(cards:readonly Card[],settings:Settings)=>settings.presentation??(cards.some(c=>c.layout)||settings.edgeReveal===false||finite(settings.restJitter,0)>0?'carry':'classic');
function direction(index:number,p:Settings):Exclude<Direction,'alternate'>{
  const d=directionFor(index,p);return d==='alternate'?(index%2===0?'left-to-right':'right-to-left'):d;
}
const vector=(d:string)=>d==='right-to-left'?{x:1,y:0}:d==='top-to-bottom'?{x:0,y:-1}:d==='bottom-to-top'?{x:0,y:1}:{x:-1,y:0};
export function targetBox(card:Card,index:number,count:number,width:number,height:number,settings:Settings):Bounds{
  let l=card.layout;
  if(!l){
    if(settings.presentation==='hold'){
      const cols=Math.min(count,Math.max(1,Math.ceil(Math.sqrt(count*width/height))));
      const rows=Math.ceil(count/cols),gap=Math.min(.025,.20/Math.max(cols,rows)),innerW=.90,innerH=.66;
      const w=(innerW-(cols-1)*gap)/cols,h=(innerH-(rows-1)*gap)/rows;
      l={x:.05+(index%cols)*(w+gap),y:.09+Math.floor(index/cols)*(h+gap),width:w,height:h};
    }else{
      const inset=clamp(finite(settings.inset,.055),.025,.18);
      // Leave breathing room below the card for the carrying organism.
      l={x:inset,y:inset,width:1-inset*2,height:Math.min(.82,1-inset*2)};
    }
  }
  const {x,y,width:w,height:h}=l;
  if(![x,y,w,h].every(Number.isFinite)||x<0||y<0||w<.035||h<.035||x+w>1+1e-8||y+h>1+1e-8)throw Error(`card ${index+1}: layout must fit within normalized canvas bounds`);
  const left=Math.round(x*width),top=Math.round(y*height);
  return {x:left,y:top,width:Math.max(1,Math.round((x+w)*width)-left),height:Math.max(1,Math.round((y+h)*height)-top)};
}
/** A resting load follows a bounded, seeded, continuous path. No independent
 * frame noise. Fade in after the arrival and back to the exact target before
 * the authored hold ends, so a following departure never jumps. */
export function restingOffset(local:number,span:LivingSpan,fps:number,target:Bounds,width:number,height:number,seed:number,intensity:number){
  if(intensity<=0||local<span.arrival||local>=span.length)return {x:0,y:0};
  const elapsed=(local-span.arrival+1)/fps;
  const envelope=ease(elapsed/.24)*ease((span.length-1-local)/(fps*.24));
  const amplitude=Math.min(width,height)*.017*clamp(intensity)*envelope;
  const phase=hash(seed,span.index,401)*Math.PI*2;
  const x=amplitude*(.72*Math.sin(elapsed*2.6+phase)+.28*Math.sin(elapsed*5.1+phase*.63));
  const y=amplitude*(.70*Math.cos(elapsed*2.2+phase)+.30*Math.sin(elapsed*4.4+phase*1.7));
  return {x:Math.max(-target.x,Math.min(width-target.x-target.width,x)),y:Math.max(-target.y,Math.min(height-target.y-target.height,y))};
}
function outside(target:Bounds,v:{x:number;y:number},width:number,height:number,pad:number){
  return {x:v.x<0?-target.width-pad:v.x>0?width+pad:target.x,
    y:v.y<0?-target.height-pad:v.y>0?height+pad:target.y};
}
export function livingSchedule(cards:readonly Card[],frames:number,fps:number,settings:Settings):LivingSpan[]{
  if(cards.length===0||frames<1||!Number.isInteger(frames))throw Error('Living deck needs media and a positive frame count');
  const intro=Math.round(clamp(finite(settings.arrivalSeconds,.8),0,1.8)*fps);
  if(settings.presentation==='hold'){
    const stagger=Math.min(Math.round(clamp(finite(settings.staggerSeconds,.24),0,1.2)*fps),Math.floor(Math.max(0,frames-Math.max(1,Math.min(intro,frames)))/Math.max(1,cards.length-1)));
    return cards.map((_,index)=>{const start=index*stagger,length=frames-start;return {index,start,length,arrival:Math.min(intro,length),tail:0};});
  }
  const scheduled=spans(cards,frames);
  const arrivals=scheduled.map((s,i)=>i===0?Math.min(intro,Math.max(1,Math.floor(s.length*.65))):revealFrames(s,fps,settings));
  return scheduled.map((s,i)=>({...s,arrival:arrivals[i],tail:arrivals[i+1]??0}));
}
export function livingPlan(frame:number,frames:number,fps:number,width:number,height:number,cards:readonly Card[],settings:Settings={},schedule=livingSchedule(cards,frames,fps,settings)):LivingPlan{
  const mode=settings.organism??(settings.presentation==='hold'?'tendrils':'swarm');
  const tile=Math.max(2,Math.round(clamp(finite(settings.organismPixelSize,mode==='none'?6:3),3,18)*Math.min(width,height)/720));
  const palette=resolveStyle(settings),back=new Tissue(tile,width,height),layers:Layer[]=[];
  const seed=finite(settings.seed,17)|0,strength=clamp(finite(settings.organismIntensity,.85));
  const root={x:width*clamp(finite(settings.armRoot?.x,.50)),y:height*clamp(finite(settings.armRoot?.y,.94))};
  const edgeReveal=settings.edgeReveal!==false;
  const armLift=Boolean(settings.armLift)&&mode==='tendrils'&&settings.presentation==='hold';
  let connected=0;
  for(const s of schedule){
    const local=frame-s.start;if(local<0||local>=s.length+s.tail)continue;
    const departing=local>=s.length;
    const target=targetBox(cards[s.index],s.index,cards.length,width,height,settings);
    const entry=s.arrival>1?clamp(local/(s.arrival-1)):1;
    const depart=departing?(s.tail<=1?1:clamp((local-s.length)/(s.tail-1))):0;
    if(departing&&depart>=1)continue;
    const d=direction(s.index,settings),v=vector(d);
    // The dedicated arm effect reaches for its load before lifting it. The
    // initial reach happens off-screen; once attached the tip follows the load.
    const travelProgress=armLift&&s.arrival>1?clamp((entry-.18)/.82):entry;
    const e=ease(travelProgress),out=ease(edgeReveal?clamp((depart-.20)/.80):depart);
    const exitV=vector(direction(s.index+1,settings));
    const pad=Math.round(Math.min(width,height)*.04);
    const start=outside(target,v,width,height,pad),end=outside(target,{x:-exitV.x,y:-exitV.y},width,height,pad);
    const lift=Math.sin(Math.PI*travelProgress)*Math.min(width,height)*.009;
    const jitter=departing?{x:0,y:0}:restingOffset(local,s,fps,target,width,height,seed,finite(settings.restJitter,0));
    const wholeSlide=!edgeReveal||armLift;
    const shiftX=(wholeSlide?start.x-target.x:v.x*width*.24)*(1-e)+(wholeSlide?end.x-target.x:-exitV.x*width*1.20)*out;
    const shiftY=(wholeSlide?start.y-target.y:v.y*height*.30)*(1-e)+(wholeSlide?end.y-target.y:-exitV.y*height*1.20)*out-lift;
    const box={...target,x:Math.round(target.x+shiftX+jitter.x),y:Math.round(target.y+shiftY+jitter.y)};
    // An intact card is never masked, and no frontier effect is drawn.
    // Arrival/exit timing is independent of reveal enablement.
    const mask=crawlAtProgress(!edgeReveal||departing?1:travelProgress,s.index,target.width,target.height,settings,Math.min(width,height));
    const effort=departing?Math.sin(Math.PI*depart):Math.sin(Math.PI*entry);
    // Workers are visible just before the media appears; their positions follow the load.
    if(mode==='swarm'){
      // The entire revealed load is carried on a two-dimensional body.
      // The movement vector produces a trailing wake; it decays after arrival.
      const travel=departing?exitV:v;
      const age=Math.max(0,local-Math.max(0,s.arrival-1))/fps;
      const lag=departing?effort:entry<1?.22+.65*effort:.22*Math.exp(-age/.18);
      swarm(back,box,frame,fps,seed,s.index,effort,strength,{x:-travel.x,y:-travel.y},
        departing||!edgeReveal?1:entry,finite(settings.organismSpread,.62),finite(settings.organismFlow,1),lag);
    }
    if(mode==='tendrils'){
      const growth=departing?1-depart:armLift?(s.arrival<=1?1:ease(clamp(entry/.18))):ease(clamp(entry*1.6+.07));
      const grip=clamp(finite(cards[s.index].grip,.5),.12,.88);
      // The invisible path ends inside the load, where the same full-footprint
      // colony pools and swirls. The load hides the junction, not a palm.
      tendril(back,root,{x:box.x+box.width*grip,y:box.y+box.height*.83},frame,fps,seed,s.index,growth,strength,finite(settings.organismFlow,1),finite(settings.organismSpread,.62));
      if(growth>.15)swarm(back,box,frame,fps,seed,s.index,effort,strength*.85,{x:0,y:-1},Math.min(1,growth*1.5),finite(settings.organismSpread,.62)*.60,finite(settings.organismFlow,1),0);
      connected=Math.max(connected,growth);
    }
    const front=new Tissue(tile,width,height);
    if(edgeReveal&&mode!=='none'&&travelProgress>0&&travelProgress<1&&!departing)frontier(front,box,mask.revealed,d,frame,fps,seed,s.index,strength);
    layers.push({index:s.index,box,target,sourceFrame:Math.min(s.length-1,local),reveal:mask,front:front.values(),effort,departing});
  }
  if(mode==='tendrils')nest(back,root,frame,fps,strength*connected,seed,finite(settings.organismFlow,1));
  // The rear body really spans the whole load. Cull only cells entirely
  // occluded by opaque media, after calculating its motion; this makes dense
  // colonies cheap to draw while preserving visible pixels at every edge.
  const cols=Math.ceil(width/tile),rows=Math.ceil(height/tile),hidden=new Uint8Array(cols*rows);
  for(const l of layers)for(const r of l.reveal.revealed){
    const left=Math.max(0,Math.ceil((l.box.x+r.x)/tile)),top=Math.max(0,Math.ceil((l.box.y+r.y)/tile));
    const right=Math.min(cols,Math.floor((l.box.x+r.x+r.width)/tile)),bottom=Math.min(rows,Math.floor((l.box.y+r.y+r.height)/tile));
    for(let y=top;y<bottom;y++)if(right>left)hidden.fill(1,y*cols+left,y*cols+right);
  }
  return {layers,back:back.values().filter(c=>!hidden[c.y/tile*cols+c.x/tile]),palette,tile};
}
