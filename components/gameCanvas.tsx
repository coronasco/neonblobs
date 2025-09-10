'use client';
import React, { useEffect, useRef, useState } from 'react';
import { GAME, HOTSPOTS, HOTSPOT, MAP } from '@/lib/config';
import { createWorld } from '@/lib/ecs/world';
import { spawnParticles, spawnPlayer, findSafeSpawn } from '@/lib/ecs/systems/spawn';
import { movementSystem } from '@/lib/ecs/systems/movement';
import { collisionSystem } from '@/lib/ecs/systems/collisions';
import { cooldownSystem, tryDash } from '@/lib/ecs/systems/abilities';
import { botSystem } from '@/lib/ecs/systems/ai';
import { hotspotSystem } from '@/lib/ecs/systems/hotspots';
import { useGameStore } from '@/lib/state/useGameStore';
import { useSettings } from '@/lib/state/useSettings';
import { SFX } from '@/lib/audio/sfx';
import { getFloaters, updateFloaters } from '@/lib/ui/effects';

const SPEED = 140;

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export default function GameCanvas(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const setUI = useGameStore((s) => s.setUI);
  const country = useGameStore((s) => s.country);

  const inputRef = useRef({ up: false, down: false, left: false, right: false, dash: false });
  const [isTouch, setIsTouch] = useState(false);

  // camera
  const camRef = useRef({ x: 0, y: 0 });
  const camTargetRef = useRef({ x: 0, y: 0 });

  // mic efect vizual la Dash
  const dashFlashRef = useRef(0); // secunde rămase de glow

  const soundOn = useSettings((s) => s.sound);
  const hapticsOn = useSettings((s) => s.haptics);


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

    let me = spawnPlayer(w, 'me', false, undefined, country);

    // Bots
    const botCountries = ['RO','IT','US','DE','FR','ES','GB','PL'];
    const rBetween = (a: number, b: number) => a + Math.random() * (b - a);
    const randC = () => botCountries[Math.floor(Math.random() * botCountries.length)];
    for (let i = 0; i < 16; i++) spawnPlayer(w, `bot-${i}`, true, rBetween(12, 22), randC());

    // init camera
    const initP = w.pos.get(me)!;
    camRef.current.x = clamp(initP.x - GAME.WIDTH / 2, 0, Math.max(0, MAP.WIDTH - GAME.WIDTH));
    camRef.current.y = clamp(initP.y - GAME.HEIGHT / 2, 0, Math.max(0, MAP.HEIGHT - GAME.HEIGHT));
    camTargetRef.current = { ...camRef.current };

    let last = performance.now();
    let raf = 0;
    let accumulator = 0;

    // keyboard
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
      const spot = findSafeSpawn(w);
      me = spawnPlayer(w, 'me', false, undefined, country);
      const p = w.pos.get(me);
      if (p) { p.x = spot.x; p.y = spot.y; }
      const pl = w.player.get(me); if (pl) pl.invuln = 1.0;
      camRef.current.x = clamp(p!.x - GAME.WIDTH / 2, 0, MAP.WIDTH - GAME.WIDTH);
      camRef.current.y = clamp(p!.y - GAME.HEIGHT / 2, 0, MAP.HEIGHT - GAME.HEIGHT);
      camTargetRef.current = { ...camRef.current };
    };

    function updateCamera() {
      const p = w.pos.get(me); if (!p) return;
      camTargetRef.current.x = clamp(p.x - GAME.WIDTH / 2, 0, Math.max(0, MAP.WIDTH - GAME.WIDTH));
      camTargetRef.current.y = clamp(p.y - GAME.HEIGHT / 2, 0, Math.max(0, MAP.HEIGHT - GAME.HEIGHT));
      const SMOOTH = 0.12;
      camRef.current.x = lerp(camRef.current.x, camTargetRef.current.x, SMOOTH);
      camRef.current.y = lerp(camRef.current.y, camTargetRef.current.y, SMOOTH);
    }

    function tick(dt: number) {
      // 1) guard inițial
      const meComp = w.player.get(me);
      if (!meComp || !meComp.alive) { respawnMe(); return; }
    
      // 2) input → mișcare
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
        if (mag > 0) {
          tryDash(w, me, { x: dirX / mag, y: dirY / mag });
          inputRef.current.dash = false;
          dashFlashRef.current = 0.25; // efect vizual
          if (soundOn) SFX.dash();
          if (hapticsOn && 'vibrate' in navigator) navigator.vibrate?.(30);
        }
      }
    
      // 3) rulăm sistemele (aici putem fi eliminați)
      hotspotSystem(w, dt);
      botSystem(w, dt);
      movementSystem(w, dt);
      collisionSystem(w);
      cooldownSystem(w, dt);
      updateFloaters(dt);
    
      // 4) guard **după** sisteme — dacă am dispărut, respawn și ieșire
      const meNow = w.player.get(me);
      if (!meNow || !meNow.alive) { respawnMe(); return; }
    
      // 5) HUD safe
      const cooldown = Math.max(0, meNow.cooldown || 0);
      setUI({ score: meNow.score, dashCooldown: Math.min(1, cooldown) });
    
      // 6) cameră
      updateCamera();
    }
    

    function render() {
      const camX = camRef.current.x, camY = camRef.current.y;

      // clear + fundal
      ctx.clearRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
      ctx.fillStyle = '#0a0f1f';
      ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

      // grilă world-aligned
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      const gridStep = 40;
      const startX = Math.floor(camX / gridStep) * gridStep;
      const startY = Math.floor(camY / gridStep) * gridStep;
      for (let x = startX; x <= camX + GAME.WIDTH; x += gridStep) {
        const sx = Math.floor(x - camX) + 0.5; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, GAME.HEIGHT); ctx.stroke();
      }
      for (let y = startY; y <= camY + GAME.HEIGHT; y += gridStep) {
        const sy = Math.floor(y - camY) + 0.5; ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(GAME.WIDTH, sy); ctx.stroke();
      }

      // contur hartă
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-camX + 0.5, -camY + 0.5, MAP.WIDTH, MAP.HEIGHT);

      // hotspots (vizibile cu culling)
      HOTSPOTS.forEach((h) => {
        const hx = h.x - camX, hy = h.y - camY;
        if (hx + h.r < 0 || hy + h.r < 0 || hx - h.r > GAME.WIDTH || hy - h.r > GAME.HEIGHT) return;
        const grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, h.r);
        grad.addColorStop(0, 'rgba(255,215,0,0.22)');
        grad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(hx, hy, h.r, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.strokeStyle = 'rgba(255,215,0,0.22)'; ctx.lineWidth = 2;
        ctx.arc(hx, hy, h.r, 0, Math.PI * 2); ctx.stroke();
      });

      // particles
      // (culling)
      
      
      (w.particle as Map<number, unknown>).forEach((_p, e: number) => {
        const pos = w.pos.get(e)!; const r = w.rad.get(e)!.r; const c = w.col.get(e)!;
        const sx = pos.x - camX, sy = pos.y - camY;
        if (sx + r < 0 || sy + r < 0 || sx - r > GAME.WIDTH || sy - r > GAME.HEIGHT) return;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.floor(c.a * 255)}, ${Math.floor(c.b * 255)}, ${Math.floor(c.g * 255)}, 0.9)`;
        ctx.shadowBlur = 12; ctx.shadowColor = ctx.fillStyle as string; ctx.fill(); ctx.shadowBlur = 0;
      });

      // players
      w.player.forEach((pl, e) => {
        if (!w.pos.has(e) || !w.rad.has(e) || !pl.alive) return;
        const pos = w.pos.get(e)!; const r = w.rad.get(e)!.r; const c = w.col.get(e)!;
        const sx = pos.x - camX, sy = pos.y - camY;
        if (sx + r < 0 || sy + r < 0 || sx - r > GAME.WIDTH || sy - r > GAME.HEIGHT) return;

        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        const col = `rgba(${Math.floor(c.a * 255)}, ${Math.floor(c.b * 255)}, ${Math.floor(c.g * 255)}, 1)`;
        ctx.strokeStyle = col as string; ctx.lineWidth = 6; ctx.shadowBlur = 18; ctx.shadowColor = col as string; ctx.stroke(); ctx.shadowBlur = 0;

        if (pl.id === 'me') {
          // dash glow scurt
          if (dashFlashRef.current > 0) {
            const alpha = Math.min(1, dashFlashRef.current * 4);
            ctx.beginPath(); ctx.arc(sx, sy, r + 16, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0,229,255,${alpha})`; ctx.lineWidth = 6; ctx.shadowBlur = 30; ctx.shadowColor = 'rgba(0,229,255,1)'; ctx.stroke(); ctx.shadowBlur = 0;
          }
        
          // highlight + YOU
          const t = performance.now() * 0.004;
          const pulse = 0.65 + Math.sin(t) * 0.2;
          ctx.beginPath(); ctx.arc(sx, sy, r + 10, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0,229,255,${pulse})`; ctx.lineWidth = 4; ctx.shadowBlur = 25; ctx.shadowColor = 'rgba(0,229,255,1)'; ctx.stroke(); ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(0,229,255,0.10)'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
          ctx.font = '700 14px ui-sans-serif, system-ui, -apple-system'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillText('YOU', sx, sy - r - 12);
        
          // === SĂGEATĂ spre cel mai apropiat hotspot (fără unioni TS) ===
          let nearestDist = Infinity;
          let nearestHX = 0, nearestHY = 0;
          for (const h of HOTSPOTS) {
            const dx = h.x - (sx + camX);
            const dy = h.y - (sy + camY);
            const d = Math.hypot(dx, dy);
            if (d < nearestDist) { nearestDist = d; nearestHX = h.x; nearestHY = h.y; }
          }
          if (nearestDist < HOTSPOT.NEAR_DIST) {
            const ang = Math.atan2(nearestHY - (sy + camY), nearestHX - (sx + camX));
            const blink = (Math.sin(performance.now() * 0.01) * 0.5 + 0.5) * 0.8 + 0.2; // 0.2..1
            const ax = sx + Math.cos(ang) * (r + 24);
            const ay = sy + Math.sin(ang) * (r + 24);
        
            ctx.save();
            ctx.translate(ax, ay);
            ctx.rotate(ang);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(18, 0);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -6);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 6);
            ctx.strokeStyle = `rgba(255,215,0,${blink})`;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
          }
        
          // === BADGE "HOTSPOT x2" dacă suntem ÎN hotspot ===
          let insideHotspot = false;
          for (const h of HOTSPOTS) {
            const dx = (sx + camX) - h.x;
            const dy = (sy + camY) - h.y;
            if (dx * dx + dy * dy <= h.r * h.r) { insideHotspot = true; break; }
          }
          if (insideHotspot) {
            const badgeY = sy + r + 18;
            ctx.font = '700 12px ui-sans-serif, system-ui, -apple-system';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            const bAlpha = 0.6 + Math.sin(performance.now() * 0.02) * 0.4;
            ctx.fillStyle = `rgba(255,215,0,${bAlpha})`;
            ctx.fillText('HOTSPOT x2', sx, badgeY);
          }
        }               

        if (pl.invuln && pl.invuln > 0) {
          ctx.beginPath(); ctx.arc(sx, sy, r + 6, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
        }
      });

      // === MINIMAP cu densitate (dreapta-jos) ===
      const MW = 200, MH = Math.floor((MAP.HEIGHT / MAP.WIDTH) * MW); // menține aspect
      const mx = GAME.WIDTH - MW - 12, my = GAME.HEIGHT - MH - 12;

      // === FLOATERS “+points” (world → screen cu camera) ===
      const fl = getFloaters();
      for (const f of fl) {
        const sx = f.x - camX;
        const sy = f.y - camY - (1 - f.life) * 28; // urcă în sus când dispare
        if (sx < -20 || sy < -20 || sx > GAME.WIDTH + 20 || sy > GAME.HEIGHT + 20) continue;

        const alpha = Math.min(1, f.life * 1.2); // fade out
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '700 14px ui-sans-serif, system-ui, -apple-system';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = f.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = f.color;
        ctx.fillText(f.text, sx, sy);
        ctx.restore();
      }


      // fundal
      ctx.fillStyle = 'rgba(10,15,31,0.9)';
      ctx.fillRect(mx, my, MW, MH);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(mx + 0.5, my + 0.5, MW, MH);

      // heatmap densitate (bucket simplu 20x12)
      const cols = 20, rows = Math.max(6, Math.floor(cols * (MAP.HEIGHT / MAP.WIDTH)));
      const cellW = MW / cols, cellH = MH / rows;
      const buckets = Array.from({ length: rows }, () => Array(cols).fill(0));

      w.player.forEach((_pl, e) => {
        const p = w.pos.get(e)!;
        const cx = Math.floor((p.x / MAP.WIDTH) * cols);
        const cy = Math.floor((p.y / MAP.HEIGHT) * rows);
        if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) buckets[cy][cx] += 1;
      });

      for (let yy = 0; yy < rows; yy++) {
        for (let xx = 0; xx < cols; xx++) {
          const v = buckets[yy][xx];
          if (!v) continue;
          const a = Math.min(0.6, 0.15 + v * 0.12);
          ctx.fillStyle = `rgba(255,64,64,${a})`;
          ctx.fillRect(mx + xx * cellW, my + yy * cellH, cellW, cellH);
        }
      }

      // hotspot-uri pe minimap
      HOTSPOTS.forEach((h) => {
        const hx = mx + (h.x / MAP.WIDTH) * MW;
        const hy = my + (h.y / MAP.HEIGHT) * MH;
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,215,0,0.9)';
        ctx.fill();
      });

      // player local pe minimap
      const mePos = w.pos.get(me)!;
      const meX = mx + (mePos.x / MAP.WIDTH) * MW;
      const meY = my + (mePos.y / MAP.HEIGHT) * MH;
      ctx.beginPath();
      ctx.arc(meX, meY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,229,255,1)';
      ctx.fill();

      // viewport pe minimap
      const vx = (camX / MAP.WIDTH) * MW;
      const vy = (camY / MAP.HEIGHT) * MH;
      const vw = (GAME.WIDTH / MAP.WIDTH) * MW;
      const vh = (GAME.HEIGHT / MAP.HEIGHT) * MH;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(mx + vx, my + vy, vw, vh);
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
  }, [setUI, country]);

  return (
    <div className="relative mx-auto w-[1280px] select-none">
      <canvas ref={canvasRef} className="rounded-2xl shadow-2xl ring-1 ring-white/10" />
    </div>
  );
}
