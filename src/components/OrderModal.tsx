import React, { useState } from 'react';
import { 
  X, CheckCircle2, PhoneCall, ShieldCheck, 
  MessageCircle, Sparkles, ArrowRight, Zap 
} from 'lucide-react';
import { WebsiteDemo } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { formatDisplayPrice } from './CategoryWebsitesView';

interface OrderModalProps {
  demo: WebsiteDemo | string | null;
  onClose: () => void;
}

export default function OrderModal({ demo, onClose }: OrderModalProps) {
  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredDomain, setPreferredDomain] = useState('');
  const { language } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  if (!demo) return null;

  const demoTitle = typeof demo === 'string' ? demo : demo.title;
  const demoCode = typeof demo === 'object' ? demo.fourDigitCode : '#2085';
  const priceTag = typeof demo === 'object' 
    ? formatDisplayPrice(demo.priceTag, language) 
    : (language === 'bn' ? '৯৯৯ ৳ থেকে শুরু' : 'Starts at ৳999');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0e0e12] text-[#f5f5f7] rounded-2xl border border-white/[0.08] shadow-dark-card p-6 sm:p-8 animate-slideUpModal relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#a1a1b0] hover:text-[#f5f5f7] hover:bg-white/[0.06] cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.05] text-[#3b5bff] border border-white/[0.08] flex items-center justify-center mx-auto mb-2 shadow-xs">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5] text-[#3b5bff]" />
            </div>
            <h3 className="text-xl font-bold text-[#f5f5f7]">
              অর্ডার রিকোয়েস্ট সফলভাবে গৃহীত হয়েছে!
            </h3>
            <p className="text-xs sm:text-sm text-[#a1a1b0] leading-relaxed max-w-sm mx-auto">
              আমাদের একজন টেকনিক্যাল ম্যানেজার আগামী ১৫ মিনিটের মধ্যে <span className="font-semibold text-[#3b5bff]">{phoneNumber}</span> নম্বরে ফোন করে আপনার প্রজেক্ট শুরু করবেন।
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                ✓ ২৪ ঘণ্টা এক্সপ্রেস ডেলিভারি টিম সক্রিয়
              </span>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="mb-5">
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] text-[#3b5bff] text-[11px] font-medium border border-white/[0.08]">
                {demoCode} • Express 24h Setup
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#f5f5f7] mt-2 line-clamp-1">
                {demoTitle}
              </h2>
              <div className="flex items-center justify-between mt-1 text-xs">
                <span className="text-[#a1a1b0]">প্যাকেজ রেট:</span>
                <span className="font-semibold text-[#3b5bff] text-sm font-mono">{priceTag}</span>
              </div>
            </div>

            {/* Reassurance Callout */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] mb-5 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-[#a1a1b0] leading-snug">
                <strong className="text-[#f5f5f7]">কোনো অগ্রিম টাকা নেওয়া হবে না।</strong> কাজ শুরু করার আগে আমাদের ইঞ্জিনিয়ার সরাসরি আপনার সাথে কথা বলে সব নিশ্চিত করবেন।
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#a1a1b0] mb-1">
                  আপনার নাম / ব্যবসার নাম
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আহসান হাবিব / হাবিব ফ্যাশন"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs sm:text-sm text-[#f5f5f7] focus:outline-none focus:border-[#3b5bff] transition-all placeholder:text-[#71717a]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1b0] mb-1">
                  মোবাইল নম্বর (যেটিতে আমরা কল করব)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="যেমন: 01700-000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs sm:text-sm text-[#f5f5f7] focus:outline-none focus:border-[#3b5bff] transition-all font-mono placeholder:text-[#71717a]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1b0] mb-1">
                  পছন্দের ডোমেইন নাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: yourbrand.com"
                  value={preferredDomain}
                  onChange={(e) => setPreferredDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs sm:text-sm text-[#f5f5f7] focus:outline-none focus:border-[#3b5bff] transition-all placeholder:text-[#71717a]"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#3b5bff] hover:bg-[#324ecc] active:scale-[0.99] text-white text-xs sm:text-sm font-semibold transition-all shadow-blue-glow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>অর্ডার কনফার্ম করুন (ফ্রি কল ব্যাক)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Or Direct WhatsApp */}
              <div className="text-center pt-2">
                <a
                  href={`https://wa.me/8801955570912?text=${encodeURIComponent(
                    `Hello BongoWeb, I want to order website: ${demoTitle} (${demoCode})`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>সরাসরি হোয়াটসঅ্যাপে কথা বলুন (01955570912)</span>
                </a>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
