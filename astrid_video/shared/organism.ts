/** A small living pixel vocabulary. Every cell is on one canvas grid; all motion
 * is a pure function of frame, seed, contact geometry and the current task. */
export type Bounds={x:number;y:number;width:number;height:number};
export type Tone='body'|'shadow'|'light';
export type Cell={x:number;y:number;width:number;height:number;tone:Tone};
export type Point={x:number;y:number};
export const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
export const hash=(a:number,b:number,c:number)=>{
  let n=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^Math.imul(c|0,1442695041);
  n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
};
export const ease=(p:number)=>{p=clamp01(p);return p*p*(3-2*p);};
/** A tile map merges overlapping organic forms without accidental opacity stacking. */
export class Tissue {
  private cells=new Map<string,Cell>();
  constructor(readonly tile:number,readonly width:number,readonly height:number){}
  add(x:number,y:number,tone:Tone='body'){
    x=Math.round(x/this.tile)*this.tile||0;y=Math.round(y/this.tile)*this.tile||0;
    // Preserve genuine squares. Whole cells outside the safe viewport are omitted.
    if(x<0||y<0||x+this.tile>this.width||y+this.tile>this.height)return;
    this.cells.set(`${x}:${y}`,{x,y,width:this.tile,height:this.tile,tone});
  }
  values(){return [...this.cells.values()];}
}
/** A worker is a tiny, segmented pixel body with a direction and unequal gait.
 * It need not look literally like an ant: the collective behaviour matters. */
function swimmer(t:Tissue,x:number,y:number,dx:number,dy:number,phase:number,detail:number){
  const s=t.tile, horizontal=Math.abs(dx)>=Math.abs(dy);
  const vx=horizontal?(dx<0?-1:1):0,vy=horizontal?0:(dy<0?-1:1);
  t.add(x,y,'body');
  t.add(x-vx*s,y-vy*s,'shadow');
  if(detail>.62)t.add(x+vx*s,y+vy*s,'light');
  if(detail>.84){const side=Math.floor(phase)%2?1:-1;t.add(x-vy*s*side,y+vx*s*side,'body');}
}
/** A full-footprint colony. Thousands of stable material-space workers occupy
 * the area beneath the load, not a line along its bottom. Seeded flow advects
 * them in coherent eddies, and an irregular low-density apron spills beyond
 * ALL edges. The cargo is rendered on top; it hides the interior naturally.
 * The reveal gates recruitment, not just the bottom contact edge. */
export function swarm(t:Tissue,b:Bounds,frame:number,fps:number,seed:number,index:number,effort:number,strength:number,movement:Point,entry=1,spread=.62,flow=1,lag=effort){
  if(strength<=0)return;
  const s=t.tile,clock=frame/fps*Math.max(0,flow),phase=hash(seed,index,79)*Math.PI*2;
  spread=clamp01(spread);entry=clamp01(entry);effort=clamp01(effort);lag=clamp01(lag);
  const mx=movement.x,my=movement.y;
  const lagDistance=s*(2+spread*7)*lag;
  const pad=s*(12+spread*23),extentX=b.width+2*pad,extentY=b.height+2*pad;
  // Bound cost for very large or extremely fine grids. Density scales with
  // area rather than with the perimeter; normal 720p cards have thousands.
  const pitch=Math.max(s*2.55,Math.sqrt(extentX*extentY/12000));
  const cols=Math.ceil(extentX/pitch),rows=Math.ceil(extentY/pitch);
  const horizontal=Math.abs(mx)>=Math.abs(my),reverse=horizontal?mx<0:my<0;
  const travel=horizontal?b.width:b.height;
  const clockRate=3.8;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const id=j*cols+i;
    const a=hash(seed+11,index,id),c=hash(seed+23,index,id),r=hash(seed+59,index,id);
    // Stable anchors with bounded trajectories: no per-frame re-seeding or
    // teleporting individuals. Local neighbours share a current.
    const x0=-pad+(i+.5+(a-.5)*.94)*pitch,y0=-pad+(j+.5+(c-.5)*.94)*pitch;
    const ox=Math.max(-x0,x0-b.width,0),oy=Math.max(-y0,y0-b.height,0);
    const outside=Math.hypot(ox,oy);
    const u=x0/Math.max(b.width,1),v=y0/Math.max(b.height,1);
    // Lobes pool in irregular patches rather than tracing a uniform halo.
    const lobe=.24+.98*Math.pow(Math.max(0,Math.sin(u*15+v*12+phase)),2)+.22*Math.sin(u*37-v*31+phase*.7)+.11*Math.sin(u*61+v*53);
    const rim=s*(2+spread*17)*Math.max(.16,lobe);
    if(outside>rim)continue;
    // An organic fringe with irregular clear gaps; the interior is dense.
    const density=outside===0?.93:Math.pow(Math.max(0,1-outside/Math.max(rim,s)),.63)*.90;
    const axis=horizontal?x0:y0;
    const logical=(reverse?travel-axis:axis)/Math.max(1,travel);
    const recruitment=entry>=1?1:clamp01((entry+.13+(a-.5)*.12-logical)/.16);
    if(r>density*strength*recruitment)continue;
    const wave=u*12+v*8+phase,eddy=u*23-v*18+phase*.8;
    const t1=clock*clockRate+wave,t2=clock*2.3+eddy;
    const amp=s*(1.55+spread*1.4+effort*1.1);
    // A flow with phase-shifted axes and a small wake opposite the cargo's
    // travel. Continuous trajectories are quantised only by Tissue.add.
    const px=x0+amp*(.8*Math.sin(t1)+.38*Math.sin(t2+c*2))-mx*lagDistance;
    const py=y0+amp*(.75*Math.cos(t1+.7)+.38*Math.cos(t2+a*2))-my*lagDistance;
    const dx=.8*Math.cos(t1)+.38*Math.cos(t2+c*2)+mx*effort*.55;
    const dy=-.75*Math.sin(t1+.7)-.38*Math.sin(t2+a*2)+my*effort*.55;
    swimmer(t,b.x+px,b.y+py,dx,dy,clock*9+a*17,c);
  }
  // A few perimeter scouts circulate independently of the dense main body.
  // The path is closed and continuous; their offsets and rhythms differ.
  const perimeter=2*(b.width+b.height),count=Math.floor(Math.min(96,perimeter/(s*18))*strength*spread);
  for(let i=0;i<count;i++){
    const a=hash(seed+173,index,i),c=hash(seed+379,index,i);
    const base=a*perimeter,position=((base+clock*s*12*(i%3===0?-1:1))%perimeter+perimeter)%perimeter;
    const d=s*(5+spread*7+c*4+1.2*Math.sin(clock*2.4+i));
    let x:number,y:number,dx:number,dy:number;
    if(position<b.width){x=position;y=-d;dx=1;dy=0;}
    else if(position<b.width+b.height){x=b.width+d;y=position-b.width;dx=0;dy=1;}
    else if(position<2*b.width+b.height){x=2*b.width+b.height-position;y=b.height+d;dx=-1;dy=0;}
    else{x=-d;y=perimeter-position;dx=0;dy=-1;}
    // Scouts dive beneath the load at corners and re-emerge on the next side.
    const corner=s*5,along=dx?x:y,side=dx?b.width:b.height;
    if(along<corner||along>side-corner)continue;
    const axis=horizontal?x:y,logical=(reverse?travel-axis:axis)/Math.max(1,travel);
    if(entry<1&&logical>entry+.12)continue;
    swimmer(t,b.x+x-mx*lagDistance,b.y+y-my*lagDistance,dx,dy,clock*7+i,.8);
  }
}
function cubic(a:Point,b:Point,c:Point,d:Point,u:number):Point{
  const v=1-u;return {x:v*v*v*a.x+3*v*v*u*b.x+3*v*u*u*c.x+u*u*u*d.x,y:v*v*v*a.y+3*v*v*u*b.y+3*v*u*u*c.y+u*u*u*d.y};
}
/** A transient current of the SAME swimmers as the colony. The spline is
 * an invisible flow guide, never an outline, skeleton or shaded surface.
 * Stable cohorts circulate through an open, breathing volume. The stream
 * flares into a diffuse cloud behind its cargo, with no palm or fingers. */
export function tendril(t:Tissue,root:Point,target:Point,frame:number,fps:number,seed:number,index:number,growth:number,strength:number,flow=1,spread=.62){
  growth=clamp01(growth);if(growth<=0||strength<=0)return;
  const s=t.tile,clock=frame/fps*Math.max(0,flow),delta=target.x-root.x;
  const side=Math.abs(delta)<s*2?(index%2?1:-1):Math.sign(delta);
  const phase=hash(seed+31,index,7)*Math.PI*2;
  const flex=Math.sin(clock*1.6+phase)*s*7;
  const reach=Math.min(Math.abs(target.y-root.y)*.24,s*33);
  const a={x:root.x+delta*.19,y:root.y+s*6},
    b={x:root.x+delta*.66+side*reach*.9+flex,y:root.y-(root.y-target.y)*.12},
    c={x:target.x-delta*.12-side*reach*.85-flex,y:target.y+(root.y-target.y)*.32},d=target;
  const distance=Math.max(s*8,Math.hypot(delta,target.y-root.y));
  const count=Math.min(2200,Math.max(100,Math.floor(distance/s*6.5*strength*(.7+spread*.6))));
  const frac=(x:number)=>x-Math.floor(x);
  for(let i=0;i<count;i++){
    const r=hash(seed+183,index,i),q=hash(seed+293,index,i),v=hash(seed+517,index,i);
    // Most workers ascend; a smaller countercurrent cycles back. At a fully
    // grown stream the wrap is between the offscreen source and hidden cargo.
    const speed=(.18+.22*q)*(i%5===0?-1:1);
    const u=frac(r+clock*speed);
    if(u>growth)continue;
    const p=cubic(a,b,c,d,u),near=cubic(a,b,c,d,Math.min(1,u+.004)),prev=cubic(a,b,c,d,Math.max(0,u-.004));
    const vx=near.x-prev.x,vy=near.y-prev.y,len=Math.max(.001,Math.hypot(vx,vy));
    const nx=-vy/len,ny=vx/len;
    // Irregular lobes and open gaps, no rigid edge. The stream constricts
    // and blooms into several little currents near the contact region.
    const pulse=.78+.26*Math.sin(u*19-clock*3+phase)+.17*Math.sin(u*37+clock*2.2);
    const flare=Math.pow(u,5)*9+Math.pow(1-u,3)*8;
    const radius=s*(7+spread*8+flare)*Math.max(.32,pulse);
    const drift=(v-.5)*2*radius+s*2.7*Math.sin(clock*3.1+u*15+q*6.28);
    const lobe=.65+.35*Math.sin(u*28-clock*2.4+phase)*Math.sin(q*6.28);
    if(hash(seed+631,index,i)>lobe)continue;
    const x=p.x+nx*drift+s*1.2*Math.sin(clock*3.4+i*.71),y=p.y+ny*drift+s*1.1*Math.cos(clock*2.8+i*.53);
    const sign=speed<0?-1:1;
    swimmer(t,x,y,vx*sign,vy*sign,clock*9+i*.31,q);
  }
}
/** The root is a porous, changing gathering of swimmers, not an anatomical
 * body. Its anchor may be outside the frame. No solid fill or hard silhouette. */
export function nest(t:Tissue,root:Point,frame:number,fps:number,strength:number,seed=17,flow=1){
  if(strength<=0)return;
  const s=t.tile,clock=frame/fps*Math.max(0,flow);
  const n=Math.floor(310*strength);
  for(let i=0;i<n;i++){
    const a=hash(seed+118,2,i),b=hash(seed+219,3,i),c=hash(seed+317,4,i);
    const radius=Math.sqrt(a),theta=b*Math.PI*2;
    const x=root.x+radius*s*42*Math.cos(theta)+s*4*Math.sin(clock*3+theta*3),
      y=root.y+s*3+radius*s*12*Math.sin(theta)+s*3*Math.cos(clock*2.7+theta*2);
    swimmer(t,x,y,Math.cos(theta+clock),Math.sin(theta+clock),clock*8+i,c);
  }
}
/** Local front workers straddle the existing reveal boundary. This gives the
 * impression that the same organism is exposing the surface it is carrying. */
export function frontier(t:Tissue,b:Bounds,revealed:Bounds[],direction:string,frame:number,fps:number,seed:number,index:number,strength:number){
  if(strength<=0||!revealed.length)return;
  const horizontal=direction==='left-to-right'||direction==='right-to-left',reverse=direction==='right-to-left'||direction==='bottom-to-top';
  const leads=new Map<number,number>();
  for(const r of revealed){const axis=horizontal?r.y:r.x,lead=horizontal?(reverse?r.x:r.x+r.width):(reverse?r.y:r.y+r.height);
    const old=leads.get(axis);if(old===undefined||(reverse?lead<old:lead>old))leads.set(axis,lead);
  }
  const s=t.tile,clock=frame/fps;
  let k=0;
  for(const [axis,lead] of leads){
    const i=k++;if(i%2!==0||hash(seed,index,i)>strength*.78)continue;
    if(lead<=0||lead>=(horizontal?b.width:b.height))continue;
    const dir=reverse?-1:1,osc=Math.floor(clock*9+i)%2;
    const x=b.x+(horizontal?lead:axis),y=b.y+(horizontal?axis:lead);
    t.add(x,y,'body');t.add(x+(horizontal?dir*s:0),y+(horizontal?0:dir*s),'light');
    t.add(x+(horizontal?-dir*s:osc*s),y+(horizontal?osc*s:-dir*s),'shadow');
  }
}
