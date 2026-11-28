const fs=require('node:fs');const path=require('node:path');
const {spans,getState,crawl}=require('./shared/deck/motion.js');
const params=JSON.parse(fs.readFileSync(path.join(__dirname,'demo-params.json'),'utf8'));
const fps=30,width=1280,height=720,frames=192,schedule=spans(params.cards,frames),states=[];
for(const span of schedule)for(let frame=0;frame<span.length;frame++){
 const state=getState(frame,span.length,fps,width,height,span.index,params),reveal=crawl(frame,span,fps,width,height,params);
 states.push({global:span.start+frame,frame,index:span.index,state,reveal});
}
process.stdout.write(JSON.stringify({fps,width,height,frames,schedule,states,params}));
