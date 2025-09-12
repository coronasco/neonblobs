// lib/realtime/room.ts
import { supabase } from '@/lib/supabaseClient';

export type NetState = {
  id: string;   // userId sau guestId
  x: number; y: number; r: number; score: number; country?: string;
  t: number;    // client timestamp
};

export function makeGuestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'guest-' + Math.random().toString(36).slice(2);
}

export function joinGlobalRoom(key: string) {
  const channel = supabase.channel('room:global', {
    config: {
      presence: { key },           // presence pentru listă online
      broadcast: { ack: true },    // vrem ack pentru QoS
    },
  });

  return channel;
}
