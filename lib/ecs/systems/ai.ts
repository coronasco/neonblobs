import type { World } from '../types';


export function botSystem(w: World, dt: number) {
// very simple steering: drift towards nearest particle; flee bigger players
const players = [...w.player.keys()].filter((e) => w.player.get(e)!.isBot);
const humanPlayers = [...w.player.keys()].filter((e) => !w.player.get(e)!.isBot);
const particles = [...w.particle.keys()];


for (const e of players) {
const pos = w.pos.get(e)!; const vel = w.vel.get(e)!; const rad = w.rad.get(e)!.r;
let tx = pos.x, ty = pos.y; let bestD = Infinity;


// flee largest nearby human
for (const h of humanPlayers) {
const hp = w.pos.get(h)!; const hr = w.rad.get(h)!.r;
const dx = hp.x - pos.x, dy = hp.y - pos.y; const d2 = dx * dx + dy * dy;
if (hr > rad * 1.2 && d2 < 200 * 200) { // flee vector
tx = pos.x - dx; ty = pos.y - dy; bestD = 0; break;
}
}


if (bestD === Infinity && particles.length) {
// seek nearest particle
for (const p of particles) {
const pp = w.pos.get(p)!; const dx = pp.x - pos.x, dy = pp.y - pos.y; const d2 = dx * dx + dy * dy;
if (d2 < bestD) { bestD = d2; tx = pp.x; ty = pp.y; }
}
}


const ax = Math.sign(tx - pos.x) * 80; // acceleration
const ay = Math.sign(ty - pos.y) * 80;
vel.x += ax * dt; vel.y += ay * dt;
// simple damping
vel.x *= 0.98; vel.y *= 0.98;
}
}