import type {ReactElement} from 'react';
import {TimelineView} from '../../../../shared/timeline/view';
export default function Effect(props:{clip:{hold?:number};params:unknown;fps:number}):ReactElement{return <TimelineView {...props} mode="assemble"/>;}
