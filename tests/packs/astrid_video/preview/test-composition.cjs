const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path');
const {compile,pixels}=require('./shared/composition/compile.js');const {framePlan,inspect}=require('./shared/composition/engine.js');
const {shuffleRecipe,presentationRecipe}=require('./extensions/recipes.js');
const read=name=>{const x=JSON.parse(fs.readFileSync(path.join(__dirname,'examples',name+'.json')));const keys=Object.keys(require('./shared/composition/compile.js').MOTION).concat('behaviour');x.composition.defaults={};for(const k of keys)if(k in x.composition){x.composition.defaults[k]=x.composition[k];delete x.composition[k];}return x;};
const run=(ex,w=960,h=540,fps=24)=>compile(ex.composition,fps,w,h,Math.round(ex.duration*fps));
const eq=(a,b)=>assert.deepEqual(a,b);
const copy=x=>JSON.parse(JSON.stringify(x));
for(const name of ['journey','exchange','extension']){
 const ex=read(name),c=run(ex); const resolved=inspect(c);assert.equal(c.warnings.length,0,`${name}: ${c.warnings}`);
 for(const pose of c.poses){const f=framePlan(c,pose.at);eq(f.layers.map(x=>x.id),pose.items.map(x=>x.id));for(const x of pose.items){const l=f.layers.find(v=>v.id===x.id);eq(l.box,pixels(x.rect,c.width,c.height));assert.equal(l.reveal.progress,1);assert.equal(l.key,x.key);}}
 for(const p of c.poses){for(const f of [p.start,Math.floor((p.start+p.at)/2),p.at]){const a=framePlan(c,f);eq(a,framePlan(c,f));for(const l of a.layers){assert(l.box.width>0&&l.box.height>0);assert(l.sourceFrame>=0);if(l.content.kind==='video')assert(l.sourceFrame<Math.ceil((l.content.sourceEnd-(l.content.sourceStart??0))*c.fps));}for(const cell of [...a.back,...a.overlay,...a.layers.flatMap(l=>l.front)]){assert.equal(cell.width,cell.height);assert(cell.x>=0&&cell.y>=0&&cell.x+cell.width<=c.width&&cell.y+cell.height<=c.height);}}}
 assert(resolved.poses.length>=4);
}
const main=run(read('journey'));eq(main.poses.map(p=>p.items.length),[1,3,3,5,1]);const portal=main.poses[2].items.find(x=>x.id==='portal');for(const p of main.poses.slice(3)){const a=p.items.find(x=>x.id==='portal');eq([a.seed,a.key,a.since],[portal.seed,portal.key,portal.since]);}
const swap=run(read('exchange')),p=swap.poses[1],f=framePlan(swap,Math.floor((p.start+p.at)/2));for(const id of ['room','story','mink']){const layers=f.layers.filter(l=>l.id===id);assert.equal(layers.length,2);assert.equal(layers[0].reveal.progress,1);assert(layers[1].reveal.progress>0&&layers[1].reveal.progress<1);assert.equal(swap.poses[0].items.find(x=>x.id===id).seed,p.items.find(x=>x.id===id).seed);}
const base=read('journey');let x=copy(base);x.composition.poses[1].transition.speed=2;const fast=run(x);assert.equal(fast.poses[1].at,main.poses[1].at);assert(fast.poses[1].start>main.poses[1].start);
x=copy(base);x.composition.poses[1].scale=.7;const scaled=run(x);assert(scaled.poses[1].items[0].rect.width<main.poses[1].items[0].rect.width);
x=copy(base);x.composition.defaults.restJitter=0;const still=run(x);for(let i=main.poses[0].at;i<main.poses[1].start;i++){eq(framePlan(still,i).layers[0].box,pixels(still.poses[0].items[0].rect,still.width,still.height));}
x=copy(base);x.composition.defaults.restSpeed=0;const stopped=run(x);eq(framePlan(stopped,main.poses[0].at+10).layers[0].box,pixels(stopped.poses[0].items[0].rect,stopped.width,stopped.height));
x=copy(base);x.composition.defaults.organismFlow=0;const frozen=run(x);x.composition.defaults.restJitter=0;const frozenStill=run(x);const fi=frozen.poses[0].at;eq(framePlan(frozenStill,fi).back,framePlan(frozenStill,fi+10).back);
x=copy(base);x.composition.defaults.organismIntensity=0;x.composition.accents=[];const clean=run(x);assert.equal(framePlan(clean,clean.poses[1].at).back.length,0);
const reject=(mutate,match)=>{const x=copy(base);mutate(x.composition);assert.throws(()=>run(x),match);};
reject(x=>x.poses[1].items=['room','room','mink'],/Duplicate/);reject(x=>x.poses[1].items=['room','unknown','mink'],/Unknown item/);reject(x=>x.poses[1].at=1.1,/overlaps/);reject(x=>x.poses[1].layout='bogus',/Unknown layout/);reject(x=>x.poses[1].items=[{id:'room',rect:{x:.8,y:0,width:.5,height:.4}},'mink','story'],/rectangle/);reject(x=>x.items.portal.sourceEnd=0,/sourceEnd/);reject(x=>x.poses[1].motion={organismFlow:2},/scene-wide/);
const simple={a:{kind:'image',asset:'room'},b:{kind:'image',asset:'mink'},c:{kind:'image',asset:'storyboard'}};
for(const [w,h] of [[1280,720],[720,1280],[720,720],[1920,1080]]){
 for(const n of [1,3]){const comp=presentationRecipe(simple,Object.keys(simple).slice(0,n));const c=compile(comp,30,w,h,90);assert.equal(framePlan(c,c.poses[0].at).layers.length,n);}
 const comp=shuffleRecipe(simple,['a','b','c']);assert.equal(compile(comp,30,w,h,120).poses.length,3);
}
const blank=compile({version:1,items:simple,poses:[{at:0,layout:'hero',items:['a']},{at:1,layout:'grid',items:[]}]},24,960,540,48);assert.equal(framePlan(blank,24).layers.length,0);
console.log('PASS: three authored compositions; 1→3→3→5→1; exact destinations, retained IDs/seeds/source clocks, same-carrier masks, timing/scale controls, zero jitter and flow, square tissue, strict input errors, recipe and multi-aspect layout checks.');
