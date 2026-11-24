const fs=require('node:fs'),path=require('node:path');
const {chapterGeometry,networkGeometry}=require('./shared/visuals.js');
const params=JSON.parse(fs.readFileSync(path.join(__dirname,'companion-params.json'),'utf8'));
const fps=30,w=1280,h=720;
for(const [id,geometry,duration] of [['chapter-card',chapterGeometry,66],['pixel-network',networkGeometry,111]]) {
 for(let frame=0;frame<duration;frame++) process.stdout.write(JSON.stringify({id,frame,width:w,height:h,shapes:geometry(frame,duration,fps,w,h,params[id])})+'\n');
}
