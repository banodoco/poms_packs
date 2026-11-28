const assert=require('node:assert/strict');const {spans,getState,crawl,revealFrames,directionFor}=require('./shared/deck/motion.js');
for(const n of [1,2,3,6,17,65]){
 const cards=Array.from({length:n},(_,i)=>({asset:`a${i}`,kind:i%2?'video':'image',weight:i%7+1}));
 for(const frames of [n,n+1,n*10,n*30+3]){
  const ss=spans(cards,frames);assert.equal(ss.length,n);assert.equal(ss[0].start,0);assert.equal(ss.at(-1).start+ss.at(-1).length,frames);
  for(let i=0;i<n;i++){assert(ss[i].length>=1);if(i)assert.equal(ss[i-1].start+ss[i-1].length,ss[i].start);assert(revealFrames(ss[i],30)<=ss[i].length);}
 }
}
assert.throws(()=>spans([],10));assert.throws(()=>spans([{asset:'a',kind:'image'},{asset:'b',kind:'image'}],1));
assert.equal(directionFor(1,{directions:['top-to-bottom']}),'top-to-bottom');
assert.equal(directionFor(2,{directions:['top-to-bottom'],direction:'right-to-left'}),'right-to-left');
for(const [w,h] of [[1280,720],[1920,1080],[1080,1920],[720,720]]){
 const span={start:30,length:30,index:1},r=revealFrames(span,30);
 for(const direction of ['left-to-right','right-to-left','top-to-bottom','bottom-to-top','alternate']){
  const settings={direction,randomness:.78};const first=crawl(0,span,30,w,h,settings);assert.equal(first.progress,0);assert.equal(first.revealed.length,0);
  let previous=new Set();const tile=first.tile,cols=Math.ceil(w/tile),rows=Math.ceil(h/tile);
  for(let f=0;f<r;f++){
   const a=crawl(f,span,30,w,h,settings);assert.deepEqual(a,crawl(f,span,30,w,h,settings));
   const cells=new Set();for(const t of a.revealed){assert(t.width>0&&t.height>0&&t.x+t.width<=w&&t.y+t.height<=h);for(let y=t.y;y<t.y+t.height;y+=tile)for(let x=t.x;x<t.x+t.width;x+=tile)cells.add(`${x}:${y}`);}
   for(const cell of previous)assert(cells.has(cell),'pixel must never unreveal');
   for(const t of a.sparks){assert(cells.has(`${t.x}:${t.y}`));assert(t.width<=tile&&t.height<=tile);}
   if(f===Math.floor(r/2)){
    assert(cells.size>0&&cells.size<cols*rows);
    const left=[...cells].filter(c=>Number(c.split(':')[0])<w*.25).length,right=[...cells].filter(c=>Number(c.split(':')[0])>w*.75).length;
    const top=[...cells].filter(c=>Number(c.split(':')[1])<h*.25).length,bottom=[...cells].filter(c=>Number(c.split(':')[1])>h*.75).length;
    const resolved=direction==='alternate'?'right-to-left':direction;
    if(resolved==='right-to-left')assert(right>left);
    if(resolved==='left-to-right')assert(left>right);
    if(resolved==='top-to-bottom')assert(top>bottom);
    if(resolved==='bottom-to-top')assert(bottom>top);
   }
   previous=cells;
  }
  assert.deepEqual(crawl(r-1,span,30,w,h,settings).revealed,[{x:0,y:0,width:w,height:h}]);
 }
 assert.equal(crawl(0,{...span,index:0},30,w,h).progress,1);assert.equal(crawl(0,{...span,length:1},30,w,h).progress,1);assert.equal(crawl(0,span,30,w,h,{transitionSeconds:0}).progress,1);
 assert.deepEqual(getState(12,30,30,w,h,1),getState(12,30,30,w,h,1));assert(getState(15,30,30,w,h,1).scale<1);assert(getState(15,30,30,w,h,1).scale>.6);
}
console.log('PASS: 1–65 cards, weighted scheduling, short holds, 4 aspect ratios, monotonic tile reveal, 5 directions, per-transition direction override, seeded geometry, complete endpoints.');
// Test the new settings against actual geometry (not only parameter parsing).
const {styleFor}=require('./shared/deck/motion.js');
const sample={start:30,length:40,index:1};
assert.equal(revealFrames(sample,30,{transitionSeconds:.42,transitionDurations:[.2]}),6);
assert.equal(revealFrames(sample,30,{transitionDurations:[0]}),0);
assert.equal(revealFrames({...sample,index:2},30,{transitionSeconds:.3,transitionDurations:[.2]}),9);
assert.equal(styleFor(1,{crawlStyle:'clean',crawlStyles:['noisy']}),'noisy');
assert.equal(styleFor(2,{crawlStyle:'clean',crawlStyles:['noisy']}),'clean');
const mid=6, w=1280,h=720;
const masks=['clean','ragged','noisy','chunky'].map(crawlStyle=>crawl(mid,sample,30,w,h,{crawlStyle,randomness:.82}));
assert(new Set(masks.map(m=>JSON.stringify(m.revealed))).size===4);
assert(masks[3].tile>masks[1].tile && masks[2].tile<masks[1].tile);
for(const crawlStyle of ['clean','ragged','noisy','chunky'])for(const direction of ['left-to-right','right-to-left','top-to-bottom','bottom-to-top']){
 const linear=crawl(mid,sample,30,w,h,{crawlStyle,direction,randomness:0});
 const change=crawl(mid,sample,30,w,h,{crawlStyle,direction,randomness:1.5});
 const isHorizontal=direction==='left-to-right'||direction==='right-to-left';
 assert.equal(new Set(linear.revealed.map(r=>isHorizontal?`${r.x}:${r.width}`:`${r.y}:${r.height}`)).size,1,'zero randomness must be a straight edge');
 assert.notDeepEqual(linear.revealed,change.revealed);
 const settings={crawlStyle,direction,randomness:1.5,transitionDurations:[.6]};
 const r=revealFrames(sample,30,settings);let prev=new Set();
 for(let f=0;f<r;f++){
  const a=crawl(f,sample,30,w,h,settings),cells=new Set();
  for(const t of a.revealed){assert(t.x>=0&&t.y>=0&&t.x+t.width<=w&&t.y+t.height<=h);for(let y=t.y;y<t.y+t.height;y+=a.tile)for(let x=t.x;x<t.x+t.width;x+=a.tile)cells.add(`${x}:${y}`);}
  for(const c of prev)assert(cells.has(c),'monotonic reveal');prev=cells;
 }
}
assert.notDeepEqual(crawl(mid,sample,30,w,h,{seed:1}).revealed,crawl(mid,sample,30,w,h,{seed:2}).revealed);
const {chapterGeometry,networkGeometry}=require('./shared/visuals.js');
for(const [w,h] of [[1280,720],[1080,1920],[720,720],[1920,1080]])for(const length of [1,2,30,120]){
 for(const [geometry,p] of [[chapterGeometry,{titleLines:['The experiment','with Astrid'],subtitle:'Creative direction and feedback.'}],[networkGeometry,{nodes:['Story','Script','Characters','Video','Audio','Editing','Direction','References']}]]){
  const last=geometry(length-1,length,30,w,h,p);assert.deepEqual(last,geometry(length-1,length,30,w,h,p));assert(last.length>10);
  for(const s of last)for(const v of Object.values(s.attrs))if(typeof v==='number')assert(Number.isFinite(v));
  for(const s of last.filter(s=>s.tag==='rect'))assert(s.attrs.x>=0&&s.attrs.y>=0&&s.attrs.x+s.attrs.width<=w+.00001&&s.attrs.y+s.attrs.height<=h+.00001,'shape bounds');
 }
}
console.log('PASS: per-transition timing/style precedence, four distinct textures, straight edge at zero, seed variation, monotonic masks at maximum randomness, deterministic responsive companion geometry.');

const {resolveStyle,THEMES,FONTS}=require('./shared/style.js');
assert.equal(resolveStyle().background,THEMES.day.background);assert.equal(resolveStyle({theme:'night'}).background,THEMES.night.background);assert.equal(resolveStyle({theme:'night',background:'#123456'}).background,'#123456');
for(const theme of ['day','night']){
 const p={theme};assert.equal(getState(10,30,30,1280,720,1,p).background,THEMES[theme].background);
 for(const geometry of [chapterGeometry,networkGeometry]){const a=geometry(60,61,30,1280,720,p);assert.equal(a[0].attrs.fill,THEMES[theme].background);assert(a.some(s=>s.tag==='text'&&s.attrs.fontFamily===FONTS.editorial));}
}
console.log('PASS: shared day/night tokens, explicit override and editorial type across all three effects.');
