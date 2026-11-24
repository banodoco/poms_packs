import {useId,type ReactElement,type CSSProperties} from 'react';
import {AbsoluteFill,Freeze,Img,OffthreadVideo,Sequence,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {FONTS} from '../style';
import {mediaFor,boundedVideoFrame,type MediaSettings,type ResolvedMedia} from '../media';
import {type Cell,type Tone} from '../organism';
import {livingPlan,livingSchedule,type Layer,type LivingPlan} from './living-motion';
import {type Card,type Settings} from './motion';
export type LivingParams=Settings&MediaSettings&{cards?:Card[]};
const resolve=(s:string)=>/^(https?:|blob:|data:|\/)/.test(s)?s:staticFile(s);
const colors=(palette:LivingPlan['palette']):Record<Tone,string>=>({body:palette.accent,shadow:palette.accentText,light:'#FFBE79'});
function TissueLayer({cells,palette,width,height}:{cells:Cell[];palette:LivingPlan['palette'];width:number;height:number}):ReactElement{
  const tone=colors(palette);
  // One path per colour, not thousands of React DOM nodes.
  const paths:Record<Tone,string[]>={body:[],shadow:[],light:[]};
  for(const c of cells)paths[c.tone].push(`M${c.x} ${c.y}h${c.width}v${c.height}h-${c.width}z`);
  return <svg width={width} height={height} style={{position:'absolute',inset:0,pointerEvents:'none'}} shapeRendering="crispEdges" aria-hidden="true">{(Object.keys(paths) as Tone[]).map(k=><path key={k} d={paths[k].join('')} fill={tone[k]}/>)}</svg>;
}
function Load({card,layer,entry,palette,settings,fps,count}:{card:Card;layer:Layer;entry:ResolvedMedia;palette:LivingPlan['palette'];settings:LivingParams;fps:number;count:number}):ReactElement{
  const id='living-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
  const {box,reveal,sourceFrame,departing}=layer;
  const src=resolve(entry.src);
  const localFrame=useCurrentFrame();
  const desired=departing?sourceFrame:Math.max(0,localFrame);
  const bounded=card.kind==='video'?boundedVideoFrame(entry,desired,card.sourceStart??0,fps):desired;
  const media:CSSProperties={display:'block',width:'100%',height:'100%',objectFit:card.fit??settings.fit??'cover'};
  const managed=/^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\/api\/(?:astrid|runtime)\/v1\/objects\//.test(src)||/^\/api\/(?:astrid|runtime)\/v1\/objects\//.test(src);
  return <div style={{position:'absolute',left:box.x,top:box.y,width:box.width,height:box.height}}>
    <svg width={box.width} height={box.height} style={{position:'absolute',inset:0,pointerEvents:'none'}} aria-hidden="true"><defs><clipPath id={id} clipPathUnits="userSpaceOnUse">{reveal.revealed.map((r,i)=><rect key={i} {...r}/>)}</clipPath></defs></svg>
    <AbsoluteFill style={{backgroundColor:palette.panel,overflow:'hidden',outline:`1px solid ${palette.frameColor}`,outlineOffset:-1,clipPath:reveal.progress===1?undefined:`url(#${id})`,visibility:reveal.progress===0?'hidden':'visible'}}>
      {card.kind==='image'?<Img src={src} crossOrigin={managed?'anonymous':undefined} style={media}/>:<Freeze frame={bounded} active={departing||bounded!==desired}><OffthreadVideo src={src} crossOrigin={managed?'anonymous':undefined} trimBefore={Math.max(0,Math.round((card.sourceStart??0)*fps))} muted style={media}/></Freeze>}
      <div style={{position:'absolute',inset:0,boxShadow:`inset 0 0 0 1px ${palette.frameColor}`,pointerEvents:'none'}}/>
    </AbsoluteFill>
    <svg width={box.width} height={box.height} style={{position:'absolute',inset:0,pointerEvents:'none'}} shapeRendering="crispEdges" aria-hidden="true">{reveal.sparks.map((r,i)=><rect key={i} {...r} fill={palette.accent} opacity={.72}/>)}</svg>
    {settings.showCounter&&reveal.progress===1&&<div style={{position:'absolute',left:0,top:-22,color:palette.foreground,fontFamily:FONTS.system,fontSize:12,letterSpacing:1}}>{String(layer.index+1).padStart(2,'0')} / {String(count).padStart(2,'0')}{card.label?' · '+card.label:''}</div>}
  </div>;
}
/** The plan has one shared rear organism layer, clean individual loads, and a
 * foreground contact layer. Source-time remains in a Sequence per card. */
export default function LivingDeck({cards,settings,total,fps}:{cards:Card[];settings:LivingParams;total:number;fps:number}):ReactElement{
  const frame=useCurrentFrame();const {width,height}=useVideoConfig();
  const schedule=livingSchedule(cards,total,fps,settings);
  const plan=livingPlan(frame,total,fps,width,height,cards,settings,schedule);
  const layers=new Map(plan.layers.map(l=>[l.index,l]));
  return <AbsoluteFill style={{backgroundColor:plan.palette.background,overflow:'hidden'}}>
    <TissueLayer cells={plan.back} palette={plan.palette} width={width} height={height}/>
    {schedule.map(s=>{
      const card=cards[s.index],layer=layers.get(s.index),entry=mediaFor(settings,card.asset,card.kind);
      if(!layer)return null;
      return <Sequence key={`${s.index}:${card.asset}`} from={s.start} durationInFrames={s.length+s.tail}>
        <Load card={card} layer={layer} entry={entry} palette={plan.palette} settings={settings} fps={fps} count={cards.length}/>
        <TissueLayer cells={layer.front} palette={plan.palette} width={width} height={height}/>
      </Sequence>;
    })}
  </AbsoluteFill>;
}
