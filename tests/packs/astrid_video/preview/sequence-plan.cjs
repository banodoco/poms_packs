const fs=require('node:fs');const {compileSequence,sequenceFrame,soundCues}=require('./shared/sequence/model.js');
const e=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),w=+process.argv[3],h=+process.argv[4],fps=+process.argv[5],frames=Math.round(e.duration*fps),c=compileSequence(e.params,w,h,fps,frames);
console.log(JSON.stringify({width:w,height:h,fps,frames,style:c.style,sounds:soundCues(c)}));for(let f=0;f<frames;f++)console.log(JSON.stringify(sequenceFrame(c,f)));
