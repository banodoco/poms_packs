import {Fragment,useMemo,type ReactElement} from 'react';
import {AbsoluteFill,Freeze,Img,OffthreadVideo,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {compileSequence,sequenceFrame,type Sequence,type Rect} from './model';
import {MinkSprite} from '../mink/view';
import {mediaFor,validateVideoRange} from '../media';
import {FONTS} from '../style';
const pos=(b:Rect)=>({position:'absolute' as const,left:b.x,top:b.y,width:b.width,height:b.height});
export function ContinuousSequence({clip,params,fps}:{clip:{hold?:number};params:unknown;fps:number}):ReactElement{
 const p=params as Sequence,v=useVideoConfig(),frame=useCurrentFrame(),total=Math.max(1,Math.round((clip.hold??v.durationInFrames/fps)*fps));
 const c=useMemo(()=>{const c=compileSequence(p,v.width,v.height,fps,total);for(const n of c.panels){if(n.kind==='video')validateVideoRange(mediaFor(p,n.asset!,'video'),n.sourceStart,n.sourceEnd!,fps);else if(n.kind==='image')mediaFor(p,n.asset!,'image');}return c;},[p,v.width,v.height,fps,total]);
 const f=sequenceFrame(c,Math.min(total-1,frame)),s=c.style;const actor=f.mink?<MinkSprite state={f.mink.state} width={v.width} height={v.height} settings={p}/>:null;
 return <AbsoluteFill style={{overflow:'hidden',background:s.background}}>{f.layers.map(n=>{const b=n.box,k=Math.min(b.width/960,b.height/540);const media=n.kind==='title'?undefined:mediaFor(p,n.asset!,n.kind);const src=media?(/^(https?:|blob:|data:|\/)/.test(media.src)?media.src:staticFile(media.src)):'';const m={width:'100%',height:'100%',objectFit:n.fit??'contain' as const};return <Fragment key={n.id}>{f.mink?.behind===n.id?actor:null}<div key={n.id} style={{...pos(b),overflow:'hidden',background:s.background,outline:n.frame?`${Math.max(1,2*k)}px solid ${s.border}`:undefined}}>{n.kind==='title'?<AbsoluteFill style={{color:s.foreground}}><div style={{position:'absolute',left:'7.7%',top:'12.8%',fontFamily:FONTS.system,fontSize:16*k,color:s.accentText}}>{n.eyebrow}</div><div style={{position:'absolute',left:'7.2%',top:'27.4%',fontFamily:FONTS.editorial,fontSize:118*k,lineHeight:1.1}}>{n.title}</div><div style={{position:'absolute',left:'8.1%',top:'56.1%',fontFamily:FONTS.body,fontSize:29*k,color:s.muted}}>{n.subtitle}</div></AbsoluteFill>:n.kind==='image'?<Img src={src} style={m}/>:<Freeze frame={n.sourceFrame}><OffthreadVideo src={src} trimBefore={Math.round(n.sourceStart*fps)} muted style={m}/></Freeze>}</div></Fragment>;})}{!f.mink?.behind||!f.layers.some(n=>n.id===f.mink?.behind)?actor:null}</AbsoluteFill>;
}
