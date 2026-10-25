import React, { useEffect } from 'react';
import { ArrowLeft, Cookie, ShieldCheck } from 'lucide-react';
import { updatePageSEO } from '../../utils/seo';

interface CookiePolicyViewProps {
  onBack: () => void;
  onNavigateToPrivacy?: () => void;
}

export default function CookiePolicyView({
  onBack,
  onNavigateToPrivacy
}: CookiePolicyViewProps) {
  useEffect(() => {
    updatePageSEO({
      title: 'Cookie Policy',
      description: 'Cookie policy and local preference handling information for BongoWeb digital solutions.',
      canonicalPath: '/cookies'
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
            <Cookie className="w-4 h-4" />
            <span>Cookie Policy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cookie Policy (কুকি নীতিমালা)
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            We use strictly necessary cookies and local storage tokens to preserve your language preference and cart preview session.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">১. কুকি কী এবং কেন ব্যবহার করা হয়?</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              কুকি হলো ছোট টেক্সট ফাইল যা আপনার ব্রাউজারে সংরক্ষিত থাকে। সাইটের ভাষা (বাংলা/English) মনে রাখতে এবং নিরবচ্ছিন্ন সেবা প্রদানে এটি ব্যবহার করা হয়।
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">২. প্রয়োজনীয় কুকিসমূহ (Essential Cookies)</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              লগইন স্ট্যাটাস, কার্ট সিলেকশন এবং সাউন্ড মিউট প্রেফারেন্স বজায় রাখতে এসেনশিয়াল কুকি ব্যবহৃত হয়।
            </p>
          </section>
        </div>

        {/* Bottom Nav Links */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200 text-xs font-bold text-[#5B2C8A]">
          <div>
            {onNavigateToPrivacy && (
              <button type="button" onClick={onNavigateToPrivacy} className="hover:underline cursor-pointer">
                Privacy Policy &rarr;
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
