import {useId,type CSSProperties,type ReactElement} from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {resolveStyle,FONTS} from '../../../../shared/style';
import {mediaFor,boundedVideoFrame,type MediaSettings,type ResolvedMedia} from '../../../../shared/media';
import LivingDeck from '../../../../shared/deck/living-deck';
import {presentationFor} from '../../../../shared/deck/living-motion';
import {DEFAULTS, crawl, getState, revealFrames, spans, type Card, type Settings, type Span} from '../../../../shared/deck/motion';

type AssetEntry={src?:string;file?:string;url?:string;type?:string};
type Clip={id?:string;hold?:number;from?:number;to?:number;speed?:number;params?:unknown};
type Params=Settings&MediaSettings&{cards?:Card[];cardIndex?:number};
// Structural subset of Astrid EffectProps; project-pack imports are React/Remotion + declared relatives only.
type EffectProps={clip:Clip;params:unknown;fps:number;assetEntry?:AssetEntry};
const resolve=(value:string)=>/^(https?:|blob:|data:|\/)/.test(value)?value:staticFile(value);
const imageKind=(entry:AssetEntry,src:string)=>entry.type?.startsWith('image')||(!entry.type&&/\.(png|jpe?g|webp|gif|avif)(?:[?#]|$)/i.test(src));
function CardView({card,src,span,fps,settings,count,rate=1,logicalIndex=span.index,entry}:{card:Card;src:string;entry?:ResolvedMedia;span:Span;fps:number;settings:Params;count:number;rate?:number;logicalIndex?:number}):ReactElement{
  const frame=useCurrentFrame();const {width,height}=useVideoConfig();
  const state=getState(frame,span.length,fps,width,height,logicalIndex,settings);
  const media:CSSProperties={display:'block',width:'100%',height:'100%',objectFit:settings.fit??DEFAULTS.fit};
  const trimBefore=Math.max(0,Math.round((card.sourceStart??0)*fps));
  const bounded=card.kind==='video'&&entry?boundedVideoFrame(entry,Math.max(0,frame),card.sourceStart??0,fps):frame;
  const managed=/^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\/api\/(?:astrid|runtime)\/v1\/objects\//.test(src)||/^\/api\/(?:astrid|runtime)\/v1\/objects\//.test(src);
  return <AbsoluteFill style={{backgroundColor:state.background,overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,transform:`translate(${state.x}px,${state.y}px) rotate(${state.angle}deg) scale(${state.scale})`,transformOrigin:'center center',backgroundColor:state.background,outline:`${state.frameWidth}px solid ${state.frameColor}`,overflow:'hidden'}}>
      {card.kind==='image'?<Img src={src} crossOrigin={managed?'anonymous':undefined} style={media}/>:<Freeze frame={bounded} active={bounded!==frame}><OffthreadVideo src={src} crossOrigin={managed?'anonymous':undefined} trimBefore={trimBefore} playbackRate={rate} muted style={media}/></Freeze>}
    </div>
    {settings.showCounter&&<div style={{position:'absolute',left:width*.055,bottom:height*.015,color:state.foreground,fontFamily:FONTS.system,fontSize:Math.max(10,height*.019),letterSpacing:2}}>{String(logicalIndex+1).padStart(2,'0')} / {String(count).padStart(2,'0')}{card.label?'  ·  '+card.label:''}</div>}
  </AbsoluteFill>;
}
function DeckLayer({card,entry,span,fps,settings,count}:{card:Card;entry:ResolvedMedia;span:Span;fps:number;settings:Params;count:number}):ReactElement{
  const frame=useCurrentFrame();const {width,height}=useVideoConfig();
  const id='crawl-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
  const reveal=crawl(frame,span,fps,width,height,settings);
  // Previous card is kept mounted for the next reveal. Freeze its final source frame
  // rather than requesting unallocated video frames or unmounting to a blank screen.
  const frozen=<Freeze frame={span.length-1} active={frame>=span.length}>
    <CardView card={card} src={resolve(entry.src)} entry={entry} span={span} fps={fps} settings={settings} count={count}/>
  </Freeze>;
  return <AbsoluteFill>
    <svg width={width} height={height} style={{position:'absolute',inset:0,pointerEvents:'none'}} aria-hidden="true">
      <defs><clipPath id={id} clipPathUnits="userSpaceOnUse">{reveal.revealed.map((r,i)=><rect key={i} {...r}/>)}</clipPath></defs>
    </svg>
    <AbsoluteFill style={{clipPath:reveal.progress===1?undefined:`url(#${id})`,visibility:reveal.progress===0?'hidden':'visible'}}>{frozen}</AbsoluteFill>
    <svg width={width} height={height} style={{position:'absolute',inset:0,pointerEvents:'none'}} shapeRendering="crispEdges" aria-hidden="true">{reveal.sparks.map((r,i)=><rect key={i} {...r} fill={resolveStyle(settings).accent} opacity={.82}/>)}</svg>
  </AbsoluteFill>;
}
export default function PixelCardShuffle({clip,params:raw,fps,assetEntry}:EffectProps):ReactElement|null{
  const p=(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}) as Params;
  const config=useVideoConfig();
  const duration=clip.hold??(typeof clip.to==='number'?Math.max(0,clip.to-(clip.from??0))/(clip.speed??1):config.durationInFrames/fps);
  const total=Math.max(1,Math.round(duration*fps));
  if(Array.isArray(p.cards)&&p.cards.length){
    const cards=p.cards,presentation=presentationFor(cards,p);
    if(presentation!=='classic')return <LivingDeck cards={cards} settings={{...p,presentation}} total={total} fps={fps}/>;
    const schedule=spans(cards,total);
    return <AbsoluteFill style={{backgroundColor:resolveStyle(p).background}}>{schedule.map(s=>{
      const card=cards[s.index],entry=mediaFor(p,card.asset,card.kind);
      const next=schedule[s.index+1];const tail=next?revealFrames(next,fps,p):0;
      return <Sequence key={`${s.index}:${card.asset}`} from={s.start} durationInFrames={s.length+tail} premountFor={card.kind==='video'?Math.min(Math.ceil(fps*.4),s.start):0}>
        <DeckLayer card={card} entry={entry} span={s} fps={fps} settings={p} count={cards.length}/>
      </Sequence>;
    })}</AbsoluteFill>;
  }
  const source=assetEntry?.src??assetEntry?.file??assetEntry?.url;
  if(!source||!assetEntry){
    // First placement may have no authored cards yet. Make the unconfigured state
    // explicit, rather than silently using demo artwork or inventing asset paths.
    return <AbsoluteFill style={{backgroundColor:resolveStyle(p).background,color:resolveStyle(p).foreground,justifyContent:'center',alignItems:'center',fontFamily:FONTS.system,fontSize:Math.min(config.width,config.height)*.03}}>PIXEL CARD SHUFFLE / SELECT CARDS</AbsoluteFill>;
  }
  // Single asset framing only: a true reveal needs two sources available together.
  const index=Math.max(0,Math.floor(p.cardIndex??0));
  const card:Card={asset:clip.id??'media',kind:imageKind(assetEntry,source)?'image':'video',sourceStart:clip.from??0};
  return <CardView card={card} src={resolve(source)} span={{start:0,length:total,index}} fps={fps} settings={p} count={index+1} rate={clip.speed??1}/>;
}
