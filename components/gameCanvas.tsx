'use client';
import React, { useEffect, useRef } from 'react';
import { GAME, HOTSPOTS, HOTSPOT, MAP, UI_FONT } from '@/lib/config';
import { createWorld } from '@/lib/ecs/world';
import { spawnParticles, spawnPlayer, findSafeSpawn } from '@/lib/ecs/systems/spawn';
import { movementSystem } from '@/lib/ecs/systems/movement';
import { collisionSystem } from '@/lib/ecs/systems/collisions';
import { cooldownSystem, tryDash } from '@/lib/ecs/systems/abilities';
import { botSystem } from '@/lib/ecs/systems/ai';
import { hotspotSystem } from '@/lib/ecs/systems/hotspots';
import { superEventSystem } from '@/lib/ecs/systems/events';
import { powerupSystem } from '@/lib/ecs/systems/powerups';
import { bossSystem } from '@/lib/ecs/systems/boss';
import { bulletsSystem, tryFire } from '@/lib/ecs/systems/bullets';
import { useGameStore } from '@/lib/state/useGameStore';
import { useSettings } from '@/lib/state/useSettings';
import { SFX } from '@/lib/audio/sfx';
import { getFloaters, updateFloaters, getPings, updatePings } from '@/lib/ui/effects';
import type { World, Entity, Particle, PowerUp, Bullet } from '@/lib/ecs/types';

const SPEED = 140;
const GRID_STEP = 40;

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export default function GameCanvas(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const setUI = useGameStore((s) => s.setUI);
  const country = useGameStore((s) => s.country);

  const inputRef = useRef<{
    up: boolean; down: boolean; left: boolean; right: boolean;
    dash: boolean; fire: boolean; mx: number; my: number; mouseInside: boolean;
  }>({
    up: false, down: false, left: false, right: false,
    dash: false, fire: false, mx: 0, my: 0, mouseInside: false,
  });

  const camRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const camTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const dashFlashRef = useRef<number>(0);
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);

  // ultima direcție validă de țintire (fallback când nu ai mouse)
  const aimRef = useRef<{ x: number; y: number }>({ x: 1, y: 0 });

  const soundOn = useSettings((s) => s.sound);
  const hapticsOn = useSettings((s) => s.haptics);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = GAME.WIDTH * dpr;
    canvas.height = GAME.HEIGHT * dpr;
    canvas.style.width = `${GAME.WIDTH}px`;
    canvas.style.height = `${GAME.HEIGHT}px`;

    const ctxRaw = canvas.getContext('2d', { alpha: true });
    if (!ctxRaw) return;
    const ctx = ctxRaw as CanvasRenderingContext2D;
    ctx.scale(dpr, dpr);

    const w: World = createWorld();
    spawnParticles(w);

    let me: Entity = spawnPlayer(w, 'me', false, undefined, country);

    const bots = ['RO','IT','US','DE','FR','ES','GB','PL'] as const;
    const rBetween = (a: number, b: number) => a + Math.random() * (b - a);
    const randC = () => bots[Math.floor(Math.random() * bots.length)];
    for (let i = 0; i < 16; i++) spawnPlayer(w, `bot-${i}`, true, rBetween(12, 22), randC());

    const startP = w.pos.get(me)!;
    camRef.current.x = clamp(startP.x - GAME.WIDTH / 2, 0, Math.max(0, MAP.WIDTH - GAME.WIDTH));
    camRef.current.y = clamp(startP.y - GAME.HEIGHT / 2, 0, Math.max(0, MAP.HEIGHT - GAME.HEIGHT));
    camTargetRef.current = { ...camRef.current };

    let last = performance.now();
    let raf = 0;
    let accumulator = 0;

    // INPUT
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') inputRef.current.up = true;
      if (k === 's' || k === 'arrowdown') inputRef.current.down = true;
      if (k === 'a' || k === 'arrowleft') inputRef.current.left = true;
      if (k === 'd' || k === 'arrowright') inputRef.current.right = true;
      if (k === ' ') inputRef.current.dash = true;
      if (k === 'f') inputRef.current.fire = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') inputRef.current.up = false;
      if (k === 's' || k === 'arrowdown') inputRef.current.down = false;
      if (k === 'a' || k === 'arrowleft') inputRef.current.left = false;
      if (k === 'd' || k === 'arrowright') inputRef.current.right = false;
      if (k === ' ') inputRef.current.dash = false;
      if (k === 'f') inputRef.current.fire = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      inputRef.current.mx = e.clientX - rect.left;
      inputRef.current.my = e.clientY - rect.top;
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        inputRef.current.fire = true;
        canvas.setPointerCapture?.((e as unknown as PointerEvent).pointerId ?? 1);
      }
    };
    const handleMouseUp = (e: MouseEvent) => { if (e.button === 0) inputRef.current.fire = false; };
    const handleMouseEnter = () => { inputRef.current.mouseInside = true; };
    const handleMouseLeave = () => { inputRef.current.mouseInside = false; };
    const preventContext = (e: MouseEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('contextmenu', preventContext);

    const respawnMe = (): void => {
      const spot = findSafeSpawn(w);
      me = spawnPlayer(w, 'me', false, undefined, country);
      const p = w.pos.get(me);
      if (p) { p.x = spot.x; p.y = spot.y; }
      const pl = w.player.get(me);
      if (pl) { pl.invuln = 1.0; pl.combo = 1; pl.comboT = 0; }
      camRef.current.x = clamp(p!.x - GAME.WIDTH / 2, 0, MAP.WIDTH - GAME.WIDTH);
      camRef.current.y = clamp(p!.y - GAME.HEIGHT / 2, 0, MAP.HEIGHT - GAME.HEIGHT);
      camTargetRef.current = { ...camRef.current };
      trailRef.current = [];
    };

    function updateCamera(): void {
      const p = w.pos.get(me); if (!p) return;
      camTargetRef.current.x = clamp(p.x - GAME.WIDTH / 2, 0, Math.max(0, MAP.WIDTH - GAME.WIDTH));
      camTargetRef.current.y = clamp(p.y - GAME.HEIGHT / 2, 0, Math.max(0, MAP.HEIGHT - GAME.HEIGHT));
      const SMOOTH = 0.12;
      camRef.current.x = lerp(camRef.current.x, camTargetRef.current.x, SMOOTH);
      camRef.current.y = lerp(camRef.current.y, camTargetRef.current.y, SMOOTH);
    }

    function tick(dt: number): void {
      const meComp = w.player.get(me);
      if (!meComp || !meComp.alive) { respawnMe(); return; }

      // gameplay systems
      hotspotSystem(w, dt);
      superEventSystem(w, dt);
      bossSystem(w, dt);
      powerupSystem(w, dt);

      const vel = w.vel.get(me)!;
      const rad = w.rad.get(me)!.r;
      const { up, down, left, right, dash, fire } = inputRef.current;

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
          dashFlashRef.current = 0.25;
          if (soundOn) SFX.dash();
          if (hapticsOn && 'vibrate' in navigator) navigator.vibrate?.(30);
        }
      }

      // === FIRE (mouse sau tasta F) — recalculăm direcția în fiecare frame
      {
        const meP = w.pos.get(me)!;
        const sx = meP.x - camRef.current.x;
        const sy = meP.y - camRef.current.y;

        // cursor dacă e peste canvas
        let ax = inputRef.current.mouseInside ? (inputRef.current.mx - sx) : 0;
        let ay = inputRef.current.mouseInside ? (inputRef.current.my - sy) : 0;
        let amag = Math.hypot(ax, ay);

        // dacă nu, folosim viteza; dacă nici asta, ultima direcție validă
        if (amag < 4) {
          const vmag = Math.hypot(vel.x, vel.y);
          if (vmag > 1) { ax = vel.x; ay = vel.y; amag = vmag; }
          else { ax = aimRef.current.x; ay = aimRef.current.y; amag = Math.hypot(ax, ay) || 1; }
        }

        // normalizăm + memorăm
        aimRef.current.x = ax / amag;
        aimRef.current.y = ay / amag;

        if (fire) {
          tryFire(w, me, aimRef.current.x, aimRef.current.y);
        }
      }

      botSystem(w, dt);
      movementSystem(w, dt);
      collisionSystem(w);
      bulletsSystem(w, dt);
      cooldownSystem(w, dt);
      updateFloaters(dt);
      updatePings(dt);

      const meNow = w.player.get(me);
      if (!meNow || !meNow.alive) { respawnMe(); return; }

      // HUD flags (pentru iconurile Lucide din HUD)
      document.body.dataset.magnet = meNow.magnetT && meNow.magnetT > 0 ? 'on' : 'off';
      document.body.dataset.shield = meNow.shieldT && meNow.shieldT > 0 ? 'on' : 'off';

      // trail
      const mePos = w.pos.get(me);
      if (mePos) {
        trailRef.current.push({ x: mePos.x, y: mePos.y });
        if (trailRef.current.length > 24) trailRef.current.shift();
      }

      setUI({
        score: meNow.score,
        dashCooldown: Math.min(1, Math.max(0, meNow.cooldown)),
        combo: Math.max(1, meNow.combo ?? 1),
      });

      updateCamera();
      dashFlashRef.current = Math.max(0, dashFlashRef.current - dt);
    }

    function render(): void {
      const camX = camRef.current.x, camY = camRef.current.y;

      ctx.clearRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
      ctx.fillStyle = '#0a0f1f';
      ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);

      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      const startX = Math.floor(camX / GRID_STEP) * GRID_STEP;
      const startY = Math.floor(camY / GRID_STEP) * GRID_STEP;
      for (let x = startX; x <= camX + GAME.WIDTH; x += GRID_STEP) {
        const sx = Math.floor(x - camX) + 0.5; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, GAME.HEIGHT); ctx.stroke();
      }
      for (let y = startY; y <= camY + GAME.HEIGHT; y += GRID_STEP) {
        const sy = Math.floor(y - camY) + 0.5; ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(GAME.WIDTH, sy); ctx.stroke();
      }

      // map bounds
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2;
      ctx.strokeRect(-camX + 0.5, -camY + 0.5, MAP.WIDTH, MAP.HEIGHT);

      // hotspots glow
      HOTSPOTS.forEach((h) => {
        const hx = h.x - camX, hy = h.y - camY;
        if (hx + h.r < 0 || hy + h.r < 0 || hx - h.r > GAME.WIDTH || hy - h.r > GAME.HEIGHT) return;
        const grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, h.r);
        grad.addColorStop(0, 'rgba(255,215,0,0.22)'); grad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(hx, hy, h.r, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.strokeStyle = 'rgba(255,215,0,0.22)'; ctx.lineWidth = 2; ctx.arc(hx, hy, h.r, 0, Math.PI * 2); ctx.stroke();
      });

      // particles (incl. super/boss)
      w.particle.forEach((part: Particle, e: Entity) => {
        const pos = w.pos.get(e)!; const r = w.rad.get(e)!.r; const c = w.col.get(e)!;
        const sx = pos.x - camX, sy = pos.y - camY;
        if (sx + r < 0 || sy + r < 0 || sx - r > GAME.WIDTH || sy - r > GAME.HEIGHT) return;

        if (part.kind === 'super' || part.kind === 'boss') {
          const t = performance.now() * 0.004;
          const pulseR = r + (part.kind === 'boss' ? 12 : 8) + Math.sin(t) * 3;
          const grad = ctx.createRadialGradient(sx, sy, r * 0.4, sx, sy, pulseR);
          grad.addColorStop(0, 'rgba(255,102,255,0.6)'); grad.addColorStop(1, 'rgba(255,102,255,0)');
          ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(sx, sy, pulseR, 0, Math.PI * 2); ctx.fill();
        }

        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.floor(c.a * 255)}, ${Math.floor(c.b * 255)}, ${Math.floor(c.g * 255)}, 0.9)`;
        ctx.shadowBlur = 12; ctx.shadowColor = ctx.fillStyle as string; ctx.fill(); ctx.shadowBlur = 0;
      });

      // power-ups (canvas): cerc pulsant + bulină color distinctă
      w.powerup.forEach((pu: PowerUp, e: Entity) => {
        const pos = w.pos.get(e)!; const r = w.rad.get(e)!.r;
        const sx = pos.x - camX, sy = pos.y - camY;
        if (sx + r < 0 || sy + r < 0 || sx - r > GAME.WIDTH || sy - r > GAME.HEIGHT) return;
        const t = performance.now() * 0.005;
        const pulse = 6 + Math.sin(t) * 4;
        const color = pu.kind === 'magnet' ? '0,229,255' : '255,215,0';
        ctx.beginPath(); ctx.arc(sx, sy, r + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color},0.85)`; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},0.9)`; ctx.fill();
        // mic fallback text
        ctx.font = UI_FONT.SMALL; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0a0f1f'; ctx.fillText(pu.kind === 'magnet' ? 'M' : 'S', sx, sy);
      });

      // trail
      const trail = trailRef.current;
      if (trail.length >= 2) {
        for (let i = 1; i < trail.length; i++) {
          const a = trail[i - 1], b = trail[i];
          const ax = a.x - camX, ay = a.y - camY;
          const bx = b.x - camX, by = b.y - camY;
          const t = i / trail.length;
          const color = t < 0.5 ? '0,229,255' : '255,215,0';
          ctx.strokeStyle = `rgba(${color}, ${Math.max(0.12, t * 0.6)})`;
          ctx.lineWidth = 3 * t;
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        }
      }

      // players
      w.player.forEach((pl, e) => {
        const pos = w.pos.get(e); const rad = w.rad.get(e); const col = w.col.get(e);
        if (!pos || !rad || !col || !pl.alive) return;
        const r = rad.r;
        const sx = pos.x - camX, sy = pos.y - camY;
        if (sx + r < 0 || sy + r < 0 || sx - r > GAME.WIDTH || sy - r > GAME.HEIGHT) return;

        const isMe = pl.id === 'me';
        const fill = isMe ? 'rgba(0,229,255,0.22)' :
          `rgba(${Math.floor(col.a * 255)}, ${Math.floor(col.b * 255)}, ${Math.floor(col.g * 255)}, 0.10)`;
        ctx.fillStyle = fill;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();

        const strokeCol = isMe ? 'rgba(0,229,255,1)' :
          `rgba(${Math.floor(col.a * 255)}, ${Math.floor(col.b * 255)}, ${Math.floor(col.g * 255)}, 1)`;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.strokeStyle = strokeCol; ctx.lineWidth = 5; ctx.shadowBlur = 16; ctx.shadowColor = strokeCol; ctx.stroke(); ctx.shadowBlur = 0;

        if (isMe) {
          if (dashFlashRef.current > 0) {
            const a = Math.min(1, dashFlashRef.current * 4);
            ctx.beginPath(); ctx.arc(sx, sy, r + 14, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0,229,255,${a})`; ctx.lineWidth = 5; ctx.shadowBlur = 28; ctx.shadowColor = 'rgba(0,229,255,1)'; ctx.stroke(); ctx.shadowBlur = 0;
          }

          // shield vizual
          if (pl.shieldT && pl.shieldT > 0) {
            ctx.beginPath(); ctx.arc(sx, sy, r + 10, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,153,0.9)'; ctx.lineWidth = 3; ctx.stroke();
          }

          // label YOU
          ctx.font = UI_FONT.MEDIUM;
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillText('YOU', sx, sy - r - 12);

          // săgeată spre cel mai apropiat hotspot
          let nearestDist = Infinity, nearestHX = 0, nearestHY = 0;
          for (const h of HOTSPOTS) {
            const dx = h.x - (sx + camX), dy = h.y - (sy + camY);
            const d = Math.hypot(dx, dy); if (d < nearestDist) { nearestDist = d; nearestHX = h.x; nearestHY = h.y; }
          }
          if (nearestDist < HOTSPOT.NEAR_DIST) {
            const ang = Math.atan2(nearestHY - (sy + camY), nearestHX - (sx + camX));
            const blink = (Math.sin(performance.now() * 0.01) * 0.5 + 0.5) * 0.8 + 0.2;
            const ax = sx + Math.cos(ang) * (r + 24), ay = sy + Math.sin(ang) * (r + 24);
            ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 0); ctx.moveTo(0, 0); ctx.lineTo(0, -6); ctx.moveTo(0, 0); ctx.lineTo(0, 6);
            ctx.strokeStyle = `rgba(255,215,0,${blink})`; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
          }
        }
      });

      // bullets
      w.bullet.forEach((_b: Bullet, e: Entity) => {
        const p = w.pos.get(e); if (!p) return;
        const sx = p.x - camX, sy = p.y - camY;
        ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,229,255,0.9)'; ctx.fill();
      });

      // floaters
      getFloaters().forEach((f) => {
        const sx = f.x - camX, sy = f.y - camY - (1 - f.life) * 28;
        if (sx < -20 || sy < -20 || sx > GAME.WIDTH + 20 || sy > GAME.HEIGHT + 20) return;
        const alpha = Math.min(1, f.life * 1.2);
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.font = UI_FONT.MEDIUM; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillStyle = f.color; ctx.shadowBlur = 12; ctx.shadowColor = f.color; ctx.fillText(f.text, sx, sy);
        ctx.globalAlpha = 1; ctx.restore();
      });

      // pings
      const pArr = getPings();
      pArr.forEach((p) => {
        const sx = p.x - camX, sy = p.y - camY;
        if (sx < -40 || sy < -40 || sx > GAME.WIDTH + 40 || sy > GAME.HEIGHT + 40) return;
        const t = 1 - p.life; const radius = 6 + t * 28;
        ctx.beginPath(); ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - t);
        ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1;
      });

      // minimap
      const MW = 200, MH = Math.floor((MAP.HEIGHT / MAP.WIDTH) * MW);
      const mx = GAME.WIDTH - MW - 12, my = GAME.HEIGHT - MH - 12;
      ctx.fillStyle = 'rgba(10,15,31,0.9)'; ctx.fillRect(mx, my, MW, MH);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.strokeRect(mx + 0.5, my + 0.5, MW, MH);

      HOTSPOTS.forEach((h) => {
        const hx = mx + (h.x / MAP.WIDTH) * MW, hy = my + (h.y / MAP.HEIGHT) * MH;
        ctx.beginPath(); ctx.arc(hx, hy, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,215,0,0.9)'; ctx.fill();
      });

      // power-ups pe minimap (cyan / galben)
      w.powerup.forEach((pu: PowerUp, e: Entity) => {
        const pos = w.pos.get(e); if (!pos) return;
        const px = mx + (pos.x / MAP.WIDTH) * MW, py = my + (pos.y / MAP.HEIGHT) * MH;
        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = pu.kind === 'magnet' ? 'rgba(0,229,255,1)' : 'rgba(255,215,0,1)'; ctx.fill();
      });

      w.player.forEach((pl, e) => {
        const pos = w.pos.get(e); const rad = w.rad.get(e);
        if (!pl.alive || !pos || !rad) return;
        const px = mx + (pos.x / MAP.WIDTH) * MW, py = my + (pos.y / MAP.HEIGHT) * MH;
        ctx.beginPath(); ctx.arc(px, py, pl.id === 'me' ? 3 : 2, 0, Math.PI * 2);
        ctx.fillStyle = pl.id === 'me' ? 'rgba(0,229,255,1)' : 'rgba(255,255,255,0.9)'; ctx.fill();
      });

      const vx = (camX / MAP.WIDTH) * MW, vy = (camY / MAP.HEIGHT) * MH;
      const vw = (GAME.WIDTH / MAP.WIDTH) * MW, vh = (GAME.HEIGHT / MAP.HEIGHT) * MH;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(mx + vx, my + vy, vw, vh);

      // SUPER event banner (optional poți muta în HUD)
      // (dacă vrei, păstrăm aici)
    }

    const STEP = 1 / GAME.TPS;
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now; accumulator += dt;
      while (accumulator >= STEP) { tick(STEP); accumulator -= STEP; }
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('contextmenu', preventContext);
      delete document.body.dataset.magnet;
      delete document.body.dataset.shield;
    };
  }, [setUI, country, soundOn, hapticsOn]);

  return (
    <div className="relative mx-auto w-[1280px] select-none">
      <canvas ref={canvasRef} className="rounded-2xl shadow-2xl ring-1 ring-white/10" />
    </div>
  );
}
