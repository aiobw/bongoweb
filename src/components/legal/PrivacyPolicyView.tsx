import React, { useEffect } from 'react';
import { ArrowLeft, Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { updatePageSEO } from '../../utils/seo';

interface PrivacyPolicyViewProps {
  onBack: () => void;
  onNavigateToTerms?: () => void;
  onNavigateToCookies?: () => void;
}

export default function PrivacyPolicyView({
  onBack,
  onNavigateToTerms,
  onNavigateToCookies
}: PrivacyPolicyViewProps) {
  useEffect(() => {
    updatePageSEO({
      title: 'Privacy Policy & Data Protection',
      description: 'Official Privacy Policy of BongoWeb complying with digital data protection standards and transparent information handling.',
      canonicalPath: '/privacy'
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
            <Shield className="w-4 h-4" />
            <span>Official Privacy Policy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy & Data Security
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            At BongoWeb, we value your privacy and trust. This policy explains what information we collect when you order a ready-made website or contact our support team, and how we keep it strictly confidential.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#5B2C8A]">
              <Lock className="w-5 h-5" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">১. সংগৃহীত তথ্যাদি (Information We Collect)</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              ওয়েবসাইট অর্ডার ও সেটআপের জন্য আমরা আপনার নাম, ফোন নম্বর, ইমেইল এবং ব্যবসার নাম/লোগো সংগ্রহ করি। পাসওয়ার্ড ও ক্রেডেনশিয়ালসমূহ এনক্রিপ্ট করে সুরক্ষিত রাখা হয়।
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ব্যক্তিগত ও ব্যবসায়িক যোগাযোগের তথ্য</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>ডোমেইন ও হোস্টিং সেটআপ ক্রেডেনশিয়াল</span>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2.5 text-[#5B2C8A]">
              <FileText className="w-5 h-5" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">২. তথ্যের নিরাপত্তা ও গোপনীয়তা (Data Protection)</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              আপনার ডেটা কোনো তৃতীয় পক্ষের কাছে বিক্রি বা শেয়ার করা হয় না। লাইভ ডেলিভারির পর সমস্ত অ্যাডমিন পাসওয়ার্ড শুধুমাত্র ক্লায়েন্টের নিয়ন্ত্রণে থাকে।
            </p>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">৩. যোগাযোগ ও অভিযোগ কর্মকর্তা (Grievance Officer)</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              যেকোনো গোপনীয়তা সংক্রান্ত প্রশ্নে বা ডেটা মুছে ফেলার অনুরোধে আমাদের ডেডিকেটেড সাপোর্ট টিমের সাথে সরাসরি যোগাযোগ করতে পারেন:
            </p>
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 text-xs sm:text-sm text-slate-700 font-mono space-y-1">
              <p>Email: support@bongoweb.site</p>
              <p>Phone: +880 1955-570912</p>
              <p>Location: Dhaka, Bangladesh</p>
            </div>
          </section>
        </div>

        {/* Bottom Nav Links */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200 text-xs font-bold text-[#5B2C8A]">
          <div className="flex items-center gap-4">
            {onNavigateToTerms && (
              <button type="button" onClick={onNavigateToTerms} className="hover:underline cursor-pointer">
                Terms & Conditions &rarr;
              </button>
            )}
            {onNavigateToCookies && (
              <button type="button" onClick={onNavigateToCookies} className="hover:underline cursor-pointer">
                Cookie Policy &rarr;
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
