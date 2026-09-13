'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import UpgradePrompt from '@/components/UpgradePrompt';
import { Users, Mail, Shield, UserPlus, X, ArrowLeft, Copy, Check, Share2, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const { user, bakeryId, userRole, planLimits, plan } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [members, setMembers] = useState<Profile[]>([]);
  const [invites, setInvites] = useState<BakeryInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [bakeryName, setBakeryName] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
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

  const getInviteUrl = (email: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/signup?email=${encodeURIComponent(email)}&invited=true`;
  };

  const handleCopyLink = async (inv: BakeryInvite) => {
    const url = getInviteUrl(inv.invited_email);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
      prompt('Copy this invite link:', url);
    }
  };

  const handleShareWhatsApp = (inv: BakeryInvite) => {
    const url = getInviteUrl(inv.invited_email);
    const text = encodeURIComponent(`Hi! Join our bakery team at ${bakeryName || 'our bakery'} on Doughnomic:\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

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
        invited_email: inviteEmail.trim().toLowerCase(),
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
            <Users className="w-5 h-5 text-[#C68A4C]" /> Team Members
          </h1>
          {bakeryName && <p className="text-xs text-slate-400 mt-0.5">{bakeryName}</p>}
        </div>
      </div>

      <div className="page-body">
        {/* Free plan notice if invites locked */}
        {!planLimits.canInvite && (
          <div className="mb-6 p-4 rounded-2xl bg-white border border-[#E3DED6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAEEDA] text-[#854F0B] flex items-center justify-center shrink-0">
                <Crown size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Multi-User Team Collaboration</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Upgrade to an Individual (Monthly or Annual) plan to invite staff, bakers, and managers to your bakery.
                </p>
              </div>
            </div>
            <Link href="/pricing" className="btn btn-primary btn-sm shrink-0 whitespace-nowrap">
              Upgrade Plan
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Active Members */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center text-slate-900">
                <Shield className="w-5 h-5 mr-2 text-[#C68A4C]" />
                Active Members
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sand-100 text-slate-600 border border-[#E3DED6]">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            
            {isLoading ? (
              <p className="text-xs text-slate-400">Loading members...</p>
            ) : (
              <ul className="space-y-3">
                {members.map(m => (
                  <li key={m.id} className="flex items-center justify-between bg-sand-50 border border-[#E3DED6] p-3.5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                        {m.id === user?.id ? (user.email?.[0]?.toUpperCase() || 'U') : 'M'}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900 block">
                          {m.id === user?.id ? `${user.email} (You)` : `Staff Member`}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ID: {m.id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                      m.role === 'owner' ? 'bg-[#C68A4C] text-white' : 'bg-sand-200 text-slate-700'
                    }`}>
                      {m.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Invite Member Form & Pending Invites */}
          {isOwner && (
            <div className="card">
              <h2 className="text-base font-bold mb-4 flex items-center text-slate-900">
                <UserPlus className="w-5 h-5 mr-2 text-[#C68A4C]" />
                Invite Team Member
              </h2>
              <form onSubmit={handleInvite} className="flex flex-col gap-3 mb-6">
                <div className="input-group">
                  <label className="input-label">Colleague Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="baker@yourbakery.co.za"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="input"
                  />
                </div>
                <button 
                  type="submit"
                  className="btn btn-primary btn-full"
                >
                  Send Invite Link
                </button>
              </form>

              {invites.length > 0 && (
                <div className="pt-4 border-t border-[#E3DED6]">
                  <h3 className="input-label mb-3">Pending Invitations ({invites.length})</h3>
                  <ul className="space-y-3">
                    {invites.map(inv => (
                      <li key={inv.id} className="bg-sand-50 border border-[#E3DED6] p-3 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-xs text-slate-800 font-semibold truncate pr-2">
                            <Mail className="w-4 h-4 mr-1.5 text-slate-400 shrink-0" />
                            <span className="truncate">{inv.invited_email}</span>
                          </div>
                          <button
                            onClick={() => handleRevoke(inv.id)}
                            className="text-slate-400 hover:text-[#A32D2D] p-1 transition-colors"
                            title="Revoke Invite"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(inv)}
                            className="btn btn-secondary btn-sm flex-1 text-xs py-1.5 flex items-center justify-center gap-1.5"
                          >
                            {copiedId === inv.id ? (
                              <>
                                <Check size={14} className="text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Link Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(inv)}
                            className="btn btn-secondary btn-sm text-xs py-1.5 px-3 flex items-center gap-1 hover:bg-[#EAF5EC] hover:text-[#1E7E34] hover:border-[#1E7E34]"
                            title="Share via WhatsApp"
                          >
                            <Share2 size={14} />
                            <span>WhatsApp</span>
                          </button>
                        </div>
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
