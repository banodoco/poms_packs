// Syntactic diagnostics only; actual Remotion/React dependency types are not installed here.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let ts;try{ts=require('typescript')}catch{ts=require(require('node:child_process').execSync('npm root -g',{encoding:'utf8'}).trim()+'/typescript')}
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(path.join(dir,f.name)):[path.join(dir,f.name)]);}
for(const f of walk(path.join(__dirname,'../astrid_video')).filter(f=>/\.tsx?$/.test(f))){const r=ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});assert.equal(r.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,f)}
console.log('PASS: TS/TSX syntactic transpilation; not dependency-aware compilation.');
