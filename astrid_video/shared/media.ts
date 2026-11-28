/** The host owns media authority. The author supplies opaque registry keys only. */
export type MediaKind = 'image' | 'video';
export type ResolvedMedia = {src:string;kind:MediaKind;duration?:number};
export type MediaSettings = {
  mediaBindings?:Record<string,string>;
  __astridMedia?:Record<string,ResolvedMedia>;
  __astridAssets?:Record<string,string>;
};
const own=(o:unknown,k:string):boolean=>!!o&&typeof o==='object'&&Object.prototype.hasOwnProperty.call(o,k);
export function mediaFor(settings:MediaSettings,slot:string,kind:MediaKind):ResolvedMedia {
  if(own(settings.mediaBindings,slot)){
    const entry=own(settings.__astridMedia,slot)?settings.__astridMedia![slot]:undefined;
    if(!entry||typeof entry.src!=='string'||!entry.src.trim())throw Error(`Managed media slot ${slot} is not resolved by the Astrid host; use a host with the managed element media contract`);
    if(entry.kind!==kind)throw Error(`Managed media slot ${slot} is ${entry.kind}, expected ${kind}`);
    if(kind==='video'&&(!Number.isFinite(entry.duration)||entry.duration!<=0))throw Error(`Managed video ${slot} lacks verified duration`);
    return entry;
  }
  const path=own(settings.__astridAssets,slot)?settings.__astridAssets![slot]:undefined;
  if(typeof path!=='string'||!path.trim())throw Error(`Unresolved immutable pack asset ${slot}; bind managed media or use an admitted pack asset`);
  return {src:path,kind};
}
/** A bounded source clock; clamp to the last real frame instead of decoding past EOF. */
export function boundedVideoFrame(entry:ResolvedMedia,frame:number,sourceStart:number,fps:number):number {
  if(entry.kind!=='video')throw Error('Expected video');
  if(!Number.isFinite(sourceStart)||sourceStart<0||!Number.isInteger(frame)||frame<0||!Number.isFinite(fps)||fps<=0)throw Error('Invalid video clock');
  if(entry.duration===undefined)return frame;
  const start=Math.round(sourceStart*fps),end=Math.floor(entry.duration*fps+1e-7);
  if(start>=end)throw Error('Video source start is outside the verified duration');
  return Math.min(frame,end-start-1);
}
export function validateVideoRange(entry:ResolvedMedia,start:number,end:number,fps:number):void {
  if(entry.duration===undefined)return;
  if(end>entry.duration+1e-7)throw Error('Video source end exceeds the verified duration');
  const startFrame=Math.round(start*fps),count=Math.ceil((end-start)*fps-1e-7);
  if(count<1||startFrame+count>Math.floor(entry.duration*fps+1e-7))throw Error('Video source range exceeds the verified frame window');
}
