import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import BongoWebLogo from './BongoWebLogo';

interface Step1WelcomeProps {
  onNext: () => void;
}

export default function Step1Welcome({ onNext }: Step1WelcomeProps) {
  return (
    <div id="step-1-welcome" className="w-full h-full flex flex-col justify-between animate-fadeIn">
      {/* Top Slide Header: Official BongoWeb Logo */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
        <BongoWebLogo size="sm" />

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="font-bold text-[#DC2626] bg-[#DC2626]/10 px-2.5 py-0.5 rounded-md border border-[#DC2626]/20">01</span>
          <span className="text-[#DC2626]/40">/</span>
          <span className="text-[#5C4E4B] font-medium">04</span>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="flex-1 flex flex-col justify-between py-3 sm:py-4 text-center sm:text-left min-h-0">
        <div>
          <h1 
            id="step-1-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1C1614] tracking-tight leading-[1.18] mb-2 sm:mb-2.5 text-balance"
          >
            আগে দেখুন,{' '}
            <span className="text-[#DC2626] underline decoration-[#DC2626]/40 underline-offset-6">
              তারপর কিনুন
            </span>
          </h1>

          {/* Key Instruction in Accent */}
          <p 
            id="step-1-subtext"
            className="text-xs sm:text-sm md:text-base text-[#DC2626] font-semibold leading-relaxed max-w-xl mb-3 sm:mb-4 text-balance mx-auto sm:mx-0 bg-[#DC2626]/8 p-2.5 sm:p-3 rounded-xl border border-[#DC2626]/20"
          >
            💡 <span className="font-bold">নির্দেশনা:</span> ১০০+ লাইভ ওয়েবসাইট ভিজিট করে দেখে নিন, তারপর পছন্দমতো আপনার ওয়েবসাইট অর্ডার করুন।
          </p>
        </div>

        {/* 3 Compact Proof Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full text-left my-auto">
          {/* Card 1: 100% Live Preview */}
          <div className="p-3.5 sm:p-4 md:p-5 rounded-2xl bg-[#FFFFFF] border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:border-[#DC2626]/40 hover:shadow-[0_4px_16px_rgba(220,38,38,0.12)] hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 flex items-center justify-center mb-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#1C1614]">১০০% লাইভ প্রিভিউ</div>
            <div className="text-[11px] sm:text-xs text-[#5C4E4B] font-medium mt-0.5 leading-snug">বাস্তব কার্যকরী ডেমো</div>
          </div>

          {/* Card 2: 24h Express Delivery */}
          <div className="p-3.5 sm:p-4 md:p-5 rounded-2xl bg-[#FFFFFF] border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:border-[#DC2626]/40 hover:shadow-[0_4px_16px_rgba(220,38,38,0.12)] hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 flex items-center justify-center mb-2.5">
              <Zap className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#1C1614]">২৪ ঘণ্টা এক্সপ্রেস ডেলিভারি</div>
            <div className="text-[11px] sm:text-xs text-[#5C4E4B] font-medium mt-0.5 leading-snug">দ্রুত চালুর নিশ্চয়তা</div>
          </div>

          {/* Card 3: Lifetime Full Ownership */}
          <div className="p-3.5 sm:p-4 md:p-5 rounded-2xl bg-[#FFFFFF] border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:border-[#DC2626]/40 hover:shadow-[0_4px_16px_rgba(220,38,38,0.12)] hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 flex items-center justify-center mb-2.5">
              <ShieldCheck className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#1C1614]">আজীবন পূর্ণ মালিকানা</div>
            <div className="text-[11px] sm:text-xs text-[#5C4E4B] font-medium mt-0.5 leading-snug">কোনো লুকানো শর্ত ছাড়া</div>
          </div>
        </div>

        {/* High-Intent Next Slide Button */}
        <div className="w-full pt-2 sm:pt-3 flex justify-center shrink-0">
          <button
            onClick={onNext}
            id="step-1-primary-cta"
            className="w-full bg-gradient-to-r from-[#DC2626] to-[#7C3AED] hover:from-[#B91C1C] hover:to-[#6D28D9] group relative inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm md:text-base font-bold text-white cursor-pointer shadow-[0_4px_18px_rgba(220,38,38,0.25)] transition-all active:scale-[0.99]"
          >
            <span>পরবর্তী পেজে যান (১০০% গ্যারান্টি দেখুন)</span>
            <ArrowRight className="w-4.5 h-4.5 transition-transform duration-200 group-hover:translate-x-1 text-white stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
