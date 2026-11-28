import {createElement,type ReactElement} from 'react';
import type {Shape} from './visuals';

export function Vector({width,height,shapes}:{width:number;height:number;shapes:Shape[]}):ReactElement {
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position:'absolute',inset:0,display:'block'}}>
    {shapes.map((s,i)=>createElement(s.tag,{...s.attrs,key:i},s.text))}
  </svg>;
}
