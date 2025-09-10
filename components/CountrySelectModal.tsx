'use client';
import React, { useMemo, useState } from 'react';
import { COUNTRY_CODES, COUNTRY_NAMES, flagEmoji } from '@/lib/countries';
import { setUserCountry } from '@/lib/countryScore';
import { useAuth } from '@/lib/auth/SupabaseProvider';
import { X } from 'lucide-react';

export default function CountrySelectModal({
  open, onClose, onPicked, initial,
}: {
  open: boolean;
  onClose: () => void;
  onPicked: (cc: string) => void;
  initial?: string | null;
}): React.ReactElement | null {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const arr = COUNTRY_CODES.map((cc) => ({ cc, name: COUNTRY_NAMES[cc]! }));
    if (!s) return arr;
    return arr.filter(({ cc, name }) =>
      cc.toLowerCase().includes(s) || name.toLowerCase().includes(s)
    );
  }, [q]);

  if (!open) return null;

  async function pick(cc: string) {
    await setUserCountry(userId, cc);
    onPicked(cc);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0a1020] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-lg font-bold">Choose your country</div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/10"><X size={16}/></button>
        </div>
        <div className="p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search country or code (e.g., RO, United)"
            className="mb-3 w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 focus:ring-white/20"
          />
          <div className="max-h-80 overflow-auto rounded-lg ring-1 ring-white/10">
            {list.map(({ cc, name }) => (
              <button
                key={cc}
                onClick={() => void pick(cc)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white/5 ${initial?.toUpperCase()===cc ? 'bg-white/5' : ''}`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">{flagEmoji(cc)}</span>
                  <span className="text-sm">{name}</span>
                </span>
                <span className="text-xs text-white/60">{cc}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-white/60">
            Only authenticated players contribute to the global country leaderboard.
            Guests can still pick a country for UI purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
