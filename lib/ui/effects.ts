export type Floater = {
  x: number; y: number;
  text: string; color: string;
  life: number; // 0..1
};

export type Ping = {
  x: number; y: number;
  color: string;  // ex: '#ff5252'
  life: number;   // 0..1
};

const floaters: Floater[] = [];
const pings: Ping[] = [];

export function addFloater(x: number, y: number, text: string, color = '#ffffff') {
  floaters.push({ x, y, text, color, life: 1 });
}

export function addPing(x: number, y: number, color = '#ff5252') {
  pings.push({ x, y, color, life: 1 });
}

export function updateFloaters(dt: number) {
  for (let i = floaters.length - 1; i >= 0; i--) {
    floaters[i].life -= dt; // ~1s
    if (floaters[i].life <= 0) floaters.splice(i, 1);
  }
}

export function updatePings(dt: number) {
  for (let i = pings.length - 1; i >= 0; i--) {
    pings[i].life -= dt * 0.5; // ~2s
    if (pings[i].life <= 0) pings.splice(i, 1);
  }
}

export function getFloaters(): ReadonlyArray<Floater> { return floaters; }
export function getPings(): ReadonlyArray<Ping> { return pings; }
