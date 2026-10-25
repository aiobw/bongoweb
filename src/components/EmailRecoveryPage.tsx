import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Mail, Phone, ShoppingBag, HelpCircle, AlertCircle, 
  CheckCircle2, Clock, ShieldAlert, FileText, ChevronDown, 
  Send, RefreshCw, X, Sparkles, AlertTriangle
} from 'lucide-react';
import { EmailRecoveryRequest } from '../types';
import { apiCreateEmailRecovery, apiGetEmailRecoveries, validateStrictBangladeshiPhone } from '../utils/api';

interface EmailRecoveryPageProps {
  onBack: () => void;
}

export default function EmailRecoveryPage({ onBack }: EmailRecoveryPageProps) {
  // Existing submitted request for this browser
  const [activeRequest, setActiveRequest] = useState<EmailRecoveryRequest | null>(null);
  const [loadingActive, setLoadingActive] = useState(true);

  // Form states
  // Option 1: Gmail Issue
  const [gmailIssue, setGmailIssue] = useState<'forgot' | 'disabled' | 'no_access' | 'others' | ''>('');
  const [gmailDropdownOpen, setGmailDropdownOpen] = useState(false);
  const [customReason, setCustomReason] = useState('');
  const [isWritingOtherPage, setIsWritingOtherPage] = useState(false);

  // Option 2: Did you purchase anything before?
  const [purchasedBefore, setPurchasedBefore] = useState<boolean | null>(null);

  // Option 3: What was your mobile number? Do you remember it?
  const [rememberPhone, setRememberPhone] = useState<boolean | null>(null);
  const [isProvidingPhonePage, setIsProvidingPhonePage] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Check if user already submitted a request from this browser
  useEffect(() => {
    const checkActiveRequest = async () => {
      setLoadingActive(true);
      try {
        const stored = localStorage.getItem('bongoweb_email_recovery_request');
        if (stored) {
          const parsed: EmailRecoveryRequest = JSON.parse(stored);
          setActiveRequest(parsed);

          // Sync fresh status from API in case admin approved/changed or deleted it
          try {
            const all = await apiGetEmailRecoveries();
            const fresh = all.find((r) => r.id === parsed.id);
            if (fresh) {
              setActiveRequest(fresh);
              localStorage.setItem('bongoweb_email_recovery_request', JSON.stringify(fresh));
            } else if (all.length > 0) {
              // Admin deleted the request (e.g. client missed the call) - allow re-applying
              setActiveRequest(null);
              localStorage.removeItem('bongoweb_email_recovery_request');
            }
          } catch (_) {}
        }
      } catch (_) {}
      setLoadingActive(false);
    };

    checkActiveRequest();
  }, []);

  // Labels for Gmail issues
  const gmailIssueOptions: { id: 'forgot' | 'disabled' | 'no_access' | 'others'; titleBn: string; titleEn: string; desc: string; icon: string }[] = [
    {
      id: 'forgot',
      titleBn: 'আমি আমার জিমেইল ভুলে গেছি',
      titleEn: 'I forgot my Gmail',
      desc: 'আপনার পূর্বের জিমেইল অ্যাড্রেসটি মনে নেই',
      icon: '❓'
    },
    {
      id: 'disabled',
      titleBn: 'আমার জিমেইল নিষ্ক্রিয় / ডিজেবল করা হয়েছে',
      titleEn: 'My Gmail was disabled',
      desc: 'গুগল বা আপনার প্রতিষ্ঠান থেকে জিমেইলটি বন্ধ হয়ে গেছে',
      icon: '🚫'
    },
    {
      id: 'no_access',
      titleBn: 'আমার জিমেইলে আমার কোনো অ্যাক্সেস নেই',
      titleEn: "I don't have access to my Gmail",
      desc: 'পাসওয়ার্ড বা টু-ফ্যাক্টর ভেরিফিকেশন না থাকায় লগইন করা সম্ভব নয়',
      icon: '🔒'
    },
    {
      id: 'others',
      titleBn: 'অন্যান্য কারণ (Others)',
      titleEn: 'Others (Write custom reason)',
      desc: 'অন্য কোনো জটিলতা থাকলে ক্লিক করে বিস্তারিত লিখুন',
      icon: '✍️'
    }
  ];

  const handleSelectGmailIssue = (optionId: 'forgot' | 'disabled' | 'no_access' | 'others') => {
    setGmailIssue(optionId);
    setGmailDropdownOpen(false);
    if (optionId === 'others') {
      setIsWritingOtherPage(true);
    } else {
      setIsWritingOtherPage(false);
    }
  };

  const handleSelectRememberPhone = (val: boolean) => {
    setRememberPhone(val);
    // Open sub-page / input view to provide their phone number
    setIsProvidingPhonePage(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!gmailIssue) {
      setErrorMsg('অনুগ্রহ করে প্রথম অপশন থেকে জিমেইল সংক্রান্ত সমস্যাটি বেছে নিন।');
      return;
    }
    if (gmailIssue === 'others' && !customReason.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার সমস্যাটির বিবরণ লিখুন।');
      return;
    }
    if (purchasedBefore === null) {
      setErrorMsg('অনুগ্রহ করে দ্বিতীয় অপশন (পূর্বে ক্রয় করেছিলেন কিনা) নির্বাচন করুন।');
      return;
    }
    if (rememberPhone === null) {
      setErrorMsg('অনুগ্রহ করে তৃতীয় অপশন (মোবাইল নম্বর মনে আছে কিনা) নির্বাচন করুন।');
      return;
    }
    const phoneCheck = validateStrictBangladeshiPhone(phoneNumber);
    if (!phoneCheck.valid) {
      setErrorMsg(phoneCheck.error || 'সঠিক ১১-সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন। কোনো ফেক বা অস্থায়ী (Temporary) নম্বর গ্রহণযোগ্য নয়।');
      return;
    }

    setSubmitting(true);
    try {
      const selectedOption = gmailIssueOptions.find((o) => o.id === gmailIssue);
      const label = selectedOption ? `${selectedOption.titleEn} (${selectedOption.titleBn})` : gmailIssue;

      const created = await apiCreateEmailRecovery({
        gmailIssue,
        gmailIssueLabel: label,
        customReason: gmailIssue === 'others' ? customReason.trim() : undefined,
        purchasedBefore: Boolean(purchasedBefore),
        rememberPhone: Boolean(rememberPhone),
        phoneNumber: phoneNumber.trim()
      });

      setActiveRequest(created);
    } catch (_) {
      setErrorMsg('রিকোয়েস্ট পাঠাতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingActive) {
    return (
      <div className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center bg-[#F8F5FC]">
        <div className="flex items-center gap-2 text-[#AB55F7] font-bold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  // ========================================================
  // VIEW 1: PERSISTENT BANNER & DETAILS VIEW (If already requested)
  // ========================================================
  if (activeRequest) {
    const isPending = activeRequest.status === 'pending';
    const isCompleted = activeRequest.status === 'completed';

    return (
      <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-start py-6 sm:py-10 px-4 bg-[#F8F5FC] font-sans animate-fadeIn select-none">
        <div className="max-w-xl w-full space-y-5">
          {/* Back button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← লগইন পৃষ্ঠায় ফিরে যান</span>
            </button>

            <span className="text-[11px] font-mono text-slate-500 font-bold bg-white px-3 py-1 rounded-full border border-slate-200">
              আইডি: {activeRequest.id}
            </span>
          </div>

          {/* MAIN PERMANENT BANNER CONTAINER */}
          <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(171,85,247,0.18),0_4px_16px_rgba(0,0,0,0.03)] space-y-6">
            
            {/* Status Header Badge */}
            <div className="text-center space-y-2">
              {isPending ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-pulse">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>পর্যালোচনাধীন রয়েছে (Under Review)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>অনুমোদিত ও সম্পন্ন (Approved by Support)</span>
                </div>
              )}

              <h1 className="text-xl sm:text-2xl font-black text-[#0D253D] tracking-tight">
                {isPending 
                  ? 'আপনার ইমেইল রিকোয়েস্ট জমা হয়েছে' 
                  : 'রিকোয়েস্ট সিদ্ধান্ত সম্পন্ন হয়েছে'}
              </h1>
              <p className="text-xs text-slate-500">
                রিকোয়েস্ট দাখিলের তারিখ ও সময়: {activeRequest.createdAt}
              </p>
            </div>

            {/* MANDATORY NOTICE PARAGRAPHS IN BANGLA & ENGLISH */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/60 border border-[#AB55F7]/30 space-y-4 shadow-xs">
              {/* Bangla Notice */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7E22CE]">
                  <Phone className="w-4 h-4 text-[#AB55F7]" />
                  <span>গুরুত্বপূর্ণ নির্দেশনা (বাংলা):</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-white/70 p-3 rounded-xl border border-purple-100">
                  আমাদের ডেডিকেটেড সাপোর্ট টিম আগামী <strong className="text-[#AB55F7]">১ থেকে ৪৮ ঘণ্টার মধ্যে</strong> সরাসরি আপনার দেওয়া মোবাইল নম্বরে কল করবে এবং আপনার অ্যাকাউন্টটি যাচাই করে পুনরুদ্ধার সম্পন্ন করবে। অনুগ্রহ করে আমাদের কলটি রিসিভ করার জন্য প্রস্তুত থাকুন। <strong className="text-red-600">আপনি যদি আমাদের সাপোর্ট টিমের কলটি মিস করেন বা কল না ধরেন, তবে আপনার এই রিকোয়েস্টটি সিস্টেম থেকে স্বয়ংক্রিয়ভাবে মুছে ফেলা (বাতিল) হবে</strong> এবং আপনাকে পরবর্তীতে পুনরায় নতুন করে আবেদন করতে হবে।
                </p>
              </div>

              {/* English Notice */}
              <div className="space-y-1.5 pt-1 border-t border-purple-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <ShieldAlert className="w-4 h-4 text-slate-600" />
                  <span>Official Notice (English):</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-white/70 p-3 rounded-xl border border-slate-100">
                  Our dedicated support team will contact you directly via your provided mobile phone number within <strong>1 to 48 hours</strong> to verify and assist you with your account. Please answer the call promptly. <strong>If you miss the call or fail to answer, this request will be automatically deleted from our system</strong> and you will need to submit a new request again.
                </p>
              </div>
            </div>

            {/* SUBMITTED DETAILS CARD */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                আপনার দাখিলকৃত বিবরণ (Submitted Details)
              </h3>
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start justify-between py-1 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-500">জিমেইল সংক্রান্ত সমস্যা:</span>
                  <span className="font-bold text-[#0D253D] text-right max-w-[240px]">
                    {activeRequest.gmailIssueLabel || activeRequest.gmailIssue}
                  </span>
                </div>

                {activeRequest.customReason && (
                  <div className="py-1 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-500 block mb-0.5">অন্যান্য কারণের বিবরণ:</span>
                    <span className="text-slate-800 italic bg-white p-2 rounded-lg border border-slate-200 block">
                      "{activeRequest.customReason}"
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-500">পূর্বে ক্রয় করেছিলেন কি?</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                    activeRequest.purchasedBefore 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {activeRequest.purchasedBefore ? 'হ্যাঁ (Yes)' : 'না (No)'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-500">মোবাইল নম্বর মনে আছে কি?</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                    activeRequest.rememberPhone 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {activeRequest.rememberPhone ? 'হ্যাঁ (Yes)' : 'না (No)'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="font-semibold text-slate-500">কল করার জন্য মোবাইল নম্বর:</span>
                  <span className="font-mono font-bold text-[#AB55F7] text-sm">
                    {activeRequest.phoneNumber}
                  </span>
                </div>

                {activeRequest.decisionNote && (
                  <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <span className="font-bold block mb-1">অ্যাডমিন সিদ্ধান্ত:</span>
                    <p className="text-xs">{activeRequest.decisionNote}</p>
                    {activeRequest.decisionAt && (
                      <span className="text-[10px] text-emerald-700 block mt-1">সময়: {activeRequest.decisionAt}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#AB55F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>লগইন পেজে ফিরে যান</span>
              </button>

              {isCompleted && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('bongoweb_email_recovery_request');
                    setActiveRequest(null);
                  }}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all whitespace-nowrap cursor-pointer"
                >
                  নতুন আবেদন করুন
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // SUB-PAGE: Writing custom reason for "Others" option
  // ========================================================
  if (isWritingOtherPage) {
    return (
      <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-start py-6 sm:py-10 px-4 bg-[#F8F5FC] font-sans animate-fadeIn select-none">
        <div className="max-w-md w-full space-y-4">
          <button
            type="button"
            onClick={() => setIsWritingOtherPage(false)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← অপশন তালিকায় ফিরে যান</span>
          </button>

          <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(171,85,247,0.18),0_4px_16px_rgba(0,0,0,0.03)] space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#AB55F7] flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-[#0D253D]">
                অন্যান্য কারণ বিস্তারিত লিখুন
              </h2>
              <p className="text-xs text-slate-500">
                আপনার জিমেইল সংক্রান্ত সমস্যাটি সংক্ষেপে বুঝিয়ে লিখুন যাতে সাপোর্ট টিম সহায়তা করতে পারে।
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                আপনার কারণ / সমস্যার বিবরণ:
              </label>
              <textarea
                rows={4}
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="যেমন: আমি জিমেইলের পাসওয়ার্ড ভুলে গেছি এবং রিকভারি নম্বরও সচল নেই..."
                className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#AB55F7] focus:ring-2 focus:ring-[#AB55F7]/20 transition-all resize-none shadow-2xs"
              />
            </div>

            <button
              type="button"
              disabled={!customReason.trim()}
              onClick={() => setIsWritingOtherPage(false)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#AB55F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>সংরক্ষণ করুন ও মূল ফর্মে ফিরুন</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // SUB-PAGE: Providing Previously Used Phone Number (Option 3 = Yes)
  // ========================================================
  if (isProvidingPhonePage && rememberPhone === true) {
    return (
      <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-start py-6 sm:py-10 px-4 bg-[#F8F5FC] font-sans animate-fadeIn select-none">
        <div className="max-w-md w-full space-y-4">
          <button
            type="button"
            onClick={() => setIsProvidingPhonePage(false)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← অপশন তালিকায় ফিরে যান</span>
          </button>

          <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(171,85,247,0.18),0_4px_16px_rgba(0,0,0,0.03)] space-y-5">
            <div className="text-center space-y-1">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#AB55F7] flex items-center justify-center mx-auto mb-2 border border-purple-200 shadow-xs">
                <Phone className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-[#0D253D] tracking-tight">
                পূর্বের ব্যবহৃত মোবাইল নম্বর
              </h2>
              <p className="text-xs text-slate-500">
                What was your mobile number? (Remember: Yes)
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              যেহেতু আপনি জানিয়েছেন যে আপনার পূর্বের ব্যবহৃত মোবাইল নম্বরটি মনে আছে, অনুগ্রহ করে সেই মোবাইল নম্বরটি নিচে লিখুন। আমাদের সাপোর্ট টিম <strong className="text-[#AB55F7]">১ থেকে ৪৮ ঘণ্টার মধ্যে</strong> সরাসরি এই নম্বরে কল করে অ্যাকাউন্ট যাচাই করবে।
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                পূর্বে ব্যবহৃত মোবাইল নম্বরটি লিখুন:
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#AB55F7] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  autoFocus
                  required
                  placeholder="যেমন: 017XXXXXXXX বা 019XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border border-purple-200 text-sm font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#AB55F7] focus:ring-2 focus:ring-[#AB55F7]/20 transition-all shadow-2xs"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                * সচল নম্বর দিন যাতে সাপোর্ট টিম সরাসরি আপনার সাথে ফোনে কথা বলতে পারে।
              </p>
            </div>

            {/* Note on 1-48 hours and missing calls */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>গুরুত্বপূর্ণ নির্দেশনা:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                আমাদের সাপোর্ট টিম ১ থেকে ৪৮ ঘণ্টার মধ্যে কল করবে। কল মিস করলে আপনার রিকোয়েস্টটি মুছে ফেলা হবে এবং পুনরায় নতুন করে আবেদন করতে হবে।
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {/* Primary Submit button directly from this page */}
              <button
                type="button"
                disabled={submitting}
                onClick={(e) => {
                  if (!phoneNumber.trim() || phoneNumber.trim().length < 9) {
                    setErrorMsg('অনুগ্রহ করে সঠিক মোবাইল নম্বরটি লিখুন (ন্যূনতম ১০ বা ১১ সংখ্যা)।');
                    return;
                  }
                  if (!gmailIssue) {
                    setErrorMsg('অনুগ্রহ করে অপশন ১ থেকে জিমেইল সমস্যাটি প্রথমে বেছে নিন।');
                    setIsProvidingPhonePage(false);
                    return;
                  }
                  if (purchasedBefore === null) {
                    setErrorMsg('অনুগ্রহ করে অপশন ২ (পূর্বে ক্রয় করেছিলেন কিনা) নির্বাচন করুন।');
                    setIsProvidingPhonePage(false);
                    return;
                  }
                  handleSubmit(e as any);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#AB55F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>রিকোয়েস্ট দাখিল হচ্ছে...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>রিকোয়েস্ট সাবমিট করুন (Submit)</span>
                    <Send className="w-4 h-4" />
                  </span>
                )}
              </button>

              {/* Secondary button to return to main form with saved number */}
              <button
                type="button"
                onClick={() => setIsProvidingPhonePage(false)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>সংরক্ষণ করুন ও মূল ফর্মে ফিরুন</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // VIEW 2: NEW FORM SELECTION (3 Options with selection images/cards)
  // ========================================================
  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-start py-6 sm:py-10 px-4 bg-[#F8F5FC] font-sans animate-fadeIn select-none">
      <div className="max-w-xl w-full space-y-5">
        
        {/* Back Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← লগইন পৃষ্ঠায় ফিরে যান</span>
          </button>

          <span className="text-xs font-bold text-[#AB55F7] bg-purple-50 px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>ইমেইল রিকভারি সহায়তা</span>
          </span>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.08)] space-y-6 text-slate-900 animate-fadeIn">
          
          <div className="text-center pt-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-purple-500/20">
              <Mail className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Email Recovery Assistance
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              আপনার একাউন্ট পুনরুদ্ধারে নিচের তথ্যগুলো নির্বাচন করুন। আমাদের টিম দ্রুত আপনার সাথে যোগাযোগ করবে।
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* OPTION 1: GMAIL ISSUE (List opens to choose)              */}
          {/* ======================================================== */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              জিমেইল সংক্রান্ত সমস্যা (Gmail Issue)
            </label>

            {/* Click to open list */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setGmailDropdownOpen(!gmailDropdownOpen)}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
                  gmailIssue 
                    ? 'bg-purple-50/60 border-[#AB55F7] text-slate-900 font-bold' 
                    : 'bg-slate-50/80 border-slate-200 text-slate-500 font-medium hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#AB55F7]" />
                  <span className="text-xs sm:text-sm">
                    {gmailIssue 
                      ? gmailIssueOptions.find(o => o.id === gmailIssue)?.titleBn 
                      : 'জিমেইল সংক্রান্ত তালিকা খুলুন (Select issue from list)'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${gmailDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* The List of Options */}
              {gmailDropdownOpen && (
                <div className="mt-2 p-2 rounded-2xl bg-white border border-purple-200 shadow-xl space-y-1.5 animate-fadeIn">
                  {gmailIssueOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectGmailIssue(opt.id)}
                      className={`w-full p-3 rounded-xl text-left transition-all flex items-start gap-3 cursor-pointer ${
                        gmailIssue === opt.id 
                          ? 'bg-purple-100/70 border border-[#AB55F7] text-purple-900' 
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xl mt-0.5">{opt.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs sm:text-sm font-bold text-slate-800">
                          {opt.titleBn}
                        </div>
                        <div className="text-[11px] text-[#AB55F7] font-semibold">
                          {opt.titleEn}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {opt.desc}
                        </div>
                      </div>
                      {gmailIssue === opt.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#AB55F7] shrink-0 mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* If Others is chosen, show quick summary / edit link */}
            {gmailIssue === 'others' && (
              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 flex items-center justify-between">
                <div className="text-xs">
                  <span className="font-bold text-purple-900">অন্যান্য কারণ: </span>
                  <span className="text-slate-700 italic">
                    {customReason ? `"${customReason}"` : 'এখনো বিবরণ লেখা হয়নি'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWritingOtherPage(true)}
                  className="text-xs text-[#AB55F7] font-bold underline hover:text-[#7C3AED] cursor-pointer shrink-0 ml-2"
                >
                  {customReason ? 'পরিবর্তন করুন' : 'বিবরণ লিখুন'}
                </button>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* OPTION 2: DID YOU PURCHASE ANYTHING BEFORE? (Yes / No)    */}
          {/* ======================================================== */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              আপনি কি পূর্বে কোনো ওয়েবসাইট অর্ডার করেছেন?
            </label>

            {/* Selection Cards (Images / Visual icons, no typing) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Option: YES */}
              <button
                type="button"
                onClick={() => setPurchasedBefore(true)}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${
                  purchasedBefore === true
                    ? 'bg-purple-50 border-[#AB55F7] ring-2 ring-[#AB55F7]/20 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  purchasedBefore === true ? 'bg-[#AB55F7] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    হ্যাঁ (Yes)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    পূর্বে ওয়েবসাইট অর্ডার করেছি
                  </div>
                </div>
                {purchasedBefore === true && (
                  <CheckCircle2 className="w-4 h-4 text-[#AB55F7]" />
                )}
              </button>

              {/* Option: NO */}
              <button
                type="button"
                onClick={() => setPurchasedBefore(false)}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${
                  purchasedBefore === false
                    ? 'bg-purple-50 border-[#AB55F7] ring-2 ring-[#AB55F7]/20 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  purchasedBefore === false ? 'bg-[#AB55F7] text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    না (No)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    নতুন ক্লায়েন্ট / কিছু কিনিনি
                  </div>
                </div>
                {purchasedBefore === false && (
                  <CheckCircle2 className="w-4 h-4 text-[#AB55F7]" />
                )}
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* OPTION 3: WHAT WAS YOUR MOBILE NUMBER? (Remember: Yes/No) */}
          {/* ======================================================== */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">
              আপনার পূর্বের মোবাইল নম্বর কি মনে আছে?
            </label>

            {/* Selection Cards (Yes / No) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Option: YES */}
              <button
                type="button"
                onClick={() => handleSelectRememberPhone(true)}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${
                  rememberPhone === true
                    ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  rememberPhone === true ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    হ্যাঁ (Yes)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    পূর্বের নম্বর মনে আছে
                  </div>
                </div>
                {rememberPhone === true && (
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                )}
              </button>

              {/* Option: NO */}
              <button
                type="button"
                onClick={() => handleSelectRememberPhone(false)}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group ${
                  rememberPhone === false
                    ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                  rememberPhone === false ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    না (No)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    সঠিক নম্বর মনে নেই
                  </div>
                </div>
                {rememberPhone === false && (
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                )}
              </button>
            </div>

            {/* Option 3 Details (When Yes or No is selected) */}
            {rememberPhone === true && (
              <div className="mt-3 p-4 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-950">
                    পূর্বে ব্যবহৃত মোবাইল নম্বর:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsProvidingPhonePage(true)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-bold underline cursor-pointer"
                  >
                    {phoneNumber ? 'নম্বর পরিবর্তন করুন' : 'নম্বর লিখুন (পৃষ্ঠা খুলুন)'}
                  </button>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-purple-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="যেমন: 017XXXXXXXX বা 019XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-purple-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 font-mono font-bold shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-purple-800">
                  📞 এই নম্বরেই আমাদের সাপোর্ট টিম কল করে অ্যাকাউন্ট যাচাই করবে।
                </p>
              </div>
            )}

            {rememberPhone === false && (
              <div className="mt-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 animate-fadeIn">
                <label className="block text-xs font-bold text-amber-950">
                  সাপোর্ট টিম যে সচল নম্বরে কল করবে সেই নম্বর দিন:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="যেমন: 017XXXXXXXX বা 019XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-amber-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono font-bold shadow-2xs"
                  />
                </div>
                <p className="text-[11px] text-amber-800">
                  ⚠️ যেহেতু পূর্বের নম্বর মনে নেই, তাই এই সচল নম্বরে কল করে বিকল্প তথ্যাদি দিয়ে যাচাই করা হবে।
                </p>
              </div>
            )}
          </div>

          {/* POLICY CALLOUT: 1 to 48 hours response notice */}
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>কল সংক্রান্ত অত্যন্ত জরুরি শর্তাবলী:</span>
            </div>
            <p className="leading-relaxed">
              রিকোয়েস্ট দাখিলের পর আমাদের সাপোর্ট টিম <strong>১ থেকে ৪৮ ঘণ্টার মধ্যে</strong> সরাসরি আপনার মোবাইল নম্বরে কল করবে। অনুগ্রহ করে কলটি রিসিভ করুন। <strong>কল মিস করলে রিকোয়েস্টটি মুছে দেওয়া হবে</strong> এবং আপনাকে পুনরায় নতুন করে আবেদন করতে হবে।
            </p>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>রিকোয়েস্ট দাখিল হচ্ছে...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>রিকোয়েস্ট দাখিল করুন</span>
                  <Send className="w-4 h-4" />
                </span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
