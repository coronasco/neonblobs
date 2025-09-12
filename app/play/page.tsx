'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import GameCanvas from '@/components/gameCanvas';
import Hud from '@/components/hud';
import { useAuth } from '@/lib/auth/SupabaseProvider';
import { useGameStore } from '@/lib/state/useGameStore';
import { enqueueCountryDelta } from '@/lib/countryScore';
import CountrySelectModal from '@/components/CountrySelectModal';
import CountryLeaderboard from '@/components/CountryLeaderboard';
import { flagEmoji } from '@/lib/countries';
import { supabase } from '@/lib/supabaseClient';
import { LogIn, Flag, Globe2, ShoppingBag, User2 } from 'lucide-react';
import { useProgress } from '@/lib/state/useProgress';

export default function PlayPage(): React.ReactElement {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const score = useGameStore((s) => s.ui.score ?? 0);
  const country = useGameStore((s) => s.country);
  const setCountry = useGameStore((s) => s.setCountry);

  const [openCountry, setOpenCountry] = useState(false);
  const prevScoreRef = useRef<number>(0);

  const { addXp, hydrate: hydrateProgress } = useProgress();

  useEffect(() => {
    (async () => {
      if (userId) {
        const { data } = await supabase
          .from('profiles')
          .select('country_code')
          .eq('id', userId)
          .maybeSingle();
        if (data?.country_code) setCountry(data.country_code);
      } else {
        const cc = localStorage.getItem('nb_country');
        if (cc) setCountry(cc);
      }
    })().catch(() => {});
  }, [userId, setCountry]);

  useEffect(() => {
    // hidratează la intrare (doar pentru userii logați)
    void hydrateProgress();
  }, [hydrateProgress]);
  
  useEffect(() => {
    const delta = Math.max(0, Math.floor(score - (prevScoreRef.current || 0)));
    prevScoreRef.current = score;
  
    if (delta > 0) {
      // leaderboard doar pentru user logat
      if (userId) {
        void enqueueCountryDelta(userId, delta);
        // XP: 1 XP / 10 puncte (poți schimba raportul)
        void addXp(Math.floor(delta / 10));
      }
    }
  }, [score, userId, addXp]);

  useEffect(() => {
    const delta = Math.max(0, Math.floor(score - (prevScoreRef.current || 0)));
    prevScoreRef.current = score;
    if (delta > 0 && userId) void enqueueCountryDelta(userId, delta);
  }, [score, userId]);

  const isGuest = !session;

  const countryLabel = useMemo(() => {
    if (!country) return 'Choose country';
    return `${flagEmoji(country)}  ${country.toUpperCase()}`;
  }, [country]);

  return (
    <div className="min-h-[100dvh] bg-[#070b16] text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-[#070b16]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          {/* Stânga: Back + Shop */}
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-lg px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white">
              ← Back
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
              title="Open Shop"
            >
              <ShoppingBag size={16} /> Shop
            </Link>
          </div>

          {/* Mijloc (desktop): Country chip */}
          <div className="hidden sm:flex items-center gap-2 text-white/90">
            <Globe2 size={16} />
            <button
              onClick={() => setOpenCountry(true)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
              title="Choose your country"
            >
              {countryLabel}
            </button>
          </div>

          {/* Dreapta: Auth */}
          <div className="flex items-center gap-2">
            {isGuest ? (
              <Link
                href="/login?redirect=/play"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
              >
                <LogIn size={14} /> Sign in
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/10">
                <User2 size={14} />
                <span>Signed in</span>
              </div>
            )}
          </div>
        </div>

        {/* Sub-row pe mobil: buton de țară vizibil */}
        <div className="sm:hidden mx-auto w-full max-w-7xl px-4 pb-3">
          <button
            onClick={() => setOpenCountry(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
          >
            <Flag size={14} /> {countryLabel}
          </button>
        </div>
      </header>

      {/* GUEST BANNER */}
      {isGuest && (
        <div className="mx-auto w-full max-w-7xl px-4">
          <div className="mb-3 rounded-xl border border-white/10 bg-amber-500/10 p-3 text-sm text-amber-200 ring-1 ring-amber-400/20">
            You are in <b>guest mode</b>. Your score won’t count towards your country’s leaderboard.
            <Link href="/login?redirect=/play" className="ml-2 underline hover:text-amber-100">
              Create an account
            </Link>
          </div>
        </div>
      )}

      {/* MAIN */}
      <main className="mx-auto w-full max-w-7xl px-4 pb-10">
        {/* Canvas + HUD suprapus */}
        <section className="relative mt-6 rounded-2xl border border-white/10 bg-white/5 p-2">
          <Hud /> {/* <- HUD e în același container, overlay absolut */}
          <GameCanvas />
          
        </section>

        {/* Cards sub canvas */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Country card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-bold">Your country</div>
              <button
                onClick={() => setOpenCountry(true)}
                className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
              >
                <Flag size={14} /> {country ? 'Change' : 'Choose'}
              </button>
            </div>
            <div className="text-lg">
              {country ? (
                <span className="inline-flex items-center gap-2">
                  <span className="text-xl">{flagEmoji(country)}</span>
                  <span>{country.toUpperCase()}</span>
                </span>
              ) : (
                <span className="text-white/60">Not set</span>
              )}
            </div>
            <p className="mt-2 text-xs text-white/60">
              Only authenticated players contribute to the leaderboard.
            </p>
          </div>

          {/* Leaderboard card */}
          <CountryLeaderboard />
        </div>
      </main>

      {/* Country picker modal */}
      <CountrySelectModal
        open={openCountry}
        onClose={() => setOpenCountry(false)}
        initial={country}
        onPicked={(cc) => setCountry(cc)}
      />
    </div>
  );
}
