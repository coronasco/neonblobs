export const clamp = (v: number, a: number, b: number) =>
    Math.max(a, Math.min(b, v));
  
  export const len = (x: number, y: number) => Math.hypot(x, y);
  
  export const norm = (x: number, y: number) => {
    const l = len(x, y) || 1;
    return [x / l, y / l] as const;
  };
  
  export const lerp = (a: number, b: number, t: number) =>
    a + (b - a) * clamp(t, 0, 1);
  
  // Helpers pentru masă/arie (previn creșterea necontrolată)
  export const rToArea = (r: number) => Math.PI * r * r;
  export const areaToR = (area: number) => Math.sqrt(area / Math.PI);
  