import {type ReactElement} from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {networkGeometry,type NetworkSettings} from '../../../../shared/visuals';
import {Vector} from '../../../../shared/vector';

type Props={clip:{hold?:number};params:unknown;fps:number};
export default function PixelNetwork({clip,params,fps}:Props):ReactElement {
  const frame=useCurrentFrame(),{width,height,durationInFrames}=useVideoConfig();
  const duration=Math.max(1,Math.round(clip.hold===undefined?durationInFrames:clip.hold*fps));
  const p=(params&&typeof params==='object'&&!Array.isArray(params)?params:{}) as NetworkSettings;
  return <Vector width={width} height={height} shapes={networkGeometry(frame,duration,fps,width,height,p)}/>;
}
