/** Frame-pure vector geometry for the Astrid Video explainer vocabulary. */
import {FONTS, resolveStyle, type ColorSettings} from './style';
export type {ColorSettings} from './style';
export type ChapterSettings=ColorSettings&{series?:string;chapter?:string;titleLines?:string[];subtitle?:string;entranceSeconds?:number;seed?:number};
export type NetworkSettings=ColorSettings&{heading?:string;nodes?:string[];output?:string;buildSeconds?:number;showGrid?:boolean};
export type Shape={tag:'rect'|'path'|'line'|'text'|'circle';attrs:Record<string,string|number>;text?:string};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>1-(1-clamp(v))**3;
const num=(v:unknown,d:number)=>typeof v==='number'&&Number.isFinite(v)?v:d;
const word=(v:unknown,d:string)=>typeof v==='string'?v:d;
const array=(v:unknown,d:string[])=>Array.isArray(v)&&v.length&&v.every(a=>typeof a==='string')?v as string[]:d;
const color=(v:unknown,d:string)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:d;
const rect=(x:number,y:number,width:number,height:number,fill:string,extra:Shape['attrs']={}):Shape=>({tag:'rect',attrs:{x,y,width,height,fill,...extra}});
const line=(x1:number,y1:number,x2:number,y2:number,stroke:string,extra:Shape['attrs']={}):Shape=>({tag:'line',attrs:{x1,y1,x2,y2,stroke,...extra}});
const text=(x:number,y:number,value:string,fill:string,size:number,extra:Shape['attrs']={}):Shape=>({tag:'text',attrs:{x,y,fill,fontSize:size,fontFamily:FONTS.body,...extra},text:value});
const mono={'fontFamily':FONTS.system,'letterSpacing':1.4};
const editorial={fontFamily:FONTS.editorial,fontWeight:400};
const fit=(s:string,max:number,size:number,monoFont=false)=>Math.max(1,Math.min(size,max/Math.max(1,s.length)/(monoFont ? .65 : .63)));
function grid(w:number,h:number,u:number,muted:string):Shape[]{const a:Shape[]=[];const step=28*u;for(let y=step;y<h;y+=step)for(let x=step;x<w;x+=step)a.push(rect(x,y,1.2*u,1.2*u,muted,{opacity:.08}));return a;}
function random(seed:number,x:number,y:number){let n=Math.imul(seed|0,374761393)^Math.imul(x,668265263)^Math.imul(y,1442695041);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
export function chapterGeometry(frame:number,duration:number,fps:number,w:number,h:number,p:ChapterSettings={}):Shape[]{
  const t=resolveStyle(p),u=Math.min(w,h)/720,margin=48*u,portrait=h>w*1.1;
  const entrance=Math.max(1,Math.min(duration-1,Math.round(Math.max(0,num(p.entranceSeconds,.46))*fps)));
  const progress=duration<=1||p.entranceSeconds===0?1:clamp(frame/entrance),e=ease(progress);
  const a:Shape[]=[rect(0,0,w,h,t.background), ];
  const series=word(p.series,'ASTRID / FIELD NOTES'),chapter=word(p.chapter,'01'),title=array(p.titleLines,['The experiment.']).slice(0,3),subtitle=word(p.subtitle,'An experiment in creative direction.');
  const contentW=portrait?w-margin*2:Math.min(w*.65-margin,w-margin*2-276*u);
  const headerY=margin+20*u, footerY=h-margin;
  a.push(line(margin,headerY+19*u,w-margin,headerY+19*u,t.border,{strokeWidth:u}));
  a.push(text(margin,headerY,series,t.accentText,fit(series,w-margin*2-100*u,17*u,true),{...mono,fontWeight:600}));
  a.push(text(w-margin,headerY,chapter,t.foreground,24*u,{...mono,textAnchor:'end'}));
  const top=portrait?h*.26:h*.38;
  const longest=title.reduce((long,s)=>s.length>long.length?s:long,'');
  const size=fit(longest,contentW,portrait?66*u:76*u),lineHeight=size*1.08;
  a.push(rect(margin,top-size-15*u,Math.max(0,76*u*e),3*u,t.accent));
  title.forEach((s,i)=>{const q=ease(clamp((progress-i*.11)/.72));a.push(text(margin,top+i*lineHeight+(1-q)*16*u,s,t.foreground,size,{...editorial,opacity:q}));});
  const subY=top+(title.length-1)*lineHeight+49*u;
  a.push(text(margin,subY,subtitle,t.muted,fit(subtitle,contentW,23*u),{opacity:ease((progress-.2)/.8)}));
  // Small tiled, stepped graphic. It stays in the margin and never obscures the title.
  const tile=(portrait?20:21)*u,cols=12,rows=10;
  const gx=w-margin-cols*tile,gy=portrait?Math.max(subY+54*u,h*.61):h*.25;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const seed=num(p.seed,17),boundary=x*.64+y*.49, n=random(seed,x,y);
    if(n>.70||boundary<2||boundary>10||gy+rows*tile>footerY-40*u)continue;
    const at=clamp((x+y)/(cols+rows-2)*.78+n*.17);
    if(progress>=at)a.push(rect(gx+x*tile,gy+y*tile,tile-2*u,tile-2*u,n>.34?t.accent:t.border,{opacity:n>.34?.9:.8}));
  }
  a.push(line(margin,footerY-21*u,w-margin,footerY-21*u,t.border,{strokeWidth:u}));
  const total=10,active=Math.floor(progress*total);for(let i=0;i<total;i++)a.push(rect(margin+i*16*u,footerY-5*u,10*u,5*u,i<active?t.accent:t.border));
  return a;
}
export function networkGeometry(frame:number,duration:number,fps:number,w:number,h:number,p:NetworkSettings={}):Shape[]{
  const t=resolveStyle(p),u=Math.min(w,h)/720,margin=48*u,portrait=h>w*1.1;
  const nodes=array(p.nodes,['Story','Script','Characters','Video','Audio','Editing']).slice(0,8),heading=word(p.heading,'The interconnected problems'),output=word(p.output,'One coherent scene');
  const cols=Math.min(nodes.length,portrait?2:nodes.length<=4?nodes.length:Math.ceil(nodes.length/2)),rows=Math.ceil(nodes.length/cols);
  const build=Math.max(1,Math.min(duration-1,Math.round(Math.max(0,num(p.buildSeconds,1.8))*fps)));
  const progress=duration<=1||p.buildSeconds===0?1:clamp(frame/build);
  const a:Shape[]=[rect(0,0,w,h,t.background),...(p.showGrid===true?grid(w,h,u,t.muted):[])];
  const top=margin+95*u, outputH=72*u,outputY=h-margin-outputH,outputW=Math.min(w-margin*2,360*u);
  const gap=18*u,cardW=(w-margin*2-gap*(cols-1))/cols;
  const cardH=Math.max(12*u,Math.min(82*u,(outputY-top-75*u-gap*(rows-1))/rows));
  const rowStep=cardH+Math.max(gap,Math.min(60*u,(outputY-top-75*u-cardH*rows)/Math.max(1,rows-1)));const hubY=outputY-29*u;
  a.push(text(margin,margin+10*u,'ASTRID / PROCESS',t.accentText,17*u,mono));
  a.push(text(margin,margin+58*u,heading,t.foreground,fit(heading,w-margin*2,48*u),editorial));
  const boxes=nodes.map((label,i)=>{const row=Math.floor(i/cols),col=i%cols,itemsInRow=Math.min(cols,nodes.length-row*cols);const x=(w-itemsInRow*cardW-(itemsInRow-1)*gap)/2+col*(cardW+gap),y=top+row*rowStep;return {label,x,y,i};});
  // Orthogonal connections use dedicated lanes between columns, keeping lines behind the cards.
  boxes.forEach(({x,y,i})=>{const p0=i/nodes.length*.54;const q=clamp((progress-p0-.14)/.24);if(!q)return;
    const cx=x+cardW/2,cy=y+cardH, lane=x+cardW+gap/2;
    const bend=cy+gap*.38;
    const d=`M ${cx} ${cy} V ${bend} H ${lane} V ${hubY} H ${w/2}`;
    const distance=Math.abs(bend-cy)+Math.abs(lane-cx)+Math.abs(hubY-bend)+Math.abs(w/2-lane);
    a.push({tag:'path',attrs:{d,fill:'none',stroke:t.border,strokeWidth:1.5*u,opacity:.7}});
    a.push({tag:'path',attrs:{d,fill:'none',stroke:t.accent,strokeWidth:2*u,strokeDasharray:distance,strokeDashoffset:distance*(1-q),opacity:.9}});
    if(q<1){const points=[[cx,cy],[cx,bend],[lane,bend],[lane,hubY],[w/2,hubY]];let remaining=distance*q;for(let j=1;j<points.length;j++){const [ax,ay]=points[j-1],[bx,by]=points[j];const len=Math.abs(bx-ax)+Math.abs(by-ay);if(remaining<=len||j===points.length-1){const f=len?clamp(remaining/len):1;const px=Math.round((ax+(bx-ax)*f)/(4*u))*4*u,py=Math.round((ay+(by-ay)*f)/(4*u))*4*u;const tile=8*u;a.push(rect(Math.max(0,Math.min(w-tile,px-tile/2)),Math.max(0,Math.min(h-tile,py-tile/2)),tile,tile,t.accent));break;}remaining-=len;}}

  });
  boxes.forEach(({x,y,i,label})=>{const q=ease((progress-i/nodes.length*.54)/.24);if(!q)return;
    const yy=y+(1-q)*9*u;
    a.push(rect(x,yy,cardW,cardH,t.panel,{stroke:t.border,strokeWidth:u,rx:9*u,opacity:q}));
    a.push(rect(x+12*u,yy+12*u,5*u,5*u,t.accent,{opacity:q}));
    const index=String(i+1).padStart(2,'0');a.push(text(x+18*u,yy+Math.min(24*u,cardH*.34),index,t.accentText,Math.min(14*u,cardH*.24),{...mono,opacity:q}));
    a.push(text(x+18*u,yy+cardH*.76,label,t.foreground,fit(label,cardW-34*u,25*u),{fontWeight:600,opacity:q}));
  });
  const q=ease((progress-.72)/.28);
  if(q>0){a.push(line(w/2,hubY,w/2,hubY+(outputY-hubY)*q,t.accent,{strokeWidth:3*u}));a.push(rect(w/2-outputW/2,outputY,outputW,outputH,t.accent,{opacity:q}));a.push(text(w/2,outputY+outputH*.60,output,t.onAccent,fit(output,outputW-36*u,25*u),{fontWeight:700,textAnchor:'middle',opacity:q}));}
  return a;
}
