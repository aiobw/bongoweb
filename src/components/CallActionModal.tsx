import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneCall, 
  Clock, 
  X, 
  CheckCircle2, 
  Copy, 
  Check, 
  Sparkles, 
  ArrowRight, 
  AlertCircle,
  Headphones,
  Calendar,
  Send,
  RefreshCw,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import { validateStrictBangladeshiPhone, apiSaveCallBackRequest, apiGetCallBackRequests, apiGetUsers, CallBackRequest } from '../utils/api';

interface CallActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'options' | 'callback';
}

export default function CallActionModal({ isOpen, onClose, initialTab }: CallActionModalProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'options' | 'callback'>(initialTab || 'options');
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Call Back Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [timeSlot, setTimeSlot] = useState('জরুরি (১৫-২০ মিনিটের মধ্যে)');
  const [reason, setReason] = useState('');
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successTicket, setSuccessTicket] = useState<CallBackRequest | null>(null);

  // Pre-fill user data if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bongoweb_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) setName(u.name);
        if (u.phone) setPhone(u.phone);
      }
      const activeCb = localStorage.getItem('bongoweb_my_active_callback_request');
      if (activeCb) {
        const parsed = JSON.parse(activeCb);
        if (parsed && parsed.status === 'pending') {
          setSuccessTicket(parsed);
        }
      }
    } catch (_) {}
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const hotline = '01955570912';

  const handleCopyHotline = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hotline);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleInstantCall = () => {
    window.location.href = `tel:+88${hotline}`;
  };

  const handleSubmitCallBack = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('অনুগ্রহ করে আপনার নাম লিখুন।');
      return;
    }

    const phoneValidation = validateStrictBangladeshiPhone(phone);
    if (!phoneValidation.valid) {
      setErrorMsg(phoneValidation.error || 'সঠিক ১১-সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন। কোনো অস্থায়ী বা ফেক নম্বর গ্রহণযোগ্য নয়।');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনি কেন কল ব্যাক চান তা সংক্ষেপে লিখুন।');
      return;
    }

    if (!consent) {
      setErrorMsg('অনুগ্রহ করে প্রাইভেসি ও কল ব্যাক প্রাপ্তির শর্তে সম্মতি প্রদান করুন।');
      return;
    }

    setSubmitting(true);
    try {
      // Restriction: Call back request is ONLY available for verified numbers users. Not for new user and not for non verified numbers.
      const users = await apiGetUsers().catch(() => []);
      const cleanPhone = phoneValidation.cleanPhone || phone.trim();
      const rawInput = cleanPhone.replace(/\D/g, '');

      let storedUser: any = null;
      try {
        const stored = localStorage.getItem('bongoweb_user');
        if (stored) storedUser = JSON.parse(stored);
      } catch (_) {}

      const isStoredUserVerified = storedUser && 
        (storedUser.phone?.replace(/\D/g, '') === rawInput) &&
        (storedUser.verificationStatus === 'verified' || storedUser.isVerified || !!storedUser.id);

      const matchingDbUser = users.find(u => {
        const uPhone = (u.phone || '').replace(/\D/g, '');
        return uPhone === rawInput;
      });

      const isDbUserVerified = matchingDbUser && 
        (matchingDbUser.verificationStatus === 'verified' || matchingDbUser.isVerified || !!matchingDbUser.id);

      const isVerified = isStoredUserVerified || isDbUserVerified;

      if (!isVerified) {
        setErrorMsg(
          language === 'bn'
            ? 'কল ব্যাক রিকোয়েস্ট সুবিধাটি শুধুমাত্র ভেরিফাইড নম্বরের ইউজারদের জন্য নির্ধারিত। নতুন ইউজার বা নন-ভেরিফাইড নম্বরের ক্ষেত্রে কল ব্যাক গ্রহণযোগ্য নয়। যেকোনো সহায়তার জন্য অনুগ্রহ করে সরাসরি আমাদের হটলাইনে কল করুন: 01955570912'
            : 'Call back request is only available for verified numbers users. Not available for new users or non-verified numbers. Please call our hotline directly at 01955570912.'
        );
        setSubmitting(false);
        return;
      }

      const newReq: CallBackRequest = {
        id: 'CB-' + Date.now().toString().slice(-6),
        name: cleanName,
        phone: phoneValidation.cleanPhone || phone.trim(),
        preferredTime: timeSlot,
        reason: reason.trim(),
        status: 'pending',
        createdAt: new Date().toLocaleDateString('bn-BD', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        requestedAt: new Date().toLocaleDateString('bn-BD', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      await apiSaveCallBackRequest(newReq);
      localStorage.setItem('bongoweb_my_active_callback_request', JSON.stringify(newReq));
      window.dispatchEvent(new Event('bongoweb_callback_requests_updated'));
      window.dispatchEvent(new CustomEvent('bongoweb_callback_created', { detail: newReq }));

      setSuccessTicket(newReq);
    } catch (err: any) {
      setErrorMsg(err?.message || 'কল ব্যাক রিকোয়েস্ট জমা দেওয়া যায়নি। ইন্টারনেট সংযোগ চেক করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn select-none">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(91,44,138,0.25)] overflow-hidden relative flex flex-col max-h-[92vh] animate-scaleUp text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-purple-600 to-indigo-600 shrink-0" />

        {/* Modal Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-2xs">
              <PhoneCall className="w-5 h-5 stroke-[2.2] animate-bounce" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {language === 'bn' ? 'BongoWeb কল সেন্টার ও সাপোর্ট' : 'BongoWeb Call & Support Desk'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700">
                  {language === 'bn' ? 'সরাসরি লাইন সক্রিয় • সকাল ৯টা - রাত ১১টা' : 'Hotline Active • 9 AM - 11 PM'}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* TAB 1: 2 Main Action Cards */}
          {activeTab === 'options' && !successTicket && (
            <div className="space-y-4">
              <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed text-center max-w-sm mx-auto">
                {language === 'bn' 
                  ? 'আপনার প্রয়োজন অনুযায়ী তাৎক্ষণিক কল করুন অথবা সুবিধাজনক সময়ে কল ব্যাক রিকোয়েস্ট পাঠান।' 
                  : 'Call us immediately or request an engineer to call you back at your preferred time.'}
              </p>

              {/* 2 Big Choice Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                
                {/* 1. INSTANT CALL BUTTON */}
                <div 
                  onClick={handleInstantCall}
                  role="button"
                  tabIndex={0}
                  className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] border border-emerald-400"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform">
                      <Phone className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                      {language === 'bn' ? 'সরাসরি' : 'Instant'}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-base font-black tracking-tight">
                      {language === 'bn' ? 'ইনস্ট্যান্ট কল (Instant Call)' : 'Instant Direct Call'}
                    </h3>
                    <p className="text-xs text-emerald-100 mt-1 leading-snug">
                      {language === 'bn' ? 'সরাসরি এখনই আমাদের হটলাইনে কথা বলুন।' : 'Connect to support hotline right away.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                    <span className="font-mono text-sm font-black tracking-wider">{hotline}</span>
                    <button
                      type="button"
                      onClick={handleCopyHotline}
                      title="Copy Hotline Number"
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                    >
                      {copiedNumber ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 2. CALL BACK REQUEST BUTTON */}
                <div 
                  onClick={() => setActiveTab('callback')}
                  role="button"
                  tabIndex={0}
                  className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-lg shadow-purple-600/25 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] border border-purple-400"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform">
                      <Clock className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                      {language === 'bn' ? 'ভেরিফাইড নম্বর' : 'Verified Only'}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-base font-black tracking-tight">
                      {language === 'bn' ? 'কল ব্যাক রিকোয়েস্ট' : 'Request a Call Back'}
                    </h3>
                    <p className="text-xs text-purple-100 mt-1 leading-snug">
                      {language === 'bn' ? 'শুধুমাত্র ভেরিফাইড নম্বরের ইউজারদের জন্য নির্ধারিত।' : 'Exclusively for verified numbers users.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold">
                    <span>{language === 'bn' ? 'ফর্ম পূরণ করুন' : 'Fill Form'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

              </div>

              {/* Quick Info Capsule */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center gap-3 text-xs text-slate-700">
                <Headphones className="w-4 h-4 text-purple-700 shrink-0" />
                <span className="leading-relaxed">
                  {language === 'bn'
                    ? 'আমাদের ইঞ্জিনিয়ারগণ সকল কাজের দিনে সকাল ৯টা থেকে রাত ১১টা পর্যন্ত সার্বক্ষণিক সহায়তায় প্রস্তুত।'
                    : 'Our senior consultants and engineers are available daily from 9:00 AM to 11:00 PM.'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: CALL BACK FORM (Working Functions) */}
          {activeTab === 'callback' && !successTicket && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('options')}
                  className="text-xs font-bold text-purple-700 hover:text-purple-800 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← {language === 'bn' ? 'অপশন নির্বাচনে ফিরে যান' : 'Back to Options'}
                </button>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  {language === 'bn' ? 'ভেরিফাইড ইউজার সেবা' : 'Verified Users Only'}
                </span>
              </div>

              {/* Verified Users Restriction Notice */}
              <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block text-purple-900">
                    {language === 'bn' ? 'শুধুমাত্র ভেরিফাইড নম্বরের ইউজারদের জন্য প্রযোজ্য' : 'Available Only for Verified Numbers Users'}
                  </span>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    {language === 'bn'
                      ? 'কল ব্যাক রিকোয়েস্ট সুবিধাটি শুধুমাত্র ভেরিফাইড নম্বরের ইউজারদের জন্য। নতুন ইউজার বা নন-ভেরিফাইড নম্বরে কল ব্যাক প্রযোজ্য নয় (যেকোনো তথ্যের জন্য সরাসরি হটলাইনে কল করুন: 01955570912)।'
                      : 'Call back requests are only available for verified numbers users. Not available for new users or non-verified numbers. Please call our hotline directly at 01955570912.'}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitCallBack} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === 'bn' ? 'যেমন: মোঃ সাকিব হাসান' : 'e.g. John Doe'}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all font-medium"
                  />
                </div>

                {/* 11-digit Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? '১১ ডিজিটের মোবাইল নম্বর' : '11-Digit Mobile Number'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    placeholder="017XXXXXXXX বা 019XXXXXXXX"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {language === 'bn' ? 'এই নম্বরে আমাদের কনসালটেন্ট সরাসরি কল করবেন।' : 'We will call this mobile number directly.'}
                  </span>
                </div>

                {/* Preferred Time Slot */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'কল করার পছন্দের সময়' : 'Preferred Call Time'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-purple-600 transition-all font-medium cursor-pointer"
                  >
                    <option value="জরুরি (১৫-২০ মিনিটের মধ্যে)">⚡ জরুরি (১৫-২০ মিনিটের মধ্যে)</option>
                    <option value="সকাল ১০টা - দুপুর ১টা">সকাল ১০:০০ টা - দুপুর ০১:০০ টা</option>
                    <option value="দুপুর ২টা - বিকাল ৫টা">দুপুর ০২:০০ টা - বিকাল ০৫:০০ টা</option>
                    <option value="সন্ধ্যা ৬টা - রাত ১০টা">সন্ধ্যা ০৬:০০ টা - রাত ১০:০০ টা</option>
                  </select>
                </div>

                {/* Call Reason / Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'bn' ? 'কল করার কারণ / বিস্তারিত' : 'Reason for Call'} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder={language === 'bn' ? 'আপনি কী বিষয় জানতে চান? যেমন: ওয়েবসাইট অর্ডার, ডোমেন সাপোর্ট বা পেমেন্ট তথ্য...' : 'Details about your inquiry or required support...'}
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 transition-all resize-none font-medium"
                  />
                </div>

                {/* Consent */}
                <div>
                  <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 rounded text-purple-600 border-slate-300"
                    />
                    <span>
                      {language === 'bn'
                        ? 'আমি BongoWeb সাপোর্ট টিমকে এই নম্বরে কল করে সহায়তা প্রদানের সম্মতি দিচ্ছি (DPDP Compliant)।'
                        : 'I consent to receiving a call back from BongoWeb regarding this inquiry.'}
                    </span>
                  </label>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('options')}
                    className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>জমা হচ্ছে...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        <span>{language === 'bn' ? 'কল ব্যাক রিকোয়েস্ট পাঠান' : 'Submit Call Back Request'}</span>
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ACTIVE SUCCESS TICKET DISPLAY */}
          {successTicket && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-900 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                    {successTicket.status === 'approved' ? '✓ কল সম্পন্ন' : 'অপেক্ষমান (পেন্ডিং)'}
                  </span>
                  <h3 className="text-base font-black text-emerald-950 mt-0.5">
                    কল ব্যাক রিকোয়েস্ট সফল হয়েছে!
                  </h3>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-emerald-100 text-xs space-y-1.5 shadow-2xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">ট্র্যাকিং নম্বর:</span>
                  <span className="font-mono font-bold text-slate-800">{successTicket.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">গ্রাহকের নাম:</span>
                  <span className="font-bold text-slate-800">{successTicket.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">মোবাইল নম্বর:</span>
                  <span className="font-mono font-bold text-emerald-700">{successTicket.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">পছন্দের সময়:</span>
                  <span className="font-bold text-purple-700">{successTicket.preferredTime || 'জরুরি'}</span>
                </div>
              </div>

              <p className="text-xs text-emerald-800 leading-relaxed">
                আমাদের সাপোর্ট টিম আপনার নির্ধারিত সময়ে <strong className="font-mono">{successTicket.phone}</strong> নম্বরে কল করবে। জরুরি প্রয়োজনে আপনিও সরাসরি আমাদের কল করতে পারেন।
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleInstantCall}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>এখনই কল করুন (01955570912)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSuccessTicket(null);
                    setActiveTab('options');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  নতুন রিকোয়েস্ট
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
