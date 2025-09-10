'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCosmetics } from '@/lib/state/useCosmetics';
import { supabase } from '@/lib/supabaseClient';
import { Check, Sparkles, Brush, Flame, Hammer, Wand2, Gem, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/SupabaseProvider';

export default function ShopPage(): React.ReactElement {
  const { catalog, equipped, buy, equip, isOwned, shards, craftRandom, isCraftable, hydrate } = useCosmetics();
  const { session, userId, loading } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const outlines = catalog.filter((c) => c.kind === 'outline');
  const trails   = catalog.filter((c) => c.kind === 'trail');

  useEffect(() => {
    // când se schimbă userId (login/logout), rehidratăm store-ul din Supabase
    void hydrate(userId);
  }, [userId, hydrate]);

  const onCraft = async (): Promise<void> => {
    if (!session) {
      setToast('Please sign in to craft.');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    const unlocked = await craftRandom(10);
    if (!unlocked) {
      setToast('Not enough shards or nothing craftable left.');
      setTimeout(() => setToast(null), 2200);
      return;
    }
    await equip(unlocked.kind, unlocked.id);
    setToast(`Unlocked: ${unlocked.name} (equipped)`);
    setTimeout(() => setToast(null), 2200);
  };

  const signIn = async () => { await supabase.auth.signInWithOAuth({ provider: 'google' }); };
  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <div className="min-h-[100dvh] bg-[#070b16] text-white">
      {/* glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,229,255,0.10),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,215,0,0.08),transparent_60%)]" />

      {/* header */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <Link href="/" className="text-sm font-semibold text-white/80 hover:text-white">← Back</Link>

        <h1 className="text-center text-2xl font-extrabold tracking-tight text-white">
          Cosmetics Shop
          <span className="ml-2 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/30">FREE</span>
        </h1>

        {/* Right: shards + auth */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1 text-sm ring-1 ring-white/10">
            <Gem size={16} className="text-cyan-300" />
            <span className="text-white/80">Shards:</span>
            <span className="font-bold text-white">{shards}</span>
          </div>
          {session ? (
            <button
              onClick={signOut}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1 text-sm ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-50"
            >
              <LogOut size={14} /> Sign out
            </button>
          ) : (
            <button
              onClick={signIn}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1 text-sm ring-1 ring-white/15 hover:bg-white/15 disabled:opacity-50"
            >
              <LogIn size={14} /> Sign in
            </button>
          )}
        </div>
      </header>

      {/* craft bar (gated by auth) */}
      <div className="relative z-10 mx-auto mb-6 w-full max-w-6xl px-5">
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-black/40 ring-1 ring-white/10">
              <Wand2 size={18} className="text-amber-300" />
            </div>
            <div>
              <div className="text-sm font-semibold">Craft Random</div>
              <div className="text-xs text-white/70">Spend 10 shards to unlock a random non-animated cosmetic.</div>
              {!session && <div className="mt-1 text-xs text-rose-300">Sign in required.</div>}
            </div>
          </div>
          <button
            onClick={onCraft}
            disabled={!session || loading || shards < 10}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ring-1 transition
              ${session && !loading && shards >= 10
                ? 'bg-cyan-600 text-white ring-cyan-400/40 hover:bg-cyan-500'
                : 'cursor-not-allowed bg-white/5 text-white/40 ring-white/10'}`}
          >
            <Hammer size={16} />
            Craft (10)
          </button>
        </div>
      </div>

      {/* content */}
      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16">
        <SectionTitle icon={<Brush size={16} />} title="Outlines" subtitle="Visual skins for your rim" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {outlines.map((item) => (
            <CosmeticCard
              key={item.id}
              itemId={item.id}
              kind="outline"
              name={item.name}
              description={item.description}
              owned={isOwned(item.id)}
              equipped={equipped.outline === item.id}
              craftable={isCraftable(item.id)}
              shards={shards}
              onBuy={() => buy(item.id)}
              onEquip={() => equip('outline', item.id)}
            />
          ))}
        </div>

        <SectionTitle className="mt-12" icon={<Flame size={16} />} title="Trails" subtitle="Futuristic motion tails" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trails.map((item) => (
            <CosmeticCard
              key={item.id}
              itemId={item.id}
              kind="trail"
              name={item.name}
              description={item.description}
              owned={isOwned(item.id)}
              equipped={equipped.trail === item.id}
              craftable={isCraftable(item.id)}
              shards={shards}
              onBuy={() => buy(item.id)}
              onEquip={() => equip('trail', item.id)}
            />
          ))}
        </div>
      </main>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
          <div className="flex items-center gap-2 rounded-xl bg-black/70 px-4 py-2 text-sm shadow-2xl ring-1 ring-white/10">
            <Sparkles size={16} className="text-amber-300" />
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  icon, title, subtitle, className,
}: { icon: React.ReactNode; title: string; subtitle?: string; className?: string; }) {
  return (
    <div className={`mb-4 flex items-baseline gap-3 ${className ?? ''}`}>
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 ring-1 ring-white/10">
        <div className="text-white/90">{icon}</div>
      </div>
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
      </div>
    </div>
  );
}

function CosmeticCard({
  itemId, kind, name, description, owned, equipped, craftable, shards, onBuy, onEquip,
}: {
  itemId: string; kind: 'outline' | 'trail'; name: string; description: string;
  owned: boolean; equipped: boolean; craftable: boolean; shards: number;
  onBuy: () => void; onEquip: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400/70 via-fuchsia-400/70 to-amber-300/70" />

      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-white">{name}</div>

          {/* BADGE: craftable vs non-craftable */}
          {craftable ? (
            <span className="rounded-md bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-300 ring-1 ring-cyan-400/30">
              Craftable {Math.min(shards,10)}/10
            </span>
          ) : (
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/70 ring-1 ring-white/15">
              Non-craftable
            </span>
          )}
        </div>

        <PreviewRich id={itemId} kind={kind} />

        <p className="min-h-[2.5rem] text-sm text-white/70">{description}</p>

        <div className="mt-1 flex items-center gap-2">
          {!owned ? (
            <button
              onClick={onBuy}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              <Sparkles size={16} /> Get
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-700/40 px-2 py-1 text-xs text-emerald-200 ring-1 ring-emerald-400/30">
              <Check size={14} /> Owned
            </span>
          )}

          <button
            onClick={onEquip}
            disabled={!owned}
            className={`ml-auto rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ${
              equipped
                ? 'bg-cyan-500/20 text-cyan-300 ring-cyan-400/40'
                : owned
                ? 'bg-white/10 text-white hover:bg-white/20 ring-white/20'
                : 'cursor-not-allowed bg-white/5 text-white/40 ring-white/10'
            }`}
          >
            {equipped ? 'Equipped' : 'Equip'}
          </button>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -inset-1 -z-10 rounded-2xl opacity-0 blur-2xl transition-opacity duration-300 hover:opacity-40"
        style={{ background: 'radial-gradient(600px 200px at 0% 0%, rgba(0,229,255,0.15), transparent 60%)' }}
      />
    </div>
  );
}

function PreviewRich({ id, kind }: { id: string; kind: 'outline' | 'trail' }) {
  return (
    <div className="grid h-28 place-items-center rounded-xl bg-[#0a1020] ring-1 ring-white/10">
      {kind === 'outline' ? <OutlinePreview id={id} /> : <TrailPreview id={id} />}
    </div>
  );
}

/* ---- Outline previews (same as before) ---- */
function OutlinePreview({ id }: { id: string }) {
  const color = (c: string) => {
    switch (c) {
      case 'magenta': return '#ff4de3';
      case 'lime': return '#a3ff12';
      case 'gold': return '#ffd76a';
      default: return '#00e5ff';
    }
  };
  if (['cyan','magenta','lime','gold'].includes(id)) {
    const col = color(id);
    return <div className="relative h-12 w-12 rounded-full bg-white/5" style={{ boxShadow: `0 0 18px ${col}`, border: `4px solid ${col}` }} />;
  }
  if (id === 'neoRing') {
    return (
      <div className="relative">
        <div className="absolute -inset-4 rounded-full border-2 border-cyan-300/60 animate-pulse" />
        <div className="absolute -inset-2 rounded-full border-2 border-cyan-300/80 animate-pulse" />
        <div className="relative h-12 w-12 rounded-full border-4 border-cyan-400 shadow-[0_0_22px_rgba(0,229,255,0.9)]" />
      </div>
    );
  }
  if (id === 'holoGlass') {
    return (
      <div
        className="relative h-14 w-14 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.4), transparent 40%), conic-gradient(from 0deg, rgba(0,229,255,0.6), rgba(255,255,255,0.4), rgba(255,215,0,0.6))',
        }}
      />
    );
  }
  if (id === 'circuit') {
    return (
      <div className="relative h-12 w-12 rounded-full border-4 border-cyan-400 shadow-[0_0_22px_rgba(0,229,255,0.9)]">
        <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.2),transparent_60%)]" />
      </div>
    );
  }
  if (id === 'hex') {
    return (
      <div className="relative h-12 w-12 rounded-full border-4 border-sky-300 shadow-[0_0_18px_rgba(125,227,255,0.8)]">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_55%,rgba(125,227,255,0.4)_56%,transparent_57%)]" />
      </div>
    );
  }
  if (id === 'tiger') {
    return (
      <div className="relative h-12 w-12 rounded-full border-4 border-amber-300 shadow-[0_0_18px_rgba(255,215,0,0.8)] overflow-hidden">
        <div className="absolute inset-0 bg-[repeating-conic-gradient(from_0deg,rgba(255,165,0,0.9)_0_10deg,transparent_10deg_20deg)] animate-pulse opacity-70" />
      </div>
    );
  }
  // aurora
  return (
    <div
      className="relative h-12 w-12 rounded-full border-[6px] border-transparent"
      style={{
        background:
          'conic-gradient(from 45deg, rgba(0,229,255,0.9), rgba(255,255,255,0.7), rgba(255,215,0,0.9))',
        WebkitMask: 'radial-gradient(circle at center, transparent 65%, black 66%)',
      }}
    />
  );
}

/* ---- Trail previews ---- */
function TrailPreview({ id }: { id: string }) {
  if (id === 'pixel') {
    return (
      <div className="flex h-2 w-44 items-center justify-center gap-1">
        {Array.from({ length: 12 }).map((_, i) => (<div key={i} className="h-2 w-3 bg-white/80" />))}
      </div>
    );
  }
  if (id === 'plasma') {
    return <div className="h-3 w-44 rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 shadow-[0_0_24px_rgba(255,255,255,0.35)]" />;
  }
  if (id === 'circuitTrail') {
    return <div className="h-0.5 w-44 border-t-4 border-dashed border-cyan-300/90" />;
  }
  if (id === 'comet') {
    return (
      <div className="relative h-3 w-44">
        <div className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.8)]" />
        <div className="absolute inset-y-0 left-0 right-4 my-auto rounded-full bg-gradient-to-r from-transparent via-cyan-300/70 to-white/60" />
      </div>
    );
  }
  if (id === 'holoTrail') {
    return <div className="h-3 w-44 rounded-full bg-gradient-to-r from-cyan-300 to-amber-300 mix-blend-screen shadow-[0_0_30px_rgba(0,229,255,0.5)]" />;
  }
  // neon (default)
  return <div className="h-2 w-44 rounded-full bg-gradient-to-r from-cyan-300 to-amber-300 shadow-[0_0_18px_rgba(255,255,255,0.35)]" />;
}
