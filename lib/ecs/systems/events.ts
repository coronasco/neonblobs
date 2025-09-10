import { MAP, SUPER_EVENT } from '@/lib/config';
import { setColor, setPos, setRad, setVel } from '../components';
import type { World } from '../types';
import { spawn } from '../world';
import { addPing } from '@/lib/ui/effects';

// state intern pentru event
let timer = SUPER_EVENT.INTERVAL * 0.5; // primul vine mai repede
let activeId: number | null = null;
let activeT = 0;

export function superEventSystem(w: World, dt: number) {
  // dacă e activ, scade timpul și termină dacă e cazul
  if (activeId !== null) {
    activeT -= dt;
    if (activeT <= 0) {
      // dacă entitatea încă există, o "ștergem" natural (o va mânca cineva sau devine inofensivă)
      activeId = null;
      timer = SUPER_EVENT.INTERVAL; // reprogramăm următorul
    }
    return;
  }

  // altfel, contorizăm până la următorul event
  timer -= dt;
  if (timer <= 0) {
    // spawn super orb la o poziție random
    const e = spawn(w);
    const x = Math.random() * MAP.WIDTH;
    const y = Math.random() * MAP.HEIGHT;
    setPos(w, e, x, y);
    setVel(w, e, 0, 0);
    setRad(w, e, SUPER_EVENT.RADIUS);
    // culoare magenta-ish
    setColor(w, e, 1.0, 0.25, 0.9);
    w.particle.set(e, { value: SUPER_EVENT.VALUE, kind: 'super' });

    activeId = e;
    activeT = SUPER_EVENT.DURATION;

    // ping global (vizibil pe minimap)
    addPing(x, y, '#ff66ff');

    // programăm următorul după ce expiră (interval complet)
    timer = SUPER_EVENT.INTERVAL + SUPER_EVENT.DURATION;
  }
}

export function getSuperState() {
  return {
    active: activeId !== null,
    timeLeft: activeId !== null ? Math.max(0, activeT) : Math.max(0, timer),
    isCountdown: activeId === null, // true = până la următorul
  };
}
