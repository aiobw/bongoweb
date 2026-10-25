import React, { useEffect } from 'react';
import { ArrowLeft, FileCheck, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { updatePageSEO } from '../../utils/seo';

interface TermsConditionsViewProps {
  onBack: () => void;
  onNavigateToPrivacy?: () => void;
  onNavigateToRefund?: () => void;
}

export default function TermsConditionsView({
  onBack,
  onNavigateToPrivacy,
  onNavigateToRefund
}: TermsConditionsViewProps) {
  useEffect(() => {
    updatePageSEO({
      title: 'Terms and Conditions',
      description: 'Official Terms of Service and delivery conditions for BongoWeb ready-made business websites.',
      canonicalPath: '/terms'
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
            <FileCheck className="w-4 h-4" />
            <span>Service Terms</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Terms & Conditions (শর্তাবলী)
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Please read these terms carefully before placing an order on BongoWeb. By ordering any website template, you agree to the conditions listed below.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">১. ডেলিভারি সময়সীমা (Delivery Timeline)</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              অর্ডার কনফার্মেশনের পর ২৪ থেকে সর্বোচ্চ ৪৮ ঘণ্টার মধ্যে ওয়েবসাইট লাইভ ও সক্রিয় করে সমস্ত অ্যাডমিন আইডি ও পাসওয়ার্ড ডেলিভারি করা হয়।
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">২. ডোমেইন ও হোস্টিং (Domain & Lifetime Hosting)</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              প্যাকেজের সাথে ১ বছরের জন্য ফ্রি .com ডোমেইন এবং লাইফটাইম ফ্রি হোস্টিং অন্তর্ভুক্ত। ডোমেইন পরবর্তী বছরগুলোর সাধারণ রিনিউ ফি ব্যতীত ক্লাউড হোস্টিং সম্পূর্ণ আজীবন বিনামূল্যে চালু থাকবে।
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">৩. আজীবন সাপোর্ট ও ফ্রি কনসালটেশন (Lifetime Support)</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              সাইট পরিচালনা, পণ্য আপলোড, কিংবা পেমেন্ট গেটওয়ে সংক্রান্ত যেকোনো সহায়তায় আমাদের ডেডিকেটেড ইঞ্জিনিয়ার টিম আজীবন বিনামূল্যে সাপোর্ট প্রদান করবে।
            </p>
          </section>
        </div>

        {/* Bottom Nav Links */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200 text-xs font-bold text-[#5B2C8A]">
          <div className="flex items-center gap-4">
            {onNavigateToPrivacy && (
              <button type="button" onClick={onNavigateToPrivacy} className="hover:underline cursor-pointer">
                Privacy Policy &rarr;
              </button>
            )}
            {onNavigateToRefund && (
              <button type="button" onClick={onNavigateToRefund} className="hover:underline cursor-pointer">
                Refund Policy &rarr;
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
