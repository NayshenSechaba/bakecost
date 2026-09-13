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
          <Settings className="w-5 h-5 text-[#C68A4C]" /> Settings
        </h1>
      </div>

      <div className="page-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Account Details */}
          <section className="card">
            <h2 className="text-base font-bold mb-4 flex items-center text-slate-900">
              <User className="w-5 h-5 mr-2 text-[#C68A4C]" />
              Account Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="input-label mb-1 block">Email</label>
                <div className="bg-sand-50 border border-[#E3DED6] p-3 rounded-xl text-sm text-slate-900 font-medium">
                  {user?.email}
                </div>
              </div>
              
              <div>
                <label className="input-label mb-1 block">Role</label>
                <div className="bg-sand-50 border border-[#E3DED6] px-3 py-1.5 rounded-xl capitalize text-sm inline-block font-semibold text-slate-700">
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
                  <div className="bg-sand-50 border border-[#E3DED6] p-3 rounded-xl flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-900">{bakeryName || 'No bakery associated'}</span>
                    {isOwner && (
                      <button onClick={() => setIsEditing(true)} className="text-[#C68A4C] hover:text-[#9A6430] p-1">
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
              <h2 className="text-base font-bold mb-4 flex items-center text-slate-900">
                <CreditCard className="w-5 h-5 mr-2 text-[#C68A4C]" />
                Subscription
              </h2>
              <div className="flex items-center justify-between bg-sand-50 border border-[#E3DED6] p-4 rounded-xl">
                <div>
                  <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Current Plan</span>
                  <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold ${
                    currentPlan === 'Free' ? 'bg-sand-200 text-slate-700' :
                    currentPlan === 'Monthly' ? 'bg-[#C68A4C] text-white' :
                    'bg-[#FAEEDA] text-[#854F0B] border border-[#F7E1B5]'
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
                  <h3 className="font-bold text-sm text-slate-900">Manage Team</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Invite staff and manage bakery members</p>
                </div>
                <Link href="/team" className="btn btn-secondary btn-sm">
                  View Team
                </Link>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="card border-[#F5C2C7]">
              <h2 className="text-base font-bold mb-2 text-[#A32D2D]">Sign Out</h2>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Sign out of your Doughnomics session.</span>
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
