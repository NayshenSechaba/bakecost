'use client';

import React from 'react';
import Link from 'next/link';
import { Check, X, Crown, Sparkles, ArrowLeft } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#3B2416] text-[#F7EBD6] p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <Link href="/login" className="inline-flex items-center text-[#E8A9B8] hover:text-[#F7EBD6] transition-colors mb-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Doughnomics
        </Link>
        
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-[#F7EBD6]/70 text-lg">Start free, upgrade when you're ready</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Free Plan */}
          <div className="bg-[#6B3A1F] rounded-2xl p-8 border border-[#6B3A1F]/50">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <div className="text-4xl font-bold mb-6">R0<span className="text-lg text-[#F7EBD6]/50 font-normal">/forever</span></div>
            <Link href="/signup" className="block w-full py-3 px-4 bg-[#3B2416] hover:bg-[#3B2416]/80 text-center rounded-lg font-semibold transition-colors mb-8">
              Get Started Free
            </Link>
            <ul className="space-y-4">
              <li className="flex items-center"><Check className="w-5 h-5 text-[#C8792A] mr-3" /> 3 recipes</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-[#C8792A] mr-3" /> 10 ingredients</li>
              <li className="flex items-center text-[#F7EBD6]/50"><X className="w-5 h-5 mr-3" /> Ads shown</li>
              <li className="flex items-center text-[#F7EBD6]/50"><X className="w-5 h-5 mr-3" /> No exports</li>
              <li className="flex items-center text-[#F7EBD6]/50"><X className="w-5 h-5 mr-3" /> No team invites</li>
            </ul>
          </div>

          {/* Monthly Plan */}
          <div className="bg-[#6B3A1F] rounded-2xl p-8 border-2 border-[#C8792A] relative transform md:-translate-y-4 shadow-lg shadow-[#C8792A]/20">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#C8792A] text-[#3B2416] px-4 py-1 rounded-full text-sm font-bold flex items-center whitespace-nowrap">
              <Sparkles className="w-4 h-4 mr-1" /> Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Monthly</h3>
            <div className="text-4xl font-bold mb-6">R91<span className="text-lg text-[#F7EBD6]/50 font-normal">/month</span></div>
            <Link href="/signup" className="block w-full py-3 px-4 bg-[#C8792A] hover:bg-[#C8792A]/90 text-[#3B2416] text-center rounded-lg font-semibold transition-colors mb-8">
              Start Monthly Plan
            </Link>
            <ul className="space-y-4">
              <li className="flex items-center"><Check className="w-5 h-5 text-[#C8792A] mr-3" /> Unlimited recipes</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-[#C8792A] mr-3" /> Unlimited ingredients</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-[#C8792A] mr-3" /> No ads</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-[#C8792A] mr-3" /> Export reports</li>
              <li className="flex items-center"><Check className="w-5 h-5 text-[#C8792A] mr-3" /> Team invites</li>
            </ul>
          </div>

          {/* Annual Plan */}
          <div className="bg-[#6B3A1F] rounded-2xl p-8 border border-[#6B3A1F]/50 relative">
             <div className="absolute top-4 right-4 bg-[#E8A9B8] text-[#3B2416] px-3 py-1 rounded-full text-xs font-bold flex items-center">
              Save R182
            </div>
            <h3 className="text-2xl font-bold mb-2">Annual</h3>
            <div className="text-4xl font-bold mb-6">R910<span className="text-lg text-[#F7EBD6]/50 font-normal">/year</span></div>
            <Link href="/signup" className="block w-full py-3 px-4 bg-[#3B2416] hover:bg-[#3B2416]/80 text-center rounded-lg font-semibold transition-colors mb-8">
              Start Annual Plan
            </Link>
            <ul className="space-y-4">
              <li className="flex items-center"><Check className="w-5 h-5 text-[#C8792A] mr-3" /> Everything in Monthly</li>
              <li className="flex items-center"><Crown className="w-5 h-5 text-[#E8A9B8] mr-3" /> 2 months free</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
