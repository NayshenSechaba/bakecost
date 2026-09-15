'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, X, Crown, Sparkles, ArrowLeft } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F4F1EC] text-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
        
        {/* Top Back Navigation */}
        <div className="w-full flex justify-start sm:justify-center mb-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#D8D2C9] text-slate-700 hover:text-slate-900 hover:border-slate-900 transition-all font-semibold text-xs sm:text-sm shadow-xs"
          >
            <ArrowLeft size={16} className="shrink-0" />
            <span>Back to Doughnomic</span>
          </Link>
        </div>

        {/* Centered Brand Header & Enlarged Logo */}
        <div className="text-center mb-12 flex flex-col items-center max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Doughnomic"
              width={340}
              height={56}
              className="h-14 sm:h-16 w-auto object-contain"
              priority
            />
          </div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#C68A4C] mb-2">
            know what every bake really costs
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            Choose Your Plan
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium max-w-xl mx-auto">
            Start free with essential bakery costing tools. Upgrade anytime to unlock unlimited recipes, exportable analytics, and team collaboration.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-16">
          
          {/* 1. Free Plan */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 border-2 border-[#D8D2C9] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                Starter Tier
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Free</h3>
              <div className="text-4xl font-black text-slate-900 mb-6">
                R0<span className="text-sm text-slate-500 font-semibold"> / forever</span>
              </div>
              
              <Link
                href="/signup"
                className="block w-full py-3.5 px-4 bg-sand-50 hover:bg-sand-100 text-slate-900 text-center rounded-2xl font-bold transition-all mb-7 border-2 border-[#D8D2C9] shadow-xs active:scale-[0.99]"
              >
                Get Started Free
              </Link>
              
              <ul className="space-y-4 text-sm text-slate-800">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-[#FAEEDA] text-[#854F0B]">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="font-semibold leading-snug">Up to 3 recipes</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-[#FAEEDA] text-[#854F0B]">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="font-semibold leading-snug">Up to 10 ingredients</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-sand-100 text-slate-400">
                    <X size={14} strokeWidth={2.5} />
                  </div>
                  <span className="leading-snug">Ads shown</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-sand-100 text-slate-400">
                    <X size={14} strokeWidth={2.5} />
                  </div>
                  <span className="leading-snug">No report downloads</span>
                </li>
                <li className="flex items-start gap-3 text-slate-400">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-sand-100 text-slate-400">
                    <X size={14} strokeWidth={2.5} />
                  </div>
                  <span className="leading-snug">No team member invites</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 2. Monthly Plan (Featured) */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 pt-9 sm:pt-10 border-[2.5px] border-slate-900 shadow-xl relative flex flex-col justify-between">
            {/* Floating Most Popular Pill */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-md whitespace-nowrap uppercase tracking-wider">
              <Sparkles size={13} className="text-[#C68A4C] shrink-0" />
              <span>Most Popular</span>
            </div>
            
            <div>
              <div className="text-xs font-extrabold text-[#C68A4C] uppercase tracking-widest mb-1.5">
                Individual Monthly
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Monthly</h3>
              <div className="text-4xl font-black text-slate-900 mb-6">
                R91<span className="text-sm text-slate-500 font-semibold"> / month</span>
              </div>
              
              <a
                href="https://paystack.shop/pay/mz6y9d-cjw"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 px-4 bg-slate-900 hover:bg-[#3D3732] text-white text-center rounded-2xl font-bold transition-all mb-7 shadow-md active:scale-[0.99]"
              >
                Subscribe Monthly (R91/mo) →
              </a>
              
              <ul className="space-y-4 text-sm text-slate-800">
                <li className="flex items-start gap-3 font-semibold">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-slate-900 text-white">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="leading-snug">Unlimited recipes</span>
                </li>
                <li className="flex items-start gap-3 font-semibold">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-slate-900 text-white">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="leading-snug">Unlimited ingredients</span>
                </li>
                <li className="flex items-start gap-3 font-semibold">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-slate-900 text-white">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="leading-snug">No ads</span>
                </li>
                <li className="flex items-start gap-3 font-semibold">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-slate-900 text-white">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="leading-snug">Export CSV & PDF reports</span>
                </li>
                <li className="flex items-start gap-3 font-semibold">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-slate-900 text-white">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="leading-snug">Team member invites</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 3. Annual Plan */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 border-2 border-[#D8D2C9] shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between">
            {/* Top Right Save Pill */}
            <div className="absolute top-6 right-6 bg-[#FAEEDA] text-[#854F0B] border border-[#F7E1B5] px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide">
              Save R182
            </div>
            
            <div>
              <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 pr-24">
                Individual Annual
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Annual</h3>
              <div className="text-4xl font-black text-slate-900 mb-6">
                R910<span className="text-sm text-slate-500 font-semibold"> / year</span>
              </div>
              
              <a
                href="https://paystack.shop/pay/l0yv1qgt3y"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 px-4 bg-sand-50 hover:bg-sand-100 text-slate-900 text-center rounded-2xl font-bold transition-all mb-7 border-2 border-[#D8D2C9] shadow-xs active:scale-[0.99]"
              >
                Subscribe Annual (R910/yr) →
              </a>
              
              <ul className="space-y-4 text-sm text-slate-800">
                <li className="flex items-start gap-3 font-semibold">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-[#FAEEDA] text-[#854F0B]">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="leading-snug">Everything in Monthly</span>
                </li>
                <li className="flex items-start gap-3 font-semibold">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-[#FAEEDA] text-[#854F0B]">
                    <Crown size={14} strokeWidth={2.5} />
                  </div>
                  <span className="leading-snug">2 months free annually</span>
                </li>
                <li className="flex items-start gap-3 font-semibold">
                  <div className="w-5 h-5 mt-0.5 shrink-0 flex items-center justify-center rounded-full bg-[#FAEEDA] text-[#854F0B]">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="leading-snug">Priority feature access</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
