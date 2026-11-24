// Full body at the last settled demo card, before the real occlusion pass.
const fs=require('node:fs'),path=require('node:path');
const {Tissue,swarm}=require('./shared/organism.js');
const {livingPlan,livingSchedule}=require('./shared/deck/living-motion.js');
const {directionFor}=require('./shared/deck/motion.js');
const p=JSON.parse(fs.readFileSync(path.join(__dirname,'living-carry-params.json'),'utf8'));
const width=1280,height=720,fps=30,frames=228,frame=222,schedule=livingSchedule(p.cards,frames,fps,p),plan=livingPlan(frame,frames,fps,width,height,p.cards,p,schedule);
const l=plan.layers[0],s=schedule[l.index],d=directionFor(l.index,p),movement=d==='right-to-left'?{x:-1,y:0}:d==='top-to-bottom'?{x:0,y:1}:d==='bottom-to-top'?{x:0,y:-1}:{x:1,y:0};
const lag=.22*Math.exp(-Math.max(0,frame-s.start-Math.max(0,s.arrival-1))/fps/.18),t=new Tissue(plan.tile,width,height);
swarm(t,l.box,frame,fps,p.seed,l.index,0,p.organismIntensity,movement,1,p.organismSpread,p.organismFlow,lag);
process.stdout.write(JSON.stringify({width,height,cells:t.values(),visible:plan.back,palette:plan.palette,box:l.box}));
