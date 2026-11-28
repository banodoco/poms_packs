import {useMemo,type ReactElement,type CSSProperties} from 'react';
import {AbsoluteFill,Freeze,Img,OffthreadVideo,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {compileTimeline,timelineFrame,formatTime,type Settings,type Mode,type TimelineFrame} from './model';
import {FONTS} from '../style';
import {mediaFor,validateVideoRange,type MediaSettings} from '../media';
import {ease,type Bounds,type Tone} from '../organism';
const position=(b:Bounds):CSSProperties=>({position:'absolute',left:b.x,top:b.y,width:b.width,height:b.height});
const resolved=(v:string)=>/^(https?:|blob:|data:|\/)/.test(v)?v:staticFile(v);
export function Media({slot,kind,frame,settings,fps,fit='cover'}:{slot:string;kind:'image'|'video';frame:number;settings:MediaSettings;fps:number;fit?:'cover'|'contain'}):ReactElement{
 const entry=mediaFor(settings,slot,kind),src=resolved(entry.src),managed=/^(?:https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?)?\/api\/(?:astrid|runtime)\/v1\/objects\//.test(src);
 const style:CSSProperties={width:'100%',height:'100%',objectFit:fit,display:'block'};
 const safe=entry.duration===undefined?frame:Math.max(0,Math.min(frame,Math.floor(entry.duration*fps+1e-7)-1));
 return kind==='image'?<Img src={src} crossOrigin={managed?'anonymous':undefined} style={style}/>:<Freeze frame={safe}><OffthreadVideo src={src} crossOrigin={managed?'anonymous':undefined} muted style={style}/></Freeze>;
}
export function TimelineView({clip,params,fps,mode,frameOverride,canvas,visibleIds}:{clip:{hold?:number};params:unknown;fps:number;mode:Mode;frameOverride?:number;canvas?:{width:number;height:number};visibleIds?:string[]}):ReactElement{
 const localFrame=useCurrentFrame(),native=useVideoConfig(),v=canvas?{...native,...canvas}:native,frame=frameOverride??localFrame,input=params as Settings,total=Math.max(1,Math.round((clip.hold??v.durationInFrames/fps)*fps));
 const c=useMemo(()=>{const x=compileTimeline(input,mode,v.width,v.height,fps,total);for(const item of x.clips)if(item.kind==='video')validateVideoRange(mediaFor(input,item.asset!,'video'),item.sourceStart,item.sourceStart+item.duration,fps);for(const item of x.clips){const change=x.changes[item.id];if(!change||item.kind==='label')continue;const media=mediaFor(input,change.asset!,item.kind);if(item.kind==='video')validateVideoRange(media,item.sourceStart,item.sourceStart+change.duration,fps);}for(const p of x.panels)validateVideoRange(mediaFor(input,p.asset,'video'),p.sourceStart,p.sourceStart+x.duration,fps);return x;},[input,mode,v.width,v.height,fps,total]);
 const f=timelineFrame(c,Math.min(total-1,frame)),{style:s,scale:k}=c;
 const sm=Math.max(10,14*k),sys=Math.max(9,11*k),trackFont=Math.max(9,13*k),paths:Record<Tone,string[]>={body:[],shadow:[],light:[]};
 for(const p of f.cells)paths[p.tone].push(`M${p.x} ${p.y}h${p.width}v${p.height}h-${p.width}z`);
 const activeTracks=new Set(f.blocks.filter(b=>b.active).map(b=>b.track));
 const totalLabel=c.mode==='assemble'&&!f.playing?`${f.assembled} / ${c.clips.length} placed`:`${formatTime(f.timelineTime)} / ${formatTime(c.duration)}`;
 return <AbsoluteFill style={{backgroundColor:s.background,color:s.foreground,fontFamily:FONTS.body,overflow:'hidden'}}>
  <div style={{position:'absolute',inset:0,opacity:f.chromeOpacity}}>
  <div style={{position:'absolute',left:c.margin,top:c.titleY,fontFamily:FONTS.system,fontSize:sys,letterSpacing:1.8*k,color:s.accentText}}>{c.eyebrow}</div>
  <div style={{position:'absolute',left:c.margin,top:c.titleY+19*k,fontFamily:FONTS.editorial,fontSize:Math.min(35*k,c.width*.065),lineHeight:1.05}}>{c.title}</div>
  <div style={{position:'absolute',right:c.margin,top:c.titleY+22*k,fontFamily:FONTS.system,fontSize:sys,color:s.muted}}>{totalLabel}</div>
  {f.playerOpacity>0&&<div style={{position:'absolute',inset:0,opacity:f.playerOpacity}}>{f.players.length?f.players.map(p=><div key={p.id}>
   <div style={{...position(p.box),border:`1px solid ${s.border}`,background:s.panel,overflow:'hidden'}}><Media slot={p.asset} kind="video" frame={p.sourceFrame} settings={input} fps={fps} fit="contain"/></div>
   <div style={{position:'absolute',left:p.box.x,top:p.box.y+p.box.height+5*k,width:p.box.width,display:'flex',justifyContent:'space-between',fontSize:sm,color:s.muted}}><span style={{display:'flex',alignItems:'center',gap:4*k,minWidth:0}}>{c.tracks.filter(t=>p.tracks?.includes(t.id)).map(t=><span key={t.id} style={{width:6*k,height:7*k,background:t.color,flexShrink:0}}/>)}<span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.label}</span></span><span style={{fontFamily:FONTS.system,fontSize:sys,flexShrink:0}}>{formatTime(f.timelineTime)}</span></div>
  </div>):<div style={{...position(c.pool),display:'flex',alignItems:'center',justifyContent:'center',fontFamily:FONTS.editorial,fontSize:28*k,color:s.muted}}>The timeline is ready.</div>}</div>}
  <div style={{position:'absolute',left:c.margin,top:c.timeline.y-26*k,fontSize:sm,fontWeight:600}}>Timeline <span style={{color:s.muted,fontWeight:400,fontSize:sys,marginLeft:9*k}}>{c.tracks.length} tracks · {c.clips.length} clips</span></div>
  <div style={{...position(c.timeline),background:s.panel,border:`1px solid ${s.border}`}}/>
  {c.tracks.map(t=><div key={t.id} style={{...position(t.box),borderTop:`1px solid ${s.border}`,boxSizing:'border-box',background:activeTracks.has(t.id)?`${t.color}28`:undefined}}><div style={{position:'absolute',left:10*k,top:0,width:c.x0-t.box.x-16*k,height:'100%',display:'flex',alignItems:'center',gap:7*k,fontSize:trackFont,overflow:'hidden',whiteSpace:'nowrap'}}><span style={{width:5*k,height:12*k,background:t.color,flexShrink:0}}/><span style={{overflow:'hidden',textOverflow:'ellipsis'}}>{t.label}</span></div></div>)}
  <svg width={c.width} height={c.height} style={{position:'absolute',inset:0,pointerEvents:'none'}}><line x1={c.x0} y1={c.timeline.y} x2={c.x0} y2={c.timeline.y+c.timeline.height} stroke={s.border}/>{c.ticks.map(t=><g key={t.at}><line x1={t.x} y1={c.timeline.y} x2={t.x} y2={c.timeline.y+c.timeline.height} stroke={s.border} strokeOpacity={.65}/>{c.showTimecodes&&<text x={Math.min(t.x+4*k,c.x1-6*k)} textAnchor={t.x>c.x1-28*k?'end':'start'} y={c.timeline.y+c.rulerHeight*.72} fontSize={sys} fontFamily={FONTS.system} fill={s.muted}>{t.at.toFixed(t.at%1?1:0)}s</text>}</g>)}</svg>
  </div>
  <svg width={c.width} height={c.height} style={{position:'absolute',inset:0,pointerEvents:'none'}} shapeRendering="crispEdges">{(Object.keys(paths) as Tone[]).map(t=><path key={t} d={paths[t].join('')} fill={{body:s.accent,shadow:s.accentText,light:'#FFBE79'}[t]}/>)}</svg>
  {f.blocks.filter(b=>visibleIds===undefined||visibleIds.includes(b.id)).map(b=><div key={b.id} style={{position:'absolute',inset:0,opacity:b.entry?1:f.chromeOpacity}}><Block b={b} fps={fps} settings={input} scale={k} foreground={s.foreground} border={b.entry&&b.p===0?s.frameColor:s.border} accent={s.accent}/></div>)}
  {f.playing&&<svg width={c.width} height={c.height} style={{position:'absolute',inset:0,pointerEvents:'none'}}><path d={`M${f.playhead-4*k} ${c.timeline.y-4*k}h${8*k}l${-4*k} ${6*k}z`} fill={s.accent}/><line x1={f.playhead} x2={f.playhead} y1={c.timeline.y} y2={c.timeline.y+c.timeline.height} stroke={s.accent} strokeWidth={Math.max(1,1.7*k)}/></svg>}
 </AbsoluteFill>;
}
function Block({b,fps,settings,scale:k,foreground,border,accent}:{b:TimelineFrame['blocks'][number];fps:number;settings:MediaSettings;scale:number;foreground:string;border:string;accent:string}):ReactElement{
 const strip=b.p>.8,dock=ease((b.p-.78)/.22),thumb=b.box.width+(Math.min(b.box.width*.4,b.box.height*1.65)-b.box.width)*dock,fs=Math.max(8,12*k);
 return <div style={{...position(b.box),background:b.color,boxSizing:'border-box',border:`${b.active?2:1}px solid ${b.active?accent:border}`,overflow:'hidden',boxShadow:b.moving?`0 ${4*k}px ${14*k}px #25241F18`:undefined}}>
 {b.kind!=='label'&&<div style={{position:'absolute',left:0,top:0,width:thumb,height:Math.max(1,b.box.height-20*k*(1-dock)*(b.entry?Math.min(1,b.p*4):1)),overflow:'hidden'}}><Media slot={b.asset!} kind={b.kind} frame={b.sourceFrame} settings={settings} fps={fps} fit="contain"/></div>}
 {( !b.entry||b.p>=.25)&&<div style={{position:'absolute',left:strip&&b.kind!=='label'?thumb+5*k:6*k,right:4*k,bottom:strip?0:2*k,top:strip?0:undefined,display:'flex',alignItems:'center',height:strip?'100%':17*k,fontSize:fs,fontWeight:600,whiteSpace:'nowrap',color:'#25241F',overflow:'hidden'}}><span style={{textOverflow:'ellipsis',overflow:'hidden'}}>{b.label}</span></div>}
 </div>;
}
