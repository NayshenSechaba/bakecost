import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { PlanType, PLAN_LIMITS } from '@/lib/plans';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  bakeryId: string | null;
  userRole: 'owner' | 'staff' | null;
  plan: PlanType;
  planLimits: typeof PLAN_LIMITS[PlanType];
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [bakeryId, setBakeryId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'staff' | null>(null);
  const [plan, setPlan] = useState<PlanType>('free');
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.user) {
      setUser(null); setSession(null); setBakeryId(null); setUserRole(null);
      setPlan('free'); setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('bakery_id, role')
      .eq('id', currentSession.user.id)
      .single();

    let currentPlan: PlanType = 'free';
    if (profile?.bakery_id) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('bakery_id', profile.bakery_id)
        .eq('status', 'active')
        .single();
      if (sub?.plan) currentPlan = sub.plan as PlanType;
    }

    setUser(currentSession.user);
    setSession(currentSession);
    setBakeryId(profile?.bakery_id || null);
    setUserRole((profile?.role as any) || null);
    setPlan(currentPlan);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => loadProfile(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => loadProfile(s));
    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ user, session, bakeryId, userRole, plan, planLimits: PLAN_LIMITS[plan], loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
