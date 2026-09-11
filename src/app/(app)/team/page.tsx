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
    <div className="p-6 max-w-4xl mx-auto text-[#F7EBD6] pb-24">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="text-[#F7EBD6]/60 hover:text-[#F7EBD6]">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold flex items-center">
            <Users className="w-8 h-8 mr-3 text-[#C8792A]" />
            Team
          </h1>
        </div>
        {bakeryName && <p className="text-[#F7EBD6]/70 ml-8">{bakeryName}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-[#6B3A1F] rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-[#C8792A]" />
              Active Members
            </h2>
            {isLoading ? (
              <p className="text-sm text-[#F7EBD6]/60">Loading members...</p>
            ) : (
              <ul className="space-y-4">
                {members.map(m => (
                  <li key={m.id} className="flex items-center justify-between bg-[#3B2416] p-3 rounded-lg">
                    <span className="font-medium">{m.id === user?.id ? `${user.email} (You)` : `Member #${m.id.substring(0, 6)}`}</span>
                    <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold ${
                      m.role === 'owner' ? 'bg-[#C8792A] text-[#3B2416]' : 'bg-[#F7EBD6]/20 text-[#F7EBD6]'
                    }`}>
                      {m.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {isOwner && (
          <div className="space-y-6">
            <div className="bg-[#6B3A1F] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-[#C8792A]" />
                Invite Team Member
              </h2>
              <form onSubmit={handleInvite} className="flex flex-col gap-3 mb-6">
                <input
                  type="email"
                  required
                  placeholder="Staff email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-[#3B2416] border border-[#C8792A]/30 rounded-lg px-4 py-2 text-[#F7EBD6] placeholder:text-[#F7EBD6]/50 focus:outline-none focus:border-[#C8792A]"
                />
                <button 
                  type="submit"
                  className="bg-[#C8792A] hover:bg-[#C8792A]/90 text-[#3B2416] px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  Send Invite
                </button>
              </form>

              {invites.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#F7EBD6]/70 mb-3 uppercase tracking-wider">Pending Invites</h3>
                  <ul className="space-y-2">
                    {invites.map(inv => (
                      <li key={inv.id} className="flex items-center justify-between bg-[#3B2416] p-3 rounded-lg text-sm">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-[#F7EBD6]/50" />
                          {inv.invited_email}
                        </div>
                        <button
                          onClick={() => handleRevoke(inv.id)}
                          className="text-[#E8A9B8] hover:bg-[#E8A9B8]/10 p-1 rounded transition-colors"
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
          </div>
        )}
      </div>

      <UpgradePrompt
        feature="Team Invitations"
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
