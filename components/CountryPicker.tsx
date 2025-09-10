'use client';
import React from 'react';
import { COUNTRIES } from '@/lib/config';
import { useGameStore } from '@/lib/state/useGameStore';

export default function CountryPicker(): React.ReactElement | null {
  const country = useGameStore((s) => s.country);
  const setCountry = useGameStore((s) => s.setCountry);

  if (country) return null; // deja selectată

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm">
      <div className="w-[92%] max-w-md rounded-2xl bg-[#0f1430] p-6 ring-1 ring-white/10">
        <h2 className="mb-4 text-center text-xl font-semibold text-white">Select your country</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setCountry(c.code)}
              className="rounded-xl bg-white/5 px-4 py-3 text-left text-white ring-1 ring-white/10 hover:bg-white/10"
            >
              {c.name}
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-white/60">
          Punctele tale vor contribui la scorul țării alese.
        </p>
      </div>
    </div>
  );
}
