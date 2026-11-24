import {type ReactElement} from 'react';
import {AbsoluteFill,useVideoConfig} from 'remotion';
import {FONTS,resolveStyle} from '../../../../shared/style';
import LivingDeck,{type LivingParams} from '../../../../shared/deck/living-deck';
import {armSettings} from './preset';

type Props={clip:{hold?:number};params:unknown;fps:number};
export default function PixelArmDisplay({clip,params:raw,fps}:Props):ReactElement{
  const p=(raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}) as LivingParams;
  const config=useVideoConfig(),total=Math.max(1,Math.round((clip.hold??config.durationInFrames/fps)*fps));
  const settings=armSettings(p),cards=settings.cards??[];
  if(!cards.length){const palette=resolveStyle(settings);return <AbsoluteFill style={{backgroundColor:palette.background,color:palette.foreground,alignItems:'center',justifyContent:'center',fontFamily:FONTS.system,fontSize:Math.min(config.width,config.height)*.03}}>PIXEL ARM DISPLAY / SELECT CARDS</AbsoluteFill>;}
  return <LivingDeck cards={cards} settings={settings} total={total} fps={fps}/>;
}
