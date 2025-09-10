'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { ensureUserInit } from '@/lib/auth/ensureUserInit';

type AuthCtx = {
  session: Session | null;
  userId: string | null;
  loading: boolean;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  userId: null,
  loading: true,
});

export function SupabaseProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsub: (() => void) | null = null;
  
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session ?? null);
      if (data.session?.user?.id) {
        await ensureUserInit(data.session.user.id);
      }
      setLoading(false);
    });
  
    const { data } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s ?? null);
      const uid = s?.user?.id;
      if (uid) await ensureUserInit(uid);
    });
    unsub = () => data.subscription.unsubscribe();
  
    return () => { unsub?.(); };
  }, []);

  return (
    <Ctx.Provider value={{ session, userId: session?.user?.id ?? null, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = (): AuthCtx => useContext(Ctx);
