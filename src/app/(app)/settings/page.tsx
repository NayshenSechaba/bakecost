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
    <div className="p-6 max-w-2xl mx-auto text-[#F7EBD6] pb-24">
      <div className="mb-8 flex items-center">
        <Settings className="w-8 h-8 mr-3 text-[#C8792A]" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Account Section */}
        <section className="bg-[#6B3A1F] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-[#C8792A]" />
            Account Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#F7EBD6]/70 mb-1">Email</label>
              <div className="bg-[#3B2416] p-3 rounded-lg">{user?.email}</div>
            </div>
            
            <div>
              <label className="block text-sm text-[#F7EBD6]/70 mb-1">Role</label>
              <div className="bg-[#3B2416] p-3 rounded-lg capitalize inline-block">
                {userRole || 'User'}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#F7EBD6]/70 mb-1">Bakery Name</label>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 bg-[#3B2416] border border-[#C8792A] rounded-lg px-3 py-2 focus:outline-none"
                  />
                  <button onClick={handleUpdateName} className="bg-[#C8792A] text-[#3B2416] px-4 py-2 rounded-lg font-bold">
                    Save
                  </button>
                  <button onClick={() => { setIsEditing(false); setNewName(bakeryName); }} className="bg-[#3B2416] px-4 py-2 rounded-lg">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="bg-[#3B2416] p-3 rounded-lg flex justify-between items-center">
                  <span>{bakeryName || 'No bakery associated'}</span>
                  {isOwner && (
                    <button onClick={() => setIsEditing(true)} className="text-[#C8792A] hover:text-[#C8792A]/80">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="bg-[#6B3A1F] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-[#C8792A]" />
            Subscription
          </h2>
          <div className="flex items-center justify-between bg-[#3B2416] p-4 rounded-lg">
            <div>
              <span className="block text-sm text-[#F7EBD6]/70 mb-1">Current Plan</span>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                currentPlan === 'Free' ? 'bg-[#F7EBD6]/20 text-[#F7EBD6]' :
                currentPlan === 'Monthly' ? 'bg-[#C8792A] text-[#3B2416]' :
                'bg-[#E8A9B8] text-[#3B2416]'
              }`}>
                {currentPlan}
              </span>
            </div>
            <Link href="/pricing" className="bg-[#C8792A] hover:bg-[#C8792A]/90 text-[#3B2416] px-4 py-2 rounded-lg font-bold transition-colors">
              Upgrade
            </Link>
          </div>
        </section>

        {/* Team Link */}
        <section className="bg-[#6B3A1F] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Manage Team</h3>
              <p className="text-sm text-[#F7EBD6]/70">Invite staff and manage team members</p>
            </div>
            <Link href="/team" className="bg-[#C8792A] text-[#3B2416] px-4 py-2 rounded-lg font-bold">
              View Team
            </Link>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-[#6B3A1F] rounded-xl p-6 border border-red-500/30">
          <h2 className="text-xl font-bold mb-4 text-red-400">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <span className="text-[#F7EBD6]/70">Sign out of your account on this device.</span>
            <button
              onClick={handleSignOut}
              className="flex items-center bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg font-bold transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
