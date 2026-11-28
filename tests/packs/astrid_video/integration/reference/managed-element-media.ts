/** Host reference adapter, not installed product code. Only feed a verified,
 * scope-correct resolved registry and the exact selected element schema. */
export type Params=Record<string,unknown>;
export type Registry=Record<string,unknown>;
const record=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const own=(x:object,k:string)=>Object.prototype.hasOwnProperty.call(x,k);
const forbidden=new Set(['__proto__','prototype','constructor']);
export function projectMedia(params:Params,schema:Params,registry:Registry,sourceField='src'):Params {
 if(own(params,'__astridMedia'))throw Error('Host-derived __astridMedia cannot be authored');
 const result={...params};
 if(!own(params,'mediaBindings'))return result;
 if(!record(schema.properties)||!own(schema.properties,'mediaBindings'))throw Error('Selected element does not declare mediaBindings');
 const bindings=params.mediaBindings;
 if(!record(bindings)||Object.keys(bindings).length>128)throw Error('mediaBindings must be a bounded object');
 const resolved:Record<string,unknown>=Object.create(null);
 for(const [slot,key] of Object.entries(bindings)){
  if(!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,95}$/.test(slot)||forbidden.has(slot))throw Error('Invalid media slot');
  if(typeof key!=='string'||!key.trim()||key.length>256||forbidden.has(key))throw Error('Invalid registry key');
  const entry=own(registry,key)?registry[key]:undefined;
  if(!record(entry))throw Error(`Unresolved media slot ${slot}`);
  const src=entry[sourceField],kind=typeof entry.type==='string'?entry.type.split('/')[0]:'';
  if(typeof src!=='string'||!src.trim()||!['image','video'].includes(kind))throw Error(`Unresolved or unsupported visual media slot ${slot}`);
  if(kind==='video'){
   const duration=entry.duration;
   if(typeof duration!=='number'||!Number.isFinite(duration)||duration<=0)throw Error(`Missing verified video duration for ${slot}`);
   resolved[slot]={src,kind,duration};
  }else resolved[slot]={src,kind};
 }
 result.__astridMedia=resolved;
 return result;
}
