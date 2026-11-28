import type {Composition} from './types';
export const DEFAULT_COMPOSITION:Composition={
  "version": 1,
  "theme": "day",
  "items": {
    "intro": {
      "kind": "text",
      "text": "Creative direction.",
      "subtitle": "A living composition, ready to configure."
    }
  },
  "poses": [
    {
      "at": 0,
      "layout": "hero",
      "items": [
        "intro"
      ]
    }
  ],
  "behaviour": "carry",
  "transitionDuration": 0.8,
  "transitionSpeed": 1,
  "stagger": 0.1,
  "restJitter": 0.12,
  "restSpeed": 0.55,
  "organismFlow": 1,
  "organismIntensity": 0.86,
  "organismSpread": 0.62,
  "organismPixelSize": 3,
  "edgeReveal": false,
  "randomness": 0.7,
  "pixelSize": 16,
  "crawlStyle": "ragged",
  "seed": 17,
  "direction": "bottom-to-top",
  "compositionScale": 1
};

/** An unconfigured placement has a real, asset-free default. Do not silently repair invalid authored scenes. */
export function compositionParams(raw:unknown):Composition {
 if(raw==null)return DEFAULT_COMPOSITION;
 if(typeof raw!=='object'||Array.isArray(raw))throw Error('Composition parameters must be an object');
 const p=raw as Partial<Composition>;
 if(p.items===undefined&&p.poses===undefined&&p.version===undefined)return {...DEFAULT_COMPOSITION,...p};
 return p as Composition;
}
