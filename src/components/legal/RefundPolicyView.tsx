import React, { useEffect } from 'react';
import { ArrowLeft, RotateCcw, ShieldCheck, MessageCircle } from 'lucide-react';
import { updatePageSEO } from '../../utils/seo';

interface RefundPolicyViewProps {
  onBack: () => void;
  onNavigateToLiveChat?: () => void;
}

export default function RefundPolicyView({
  onBack,
  onNavigateToLiveChat
}: RefundPolicyViewProps) {
  useEffect(() => {
    updatePageSEO({
      title: 'Refund & Cancellation Policy',
      description: 'Official Refund & Cancellation Policy for BongoWeb ready-made business websites and digital solutions.',
      canonicalPath: '/refund'
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#F8F5FC] text-[#1F1F2E] font-sans pb-28 pt-4 sm:pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Top Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#5B2C8A] border border-purple-100 text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>ফিরে যান (Back)</span>
          </button>

          <span className="text-xs text-slate-500 font-mono">Last Updated: October 2026</span>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-[#5B2C8A] text-xs font-bold mb-4">
            <RotateCcw className="w-4 h-4" />
            <span>Refund Policy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Refund & Cancellation Policy (রিফান্ড নীতিমালা)
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            We are committed to delivering top-quality websites. Here are our transparent refund and satisfaction guarantee guidelines.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">১. শতভাগ সন্তুষ্টি গ্যারান্টি (100% Satisfaction)</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              ডেলিভারির পর সাইট সংক্রান্ত কোনো ত্রুটি থাকলে আমাদের টিম ৪৮ ঘণ্টার মধ্যে তা সংশোধন করে দেবে। কোনো কারণে ডেলিভারি সম্পন্ন করতে ব্যর্থ হলে সম্পূর্ণ অর্থ বিকাশ/নগদে রিফান্ড করা হবে।
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">২. রিফান্ডের শর্তাবলী (Refund Conditions)</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              ডোমেইন রেজিস্ট্রেশন ও হোস্টিং সার্ভার অ্যাক্টিভেশনের পর ডোমেইন ফি অফেরতযোগ্য। তবে ওয়েবসাইট ডিজাইনিং ও সেটআপ ফি সংক্রান্ত যেকোনো যুক্তিসঙ্গত ক্ষেত্রে রিফান্ড প্রযোজ্য।
            </p>
          </section>
        </div>

        {/* Bottom Nav Links */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200 text-xs font-bold text-[#5B2C8A]">
          <div>
            {onNavigateToLiveChat && (
              <button 
                type="button" 
                onClick={onNavigateToLiveChat} 
                className="inline-flex items-center gap-1.5 hover:underline cursor-pointer text-[#5B2C8A]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>লাইভ চ্যাটে কথা বলুন (Live Chat Support)</span>
              </button>
            )}
          </div>
          <button type="button" onClick={onBack} className="text-slate-600 hover:text-slate-900 cursor-pointer">
            হোমে ফিরে যান
          </button>
        </div>
      </div>
    </div>
  );
}
