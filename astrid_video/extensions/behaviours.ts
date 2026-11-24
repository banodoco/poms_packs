import {swarm,tendril} from '../shared/organism';
import type {Behaviour} from '../shared/composition/types';
export const BEHAVIOURS:Readonly<Record<string,Behaviour>>={
 carry:{draw:c=>swarm(c.tissue,c.box,c.frame,c.fps,c.seed,c.idSeed,c.effort,c.strength,c.movement,c.growth,c.spread,c.flow,c.effort)},
 present:{root:true,draw:c=>{
  tendril(c.tissue,c.root,{x:c.box.x+c.box.width*.5,y:c.box.y+c.box.height*.83},c.frame,c.fps,c.seed,c.idSeed,c.growth,c.strength,c.flow,c.spread);
  swarm(c.tissue,c.box,c.frame,c.fps,c.seed,c.idSeed,c.effort,c.strength*.85,c.movement,c.growth,c.spread*.60,c.flow,0);
 }},
 none:{draw:()=>{}}
};
