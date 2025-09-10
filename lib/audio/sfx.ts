// Tiny SFX manager (folosește <audio> simple). Poți înlocui ulterior cu WebAudio.
let enabled = true;

export function setSfxEnabled(on: boolean) {
  enabled = on;
}

function play(url: string, volume = 0.7, rate = 1) {
  if (!enabled) return;
  try {
    const a = new Audio(url);
    a.volume = volume;
    
    if (a.playbackRate) a.playbackRate = rate;
    a.play().catch(() => {});
  } catch {}
}

export const SFX = {
  dash: () => play('/sfx/dash.mp3', 0.6, 1.1),
  pickup: () => play('/sfx/pickup.mp3', 0.5, 1.0),
  absorb: () => play('/sfx/absorb.mp3', 0.65, 0.95),
};
