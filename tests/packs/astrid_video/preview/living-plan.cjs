const fs=require('node:fs'),path=require('node:path');
const {livingPlan,livingSchedule}=require('./shared/deck/living-motion.js');
const mode=process.argv[2]??'carry';const params=JSON.parse(fs.readFileSync(path.join(__dirname,`living-${mode}-params.json`),'utf8'));
const fps=30,width=1280,height=720,frames=mode==='carry'||mode==='slide'?228:144;
if(mode==='arms')Object.assign(params,require('./rendering/elements/effects/pixel-arm-display/preset.js').armSettings(params));
const schedule=livingSchedule(params.cards,frames,fps,params);
process.stdout.write(JSON.stringify({fps,width,height,frames,schedule,params}));process.stdout.write('\n');
for(let frame=0;frame<frames;frame++)process.stdout.write(JSON.stringify(livingPlan(frame,frames,fps,width,height,params.cards,params,schedule))+'\n');
