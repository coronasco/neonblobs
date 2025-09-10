'use client';
import React, { useEffect, useRef, useState } from 'react';

type Props = {
  radius?: number;                             // raza cercului de control (px)
  onChange?: (v: { x: number; y: number }) => void; // vector normalizat [-1..1]
  className?: string;
};

export default function Joystick({ radius = 56, onChange, className }: Props): React.ReactElement {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const activeRef = useRef(false);
  const originRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const el = baseRef.current;
    if (!el) return;

    const getPoint = (e: Touch | MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return { x: (('clientX' in e) ? e.clientX : 0) - cx, y: (('clientY' in e) ? e.clientY : 0) - cy };
    };

    const clampVec = (x: number, y: number) => {
      const len = Math.hypot(x, y);
      if (len <= radius) return { x, y, nx: x / radius, ny: y / radius, len };
      const f = radius / (len || 1);
      return { x: x * f, y: y * f, nx: (x * f) / radius, ny: (y * f) / radius, len: radius };
    };

    const handleStart = (e: TouchEvent | MouseEvent) => {
      activeRef.current = true;
      const p = 'touches' in e ? e.touches[0] : (e as MouseEvent);
      const { x, y, nx, ny } = clampVec(...Object.values(getPoint(p)) as [number, number]);
      originRef.current = { x, y };
      setKnob({ x, y });
      onChange?.({ x: nx, y: ny });
    };

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!activeRef.current) return;
      const p = 'touches' in e ? e.touches[0] : (e as MouseEvent);
      const { x, y, nx, ny } = clampVec(...Object.values(getPoint(p)) as [number, number]);
      setKnob({ x, y });
      onChange?.({ x: nx, y: ny });
      e.preventDefault();
    };

    const handleEnd = () => {
      activeRef.current = false;
      setKnob({ x: 0, y: 0 });
      onChange?.({ x: 0, y: 0 });
    };

    // touch
    el.addEventListener('touchstart', handleStart, { passive: true });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd, { passive: true });
    window.addEventListener('touchcancel', handleEnd, { passive: true });
    // mouse (fallback / debug pe desktop)
    el.addEventListener('mousedown', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);

    return () => {
      el.removeEventListener('touchstart', handleStart as EventListenerOrEventListenerObject);
      window.removeEventListener('touchmove', handleMove as EventListenerOrEventListenerObject);
      window.removeEventListener('touchend', handleEnd as EventListenerOrEventListenerObject);
      window.removeEventListener('touchcancel', handleEnd as EventListenerOrEventListenerObject);
      el.removeEventListener('mousedown', handleStart as EventListenerOrEventListenerObject);
      window.removeEventListener('mousemove', handleMove as EventListenerOrEventListenerObject);
      window.removeEventListener('mouseup', handleEnd as EventListenerOrEventListenerObject);
    };
  }, [onChange, radius]);

  return (
    <div
      ref={baseRef}
      aria-label="Move joystick"
      className={`relative select-none touch-none ${className ?? ''}`}
      style={{ width: radius * 2, height: radius * 2 }}
    >
      {/* baza */}
      <div className="absolute inset-0 rounded-full bg-white/5 ring-1 ring-white/10 backdrop-blur-sm" />
      {/* cerc ghidaj */}
      <div className="absolute inset-2 rounded-full ring-1 ring-white/15" />
      {/* knob */}
      <div
        className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 ring-1 ring-white/40 shadow-[0_0_12px_rgba(255,255,255,0.35)]"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}
