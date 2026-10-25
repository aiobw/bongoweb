import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Layers } from 'lucide-react';

interface Step2GuaranteeProps {
  onBack: () => void;
  onNext: () => void;
}

export default function Step2Guarantee({ onBack, onNext }: Step2GuaranteeProps) {
  return (
    <div id="step-2-guarantee" className="w-full h-full flex flex-col justify-between animate-fadeIn">
      {/* Top Slide Header: Back Button on Left, Slide Counter on Right */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
        <button
          onClick={onBack}
          id="step-2-top-back-btn"
          className="text-xs font-semibold text-[#5C4E4B] hover:text-[#DC2626] flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-2.5 -ml-2 rounded-lg hover:bg-[#DC2626]/5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>পেছনে যান</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="font-bold text-[#DC2626] bg-[#DC2626]/10 px-2.5 py-0.5 rounded-md border border-[#DC2626]/20">02</span>
          <span className="text-[#DC2626]/40">/</span>
          <span className="text-[#5C4E4B] font-medium">04</span>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="flex-1 flex flex-col justify-between py-3 sm:py-4 text-center sm:text-left min-h-0">
        <div>
          <h1 
            id="step-2-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1C1614] tracking-tight leading-[1.18] mb-2 sm:mb-2.5 text-balance"
          >
            আপনি যে ওয়েবসাইটটি পছন্দ করবেন,{' '}
            <span className="text-[#DC2626] underline decoration-[#DC2626]/40 underline-offset-6">
              ঠিক হুবহু সেই ওয়েবসাইটটিই
            </span>{' '}
            পাবেন।
          </h1>

          <p 
            id="step-2-subtext"
            className="text-xs sm:text-sm md:text-base text-[#DC2626] font-semibold leading-relaxed max-w-xl mb-3 sm:mb-4 text-balance mx-auto sm:mx-0 bg-[#DC2626]/8 p-2.5 sm:p-3 rounded-xl border border-[#DC2626]/20"
          >
            💡 <span className="font-bold">তথ্য ও নিশ্চয়তা:</span> ২৪ ঘণ্টার মধ্যে আপনার ওয়েবসাইট, আপনার লোগো এবং আপনার মতো করে কাস্টমাইজেশন করে সম্পূর্ণ রেডি ডেলিভারি দেওয়া হবে।
          </p>
        </div>

        {/* 3 Proof Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full text-left my-auto">
          {/* Card 1: Exact Match */}
          <div className="p-3.5 sm:p-4 md:p-5 rounded-2xl bg-[#FFFFFF] border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:border-[#DC2626]/40 hover:shadow-[0_4px_16px_rgba(220,38,38,0.12)] hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 flex items-center justify-center mb-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#1C1614]">হুবহু ডিজাইন ম্যাচ</div>
            <div className="text-[11px] sm:text-xs text-[#5C4E4B] font-medium mt-0.5 leading-snug">ডেমোর সাথে ১০০% হুবহু মিল</div>
          </div>

          {/* Card 2: Custom Branding */}
          <div className="p-3.5 sm:p-4 md:p-5 rounded-2xl bg-[#FFFFFF] border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:border-[#DC2626]/40 hover:shadow-[0_4px_16px_rgba(220,38,38,0.12)] hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 flex items-center justify-center mb-2.5">
              <Sparkles className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#1C1614]">আপনার নিজস্ব ব্র্যান্ডিং</div>
            <div className="text-[11px] sm:text-xs text-[#5C4E4B] font-medium mt-0.5 leading-snug">আপনার নাম ও নিজস্ব লোগো যুক্ত</div>
          </div>

          {/* Card 3: Ready-Made Setup */}
          <div className="p-3.5 sm:p-4 md:p-5 rounded-2xl bg-[#FFFFFF] border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:border-[#DC2626]/40 hover:shadow-[0_4px_16px_rgba(220,38,38,0.12)] hover:-translate-y-0.5">
            <div className="w-9 h-9 rounded-xl bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20 flex items-center justify-center mb-2.5">
              <Layers className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#1C1614]">সম্পূর্ণ রেডিমেড সেটআপ</div>
            <div className="text-[11px] sm:text-xs text-[#5C4E4B] font-medium mt-0.5 leading-snug">কোনো টেকনিক্যাল কোডিং ঝামেলা নেই</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full pt-2 sm:pt-3 shrink-0">
          <button
            onClick={onBack}
            id="step-2-back-btn"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm md:text-base font-semibold cursor-pointer border border-slate-200 hover:border-[#DC2626]/40 bg-white text-slate-700 hover:text-[#DC2626] transition-all shadow-2xs active:scale-[0.99]"
          >
            <ArrowLeft className="w-4 h-4 text-[#DC2626]" />
            <span>পেছনে যান</span>
          </button>

          <button
            onClick={onNext}
            id="step-2-next-btn"
            className="flex-1 bg-gradient-to-r from-[#DC2626] to-[#7C3AED] hover:from-[#B91C1C] hover:to-[#6D28D9] group inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm md:text-base font-bold text-white cursor-pointer shadow-[0_4px_18px_rgba(220,38,38,0.25)] transition-all active:scale-[0.99]"
          >
            <span>পরবর্তী পেজে যান</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 text-white stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
