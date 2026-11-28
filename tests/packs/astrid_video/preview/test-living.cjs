const assert=require('node:assert/strict');const {livingSchedule,livingPlan,targetBox,presentationFor}=require('./shared/deck/living-motion.js');
const cards=[{asset:'a',kind:'image',layout:{x:.08,y:.14,width:.52,height:.52}},{asset:'b',kind:'video',layout:{x:.50,y:.18,width:.42,height:.42}},{asset:'c',kind:'image',layout:{x:.13,y:.12,width:.72,height:.72}}];
assert.equal(presentationFor(cards,{}),'carry');assert.equal(presentationFor([{asset:'a',kind:'image'}],{}),'classic');assert.equal(presentationFor(cards,{presentation:'classic'}),'classic');
assert.throws(()=>targetBox({...cards[0],layout:{x:.9,y:0,width:.2,height:.5}},0,1,1280,720,{presentation:'carry'}),/normalized canvas/);
for(const [w,h] of [[1280,720],[720,1280],[721,721],[1920,1080]])for(const presentation of ['carry','hold']){
 const settings={presentation,arrivalSeconds:.7,transitionSeconds:.55,staggerSeconds:.25,organismIntensity:.9,randomness:.9,seed:81};const total=120,fps=30,schedule=livingSchedule(cards,total,fps,settings);
 const last=livingPlan(total-1,total,fps,w,h,cards,settings,schedule);assert.equal(last.layers.length,presentation==='hold'?cards.length:1);
 for(const l of last.layers){assert.deepEqual(l.box,l.target);assert.deepEqual(l.target,targetBox(cards[l.index],l.index,cards.length,w,h,settings));assert.equal(l.reveal.progress,1);assert.deepEqual(l.reveal.revealed,[{x:0,y:0,width:l.target.width,height:l.target.height}]);}
 const frame=52,a=livingPlan(frame,total,fps,w,h,cards,settings,schedule);assert.deepEqual(a,livingPlan(frame,total,fps,w,h,cards,settings,schedule));
 assert.notDeepEqual(last.back,livingPlan(total-5,total,fps,w,h,cards,settings,schedule).back,'organism still alive during hold');
 for(const f of [0,1,15,37,40,52,79,83,119]){
  const p=livingPlan(f,total,fps,w,h,cards,settings,schedule);
  for(const cell of [...p.back,...p.layers.flatMap(l=>l.front)]){assert.equal(cell.width,p.tile);assert.equal(cell.height,p.tile);assert.equal(cell.x%p.tile,0);assert.equal(cell.y%p.tile,0);assert(cell.x>=0&&cell.y>=0&&cell.x+cell.width<=w&&cell.y+cell.height<=h);}
  for(const l of p.layers){assert(l.sourceFrame>=0&&l.sourceFrame<schedule[l.index].length);assert(l.box.width===l.target.width&&l.box.height===l.target.height);for(const r of l.reveal.revealed)assert(r.x>=0&&r.y>=0&&r.x+r.width<=l.box.width&&r.y+r.height<=l.box.height);}
 }
 const none=livingPlan(50,total,fps,w,h,cards,{...settings,organismIntensity:0});assert.equal(none.back.length,0);assert(none.layers.every(l=>l.front.length===0));
 const hard=livingPlan(0,1,fps,w,h,[cards[0]],{...settings,arrivalSeconds:0,transitionSeconds:0});assert.deepEqual(hard.layers[0].box,hard.layers[0].target);assert.equal(hard.layers[0].reveal.progress,1);
}
for(const direction of ['left-to-right','right-to-left','top-to-bottom','bottom-to-top']){
 const settings={presentation:'carry',direction,arrivalSeconds:1,transitionSeconds:.5,organism:'swarm'};const p=livingPlan(0,60,30,1280,720,[cards[0]],settings),l=p.layers[0];
 if(direction==='left-to-right')assert(l.box.x<l.target.x);if(direction==='right-to-left')assert(l.box.x>l.target.x);if(direction==='top-to-bottom')assert(l.box.y<l.target.y);if(direction==='bottom-to-top')assert(l.box.y>l.target.y);
}
const hold=livingSchedule(Array.from({length:8},(_,i)=>({asset:String(i),kind:'image'})),15,30,{presentation:'hold',arrivalSeconds:1,staggerSeconds:1});assert(hold.every(x=>x.start+x.length===15));
const mid=livingPlan(51,120,30,1280,720,cards,{presentation:'carry',transitionSeconds:.6});const old=mid.layers.find(l=>l.departing);assert(old&&old.sourceFrame===39,'outgoing source freezes at allocated final frame');
console.log('PASS: living layouts, exact end states, all directions, variable count, deterministic seek, square clipped organism cells, zero intensity, one-frame holds, held source time and short stagger.');

// A colony occupies the cargo footprint; its visible apron is not a substitute
// for that body. Test the underlying tissue independently of occlusion.
const {Tissue,swarm}=require('./shared/organism.js');
const b={x:210,y:110,width:860,height:500};
function body(frame,flow=1.2){const t=new Tissue(3,1280,720);swarm(t,b,frame,30,47,0,0,.94,{x:1,y:0},1,.82,flow,0);return t.values();}
const full=body(60);assert(full.length>10000,'dense two-dimensional body');
const inside=full.filter(c=>c.x>=b.x&&c.y>=b.y&&c.x<b.x+b.width&&c.y<b.y+b.height);
assert(inside.length>full.length*.70,'majority hidden by cargo');
for(const dx of [0,1])for(const dy of [0,1])assert(inside.filter(c=>c.x>=b.x+dx*b.width/2&&c.x<b.x+(dx+1)*b.width/2&&c.y>=b.y+dy*b.height/2&&c.y<b.y+(dy+1)*b.height/2).length>1000,'population in all interior quadrants');
for(const side of [c=>c.x<b.x,c=>c.x>=b.x+b.width,c=>c.y<b.y,c=>c.y>=b.y+b.height])assert(full.filter(side).length>50,'workers emerge on every side');
assert.deepEqual(full,body(60));assert.notDeepEqual(full,body(64),'internal flow moves');assert.deepEqual(body(60,0),body(64,0),'zero internal flow stops swimming at rest');
const single=[{asset:'a',kind:'image',layout:{x:b.x/1280,y:b.y/720,width:b.width/1280,height:b.height/720}}];
const composed=livingPlan(80,90,30,1280,720,single,{presentation:'carry',organism:'swarm',organismPixelSize:3,organismSpread:.82,organismIntensity:.94,seed:47});
assert(composed.back.length<full.length*.3,'occlusion omits hidden body');
assert(composed.back.every(c=>!(c.x>=b.x&&c.y>=b.y&&c.x+c.width<=b.x+b.width&&c.y+c.height<=b.y+b.height)),'fully hidden cells are not drawn');
console.log('PASS: complete dense body, populated interior quadrants, apron on all four sides, deterministic internal swimming and pause, hidden-cell culling.');

const {armSettings}=require('./rendering/elements/effects/pixel-arm-display/preset.js');
const slide={presentation:'carry',edgeReveal:false,restJitter:.8,organism:'swarm',direction:'left-to-right',arrivalSeconds:.8,transitionSeconds:.8};
for(const direction of ['left-to-right','right-to-left','top-to-bottom','bottom-to-top']){
 const settings={...slide,direction},schedule=livingSchedule(cards,120,30,settings);
 const first=livingPlan(0,120,30,1280,720,cards,settings,schedule).layers[0];
 if(direction==='left-to-right')assert(first.box.x+first.box.width<0);
 if(direction==='right-to-left')assert(first.box.x>1280);
 if(direction==='top-to-bottom')assert(first.box.y+first.box.height<0);
 if(direction==='bottom-to-top')assert(first.box.y>720);
 for(const f of [0,12,24,30,40,44,55,79,90,119]){
  const p=livingPlan(f,120,30,1280,720,cards,settings,schedule);
  assert(p.layers.every(l=>l.reveal.progress===1&&l.reveal.sparks.length===0&&l.front.length===0));
 }
 const old=livingPlan(40,120,30,1280,720,cards,settings,schedule).layers.find(l=>l.departing);assert(old);assert.deepEqual(old.box,old.target);
 const nearEnd=livingPlan(40+schedule[0].tail-2,120,30,1280,720,cards,settings,schedule).layers.find(l=>l.departing);assert(nearEnd);if(direction==='left-to-right')assert(nearEnd.box.x>=1280);if(direction==='right-to-left')assert(nearEnd.box.x+nearEnd.box.width<=0);if(direction==='top-to-bottom')assert(nearEnd.box.y>=720);if(direction==='bottom-to-top')assert(nearEnd.box.y+nearEnd.box.height<=0);
}
const arms=armSettings({restJitter:.8,edgeReveal:false,arrivalSeconds:1.1,staggerSeconds:.2});
for(const n of [1,3,5,8]){
 const group=Array.from({length:n},(_,i)=>({asset:'a'+i,kind:'image',grip:.35+i*.03}));
 for(const [w,h] of [[1280,720],[720,1280]]){
  const schedule=livingSchedule(group,150,30,arms),first=livingPlan(0,150,30,w,h,group,arms,schedule),last=livingPlan(149,150,30,w,h,group,arms,schedule);
  assert(first.layers[0].box.y>=h);assert.equal(last.layers.length,n);assert(last.layers.every(l=>JSON.stringify(l.box)===JSON.stringify(l.target)&&l.reveal.progress===1));
  const a=livingPlan(100,150,30,w,h,group,arms,schedule),b=livingPlan(106,150,30,w,h,group,arms,schedule);assert(a.layers.some((l,i)=>JSON.stringify(l.box)!==JSON.stringify(b.layers[i].box)),'rest jitter moves cards');
  assert.deepEqual(a,livingPlan(100,150,30,w,h,group,arms,schedule));
  const locked=livingPlan(100,150,30,w,h,group,{...arms,restJitter:0});assert(locked.layers.every(l=>JSON.stringify(l.box)===JSON.stringify(l.target)));assert(a.layers.every(l=>l.box.x>=0&&l.box.y>=0&&l.box.x+l.box.width<=w&&l.box.y+l.box.height<=h));
 }
}
console.log('PASS: mask-free transport from/to all four edges, exact departure continuity, shared arm preset with 1/3/5/8 loads, bounded deterministic rest jitter, zero-jitter lock and exact final placement.');
