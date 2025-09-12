'use client';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Gamepad2, Sparkles, Crown, Zap, Shield, Palette, Play, ArrowRight, Globe, Magnet, Move } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { COUNTRY_NAMES, flagEmoji } from '@/lib/countries';

type CountryData = { country_code: string; points: number };

export default function Home(): React.ReactElement {
  const [topCountries, setTopCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTopCountries() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('country_scores')
          .select('country_code, points')
          .order('points', { ascending: false })
          .limit(4);
        
        if (error) {
          console.error('Failed to load country leaderboard');
          setTopCountries([]);
        } else {
          setTopCountries(data ?? []);
        }
      } catch (error) {
        console.error('Error loading countries:', error);
        setTopCountries([]);
      } finally {
        setLoading(false);
      }
    }
    loadTopCountries();
  }, []);

  return (
    <>
      
      <div className="min-h-[100dvh] bg-[#070b16] text-white">
      {/* SIMPLE GRID - PĂTRĂȚELE VIZIBILE */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        {/* GRID SIMPLU CU PĂTRĂȚELE */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
        
        {/* PĂTRĂȚELE CU FUNDAL */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
        
        {/* PĂTRĂȚELE MICI */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(168,85,247,0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168,85,247,0.2) 1px, transparent 1px)
          `,
          backgroundSize: '25px 25px'
        }} />
      </div>

      {/* Enhanced Header */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="group inline-flex items-center gap-3">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-400 via-purple-400 to-amber-300 shadow-[0_0_25px_rgba(0,229,255,0.6)]" />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-cyan-400 via-purple-400 to-amber-300 opacity-20 blur-sm" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-cyan-200 transition-colors">
                Blobeer
              </span>
              <div className="text-xs text-cyan-300/70 font-medium">Arena Battle</div>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/shop"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <Palette size={16} className="inline mr-2" />
              Shop
            </Link>
            <Link
              href="/play"
              className="group rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_25px_rgba(0,229,255,0.3)] hover:shadow-[0_12px_35px_rgba(0,229,255,0.4)] hover:scale-105 transition-all duration-200"
            >
              <Play size={16} className="inline mr-2" />
              Play Now
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="relative">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-20 z-0">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 px-4 py-2 text-sm font-medium text-cyan-300 ring-1 ring-cyan-400/30">
                  <Globe size={16} className="text-cyan-300" />
                  <span>Multiplayer Arena Battle</span>
                </div>
                
                <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                  <span className="block">Master the</span>
                  <span className="block bg-gradient-to-r from-cyan-300 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                    Blobeer Arena
                  </span>
                </h1>
                
                <p className="text-xl text-white/80 max-w-2xl leading-relaxed">
                  Experience intense multiplayer battles where strategy meets action. 
                  <span className="text-cyan-300 font-semibold"> Grow</span> your blob, 
                  <span className="text-amber-300 font-semibold"> collect</span> power-ups, and 
                  <span className="text-purple-300 font-semibold"> dominate</span> the arena.
                </p>
              </div>

              {/* Game Features */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={16} className="text-cyan-300" />
                    <span className="text-sm font-medium text-white/70">Fast Action</span>
                  </div>
                  <div className="text-sm text-white/80">60fps gameplay</div>
                </div>
                <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield size={16} className="text-amber-300" />
                    <span className="text-sm font-medium text-white/70">Power-ups</span>
                  </div>
                  <div className="text-sm text-white/80">Magnet & Shield</div>
                </div>
                <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown size={16} className="text-purple-300" />
                    <span className="text-sm font-medium text-white/70">Boss Battles</span>
                  </div>
                  <div className="text-sm text-white/80">Epic encounters</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/play"
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-8 py-4 font-bold text-white shadow-[0_15px_35px_rgba(0,229,255,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_45px_rgba(0,229,255,0.5)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center gap-3">
                    <Play size={20} />
                    <span>Start Playing</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
                <Link
                  href="/shop"
                  className="rounded-2xl bg-white/10 px-6 py-4 font-semibold text-white/90 ring-1 ring-white/20 transition-all duration-200 hover:bg-white/15 hover:ring-white/30"
                >
                  <Palette size={18} className="inline mr-2" />
                  Customize
                </Link>
              </div>

              {/* Controls */}
              <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                  <Gamepad2 size={16} className="text-cyan-300" />
                  Controls
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
                  <div>• <span className="text-cyan-300">WASD/Arrows</span> - Move</div>
                  <div>• <span className="text-amber-300">Space</span> - Dash</div>
                  <div>• <span className="text-purple-300">Click/F</span> - Fire</div>
                  <div>• <span className="text-green-300">Hotspots</span> - x2 Score</div>
                </div>
              </div>
            </div>

            {/* Enhanced Game Preview */}
            <div className="relative group">
              <div className="relative h-[400px] w-full overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-[#0a1020] to-[#1a1a2e] shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                {/* Animated background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,229,255,0.3),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.2),transparent_50%),radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.15),transparent_60%)]" />
                
                {/* Floating particles */}
                <div className="absolute inset-0">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute h-2 w-2 rounded-full bg-cyan-400/40 animate-pulse"
                      style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${2 + Math.random() * 2}s`
                      }}
                    />
                  ))}
                </div>

                {/* Game UI Elements */}
                <div className="absolute left-6 top-6 flex items-center gap-3 rounded-xl bg-black/60 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
                  <Gamepad2 size={16} className="text-cyan-300" />
                  <span>Blobeer Arena</span>
                </div>

                {/* Power-ups Preview */}
                <div className="absolute right-6 top-6 rounded-xl bg-black/60 p-4 ring-1 ring-white/20 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-white/70 mb-3">Power-ups</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-white/90">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                        <Magnet className="w-4 h-4 text-white" />
                      </div>
                      <span>Magnet</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/90">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <span>Shield</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-white/90">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                        <Move className="w-4 h-4 text-white" />
                      </div>
                      <span>Dash</span>
                    </div>
                  </div>
                </div>

                {/* Gameplay elements */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Player blob */}
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 shadow-[0_0_30px_rgba(0,229,255,0.8)] animate-pulse" />
                    {/* Trail effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/30 to-blue-400/30 blur-xl animate-pulse" />
                  </div>
                </div>

                {/* Top Countries */}
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="mb-3 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 ring-1 ring-white/20 backdrop-blur-sm">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-semibold text-white/90">Top Countries</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {loading ? (
                      <div className="col-span-4 flex items-center justify-center rounded-lg bg-black/40 p-6 ring-1 ring-white/10">
                        <div className="text-sm text-white/60">Loading countries...</div>
                      </div>
                    ) : topCountries.length > 0 ? (
                      topCountries.map((country, i) => {
                        const colors = ['text-blue-300', 'text-yellow-300', 'text-red-300', 'text-pink-300'];
                        const bgColors = ['bg-blue-500/20', 'bg-yellow-500/20', 'bg-red-500/20', 'bg-pink-500/20'];
                        const ringColors = ['ring-blue-400/30', 'ring-yellow-400/30', 'ring-red-400/30', 'ring-pink-400/30'];
                        return (
                          <div key={country.country_code} className={`rounded-lg ${bgColors[i]} p-3 ring-1 ${ringColors[i]} backdrop-blur-sm`}>
                            <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                              <span className="text-lg">{flagEmoji(country.country_code)}</span>
                              <span className="font-medium">{COUNTRY_NAMES[country.country_code] || country.country_code}</span>
                            </div>
                            <div className={`text-lg font-bold ${colors[i]}`}>
                              {(country.points / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-white/50 mt-1">
                              #{i + 1} place
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-4 flex flex-col items-center justify-center rounded-lg bg-black/40 p-6 ring-1 ring-white/10 text-center">
                        <div className="text-lg font-bold text-white/90 mb-2">🌍 Global Arena Awaits!</div>
                        <div className="text-sm text-white/60 mb-3">
                          Not enough countries yet. Be the first to represent your nation!
                        </div>
                        <div className="text-xs text-white/50">
                          Sign up and fight for your country&apos;s glory
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              {/* Glow effect */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </div>
          </div>
        </section>

        {/* Enhanced Features */}
        <section className="border-t border-white/10 bg-gradient-to-b from-transparent to-black/20">
          <div className="mx-auto max-w-7xl px-5 py-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold tracking-tight mb-4">
                Why <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">Players Choose Blobeer</span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Experience the perfect blend of strategy, skill, and style in the most engaging multiplayer arena battle game
              </p>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Feature
                icon={<Zap className="text-cyan-300" size={24} />}
                title="Lightning Fast Action"
                desc="60fps gameplay with smooth movement, instant dashes, and responsive controls that feel natural."
              />
              <Feature
                icon={<Shield className="text-amber-300" size={24} />}
                title="Strategic Power-ups"
                desc="Smart Magnet system and visible Shield mechanics give you complete control over every encounter."
              />
              <Feature
                icon={<Crown className="text-fuchsia-300" size={24} />}
                title="Epic Boss Battles"
                desc="Face rare bosses in special zones for massive score multipliers and legendary rewards."
              />
              <Feature
                icon={<Palette className="text-emerald-300" size={24} />}
                title="Free Customization"
                desc="Unlock futuristic skins and trails through gameplay. No pay-to-win, just pure skill progression."
              />
              <Feature
                icon={<Sparkles className="text-sky-300" size={24} />}
                title="Satisfying Feedback"
                desc="Every action feels rewarding with particle effects, kill feeds, and satisfying audio cues."
              />
              <Feature
                icon={<Gamepad2 className="text-white/90" size={24} />}
                title="Instant Access"
                desc="No downloads, no waiting. Click and play immediately in your browser on any device."
              />
            </div>

            {/* Enhanced CTA */}
            <div className="mt-20 relative">
              <div className="rounded-3xl border border-white/20 bg-gradient-to-r from-white/5 to-white/10 p-8 text-center ring-1 ring-white/10 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Ready to <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">Battle</span>?
                  </h3>
                  <p className="text-lg text-white/80 mb-8">
                    Join the ultimate multiplayer arena experience. Your journey to become the Blobeer champion starts now.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link
                      href="/play"
                      className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 px-8 py-4 font-bold text-white shadow-[0_15px_35px_rgba(0,229,255,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_45px_rgba(0,229,255,0.5)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative flex items-center gap-3">
                        <Play size={20} />
                        <span>Start Your Journey</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                    <Link
                      href="/shop"
                      className="rounded-2xl bg-white/10 px-6 py-4 font-semibold text-white/90 ring-1 ring-white/20 transition-all duration-200 hover:bg-white/15 hover:ring-white/30 hover:scale-105"
                    >
                      <Palette size={18} className="inline mr-2" />
                      Customize Style
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Background glow */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-amber-500/10 blur-xl -z-10" />
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="mt-20 border-t border-white/10 bg-gradient-to-t from-black/40 to-transparent py-12">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-400 via-purple-400 to-amber-300 shadow-[0_0_25px_rgba(0,229,255,0.6)]" />
                <span className="text-xl font-bold text-white">Blobeer</span>
              </div>
              <p className="text-white/70 text-sm max-w-xs">
                The ultimate multiplayer arena battle game. Fast, competitive, and completely free to play.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Game</h4>
              <nav className="space-y-2">
                <Link href="/play" className="block text-sm text-white/70 hover:text-white transition-colors">Play Now</Link>
                <Link href="/shop" className="block text-sm text-white/70 hover:text-white transition-colors">Shop</Link>
                <Link href="/login" className="block text-sm text-white/70 hover:text-white transition-colors">Login</Link>
              </nav>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Community</h4>
              <nav className="space-y-2">
                <a href="#" className="block text-sm text-white/70 hover:text-white transition-colors">Discord</a>
                <a href="#" className="block text-sm text-white/70 hover:text-white transition-colors">Twitter</a>
                <a href="#" className="block text-sm text-white/70 hover:text-white transition-colors">Reddit</a>
              </nav>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <nav className="space-y-2">
                <a href="#" className="block text-sm text-white/70 hover:text-white transition-colors">Help Center</a>
                <a href="#" className="block text-sm text-white/70 hover:text-white transition-colors">Report Bug</a>
                <a href="#" className="block text-sm text-white/70 hover:text-white transition-colors">Contact</a>
              </nav>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/60">© {new Date().getFullYear()} Blobeer. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Terms of Service</a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
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
    <div className="group relative overflow-hidden rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition-all duration-300 hover:bg-white/10 hover:ring-white/20 hover:scale-105">
      <div className="relative z-10">
        <div className="mb-4 inline-flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/20 group-hover:ring-white/30 transition-all duration-300">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-cyan-200 transition-colors">{title}</h3>
        </div>
        <p className="text-white/80 leading-relaxed">{desc}</p>
      </div>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
