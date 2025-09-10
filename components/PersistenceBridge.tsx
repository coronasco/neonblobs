'use client';
import { useEffect } from 'react';
import { useGameStore } from '@/lib/state/useGameStore';

export default function PersistenceBridge(): null {
  const setCountry = useGameStore((s) => s.setCountry);
  const addCountryPoints = useGameStore((s) => s.addCountryPoints);

  useEffect(() => {
    // Load la pornire
    try {
      const savedCountry = localStorage.getItem('country');
      const savedScores = localStorage.getItem('countryScores');
      if (savedCountry) setCountry(savedCountry);
      if (savedScores) {
        const obj = JSON.parse(savedScores) as Record<string, number>;
        for (const [code, pts] of Object.entries(obj)) {
          if (pts > 0) addCountryPoints(code, pts); // adună incremental
        }
      }
    } catch { /* ignore */ }

    // Subscribe: salvăm când se schimbă store-ul
    const unsub1 = useGameStore.subscribe((s) => {
      try { if (s.country) localStorage.setItem('country', s.country); } catch {}
    });
    const unsub2 = useGameStore.subscribe((s) => {
      try { localStorage.setItem('countryScores', JSON.stringify(s.countryScores)); } catch {}
    });
    return () => { unsub1(); unsub2(); };
  }, [setCountry, addCountryPoints]);

  return null;
}
