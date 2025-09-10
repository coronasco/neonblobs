import { MAP } from '@/lib/config';
import type { World } from '../types';

export function movementSystem(w: World, dt: number) {
  w.vel.forEach((v, e) => {
    const p = w.pos.get(e); if (!p) return;
    p.x += v.x * dt; p.y += v.y * dt;

    // Clamp la margini + bounce mic
    if (!MAP.WRAP) {
      if (p.x < 0) { p.x = 0; v.x *= -0.4; }
      if (p.x > MAP.WIDTH) { p.x = MAP.WIDTH; v.x *= -0.4; }
      if (p.y < 0) { p.y = 0; v.y *= -0.4; }
      if (p.y > MAP.HEIGHT) { p.y = MAP.HEIGHT; v.y *= -0.4; }
    }
  });
}
