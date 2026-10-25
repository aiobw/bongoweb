import React, { useState, useEffect } from 'react';
import { 
  X, ClipboardCheck, MessageCircle, 
  CheckCircle2, Send, Ticket,
  PhoneCall, Lock,
  Building2, ShieldCheck, Mail, Phone, ExternalLink, Cookie,
  ChevronRight, KeyRound
} from 'lucide-react';
import BongoWebLogo from './BongoWebLogo';
import { BottomTabType } from './FixedBottomNav';
import { UserAccount, CallBackRequest } from '../types';
import { apiSubmitCallBackRequest } from '../utils/api';
import { useLanguage } from '../utils/LanguageContext';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: BottomTabType) => void;
  onGoToCategoryLanding?: () => void;
  onOpenLogoShowcase?: () => void;
  onOpenOrderDetails?: () => void;
  onOpenWebsiteCredentials?: () => void;
  onNavigateLegal?: (page: 'privacy' | 'terms' | 'cookies' | 'refund') => void;
}

export default function SideMenuDrawer({
  isOpen,
  onClose,
  onSelectTab,
  onGoToCategoryLanding,
  onOpenLogoShowcase: _onOpenLogoShowcase,
  onOpenOrderDetails,
  onOpenWebsiteCredentials,
  onNavigateLegal
}: SideMenuDrawerProps) {
  const { language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const raw = localStorage.getItem('bongoweb_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [myCallBackRequest, setMyCallBackRequest] = useState<CallBackRequest | null>(() => {
    try {
      const raw = localStorage.getItem('bongoweb_my_active_callback_request');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Keep user and callback request in sync
  useEffect(() => {
    const handleSync = () => {
      try {
        const u = localStorage.getItem('bongoweb_user');
        setCurrentUser(u ? JSON.parse(u) : null);
      } catch {
        setCurrentUser(null);
      }

      try {
        const cb = localStorage.getItem('bongoweb_my_active_callback_request');
        setMyCallBackRequest(cb ? JSON.parse(cb) : null);
      } catch {
        setMyCallBackRequest(null);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('bongoweb_user_updated', handleSync);
    window.addEventListener('bongoweb_callback_requests_updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('bongoweb_user_updated', handleSync);
      window.removeEventListener('bongoweb_callback_requests_updated', handleSync);
    };
  }, []);

  // Call Back Modal State
  const [callBackModalOpen, setCallBackModalOpen] = useState(false);
  const [callBackName, setCallBackName] = useState('');
  const [callBackPhone, setCallBackPhone] = useState('');
  const [callBackReason, setCallBackReason] = useState('');
  const [callBackSubmitting, setCallBackSubmitting] = useState(false);
  const [callBackSuccess, setCallBackSuccess] = useState(false);
  const [showLoginPromptModal, setShowLoginPromptModal] = useState(false);

  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketReason, setTicketReason] = useState('');
  const [ticketName, setTicketName] = useState('');
  const [ticketPhone, setTicketPhone] = useState('');
  const [ticketQuestion, setTicketQuestion] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [generatedTicketId, setGeneratedTicketId] = useState('');

  // Business Info & Legal Policies Modal State
  const [businessInfoModalOpen, setBusinessInfoModalOpen] = useState(false);
  const [ticketConsent, setTicketConsent] = useState(false);
  const [ticketConsentError, setTicketConsentError] = useState('');
  const [callBackConsent, setCallBackConsent] = useState(false);
  const [callBackConsentError, setCallBackConsentError] = useState('');

  if (!isOpen) return null;

  const handleOpenCallBack = () => {
    if (!currentUser) {
      setShowLoginPromptModal(true);
      return;
    }
    setCallBackName(currentUser.name || '');
    setCallBackPhone(currentUser.phone || '');
    setCallBackReason('');
    setCallBackConsent(false);
    setCallBackConsentError('');
    setCallBackSuccess(false);
    setCallBackModalOpen(true);
  };

  const handleSubmitCallBack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callBackName.trim() || !callBackPhone.trim() || !callBackReason.trim()) return;

    if (!callBackConsent) {
      setCallBackConsentError(
        language === 'bn' 
          ? 'অনুগ্রহ করে যোগাযোগের সম্মতিতে টিক দিন।' 
          : 'Please give consent to be contacted regarding your inquiry.'
      );
      return;
    }

    setCallBackSubmitting(true);
    setCallBackConsentError('');
    try {
      const res = await apiSubmitCallBackRequest({
        name: callBackName.trim(),
        phone: callBackPhone.trim(),
        reason: callBackReason.trim()
      });
      setMyCallBackRequest(res);
      setCallBackSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setCallBackSubmitting(false);
    }
  };

  const handleOpenTicket = () => {
    setTicketSubmitted(false);
    setTicketConsent(false);
    setTicketConsentError('');
    setTicketModalOpen(true);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketReason.trim() || !ticketName.trim() || !ticketQuestion.trim()) return;

    if (!ticketConsent) {
      setTicketConsentError(
        language === 'bn'
          ? 'অনুগ্রহ করে সাপোর্ট যোগাযোগ সম্মতিতে টিক দিন।'
          : 'Please agree to allow our support team to contact you.'
      );
      return;
    }

    const randomId = `#TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedTicketId(randomId);
    setTicketSubmitted(true);
    setTicketConsentError('');
  };

  const handleResetTicketModal = () => {
    setTicketModalOpen(false);
    setTicketSubmitted(false);
    setTicketConsent(false);
    setTicketConsentError('');
    setTicketReason('');
    setTicketName('');
    setTicketPhone('');
    setTicketQuestion('');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
        {/* Backdrop */}
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
        />

        {/* Drawer Content */}
        <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg bg-white text-slate-900 h-full shadow-2xl flex flex-col justify-between z-10 animate-slideLeft border-l border-slate-200">
          {/* Drawer Top Header */}
          <div className="p-4 sm:p-5 border-b border-[#4A2370] flex items-center justify-between bg-[#5B2C8A] text-white">
            <BongoWebLogo size="sm" variant="white" />

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Organized Navigation Menu */}
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 space-y-5">
            {/* SECTION 1: Orders & Website Services */}
            <div className="space-y-2">
              <div className="px-1 flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5B2C8A] flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'অর্ডার ও ওয়েবসাইট সেবা' : 'Orders & Services'}</span>
                </span>
              </div>

              <div className="space-y-2">
                {/* 1. Order Details */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectTab('after-order');
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#FAF6FC] active:bg-[#F3EBF9] border border-[#EDE4F5] hover:border-[#5B2C8A]/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F8F5FC] text-[#5B2C8A] group-hover:bg-[#5B2C8A] group-hover:text-white border border-[#EDE4F5] flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                      <ClipboardCheck className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#1F1F2E] group-hover:text-[#5B2C8A] transition-colors leading-tight truncate">
                        {language === 'bn' ? 'আপনার অর্ডারের বিস্তারিত' : 'Your Order Details'}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] font-normal mt-0.5 leading-snug truncate">
                        {language === 'bn' ? 'লাইভ ডেলিভারি স্ট্যাটাস ও ট্র্যাকিং' : 'Live delivery status & tracking'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#5B2C8A] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* 2. Website ID & Password */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectTab('credentials');
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#FAF6FC] active:bg-[#F3EBF9] border border-[#EDE4F5] hover:border-[#5B2C8A]/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F8F5FC] text-[#5B2C8A] group-hover:bg-[#5B2C8A] group-hover:text-white border border-[#EDE4F5] flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                      <KeyRound className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#1F1F2E] group-hover:text-[#5B2C8A] transition-colors leading-tight truncate">
                        {language === 'bn' ? 'ওয়েবসাইট আইডি ও পাসওয়ার্ড' : 'Website ID & Password'}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] font-normal mt-0.5 leading-snug truncate">
                        {language === 'bn' ? 'ডেলিভারি হওয়া ওয়েবসাইটের লগইন তথ্য' : 'Delivered website login credentials'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#5B2C8A] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* 3. Dedicated Admin Control Panel Entry */}
                <div
                  onClick={() => {
                    onClose();
                    window.history.pushState({}, '', '/admin');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  role="button"
                  tabIndex={0}
                  className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#FAF6FC] active:bg-[#F3EBF9] border border-[#EDE4F5] hover:border-[#5B2C8A]/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F8F5FC] text-[#5B2C8A] group-hover:bg-[#5B2C8A] group-hover:text-white border border-[#EDE4F5] flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                      <ShieldCheck className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1F1F2E] group-hover:text-[#5B2C8A] transition-colors leading-tight truncate">
                          {language === 'bn' ? 'অ্যাডমিন কন্ট্রোল প্যানেল' : 'Admin Control Panel'}
                        </h4>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#5B2C8A]/10 text-[#5B2C8A] border border-[#5B2C8A]/20">
                          /admin
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] font-normal mt-0.5 leading-snug truncate">
                        {language === 'bn' ? 'ম্যানেজমেন্ট ও ক্যাটালগ কন্ট্রোল' : 'Management & catalog control'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#5B2C8A] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>
            </div>

            {/* SECTION 2: Customer Support & Assistance */}
            <div className="space-y-2">
              <div className="px-1 flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5B2C8A] flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'কাস্টমার সাপোর্ট ও সহায়তা' : 'Support & Assistance'}</span>
                </span>
              </div>

              <div className="space-y-2">
                {/* 4. Live Chat Support */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectTab('live-chat');
                  }}
                  className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#FAF6FC] active:bg-[#F3EBF9] border border-[#EDE4F5] hover:border-[#5B2C8A]/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white border border-emerald-200 flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                      <MessageCircle className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#1F1F2E] group-hover:text-[#5B2C8A] transition-colors leading-tight truncate">
                        {language === 'bn' ? 'বঙ্গওয়েব লাইভ সাপোর্ট' : 'BongoWeb Live Support'}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] font-normal mt-0.5 leading-snug truncate">
                        {language === 'bn' ? 'তাৎক্ষণিক চ্যাট ও কাস্টমার কেয়ার' : 'Instant live chat & desk'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#5B2C8A] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* 5. Support Ticket */}
                <button
                  type="button"
                  onClick={handleOpenTicket}
                  className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#FAF6FC] active:bg-[#F3EBF9] border border-[#EDE4F5] hover:border-[#5B2C8A]/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F8F5FC] text-[#5B2C8A] group-hover:bg-[#5B2C8A] group-hover:text-white border border-[#EDE4F5] flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                      <Ticket className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#1F1F2E] group-hover:text-[#5B2C8A] transition-colors leading-tight truncate">
                        {language === 'bn' ? 'সাপোর্ট টিকিট' : 'Support Ticket'}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] font-normal mt-0.5 leading-snug truncate">
                        {language === 'bn' ? 'অভিযোগ ও টেকনিক্যাল অনুসন্ধান' : 'Submit technical inquiries & issues'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#5B2C8A] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>

                {/* 6. Call Back Request */}
                <button
                  type="button"
                  onClick={handleOpenCallBack}
                  className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#FAF6FC] active:bg-[#F3EBF9] border border-[#EDE4F5] hover:border-[#5B2C8A]/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F8F5FC] text-[#5B2C8A] group-hover:bg-[#5B2C8A] group-hover:text-white border border-[#EDE4F5] flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                      <PhoneCall className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#1F1F2E] group-hover:text-[#5B2C8A] transition-colors leading-tight truncate">
                        {language === 'bn' ? 'কল ব্যাক রিকোয়েস্ট' : 'Request Call Back'}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] font-normal mt-0.5 leading-snug truncate">
                        {language === 'bn' ? 'আমাদের প্রতিনিধি আপনাকে দ্রুত কল করবে' : 'Our representative will call you back'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#5B2C8A] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Clean Footer with Compliance & Clickable Contacts */}
          <div className="p-3.5 border-t border-[#EDE4F5] bg-[#F8F5FC] text-center space-y-2">

            <div className="flex items-center justify-center gap-3 text-[11px]">
              <a 
                href="tel:+8801955570912"
                className="text-[#5B2C8A] font-bold hover:underline inline-flex items-center gap-1 font-mono"
              >
                <Phone className="w-3 h-3" />
                <span>01955570912</span>
              </a>
              <span className="text-slate-300">•</span>
              <a 
                href="mailto:support@bongoweb.xyz"
                className="text-[#5B2C8A] font-bold hover:underline inline-flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                <span>support@bongoweb.xyz</span>
              </a>
            </div>

            <div className="pt-1 flex items-center justify-center gap-2 text-[10px] text-[#6B7280] flex-wrap">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateLegal) onNavigateLegal('privacy');
                }}
                className="hover:text-[#5B2C8A] underline cursor-pointer"
              >
                Privacy
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateLegal) onNavigateLegal('terms');
                }}
                className="hover:text-[#5B2C8A] underline cursor-pointer"
              >
                Terms
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateLegal) onNavigateLegal('refund');
                }}
                className="hover:text-[#5B2C8A] underline cursor-pointer"
              >
                Refund
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateLegal) onNavigateLegal('cookies');
                }}
                className="hover:text-[#5B2C8A] underline cursor-pointer"
              >
                Cookies
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support Ticket Modal */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 animate-slideUpModal relative">
            <button
              onClick={handleResetTicketModal}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {ticketSubmitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold font-mono">
                  {generatedTicketId}
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  সাপোর্ট টিকিট সফলভাবে গৃহীত হয়েছে!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                  ধন্যবাদ <strong className="text-purple-700">{ticketName}</strong>। আমাদের টেকনিক্যাল টিম আপনার টিকিট পর্যালোচনা করে খুব শীঘ্রই আপনার মোবাইল নম্বরে সমাধান জানাবে।
                </p>
                <div className="pt-3">
                  <button
                    onClick={handleResetTicketModal}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer shadow-md shadow-purple-500/25"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-5">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold">
                    সরাসরি সাপোর্ট ডেস্ক
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-2">
                    সাপোর্ট টিকিট জমা দিন (Support Ticket)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    আপনার যেকোনো প্রশ্ন বা সমস্যার কারণ লিখে টিকিট পাঠান।
                  </p>
                </div>

                <form onSubmit={handleSubmitTicket} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      টিকিটের কারণ / বিষয় (Reason Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ডোমেইন সেটআপ, পেমেন্ট গেটওয়ে, কাস্টম ডিজাইন..."
                      value={ticketReason}
                      onChange={(e) => setTicketReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        আপনার নাম (Your Name) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="আপনার নাম"
                        value={ticketName}
                        onChange={(e) => setTicketName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        মোবাইল নম্বর <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="017xxxxxxxx"
                        value={ticketPhone}
                        onChange={(e) => setTicketPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      আপনার প্রশ্ন বা সমস্যা (Your Question) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="বিস্তারিত লিখুন..."
                      value={ticketQuestion}
                      onChange={(e) => setTicketQuestion(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={ticketConsent}
                        onChange={(e) => setTicketConsent(e.target.checked)}
                        className="mt-0.5 rounded text-[#5B2C8A] border-slate-300"
                      />
                      <span>
                        আমি BongoWeb সাপোর্ট টিমকে আমার এই মোবাইল নম্বর ও বিষয়ে যোগাযোগের সম্মতি প্রদান করছি (DPDP Act &amp; Privacy Policy Compliant)।
                      </span>
                    </label>
                    {ticketConsentError && (
                      <p className="text-[11px] text-rose-500 font-bold mt-1">{ticketConsentError}</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>টিকিট পাঠান (Send Ticket)</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Business Details & Legal Compliance Modal (Replaces fake reviews) */}
      {businessInfoModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl max-h-[85vh] bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 animate-slideUpModal relative flex flex-col">
            <button
              onClick={() => setBusinessInfoModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5B2C8A] border border-purple-200 text-xs font-bold inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>ব্যবসায়িক পরিচিতি ও আইনি বিবরণ</span>
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                BongoWeb Digital Solutions Ltd.
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                অফিসিয়াল কোম্পানি তথ্য, স্বচ্ছ রিফান্ড নীতি ও ডিপিডিপি আইন মেনে পরিচালিত সেবা:
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              {/* Registered Address & Entity */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <span>কর্পোরেট বিবরণ ও নিবন্ধিত কার্যালয়</span>
                </div>
                <p className="text-slate-600">
                  <strong>কোম্পানি:</strong> BongoWeb Digital Solutions Ltd.
                </p>
                <p className="text-slate-600">
                  <strong>অফিস ঠিকানা:</strong> Block B, Road 11, Banani, Dhaka 1213, Bangladesh.
                </p>
                <p className="text-slate-600">
                  <strong>সেবার ধরণ:</strong> প্রিমিয়াম বিজনেস ওয়েবসাইট ক্যাটালগ ও ক্লাউড নোড হোস্টিং।
                </p>
              </div>

              {/* Direct Clickable Contacts */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm">
                  যোগাযোগ ও কাস্টমার সাপোর্ট
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#5B2C8A]" />
                  <span className="text-slate-600">হটলাইন:</span>
                  <a href="tel:+8801955570912" className="text-[#5B2C8A] font-bold font-mono underline">
                    01955570912
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#5B2C8A]" />
                  <span className="text-slate-600">ইমেইল:</span>
                  <a href="mailto:support@bongoweb.xyz" className="text-[#5B2C8A] font-bold underline">
                    support@bongoweb.xyz
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#5B2C8A]" />
                  <span className="text-slate-600">ডিপিডিপি গ্রিভ্যান্স অফিসার:</span>
                  <a href="mailto:privacy@bongoweb.xyz" className="text-[#5B2C8A] font-bold underline">
                    privacy@bongoweb.xyz
                  </a>
                </div>
              </div>

              {/* Quick Legal Links */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                <div className="font-bold text-[#5B2C8A] text-xs uppercase tracking-wider">
                  আইনি নীতিমালা ও অধিকার
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBusinessInfoModalOpen(false);
                      onClose();
                      if (onNavigateLegal) onNavigateLegal('privacy');
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-purple-100/60 text-[#1F1F2E] font-bold border border-purple-200 transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Privacy Policy (DPDP)</span>
                    <ExternalLink className="w-3 h-3 text-[#5B2C8A]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBusinessInfoModalOpen(false);
                      onClose();
                      if (onNavigateLegal) onNavigateLegal('terms');
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-purple-100/60 text-[#1F1F2E] font-bold border border-purple-200 transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Terms &amp; Conditions</span>
                    <ExternalLink className="w-3 h-3 text-[#5B2C8A]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBusinessInfoModalOpen(false);
                      onClose();
                      if (onNavigateLegal) onNavigateLegal('refund');
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-purple-100/60 text-[#1F1F2E] font-bold border border-purple-200 transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>৭-দিনের রিফান্ড পলিসি</span>
                    <ExternalLink className="w-3 h-3 text-[#5B2C8A]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBusinessInfoModalOpen(false);
                      onClose();
                      if (onNavigateLegal) onNavigateLegal('cookies');
                    }}
                    className="p-2.5 rounded-xl bg-white hover:bg-purple-100/60 text-[#1F1F2E] font-bold border border-purple-200 transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Cookie Policy</span>
                    <ExternalLink className="w-3 h-3 text-[#5B2C8A]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('bongoweb_open_cookie_preferences'));
                }}
                className="text-xs text-[#5B2C8A] font-bold underline cursor-pointer flex items-center gap-1"
              >
                <Cookie className="w-3.5 h-3.5" />
                <span>কুকি সেটিংস পরিবর্তন</span>
              </button>

              <button
                type="button"
                onClick={() => setBusinessInfoModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Prompt Modal for Non-Logged-in Users */}
      {showLoginPromptModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 animate-slideUpModal relative">
            <button
              onClick={() => setShowLoginPromptModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
                <PhoneCall className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  কল ব্যাক সেবা (Call Back Request)
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  কল ব্যাক রিকোয়েস্ট জমা দিতে এবং আমাদের সাপোর্ট টিমের সরাসরি কল পেতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন বা একটি নতুন অ্যাকাউন্ট খুলুন।
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-800 flex items-center gap-2 text-left font-medium">
                <Lock className="w-4 h-4 shrink-0 text-purple-600" />
                <span>লগইন করার পর আপনার নাম ও নম্বর স্বয়ংক্রিয়ভাবে সংযুক্ত হবে।</span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginPromptModal(false);
                    onClose();
                    onSelectTab('account');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>লগইন / সাইন আপ করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginPromptModal(false)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  পরে করব
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
