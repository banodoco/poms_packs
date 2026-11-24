/** Deterministic, frame-pure motion shared by the pack and preview. */
import {resolveStyle, THEMES, type ThemeName} from "../style";
export type Direction = 'left-to-right'|'right-to-left'|'top-to-bottom'|'bottom-to-top'|'alternate';
export type CrawlStyle = 'clean'|'ragged'|'noisy'|'chunky';
export type Settings = {
  transitionSeconds?: number; inset?: number; drift?: number; pixelSize?: number;
  seed?: number; theme?: ThemeName; foreground?: string; background?: string; accent?: string; frameColor?: string;
  showCounter?: boolean; fit?: 'cover'|'contain'; direction?: Direction;
  directions?: Direction[]; sparkDensity?: number; randomness?: number;
  transitionDurations?: number[]; crawlStyle?: CrawlStyle; crawlStyles?: CrawlStyle[];
  presentation?: 'classic'|'carry'|'hold'; organism?: 'swarm'|'tendrils'|'none';
  /** Rest-only cargo drift, independent of internal tissue flow. */
  restJitter?:number; edgeReveal?:boolean;
  /** Internal preset for the dedicated arm-display element. */
  armLift?:boolean; armRoot?:{x:number;y:number};
  organismIntensity?:number; organismPixelSize?:number; organismSpread?:number; organismFlow?:number; arrivalSeconds?:number; staggerSeconds?:number;
};
export const DEFAULTS = {transitionSeconds: 0.42, inset: 0.055, drift: 1, pixelSize: 16,
  seed: 17, theme:'day' as const, background: THEMES.day.background, accent: THEMES.day.accent, frameColor: THEMES.day.border,
  showCounter: false, fit: 'cover' as const, direction: 'left-to-right' as const, sparkDensity: .10,
  randomness: .70, crawlStyle: 'ragged' as const};
export const clamp = (v:number,a=0,b=1) => Math.min(b,Math.max(a,v));
const finite=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?v:fallback;
const out=(v:number)=>1-Math.pow(1-clamp(v),3);
export const rand=(a:number,b:number,c:number)=>{
  let n=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^Math.imul(c|0,1442695041);
  n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
};
export type Layout={x:number;y:number;width:number;height:number};
export type Card={asset:string;kind:'image'|'video';weight?:number;sourceStart?:number;label?:string;layout?:Layout;grip?:number;fit?:'cover'|'contain'};
export type Span={start:number;length:number;index:number};
export function spans(cards:readonly Card[],frames:number):Span[]{
  if(!Number.isInteger(frames)||frames<cards.length||cards.length===0)throw Error('Deck requires at least one frame per card');
  const weights=cards.map(c=>Math.max(.001,finite(c.weight,1)));const sum=weights.reduce((a,b)=>a+b,0);let cursor=0,cumulative=0;
  return weights.map((w,index)=>{cumulative+=w;const end=index===cards.length-1?frames:index+1+Math.round((frames-cards.length)*cumulative/sum);const s={start:cursor,length:end-cursor,index};cursor=end;return s;});
}
/** Transition consumes the start of each incoming hold, never its entire hold. */
export function revealFrames(span:Span,fps:number,settings:Settings={}):number{
  const requested=Math.round(clamp(finite(settings.transitionDurations?.[span.index-1],
    finite(settings.transitionSeconds,DEFAULTS.transitionSeconds)),0,1.2)*fps);
  if(span.index===0||requested<2||span.length<2)return 0;
  return Math.min(requested,span.length,Math.max(2,Math.floor(span.length*.65)));
}
const validDirection=(d:unknown):d is Direction=>d==='left-to-right'||d==='right-to-left'||d==='top-to-bottom'||d==='bottom-to-top'||d==='alternate';
export function directionFor(index:number,settings:Settings={}):Direction{
  const override=settings.directions?.[index-1];
  return validDirection(override)?override:validDirection(settings.direction)?settings.direction:DEFAULTS.direction;
}
const validStyle=(s:unknown):s is CrawlStyle=>s==='clean'||s==='ragged'||s==='noisy'||s==='chunky';
export function styleFor(index:number,settings:Settings={}):CrawlStyle{
  const override=settings.crawlStyles?.[index-1];
  return validStyle(override)?override:validStyle(settings.crawlStyle)?settings.crawlStyle:DEFAULTS.crawlStyle;
}
// A style is a distinct spatial texture, not a new compositor. Randomness=0 is a straight front for every style.
const PROFILES = {
  clean: {tile:1, wave:.025, tooth:.010, branch:.010, freq:.7, sparks:.5},
  ragged: {tile:1, wave:.115, tooth:.052, branch:.032, freq:1, sparks:1},
  noisy: {tile:.75, wave:.075, tooth:.22, branch:.020, freq:1.7, sparks:1.4},
  chunky: {tile:2.1, wave:.15, tooth:.07, branch:.06, freq:.65, sparks:1},
} as const;
export function getState(frame:number,length:number,fps:number,width:number,height:number,index:number,settings:Settings={}){
  const seed=finite(settings.seed,DEFAULTS.seed)|0;
  const inset=clamp(finite(settings.inset,DEFAULTS.inset),.025,.18);
  const drift=clamp(finite(settings.drift,DEFAULTS.drift),0,1.5);
  const settle=out(clamp(frame,0,length-1)/Math.max(1,Math.min(length-1,Math.round(fps*.28))));
  const dir=index%2===0?1:-1,unit=Math.min(width,height);
  const x=(rand(seed,index,1)-.5)*unit*.042*drift+dir*unit*.024*drift*(1-settle);
  const y=(rand(seed,index,2)-.5)*unit*.030*drift+unit*.01*(1-settle)*drift;
  const angle=(rand(seed,index,3)-.5)*1.65*drift+dir*(1-settle)*.65*drift;
  const palette=resolveStyle(settings);
  const zoom=1+(.009*settle-.018*(1-settle))*drift;
  return {x,y,angle,scale:(1-inset*2)*zoom,frameWidth:Math.max(1,Math.round(unit/720*1.5)),
    background:palette.background,accent:palette.accent,frameColor:palette.frameColor,foreground:palette.foreground};
}
export type Rect={x:number;y:number;width:number;height:number};
export type Reveal={progress:number;revealed:Rect[];sparks:Rect[];tile:number};
/** Incoming pixels grow monotonically from one side. A narrow, coherent ragged front
 * advances across the frame; isolated seeded cells nibble at its boundary.
 * Unrevealed pixels are transparent, not black. Rect runs are compressed along
 * the active reveal axis. `randomness` controls how ragged and meandering the
 * crawl edge is while remaining monotonic and deterministic. */
export function crawl(frame:number,span:Span,fps:number,width:number,height:number,settings:Settings={}):Reveal{
  const duration=revealFrames(span,fps,settings);
  const progress=duration?clamp(frame/(duration-1)):1;
  return crawlAtProgress(progress,span.index,width,height,settings);
}
/** The same directional reveal, usable in an individual card's local rectangle. */
export function crawlAtProgress(progress:number,index:number,width:number,height:number,settings:Settings={},canvasUnit=Math.min(width,height)):Reveal{
  progress=clamp(progress);
  const unit=canvasUnit;
  const profile=PROFILES[styleFor(index,settings)];
  const tile=Math.max(6,Math.round(clamp(finite(settings.pixelSize,DEFAULTS.pixelSize),8,100)*profile.tile*unit/720));
  if(progress===0||progress===1)return {progress,revealed:progress===1?[{x:0,y:0,width,height}]:[],sparks:[],tile};
  const seed=finite(settings.seed,DEFAULTS.seed)|0;
  const randomness=clamp(finite(settings.randomness,DEFAULTS.randomness),0,1.5);
  const mode=directionFor(index,settings);
  const resolved=mode==='alternate' ? (index%2===0?'left-to-right':'right-to-left') : mode;
  const horizontal=resolved==='left-to-right'||resolved==='right-to-left';
  const reverse=resolved==='right-to-left'||resolved==='bottom-to-top';
  const primary=horizontal?Math.ceil(width/tile):Math.ceil(height/tile);
  const secondary=horizontal?Math.ceil(height/tile):Math.ceil(width/tile);
  const revealed:Rect[]=[],sparks:Rect[]=[];
  const density=clamp(finite(settings.sparkDensity,DEFAULTS.sparkDensity)*profile.sparks,0,.5);
  const waveAmp=randomness*profile.wave;
  const toothAmp=randomness*profile.tooth;
  const branchAmp=randomness*profile.branch;
  for(let s=0;s<secondary;s++){
    const wave=.54*Math.sin(s*.33*profile.freq+rand(seed,index,1)*6.28)+.29*Math.sin(s*.81*profile.freq+rand(seed,index,2)*6.28)+.17*((rand(seed,index,s)-.5)*2);
    const branch=.55*Math.sin(s*.17+rand(seed,index,7)*6.28)*branchAmp;
    let run=-1;
    const addRun=(end:number)=>{if(run<0)return; if(horizontal){
      const x=run*tile,y=s*tile,w=Math.min(width,end*tile)-x,h=Math.min(tile,height-s*tile);revealed.push({x,y,width:w,height:h});
    }else{
      const x=s*tile,y=run*tile,w=Math.min(tile,width-s*tile),h=Math.min(height,end*tile)-y;revealed.push({x,y,width:w,height:h});
    } run=-1;};
    for(let p=0;p<primary;p++){
      const logical=reverse?primary-1-p:p;
      const axis=(logical+.5)/primary;
      const fixed=rand(seed+index,logical,s)-.5;
      const tooth=((rand(seed+index*31+301,logical,s)-.5)+(rand(seed+index*31+607,logical,s)-.5)*.45)*toothAmp;
      const order=clamp(axis + wave*waveAmp + branch + fixed*toothAmp + tooth,.008,.992);
      if(progress>=order){
        if(run<0)run=p;
        if(progress-order<Math.max(.03,1/primary*2.5) && rand(seed+index+91,logical,s)<density){
          if(horizontal){
            sparks.push({x:p*tile,y:s*tile,width:Math.min(tile,width-p*tile),height:Math.min(tile,height-s*tile)});
          }else{
            sparks.push({x:s*tile,y:p*tile,width:Math.min(tile,width-s*tile),height:Math.min(tile,height-p*tile)});
          }
        }
      }else addRun(p);
    }
    addRun(primary);
  }
  return {progress,revealed,sparks,tile};
}
