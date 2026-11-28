/** Shared editorial and pixel tokens. Day palette follows Astrid App public pages. */
export type ThemeName = 'day' | 'night';
export type ColorSettings = {theme?:ThemeName;background?:string;foreground?:string;accent?:string;frameColor?:string};
export const THEMES = {
  day: {background:'#F7F4ED',foreground:'#25241F',panel:'#FFFEFA',muted:'#615E55',border:'#D5D0C5',accent:'#ED6B23',accentText:'#A94714',onAccent:'#25241F'},
  night: {background:'#0D0E17',foreground:'#F3EEE4',panel:'#1D202B',muted:'#BDB7AD',border:'#4A4849',accent:'#ED6B23',accentText:'#F28A4E',onAccent:'#25241F'},
} as const;
export const FONTS = {editorial:'Georgia, Gelasio, "Times New Roman", serif',body:'Inter, Arial, sans-serif',system:'"Departure Mono", ui-monospace, monospace'} as const;
const color = (v:unknown,d:string)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:d;
export function resolveStyle(p:ColorSettings={}){
  const base=THEMES[p.theme==='night'?'night':'day'];
  return {...base,background:color(p.background,base.background),foreground:color(p.foreground,base.foreground),accent:color(p.accent,base.accent),frameColor:color(p.frameColor,base.border)};
}
