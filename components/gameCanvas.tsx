'use client';
import React, { useEffect, useRef, useState } from 'react';
import { GAME, HOTSPOTS, MAP } from '@/lib/config';
import { createWorld } from '@/lib/ecs/world';
import { spawnParticles, spawnPlayer, findSafeSpawn } from '@/lib/ecs/systems/spawn';
import { movementSystem } from '@/lib/ecs/systems/movement';
import { collisionSystem } from '@/lib/ecs/systems/collisions';
import { cooldownSystem, tryDash } from '@/lib/ecs/systems/abilities';
import { botSystem } from '@/lib/ecs/systems/ai';
import { hotspotSystem } from '@/lib/ecs/systems/hotspots';
import { useGameStore } from '@/lib/state/useGameStore';
import Joystick from '@/components/Joystick';
import DashButton from '@/components/DashButton';
import CountryPicker from '@/components/CountryPicker';

const SPEED = 140;

export default function GameCanvas(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const setUI = useGameStore((s) => s.setUI);
  const country = useGameStore((s) => s.country);

  const inputRef = useRef({ up: false, down: false, left: false, right: false, dash: false });
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = GAME.WIDTH * dpr;
    canvas.height = GAME.HEIGHT * dpr;
    canvas.style.width = `${GAME.WIDTH}px`;
    canvas.style.height = `${GAME.HEIGHT}px`;

    const ctx = canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const w = createWorld();
    spawnParticles(w);

    // Player local cu țară (dacă e selectată)
    let me = spawnPlayer(w, 'me', false, undefined, country);

    // Bots cu țări random (doar ca demo)
    const botCountries = ['RO','IT','US','DE','FR','ES','GB','PL'];
    const randC = () => botCountries[Math.floor(Math.random() * botCountries.length)];
    const rBetween = (a: number, b: number) => a + Math.random() * (b - a);
    for (let i = 0; i < 10; i++) spawnPlayer(w, `bot-${i}`, true, rBetween(12, 22), randC());

    let last = performance.now();
    let raf = 0;
    let accumulator = 0;

    // tastatură
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') inputRef.current.up = true;
      if (k === 's' || k === 'arrowdown') inputRef.current.down = true;
      if (k === 'a' || k === 'arrowleft') inputRef.current.left = true;
      if (k === 'd' || k === 'arrowright') inputRef.current.right = true;
      if (k === ' ') inputRef.current.dash = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') inputRef.current.up = false;
      if (k === 's' || k === 'arrowdown') inputRef.current.down = false;
      if (k === 'a' || k === 'arrowleft') inputRef.current.left = false;
      if (k === 'd' || k === 'arrowright') inputRef.current.right = false;
      if (k === ' ') inputRef.current.dash = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const respawnMe = () => {
      // respawn într-un loc „safe” pe hartă, cu țară setată
      const spot = findSafeSpawn(w);
      me = spawnPlayer(w, 'me', false, undefined, country);
      // poziționează explicit la spot-ul găsit (spawnPlayer a ales deja unul; îl suprascriem)
      const p = w.pos.get(me);
      if (p) { p.x = spot.x; p.y = spot.y; }
      const pl = w.player.get(me); if (pl) pl.invuln = 1.0;
    };

    function tick(dt: number) {
      const meComp = w.player.get(me);
      if (!meComp || !meComp.alive) { respawnMe(); return; }

      // Hotspots: generează resurse bogate în timp
      hotspotSystem(w, dt);

      const vel = w.vel.get(me)!;
      const rad = w.rad.get(me)!.r;
      const { up, down, left, right, dash } = inputRef.current;

      const accel = SPEED / Math.max(1, rad / 16);
      const dirX = (right ? 1 : 0) - (left ? 1 : 0);
      const dirY = (down ? 1 : 0) - (up ? 1 : 0);

      vel.x += dirX * accel * dt;
      vel.y += dirY * accel * dt;
      vel.x *= 0.98; vel.y *= 0.98;

      if (dash) {
        const mag = Math.hypot(dirX, dirY);
        if (mag > 0) { tryDash(w, me, { x: dirX / mag, y: dirY / mag }); inputRef.current.dash = false; }
      }

      botSystem(w, dt);
      movementSystem(w, dt);
      collisionSystem(w);
      cooldownSystem(w, dt);

      const meNow = w.player.get(me);
      if (meNow) setUI({ score: meNow.score });
    }

    function render() {
      ctx.clearRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

      // fundal: indicăm margini de hartă
      ctx.fillStyle = '#0a0f1f';
      ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
      // grid simplu ecran (nu world-map scrolling în MVP)

      // desenăm hotspots (glow + cerc)
      HOTSPOTS.forEach((h) => {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(h.x - (MAP.WIDTH - GAME.WIDTH) / 2, h.y - (MAP.HEIGHT - GAME.HEIGHT) / 2, 0,
                                              h.x - (MAP.WIDTH - GAME.WIDTH) / 2, h.y - (MAP.HEIGHT - GAME.HEIGHT) / 2, h.r);
        grad.addColorStop(0, 'rgba(255,215,0,0.25)');
        grad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = grad;
        ctx.arc(h.x - (MAP.WIDTH - GAME.WIDTH) / 2, h.y - (MAP.HEIGHT - GAME.HEIGHT) / 2, h.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,215,0,0.25)';
        ctx.lineWidth = 2;
        ctx.arc(h.x - (MAP.WIDTH - GAME.WIDTH) / 2, h.y - (MAP.HEIGHT - GAME.HEIGHT) / 2, h.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // particles
      w.particle.forEach((_p, e) => {
        const pos = w.pos.get(e)!; const r = w.rad.get(e)!.r; const c = w.col.get(e)!;
        // În MVP nu avem cameră / scrolling: randăm ca și cum harta = ecran (poți adăuga cameră ulterior)
        ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.floor(c.a * 255)}, ${Math.floor(c.b * 255)}, ${Math.floor(c.g * 255)}, 0.9)`;
        ctx.shadowBlur = 12; ctx.shadowColor = ctx.fillStyle as string; ctx.fill(); ctx.shadowBlur = 0;
      });

      // players
      w.player.forEach((pl, e) => {
        if (!w.pos.has(e) || !w.rad.has(e) || !pl.alive) return;
        const pos = w.pos.get(e)!; const r = w.rad.get(e)!.r; const c = w.col.get(e)!;

        ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        const col = `rgba(${Math.floor(c.a * 255)}, ${Math.floor(c.b * 255)}, ${Math.floor(c.g * 255)}, 1)`;
        ctx.strokeStyle = col as string; ctx.lineWidth = 6; ctx.shadowBlur = 18; ctx.shadowColor = col as string; ctx.stroke(); ctx.shadowBlur = 0;

        if (pl.id === 'me') {
          const t = performance.now() * 0.004;
          const pulse = 0.65 + Math.sin(t) * 0.2;
          ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 10, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0,229,255,${pulse})`; ctx.lineWidth = 4; ctx.shadowBlur = 25; ctx.shadowColor = 'rgba(0,229,255,1)'; ctx.stroke(); ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(0,229,255,0.10)'; ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2); ctx.fill();
          ctx.font = '700 14px ui-sans-serif, system-ui, -apple-system'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillText('YOU', pos.x, pos.y - r - 12);
        }

        if (pl.invuln && pl.invuln > 0) {
          ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 6, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
        }
      });
    }

    const step = 1 / GAME.TPS;
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now; accumulator += dt;
      while (accumulator >= step) { tick(step); accumulator -= step; }
      render();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  // re-initializează când userul își schimbă țara (la prima selecție)
  }, [setUI, country]);

  const handleJoy = (v: { x: number; y: number }) => {
    const dead = 0.15;
    inputRef.current.right = v.x > dead;
    inputRef.current.left = v.x < -dead;
    inputRef.current.down = v.y > dead;
    inputRef.current.up = v.y < -dead;
  };

  return (
    <div className="relative mx-auto w-[1280px] select-none">
      <CountryPicker />
      <canvas ref={canvasRef} className="rounded-2xl shadow-2xl ring-1 ring-white/10" />

      {isTouch && (
        <>
          <div className="pointer-events-auto absolute bottom-6 left-6 touch-none sm:left-8">
            <Joystick radius={56} onChange={handleJoy} />
          </div>
          <div className="pointer-events-auto absolute bottom-6 right-6 sm:right-8">
            <DashButton onPress={() => { inputRef.current.dash = true; }} />
          </div>
        </>
      )}
    </div>
  );
}
