import { HOTSPOTS } from '@/lib/config';
import { setColor, setPos, setRad, setVel } from '../components';
import type { World } from '../types';
import { spawn } from '../world';

// ținem timere interne pentru fiecare hotspot
const timers = HOTSPOTS.map(() => 0);

export function hotspotSystem(w: World, dt: number) {
  HOTSPOTS.forEach((h, i) => {
    timers[i] += dt * h.spawnRate;
    while (timers[i] >= 1) {
      timers[i] -= 1;

      // creează o particulă „bogată”
      const e = spawn(w);
      // offset random în cerc
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.random() * (h.r - 10);
      const x = h.x + Math.cos(ang) * rad;
      const y = h.y + Math.sin(ang) * rad;

      setPos(w, e, x, y);
      setVel(w, e, 0, 0);
      setRad(w, e, 6 + Math.random() * 4); // mai mari decât particulele normale
      // culori mai „prețioase” (gold/cyan)
      setColor(w, e, 1.0, 0.85, 0.2 + Math.random() * 0.2);
      w.particle.set(e, { value: 5 + Math.floor(Math.random() * 6) }); // 5..10 puncte
    }
  });
}
