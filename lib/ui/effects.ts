// lib/ui/effects.ts
type Floater = { x: number; y: number; text: string; color: string; life: number };
type Ping = { x: number; y: number; color: string; life: number };
type Hit = { x: number; y: number; life: number };

const floaters: Floater[] = [];
const pings: Ping[] = [];
const hits: Hit[] = [];

// screen shake — intensitate care decurge în timp
let shake = 0; // 0..1

/* -------- Floaters -------- */
export function addFloater(x: number, y: number, text: string, color = '#fff'): void {
  floaters.push({ x, y, text, color, life: 1 });
}
export function getFloaters(): Floater[] {
  return floaters;
}
export function updateFloaters(dt: number): void {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.life -= dt * 1.4;
    if (f.life <= 0) floaters.splice(i, 1);
  }
}

/* -------- Pings -------- */
export function addPing(x: number, y: number, color = '#00e5ff'): void {
  pings.push({ x, y, color, life: 1 });
}
export function getPings(): Ping[] {
  return pings;
}
export function updatePings(dt: number): void {
  for (let i = pings.length - 1; i >= 0; i--) {
    const p = pings[i];
    p.life -= dt * 1.2;
    if (p.life <= 0) pings.splice(i, 1);
  }
}

/* -------- Hit markers -------- */
export function addHit(x: number, y: number): void {
  hits.push({ x, y, life: 0.35 }); // scurt și vizibil
}
export function getHits(): Hit[] {
  return hits;
}
export function updateHits(dt: number): void {
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i];
    h.life -= dt * 3.2;
    if (h.life <= 0) hits.splice(i, 1);
  }
}

/* -------- Screen shake -------- */
export function addShake(amount: number): void {
  // clamp & cumulează ușor (nu peste 1)
  shake = Math.min(1, shake + amount);
}
export function getShake(): number {
  return shake;
}
export function updateShake(dt: number): void {
  // decay relativ rapid
  shake = Math.max(0, shake - dt * 2);
}
