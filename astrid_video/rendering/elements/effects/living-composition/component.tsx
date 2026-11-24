import {useMemo,useId,type ReactElement,type CSSProperties} from 'react';
import {AbsoluteFill,Freeze,Img,OffthreadVideo,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {compile} from '../../../../shared/composition/compile';
import {framePlan} from '../../../../shared/composition/engine';
import type {Composition,Layer,FramePlan} from '../../../../shared/composition/types';
import type {Cell,Tone} from '../../../../shared/organism';
import {FONTS} from '../../../../shared/style';
import {mediaFor,validateVideoRange,boundedVideoFrame,type MediaSettings} from '../../../../shared/media';
import {compositionParams} from '../../../../shared/composition/defaults';
const resolve=(v:string)=>/^(https?:|blob:|data:|\/)/.test(v)?v:staticFile(v);
function TissueLayer({cells,palette,width,height}:{cells:Cell[];palette:FramePlan['palette'];width:number;height:number}):ReactElement{
 const paths:Record<Tone,string[]>={body:[],shadow:[],light:[]};const tones={body:palette.accent,shadow:palette.accentText,light:'#FFBE79'};
 for(const c of cells)paths[c.tone].push(`M${c.x} ${c.y}h${c.width}v${c.height}h-${c.width}z`);
 return <svg width={width} height={height} style={{position:'absolute',inset:0,pointerEvents:'none'}} shapeRendering="crispEdges" aria-hidden="true">{(Object.keys(paths) as Tone[]).map(k=><path key={k} fill={tones[k]} d={paths[k].join('')}/>)}</svg>;
}
function Content({layer,palette,fps,assets}:{layer:Layer;palette:FramePlan['palette'];fps:number;assets:MediaSettings}):ReactElement{
 const maskId='composition-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const {box,content,reveal}=layer;
 const entry=content.kind==='text'?undefined:mediaFor(assets,content.asset!,content.kind);
 if(entry&&content.kind==='video')validateVideoRange(entry,content.sourceStart??0,content.sourceEnd!,fps);
 const sourceFrame=entry&&content.kind==='video'?boundedVideoFrame(entry,layer.sourceFrame,content.sourceStart??0,fps):layer.sourceFrame;
 const src=entry?resolve(entry.src):'';
 const managed=/^(?:https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?)?\/api\/(?:astrid|runtime)\/v1\/objects\//.test(src);
 const media:CSSProperties={display:'block',width:'100%',height:'100%',objectFit:content.fit??'contain'};
 const font=Math.max(9,Math.min(box.width*.095,box.height*.22,box.width/Math.max(3,content.text?.length??1)*1.55));
 return <div style={{position:'absolute',left:box.x,top:box.y,width:box.width,height:box.height}}>
  <svg width={box.width} height={box.height} style={{position:'absolute',inset:0,pointerEvents:'none'}}><defs><clipPath id={maskId} clipPathUnits="userSpaceOnUse">{reveal.revealed.map((r,i)=><rect key={i} {...r}/>)}</clipPath></defs></svg>
  <AbsoluteFill style={{backgroundColor:palette.panel,overflow:'hidden',clipPath:reveal.progress===1?undefined:`url(#${maskId})`}}>
   {content.kind==='text'?<AbsoluteFill style={{justifyContent:'center',padding:'8%',color:palette.foreground,boxSizing:'border-box',gap:font*.24}}><div style={{fontFamily:FONTS.editorial,fontSize:font,lineHeight:1.05,overflowWrap:'anywhere'}}>{content.text}</div>{content.subtitle&&<div style={{fontFamily:FONTS.body,fontSize:font*.43,color:palette.muted,lineHeight:1.25,overflowWrap:'anywhere'}}>{content.subtitle}</div>}</AbsoluteFill>:content.kind==='image'?<Img src={src} crossOrigin={managed?'anonymous':undefined} style={media}/>:<Freeze frame={sourceFrame}><OffthreadVideo src={src} crossOrigin={managed?'anonymous':undefined} trimBefore={Math.round((content.sourceStart??0)*fps)} muted style={media}/></Freeze>}
   <div style={{position:'absolute',inset:0,boxShadow:`inset 0 0 0 1px ${palette.frameColor}`,pointerEvents:'none'}}/>
  </AbsoluteFill>
  <svg width={box.width} height={box.height} style={{position:'absolute',inset:0,pointerEvents:'none'}} shapeRendering="crispEdges">{reveal.sparks.map((r,i)=><rect key={i} {...r} fill={palette.accent} opacity={.72}/>)}</svg>
 </div>;
}
export default function LivingComposition({clip,params:raw,fps}:{clip:{hold?:number};params:unknown;fps:number}):ReactElement{
 const frame=useCurrentFrame(),config=useVideoConfig(),{width,height}=config;
 const input=useMemo(()=>compositionParams(raw),[raw]),total=Math.max(1,Math.round((clip.hold??config.durationInFrames/fps)*fps));
 const compiled=useMemo(()=>compile(input,fps,width,height,total),[input,fps,width,height,total]);
 const plan=framePlan(compiled,frame);
 return <AbsoluteFill style={{backgroundColor:plan.palette.background,overflow:'hidden'}}>
  <TissueLayer cells={plan.back} palette={plan.palette} width={width} height={height}/>
  {plan.layers.map(l=><Content key={l.key} layer={l} palette={plan.palette} fps={fps} assets={input}/>)}
  {plan.layers.map(l=><TissueLayer key={l.key+'-front'} cells={l.front} palette={plan.palette} width={width} height={height}/>)}
  <TissueLayer cells={plan.overlay} palette={plan.palette} width={width} height={height}/>
 </AbsoluteFill>;
}
