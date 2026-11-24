const fs=require('node:fs');const {compileTimeline,timelineFrame}=require('./shared/timeline/model.js');
const ex=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),width=Number(process.argv[3]),height=Number(process.argv[4]),fps=Number(process.argv[5]);
const c=compileTimeline(ex.params,ex.mode,width,height,fps,Math.round(ex.duration*fps));
console.log(JSON.stringify(c));for(let frame=0;frame<c.frames;frame++)console.log(JSON.stringify(timelineFrame(c,frame)));
