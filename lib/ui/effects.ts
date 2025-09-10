export type Floater = {
    x: number; y: number;            // coordonate world
    text: string; color: string;     // ex: "+10", "#ffd700"
    life: number;                    // 0..1 (1 = proaspăt, 0 = gata)
  };
  
  const floaters: Floater[] = [];
  
  /** Adaugă un “+points” floater în world coords */
  export function addFloater(x: number, y: number, text: string, color = '#ffffff') {
    floaters.push({ x, y, text, color, life: 1 });
  }
  
  /** Avansează animația; șterge cele terminate */
  export function updateFloaters(dt: number) {
    for (let i = floaters.length - 1; i >= 0; i--) {
      floaters[i].life -= dt; // ~1s
      if (floaters[i].life <= 0) floaters.splice(i, 1);
    }
  }
  
  /** Citește lista curentă (read-only) */
  export function getFloaters(): ReadonlyArray<Floater> {
    return floaters;
  }
  