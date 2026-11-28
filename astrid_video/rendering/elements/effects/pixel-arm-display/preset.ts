import type {Settings} from '../../../../shared/deck/motion';
/** Independent authoring surface: one common body presents a group of loads. */
export function armSettings<T extends Settings>(p:T):T & Settings {
  return {...p,presentation:'hold',organism:'tendrils',armLift:true,direction:p.direction??'bottom-to-top',
    edgeReveal:p.edgeReveal??false,restJitter:p.restJitter??.18,arrivalSeconds:p.arrivalSeconds??1.15,
    staggerSeconds:p.staggerSeconds??.18,organismIntensity:p.organismIntensity??.9,organismPixelSize:p.organismPixelSize??3};
}
