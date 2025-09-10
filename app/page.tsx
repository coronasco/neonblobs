import Link from 'next/link';
import { Gamepad2, Sparkles, Crown, Zap, Shield, Palette } from 'lucide-react';

export default function Home(): React.ReactElement {
  return (
    <div className="min-h-[100dvh] bg-[#070b16] text-white">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_20%_0%,rgba(0,229,255,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_35%_at_90%_100%,rgba(255,215,0,0.10),transparent_60%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="group inline-flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-cyan-400 to-amber-300 shadow-[0_0_20px_rgba(0,229,255,0.45)]" />
            <span className="font-extrabold tracking-tight text-white group-hover:text-cyan-200">
              Neon Blobs
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/shop"
              className="rounded-lg px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              Shop
            </Link>
            <Link
              href="/play"
              className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,229,255,0.25)] hover:bg-cyan-500"
            >
              Play
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="relative">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 py-12 md:grid-cols-2 md:py-16">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
                <Sparkles size={14} className="text-cyan-300" />
                .io arena • fast & neon
              </div>
              <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Dominate the map. <span className="text-cyan-300">Grow</span>, avoid, <span className="text-amber-300">conquer</span>.
              </h1>
              <p className="mb-6 max-w-xl text-white/70">
                Collect particles, activate power-ups (Magnet & Shield), shoot projectiles and climb the leaderboard.
                Free cosmetics in Shop – no pay-to-win.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/play"
                  className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(0,229,255,0.35)] transition hover:translate-y-[-1px] hover:bg-cyan-500"
                >
                  Play now
                </Link>
                <Link
                  href="/shop"
                  className="rounded-xl bg-white/10 px-5 py-3 font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-white/15"
                >
                  Open Shop
                </Link>
              </div>

              {/* Mini “how-to” */}
              <ul className="mt-6 grid gap-2 text-sm text-white/65">
                <li>• WASD / arrows – movement • Space – dash • Click/F – fire</li>
                <li>• Hotspots give x2 score • Boss = big reward</li>
              </ul>
            </div>

            {/* Visual card (placeholder “screenshot”) */}
            <div className="relative h-[260px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a1020] shadow-[0_25px_70px_rgba(0,0,0,0.45)] sm:h-[320px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,229,255,0.25),transparent_45%),radial-gradient(circle_at_30%_70%,rgba(255,215,0,0.18),transparent_45%)]" />
              <div className="absolute left-6 top-6 flex items-center gap-2 rounded-lg bg-black/40 px-3 py-1 text-xs ring-1 ring-white/10">
                <Gamepad2 size={14} className="text-cyan-300" /> Live Arena
              </div>
              <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-3 p-4 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] ring-1 ring-white/10"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-5 py-12">
            <h2 className="mb-6 text-center text-2xl font-extrabold tracking-tight">Why you&apos;ll love it</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Feature
                icon={<Zap className="text-cyan-300" size={18} />}
                title="Fast gameplay"
                desc="Smooth movement, dashes, projectiles and clear collisions."
              />
              <Feature
                icon={<Shield className="text-amber-300" size={18} />}
                title="Power-ups smart"
                desc="Magnet homing & visible Shield – control over the flow."
              />
              <Feature
                icon={<Crown className="text-fuchsia-300" size={18} />}
                title="Hotspots & Boss"
                desc="x2 zones and rare bosses for score spikes."
              />
              <Feature
                icon={<Palette className="text-emerald-300" size={18} />}
                title="FREE cosmetics"
                desc="Futuristic skins & trails, saved locally – no P2W."
              />
              <Feature
                icon={<Sparkles className="text-sky-300" size={18} />}
                title="Kill feed & effects"
                desc="Satisfying feedback: floaters, pings, clear feed."
              />
              <Feature
                icon={<Gamepad2 className="text-white/90" size={18} />}
                title="Instant play"
                desc="Zero installation. Open, enter, have fun."
              />
            </div>

            {/* CTA strip */}
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-center ring-1 ring-white/10">
              <p className="mb-4 text-white/80">Ready?</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/play"
                  className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(0,229,255,0.35)] transition hover:translate-y-[-1px] hover:bg-cyan-500"
                >
                  Start new game
                </Link>
                <Link
                  href="/shop"
                  className="rounded-xl bg-white/10 px-5 py-3 font-semibold text-white/90 ring-1 ring-white/15 transition hover:bg-white/15"
                >
                  Customize your look
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Neon Blobs. All rights reserved.</p>
          <nav className="flex items-center gap-3">
            <Link href="/play" className="hover:text-white">Play</Link>
            <Link href="/shop" className="hover:text-white">Shop</Link>
            <a
              className="hover:text-white"
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Components ---------- */

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}): React.ReactElement {
  return (
    <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10">
      <div className="mb-2 inline-flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-black/40 ring-1 ring-white/10">
          {icon}
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-white/70">{desc}</p>
    </div>
  );
}
