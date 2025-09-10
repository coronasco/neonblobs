'use client';
import { useEffect } from 'react';
import { useSettings } from '@/lib/state/useSettings';
import { setSfxEnabled } from '@/lib/audio/sfx';

export default function SettingsPanel(): React.ReactElement {
  const sound = useSettings((s) => s.sound);
  const haptics = useSettings((s) => s.haptics);
  const setSound = useSettings((s) => s.setSound);
  const setHaptics = useSettings((s) => s.setHaptics);

  useEffect(() => {
    try { localStorage.setItem('settings.sound', JSON.stringify(sound)); } catch {}
    setSfxEnabled(sound);
  }, [sound]);
  useEffect(() => {
    try { localStorage.setItem('settings.haptics', JSON.stringify(haptics)); } catch {}
  }, [haptics]);
  useEffect(() => {
    try {
      const s = localStorage.getItem('settings.sound');
      const h = localStorage.getItem('settings.haptics');
      if (s !== null) setSound(JSON.parse(s));
      if (h !== null) setHaptics(JSON.parse(h));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pointer-events-auto absolute right-4 top-20 z-20 flex gap-2">
      <button
        onClick={() => setSound(!sound)}
        className={`rounded-lg px-3 py-2 text-sm ring-1 ${
          sound ? 'bg-white/10 text-white ring-white/20' : 'bg-black/30 text-white/60 ring-white/10'
        }`}
        aria-pressed={sound}
        aria-label="Toggle sound"
        title="Sound effects on/off"
      >
        {sound ? '🔊 Sound ON' : '🔇 Sound OFF'}
      </button>
      <button
        onClick={() => setHaptics(!haptics)}
        className={`rounded-lg px-3 py-2 text-sm ring-1 ${
          haptics ? 'bg-white/10 text-white ring-white/20' : 'bg-black/30 text-white/60 ring-white/10'
        }`}
        aria-pressed={haptics}
        aria-label="Toggle vibration"
        title="Vibration on/off (mobile)"
      >
        {haptics ? '📳 Vibration ON' : '📴 Vibration OFF'}
      </button>
    </div>
  );
}
