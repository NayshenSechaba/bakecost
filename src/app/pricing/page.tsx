'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, Crown, Sparkles, ArrowLeft } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F4F1EC] text-slate-900 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/login"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-8 font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Doughnomic
        </Link>

        <div className="text-center mb-12">
          <div className="flex justify-center mb-3">
            <Image
              src="/logo.png"
              alt="Doughnomic"
              width={220}
              height={38}
              className="h-10 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Choose Your Plan
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-lg mx-auto">
            know what every bake really costs — start free, upgrade anytime to unlock unlimited recipes and team features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl p-7 border border-[#E3DED6] shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Starter</div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Free</h3>
              <div className="text-4xl font-extrabold text-slate-900 mb-6">
                R0<span className="text-sm text-slate-500 font-normal"> / forever</span>
              </div>
              <Link
                href="/signup"
                className="block w-full py-3 px-4 bg-sand-100 hover:bg-sand-200 text-slate-900 text-center rounded-xl font-bold transition-colors mb-6 border border-[#E3DED6]"
              >
                Get Started Free
              </Link>
              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-center"><Check className="w-4 h-4 text-[#C68A4C] mr-2.5 flex-shrink-0" /> Up to 3 recipes</li>
                <li className="flex items-center"><Check className="w-4 h-4 text-[#C68A4C] mr-2.5 flex-shrink-0" /> Up to 10 ingredients</li>
                <li className="flex items-center text-slate-400"><X className="w-4 h-4 mr-2.5 flex-shrink-0" /> Ads shown</li>
                <li className="flex items-center text-slate-400"><X className="w-4 h-4 mr-2.5 flex-shrink-0" /> No report exports</li>
                <li className="flex items-center text-slate-400"><X className="w-4 h-4 mr-2.5 flex-shrink-0" /> No team invites</li>
              </ul>
            </div>
          </div>

          {/* Monthly Plan */}
          <div className="bg-white rounded-2xl p-7 border-2 border-slate-900 shadow-md relative flex flex-col justify-between transform md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3.5 py-1 rounded-full text-xs font-bold flex items-center shadow-sm whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-[#C68A4C]" /> Most Popular
            </div>
            <div>
              <div className="text-xs font-bold text-[#C68A4C] uppercase tracking-wider mb-1">Individual Monthly</div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Monthly</h3>
              <div className="text-4xl font-extrabold text-slate-900 mb-6">
                R91<span className="text-sm text-slate-500 font-normal"> / month</span>
              </div>
              <Link
                href="/signup"
                className="block w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-center rounded-xl font-bold transition-colors mb-6 shadow-sm"
              >
                Start Monthly Plan
              </Link>
              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-center font-medium"><Check className="w-4 h-4 text-[#C68A4C] mr-2.5 flex-shrink-0" /> Unlimited recipes</li>
                <li className="flex items-center font-medium"><Check className="w-4 h-4 text-[#C68A4C] mr-2.5 flex-shrink-0" /> Unlimited ingredients</li>
                <li className="flex items-center font-medium"><Check className="w-4 h-4 text-[#C68A4C] mr-2.5 flex-shrink-0" /> No ads</li>
                <li className="flex items-center font-medium"><Check className="w-4 h-4 text-[#C68A4C] mr-2.5 flex-shrink-0" /> Export CSV reports</li>
                <li className="flex items-center font-medium"><Check className="w-4 h-4 text-[#C68A4C] mr-2.5 flex-shrink-0" /> Team member invites</li>
              </ul>
            </div>
          </div>

          {/* Annual Plan */}
          <div className="bg-white rounded-2xl p-7 border border-[#E3DED6] shadow-sm relative flex flex-col justify-between">
            <div className="absolute top-4 right-4 bg-[#FAEEDA] text-[#854F0B] border border-[#F7E1B5] px-2.5 py-0.5 rounded-full text-xs font-bold">
              Save R182
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Individual Annual</div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Annual</h3>
              <div className="text-4xl font-extrabold text-slate-900 mb-6">
                R910<span className="text-sm text-slate-500 font-normal"> / year</span>
              </div>
              <Link
                href="/signup"
                className="block w-full py-3 px-4 bg-sand-100 hover:bg-sand-200 text-slate-900 text-center rounded-xl font-bold transition-colors mb-6 border border-[#E3DED6]"
              >
                Start Annual Plan
              </Link>
              <ul className="space-y-3.5 text-sm text-slate-700">
                <li className="flex items-center font-medium"><Check className="w-4 h-4 text-[#C68A4C] mr-2.5 flex-shrink-0" /> Everything in Monthly</li>
                <li className="flex items-center font-medium"><Crown className="w-4 h-4 text-[#C68A4C] mr-2.5 flex-shrink-0" /> 2 months free annually</li>
                <li className="flex items-center font-medium"><Check className="w-4 h-4 text-[#C68A4C] mr-2.5 flex-shrink-0" /> Priority feature access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
