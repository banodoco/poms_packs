const fs=require('node:fs');const {compile}=require('./shared/composition/compile.js');const {framePlan,inspect}=require('./shared/composition/engine.js');
const ex=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const width=Number(process.argv[3]??960),height=Number(process.argv[4]??540),fps=Number(process.argv[5]??24);
const c=compile(ex.composition,fps,width,height,Math.round(ex.duration*fps));console.log(JSON.stringify(inspect(c)));if(process.argv[6]!=='inspect')for(let f=0;f<c.frames;f++)console.log(JSON.stringify(framePlan(c,f)));
