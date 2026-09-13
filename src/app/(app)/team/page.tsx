'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import UpgradePrompt from '@/components/UpgradePrompt';
import { Users, Mail, Shield, UserPlus, X, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Profile {
  id: string;
  role: string;
}

interface BakeryInvite {
  id: string;
  bakery_id: string;
  invited_email: string;
  invited_by: string;
  role: string;
  status: string;
  created_at: string;
}

export default function TeamPage() {
  const { user, bakeryId, userRole, planLimits } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [members, setMembers] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<BakeryInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [bakeryName, setBakeryName] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const isOwner = userRole === 'owner';

  useEffect(() => {
    async function loadData() {
      if (!bakeryId) return;
      
      const { data: bakery } = await supabase
        .from('bakeries')
        .select('name')
        .eq('id', bakeryId)
        .single();
        
      if (bakery) setBakeryName(bakery.name);

      const { data: membersData } = await supabase
        .from('profiles')
        .select('*')
        .eq('bakery_id', bakeryId);
        
      if (membersData) setMembers(membersData);

      const { data: invitesData } = await supabase
        .from('bakery_invites')
        .select('*')
        .eq('bakery_id', bakeryId)
        .eq('status', 'pending');
        
      if (invitesData) setInvites(invitesData);
      
      setIsLoading(false);
    }
    
    loadData();
  }, [bakeryId, supabase]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planLimits.canInvite) {
      setShowUpgradeModal(true);
      return;
    }
    if (!bakeryId || !user?.id) return;

    const { data, error } = await supabase
      .from('bakery_invites')
      .insert({
        bakery_id: bakeryId,
        invited_email: inviteEmail,
        invited_by: user.id,
        role: 'staff',
        status: 'pending'
      })
      .select()
      .single();

    if (!error && data) {
      setInvites([...invites, data]);
      setInviteEmail('');
    } else if (error) {
      alert(error.message);
    }
  };

  const handleRevoke = async (id: string) => {
    const { error } = await supabase
      .from('bakery_invites')
      .update({ status: 'revoked' })
      .eq('id', id);

    if (!error) {
      setInvites(invites.filter(inv => inv.id !== id));
    }
  };

  return (
    <>
      <div className="page-header">
        <button onClick={() => router.back()} className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C68A4C]" /> Team
          </h1>
          {bakeryName && <p className="text-xs text-slate-400 mt-0.5">{bakeryName}</p>}
        </div>
      </div>

      <div className="page-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Active Members */}
          <div className="card">
            <h2 className="text-base font-bold mb-4 flex items-center text-slate-900">
              <Shield className="w-5 h-5 mr-2 text-[#C68A4C]" />
              Active Members
            </h2>
            {isLoading ? (
              <p className="text-xs text-slate-400">Loading members...</p>
            ) : (
              <ul className="space-y-3">
                {members.map(m => (
                  <li key={m.id} className="flex items-center justify-between bg-sand-50 border border-[#E3DED6] p-3 rounded-xl">
                    <span className="text-sm font-semibold text-slate-900">
                      {m.id === user?.id ? `${user.email} (You)` : `Member #${m.id.substring(0, 6)}`}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full uppercase font-bold ${
                      m.role === 'owner' ? 'bg-[#C68A4C] text-white' : 'bg-sand-200 text-slate-700'
                    }`}>
                      {m.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Invite Member */}
          {isOwner && (
            <div className="card">
              <h2 className="text-base font-bold mb-4 flex items-center text-slate-900">
                <UserPlus className="w-5 h-5 mr-2 text-[#C68A4C]" />
                Invite Team Member
              </h2>
              <form onSubmit={handleInvite} className="flex flex-col gap-3 mb-6">
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@bakery.co.za"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input"
                  />
                </div>
                <button 
                  type="submit"
                  className="btn btn-primary btn-full"
                >
                  Send Invite
                </button>
              </form>

              {invites.length > 0 && (
                <div>
                  <h3 className="input-label mb-3">Pending Invites</h3>
                  <ul className="space-y-2">
                    {invites.map(inv => (
                      <li key={inv.id} className="flex items-center justify-between bg-sand-50 border border-[#E3DED6] p-3 rounded-xl text-sm">
                        <div className="flex items-center text-xs text-slate-800 font-medium">
                          <Mail className="w-4 h-4 mr-2 text-slate-400" />
                          {inv.invited_email}
                        </div>
                        <button
                          onClick={() => handleRevoke(inv.id)}
                          className="btn btn-ghost btn-sm text-[#A32D2D] hover:bg-[#FBEAEB]"
                          title="Revoke Invite"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <UpgradePrompt
        feature="Team Invitations"
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
