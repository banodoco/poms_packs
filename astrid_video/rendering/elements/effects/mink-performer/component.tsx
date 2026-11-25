import {useMemo,type ReactElement} from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {compileMink,minkFrame,type PerformerSettings} from '../../../../shared/mink/model';
import {MinkSprite} from '../../../../shared/mink/view';
import {resolveStyle,type ColorSettings} from '../../../../shared/style';
import type {MediaSettings} from '../../../../shared/media';
export default function Effect({clip,params,fps}:{clip:{hold?:number};params:unknown;fps:number}):ReactElement{
 const p=params as PerformerSettings&MediaSettings&ColorSettings&{transparent?:boolean},v=useVideoConfig(),f=useCurrentFrame(),total=Math.max(1,Math.round((clip.hold??v.durationInFrames/fps)*fps));const c=useMemo(()=>compileMink(p,total,fps),[p,total,fps]);return <AbsoluteFill style={{background:p.transparent!==false?'transparent':resolveStyle(p).background,overflow:'hidden'}}><MinkSprite state={minkFrame(c,Math.min(total-1,f))} width={v.width} height={v.height} settings={p}/></AbsoluteFill>;
}
