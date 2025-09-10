'use client';
import React from 'react';

type Props = {
  onPress?: () => void;
  className?: string;
};

export default function DashButton({ onPress, className }: Props): React.ReactElement {
  return (
    <button
      aria-label="Dash"
      onTouchStart={(e) => { e.preventDefault(); onPress?.(); }}
      onMouseDown={(e) => { e.preventDefault(); onPress?.(); }}
      className={`rounded-full bg-white/10 px-6 py-6 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-md active:scale-95 ${className ?? ''}`}
    >
      DASH
    </button>
  );
}
