import type {Composition,Item,Motion} from '../shared/composition/types';
/** Convenience authors, not alternate renderers. Each returns the canonical contract. */
export function shuffleRecipe(items:Record<string,Item>,order:string[],holdSeconds=1.2,defaults:Motion={}):Composition{
 return {version:1,items,defaults:{behaviour:'carry',edgeReveal:false,...defaults},poses:order.map((id,i)=>({at:i*holdSeconds,layout:'hero',items:[id]}))};
}
export function presentationRecipe(items:Record<string,Item>,order:string[],at=1.1,defaults:Motion={}):Composition{
 return {version:1,items,defaults:{behaviour:'present',direction:'bottom-to-top',edgeReveal:false,...defaults},poses:[{at,layout:order.length===3?'centre-emphasis':'grid',items:order}]};
}
