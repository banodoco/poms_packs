import type {Rect,LayoutContext,LayoutFn} from '../shared/composition/types';
const G=.035;
const sub=(a:Rect,x:number,y:number,w:number,h:number):Rect=>({x:a.x+x*a.width,y:a.y+y*a.height,width:w*a.width,height:h*a.height});
// Fit actual media aspect inside a slot. Canvas fractions have unequal physical axes.
export function fit(r:Rect,aspect:number,canvasAspect:number):Rect{
 const w=Math.min(r.width,r.height*aspect/canvasAspect),h=w*canvasAspect/aspect;
 return {x:r.x+(r.width-w)/2,y:r.y+(r.height-h)/2,width:w,height:h};
}
const grid:LayoutFn=({items,area,canvasAspect})=>{
 const n=items.length,cols=Math.min(n,Math.max(1,Math.ceil(Math.sqrt(n*area.width*canvasAspect/area.height/1.4)))),rows=Math.ceil(n/cols);
 const w=(1-(cols-1)*G)/cols,h=(1-(rows-1)*G)/rows;
 return items.map((v,i)=>{const row=Math.floor(i/cols),inRow=Math.min(cols,n-row*cols),offset=(1-(inRow*w+(inRow-1)*G))/2;return fit(sub(area,offset+(i%cols)*(w+G),row*(h+G),w,h),v.aspect,canvasAspect);});
};
const columns:LayoutFn=({items,area,canvasAspect})=>{
 const w=(1-(items.length-1)*G)/items.length;return items.map((v,i)=>fit(sub(area,i*(w+G),0,w,1),v.aspect,canvasAspect));
};
const hero:LayoutFn=ctx=>{if(ctx.items.length!==1)throw Error('hero needs exactly one item');return [fit(ctx.area,ctx.items[0].aspect,ctx.canvasAspect)];};
const centre:LayoutFn=ctx=>{
 const {items,area,canvasAspect}=ctx;if(items.length!==3)throw Error('centre-emphasis needs exactly three items');
 return items.map((v,i)=>fit(sub(area,[0,.255,.765][i],i===1?0:.28,[.235,.49,.235][i],i===1?1:.55),v.aspect,canvasAspect));
};
const comparison:LayoutFn=ctx=>{if(ctx.items.length!==2)throw Error('comparison needs exactly two items');return columns(ctx);};
const diagonal:LayoutFn=({items,area,canvasAspect})=>{if(items.length>4)throw Error('diagonal supports at most four items');const n=items.length,w=(1-(n-1)*G)/n;return items.map((v,i)=>fit(sub(area,i*(w+G),n===1?0:.45*i/(n-1),w,.55),v.aspect,canvasAspect));};
// Deliberately explicit, static registration; no dynamic imports or hidden discovery.
export const LAYOUTS:Readonly<Record<string,LayoutFn>>={hero,columns,grid,'centre-emphasis':centre,comparison,timeline:columns,diagonal};
