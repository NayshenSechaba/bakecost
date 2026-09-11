'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { Settings, User, CreditCard, LogOut, Edit2 } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, bakeryId, userRole, plan, signOut } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  
  const [bakeryName, setBakeryName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  
  const isOwner = userRole === 'owner';
  const currentPlan = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Free';

  useEffect(() => {
    async function loadBakery() {
      if (!bakeryId) return;
      
      const { data } = await supabase
        .from('bakeries')
        .select('name')
        .eq('id', bakeryId)
        .single();
        
      if (data) {
        setBakeryName(data.name);
        setNewName(data.name);
      }
    }
    
    loadBakery();
  }, [bakeryId, supabase]);

  const handleUpdateName = async () => {
    if (!bakeryId) return;
    
    const { error } = await supabase
      .from('bakeries')
      .update({ name: newName })
      .eq('id', bakeryId);
      
    if (!error) {
      setBakeryName(newName);
      setIsEditing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#C8792A]" /> Settings
        </h1>
      </div>

      <div className="page-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Account Details */}
          <section className="card">
            <h2 className="text-base font-bold mb-4 flex items-center text-primary">
              <User className="w-5 h-5 mr-2 text-[#C8792A]" />
              Account Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="input-label mb-1 block">Email</label>
                <div className="bg-[var(--bg-base)] border border-[var(--border)] p-3 rounded-lg text-sm text-[var(--text-primary)]">
                  {user?.email}
                </div>
              </div>
              
              <div>
                <label className="input-label mb-1 block">Role</label>
                <div className="bg-[var(--bg-base)] border border-[var(--border)] px-3 py-1.5 rounded-lg capitalize text-sm inline-block font-semibold">
                  {userRole || 'User'}
                </div>
              </div>

              <div>
                <label className="input-label mb-1 block">Bakery Name</label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="input flex-1"
                    />
                    <button onClick={handleUpdateName} className="btn btn-primary btn-sm">
                      Save
                    </button>
                    <button onClick={() => { setIsEditing(false); setNewName(bakeryName); }} className="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="bg-[var(--bg-base)] border border-[var(--border)] p-3 rounded-lg flex justify-between items-center text-sm">
                    <span className="font-medium">{bakeryName || 'No bakery associated'}</span>
                    {isOwner && (
                      <button onClick={() => setIsEditing(true)} className="text-[#C8792A] hover:text-[#C8792A]/80 p-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Subscription & Team */}
          <div className="flex flex-col gap-6">
            <section className="card">
              <h2 className="text-base font-bold mb-4 flex items-center text-primary">
                <CreditCard className="w-5 h-5 mr-2 text-[#C8792A]" />
                Subscription
              </h2>
              <div className="flex items-center justify-between bg-[var(--bg-base)] border border-[var(--border)] p-4 rounded-lg">
                <div>
                  <span className="block text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1">Current Plan</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    currentPlan === 'Free' ? 'bg-[var(--text-primary)]/10 text-[var(--text-primary)]' :
                    currentPlan === 'Monthly' ? 'bg-[#C8792A] text-[#3B2416]' :
                    'bg-[#E8A9B8] text-[#3B2416]'
                  }`}>
                    {currentPlan}
                  </span>
                </div>
                <Link href="/pricing" className="btn btn-primary btn-sm">
                  Upgrade
                </Link>
              </div>
            </section>

            {/* Team Link */}
            <section className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">Manage Team</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Invite staff and manage team members</p>
                </div>
                <Link href="/team" className="btn btn-secondary btn-sm">
                  View Team
                </Link>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="card border-red-500/30">
              <h2 className="text-base font-bold mb-3 text-red-400">Sign Out</h2>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Sign out of your Doughnomics session.</span>
                <button
                  onClick={handleSignOut}
                  className="btn btn-danger btn-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
