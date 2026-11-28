import type {ReactElement} from 'react';
import {Img,staticFile} from 'remotion';
import {SPRITES,spriteBox,type minkFrame} from './model';
import {mediaFor,type MediaSettings} from '../media';
export function MinkSprite({state,width,height,settings}:{state:ReturnType<typeof minkFrame>;width:number;height:number;settings:MediaSettings}):ReactElement|null{
 if(!state.visible)return null;const b=spriteBox(state,width,height),m=mediaFor({__astridAssets:settings.__astridAssets},`mink-${state.sprite}`,'image'),src=/^(https?:|blob:|data:|\/)/.test(m.src)?m.src:staticFile(m.src);
 return <div style={{position:'absolute',left:b.x,top:b.y,width:b.width,height:b.height,overflow:'hidden',transform:state.facing==='left'?'scaleX(-1)':undefined,pointerEvents:'none'}}><Img src={src} style={{position:'absolute',left:-state.index*b.width,top:0,width:b.width*SPRITES[state.sprite].frames,height:b.height,maxWidth:'none',imageRendering:'pixelated'}}/></div>;
}
