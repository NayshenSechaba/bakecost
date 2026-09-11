'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
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

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadData(currentSession: Session | null) {
      if (!currentSession?.user) {
        if (mounted) {
          setUser(null);
          setSession(null);
          setBakeryId(null);
          setUserRole(null);
          setPlan('free');
          setLoading(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('bakery_id, role')
        .eq('id', currentSession.user.id)
        .single();

      let currentPlan: PlanType = 'free';
      if (profile?.bakery_id) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('bakery_id', profile.bakery_id)
          .eq('status', 'active')
          .single();
        if (subscription?.plan) {
          currentPlan = subscription.plan as PlanType;
        }
      }

      if (mounted) {
        setUser(currentSession.user);
        setSession(currentSession);
        setBakeryId(profile?.bakery_id || null);
        setUserRole(profile?.role || null);
        setPlan(currentPlan);
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadData(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadData(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    session,
    bakeryId,
    userRole,
    plan,
    planLimits: PLAN_LIMITS[plan],
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
