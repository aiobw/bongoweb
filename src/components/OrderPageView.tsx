import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, 
  Copy, Check, Upload, HelpCircle, Lock, 
  FileText, Download, Printer, AlertCircle, Sparkles,
  Mail, Phone, RefreshCw, KeyRound, User, Globe, Zap, MessageCircle,
  Building2, Hash, CreditCard, Smartphone, ChevronDown, X
} from 'lucide-react';
import { WebsiteDemo, ClientOrder, UserAccount } from '../types';
import { 
  apiCreateOrder, apiRegisterUser, apiGetUsers, apiSendEmailOtp, apiVerifyEmailOtp,
  isStrictGmail, validateStrictBangladeshiPhone 
} from '../utils/api';
import { useLanguage } from '../utils/LanguageContext';

interface OrderPageViewProps {
  demo: WebsiteDemo | string | null;
  onBackToDashboard: () => void;
  onBackToWebsite?: (code: string) => void;
  onOrderCompleted?: (order: ClientOrder) => void;
}

export type OrderStep = 1 | 'otp' | 2 | 3 | 'receipt';
export type BuyerTier = 'basic' | 'pro' | 'advance';

export default function OrderPageView({
  demo,
  onBackToDashboard,
  onBackToWebsite,
  onOrderCompleted
}: OrderPageViewProps) {
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const defaultTitle = isEn ? 'Premium Business Website' : 'প্রিমিয়াম বিজনেস ওয়েবসাইট';
  const demoTitle = typeof demo === 'string' ? demo : demo?.title || defaultTitle;
  const demoCode = (typeof demo === 'object' && demo?.fourDigitCode) ? demo.fourDigitCode : (typeof demo === 'string' ? demo : '#2085');
  const cleanCode = String(demoCode || '').replace('#', '');
  const storageKey = `bongoweb_order_state_${cleanCode}`;

  const demoObj: WebsiteDemo = (() => {
    if (typeof demo === 'object' && demo) return demo;
    const clean = String(demoCode || '').replace('#', '').trim().toLowerCase();
    try {
      const stored = localStorage.getItem('bongoweb_custom_websites') || localStorage.getItem('bongoweb_custom_catalog');
      if (stored) {
        const parsed: WebsiteDemo[] = JSON.parse(stored);
        const found = parsed.find(d => String(d?.fourDigitCode || '').replace('#', '').trim().toLowerCase() === clean);
        if (found) return found;
      }
    } catch (_) {}
    return {
      id: `site-${clean || 'custom'}`,
      fourDigitCode: clean ? `#${clean}` : '#1001',
      title: demoTitle,
      englishTitle: demoTitle,
      banglaTitle: demoTitle,
      category: 'ecommerce',
      categoryLabel: '🛍️ E-Commerce',
      description: 'Ready-made business website solution with automated checkout and mobile optimization.',
      priceTag: '১,৯৯০ ৳',
      demoUrl: `${clean || 'demo'}.bongoweb.site`,
      previewImage: '',
      heroHeadline: demoTitle,
      features: ['Automated Checkout', 'Courier Integration', '24h Delivery']
    };
  })();

  // Safely restore state across page refreshes
  const getSavedState = () => {
    try {
      const saved = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  };

  const getLoggedInUser = (): UserAccount | null => {
    try {
      const raw = localStorage.getItem('bongoweb_user') || sessionStorage.getItem('bongoweb_user');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  };

  const saved = getSavedState();
  const loggedIn = getLoggedInUser();

  const getLatestSavedOrder = (): ClientOrder | null => {
    if (saved?.createdOrder) return saved.createdOrder;
    try {
      const rawLatest = localStorage.getItem('bongoweb_latest_order');
      if (rawLatest) return JSON.parse(rawLatest);
    } catch (_) {}
    return null;
  };

  // Check URL query for step e.g. /order/2085?step=2
  const getInitialStep = (): OrderStep => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlStep = params.get('step');
      if (urlStep === 'receipt') return 'receipt';
      if (urlStep === '3') return 3;
      if (urlStep === '2') return 2;
      if (urlStep === 'otp') return 'otp';
    } catch (_) {}
    if (saved?.createdOrder || localStorage.getItem('bongoweb_latest_order')) {
      if (saved?.currentStep === 'receipt' || saved?.currentStep === 3) return 'receipt';
    }
    if (saved?.currentStep === 'receipt') return 'receipt';
    if (saved?.currentStep === 3) return 3;
    if (saved?.currentStep === 2) return 2;
    if (saved?.currentStep === 'otp') return 'otp';
    if (loggedIn) return 2; // If already logged in, skip account creation directly to step 2!
    return 1;
  };

  // Step 1: User Info; Step 'otp': OTP verification; Step 2: Business & Domain; Step 3: Checkout/Payment; 'receipt': Standalone Receipt
  const [currentStep, setCurrentStep] = useState<OrderStep>(getInitialStep());

  // Step 1 Inputs (Client Information - No Passwords)
  const [name, setName] = useState(saved?.name || loggedIn?.name || '');
  const [phone, setPhone] = useState(saved?.phone || loggedIn?.phone || '');
  const [email, setEmail] = useState(saved?.email || loggedIn?.email || '');
  const [formConsent, setFormConsent] = useState(false);
  const [step1Error, setStep1Error] = useState('');
  const [step1Loading, setStep1Loading] = useState(false);

  // OTP Verification State
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [isOldUserDetected, setIsOldUserDetected] = useState(false);
  const [registeredOldNumber, setRegisteredOldNumber] = useState('');
  const lastVerifiedOtpRef = useRef<string>('');

  // Step 2 Inputs (Company & Domain)
  const [companyName, setCompanyName] = useState(saved?.companyName || '');
  const [domainOption, setDomainOption] = useState<'have_domain' | 'no_domain' | 'dont_know' | null>(null);
  const [customDomainName, setCustomDomainName] = useState(saved?.customDomainName || '');
  const [step2Error, setStep2Error] = useState('');
  const [showFeaturesSheet, setShowFeaturesSheet] = useState(false);

  // Automatically calculate buyer domain tier based on selected product price:
  // "The higher the price they buy, the higher tier domain they get"
  // Basic: .shop (budget packages e.g. < ৳1,400 like ৳999)
  // Pro: .xyz (mid-tier packages e.g. ৳1,400 - ৳2,200 like ৳1,490, ৳1,990)
  // Advance: .com (premium packages e.g. > ৳2,200 like ৳2,450, ৳3,500+)
  const demoNumericPrice = useMemo(() => {
    try {
      const rawPrice = (demoObj?.priceTag || '').toString();
      const bengaliToEnglish: Record<string, string> = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
      };
      const normalizedPrice = rawPrice.replace(/[০-৯]/g, d => bengaliToEnglish[d] || d);
      const priceNum = parseInt(normalizedPrice.replace(/[^0-9]/g, ''), 10) || 0;
      if (priceNum > 0) return priceNum;
    } catch (_) {}
    return 1990;
  }, [demoObj]);

  const buyerTier: BuyerTier = useMemo(() => {
    try {
      // 1. Check URL query override (?tier=basic|pro|advance)
      const params = new URLSearchParams(window.location.search);
      const urlTier = params.get('tier') || params.get('plan') || params.get('package');
      if (urlTier === 'basic') return 'basic';
      if (urlTier === 'pro') return 'pro';
      if (urlTier === 'advance' || urlTier === 'advanced') return 'advance';

      // 2. Check saved order tier if in receipt mode
      if (saved?.buyerTier && currentStep === 'receipt') return saved.buyerTier;

      // 3. User account tier if present
      if (loggedIn?.tier === 'basic' || loggedIn?.plan === 'basic') return 'basic';
      if (loggedIn?.tier === 'pro' || loggedIn?.plan === 'pro') return 'pro';
      if (loggedIn?.tier === 'advance' || loggedIn?.plan === 'advance') return 'advance';

      // 4. Derive from product price: "the high price they buy the high they get"
      if (demoNumericPrice <= 1200) {
        return 'basic'; // .shop
      } else if (demoNumericPrice <= 2200) {
        return 'pro'; // .xyz
      } else {
        return 'advance'; // .com
      }
    } catch (_) {}
    return 'pro';
  }, [demoNumericPrice, saved?.buyerTier, currentStep, loggedIn]);

  // Keep it remembered across sessions, reloads, and visits
  useEffect(() => {
    try {
      localStorage.setItem('bongoweb_buyer_tier', buyerTier);
      sessionStorage.setItem('bongoweb_buyer_tier', buyerTier);
    } catch (_) {}
  }, [buyerTier]);

  const domainTierInfo = useMemo(() => {
    switch (buyerTier) {
      case 'basic':
        return {
          tier: 'basic' as const,
          tld: '.shop',
          name: isEn ? 'Basic' : 'বেসিক',
          badgeText: isEn ? 'Basic User • Free .shop Domain' : 'বেসিক ইউজার • ফ্রি .shop ডোমেইন',
          buttonSub: isEn ? 'Free .shop Domain' : 'ফ্রি .shop ডোমেইন',
          congratsTitle: isEn ? 'Congratulations! 1-Year Free .shop Domain Included' : 'অভিনন্দন! ১ বছর ফ্রি .shop ডোমেইন অন্তর্ভুক্ত',
          congratsDesc: isEn 
            ? 'We will register and connect the best matching .shop domain for your business name for free.' 
            : 'আপনার কোম্পানি বা ব্যবসার নামের সাথে মিলিয়ে সেরা .shop ডোমেইনটি আমরা বিনামূল্যে রেজিস্টার করে লাইভ করে দেব।',
          teamDesc: isEn
            ? "No worries if you are unfamiliar with domains! After placing your order, our team will call and guide you to choose the best .shop domain name."
            : 'ডোমেইন সম্পর্কে না জানলেও কোনো সমস্যা নেই। অর্ডার কনফার্মেশনের পর আমাদের টিম আপনাকে কল করে সবচেয়ে চমৎকার .shop ডোমেইন নাম বাছাই করতে সাহায্য করবে।',
          summaryItem: isEn ? '1-Year Free .shop Domain' : '১ বছর ফ্রি .shop ডোমেইন'
        };
      case 'pro':
        return {
          tier: 'pro' as const,
          tld: '.xyz',
          name: isEn ? 'Pro' : 'প্রো',
          badgeText: isEn ? 'Pro User • Free .xyz Domain' : 'প্রো ইউজার • ফ্রি .xyz ডোমেইন',
          buttonSub: isEn ? 'Free .xyz Domain' : 'ফ্রি .xyz ডোমেইন',
          congratsTitle: isEn ? 'Congratulations! 1-Year Free .xyz Domain Included' : 'অভিনন্দন! ১ বছর ফ্রি .xyz ডোমেইন অন্তর্ভুক্ত',
          congratsDesc: isEn 
            ? 'We will register and connect the best matching .xyz domain for your business name for free.' 
            : 'আপনার কোম্পানি বা ব্যবসার নামের সাথে মিলিয়ে সেরা .xyz ডোমেইনটি আমরা বিনামূল্যে রেজিস্টার করে লাইভ করে দেব।',
          teamDesc: isEn
            ? "No worries if you are unfamiliar with domains! After placing your order, our team will call and guide you to choose the best .xyz domain name."
            : 'ডোমেইন সম্পর্কে না জানলেও কোনো সমস্যা নেই। অর্ডার কনফার্মেশনের পর আমাদের টিম আপনাকে কল করে সবচেয়ে চমৎকার .xyz ডোমেইন নাম বাছাই করতে সাহায্য করবে।',
          summaryItem: isEn ? '1-Year Free .xyz Domain' : '১ বছর ফ্রি .xyz ডোমেইন'
        };
      case 'advance':
      default:
        return {
          tier: 'advance' as const,
          tld: '.com',
          name: isEn ? 'Advance' : 'এডভান্স',
          badgeText: isEn ? 'Advance User • Free .com Domain' : 'এডভান্স ইউজার • ফ্রি .com ডোমেইন',
          buttonSub: isEn ? 'Free .com Domain' : 'ফ্রি .com ডোমেইন',
          congratsTitle: isEn ? 'Congratulations! 1-Year Free .com Domain Included' : 'অভিনন্দন! ১ বছর ফ্রি .com ডোমেইন অন্তর্ভুক্ত',
          congratsDesc: isEn 
            ? 'We will register and connect the best matching .com domain for your business name for free.' 
            : 'আপনার কোম্পানি বা ব্যবসার নামের সাথে মিলিয়ে সেরা .com ডোমেইনটি আমরা বিনামূল্যে রেজিস্টার করে লাইভ করে দেব।',
          teamDesc: isEn
            ? "No worries if you are unfamiliar with domains! After placing your order, our team will call and guide you to choose the best .com domain name."
            : 'ডোমেইন সম্পর্কে না জানলেও কোনো সমস্যা নেই। অর্ডার কনফার্মেশনের পর আমাদের টিম আপনাকে কল করে সবচেয়ে চমৎকার .com ডোমেইন নাম বাছাই করতে সাহায্য করবে।',
          summaryItem: isEn ? '1-Year Free .com Domain' : '১ বছর ফ্রি .com ডোমেইন'
        };
    }
  }, [buyerTier, isEn]);

  // Step 3 Inputs (Payment & Checkout)
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'upay'>(saved?.paymentMethod || 'bkash');
  const [transactionId, setTransactionId] = useState(saved?.transactionId || '');
  const [screenshotName, setScreenshotName] = useState(saved?.screenshotName || '');
  const [step3Error, setStep3Error] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [emailNotification, setEmailNotification] = useState(false);

  // Final Order Receipt
  const [createdOrder, setCreatedOrder] = useState<ClientOrder | null>(getLatestSavedOrder());

  // OTP Countdown timer
  useEffect(() => {
    let timer: any;
    if (currentStep === 'otp' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, otpCountdown]);

  // Synchronize state to both sessionStorage and localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        currentStep,
        name,
        phone,
        email,
        companyName,
        domainOption,
        customDomainName,
        paymentMethod,
        transactionId,
        screenshotName,
        createdOrder,
        buyerTier
      };
      sessionStorage.setItem(storageKey, JSON.stringify(stateToSave));
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      if (createdOrder) {
        localStorage.setItem('bongoweb_latest_order', JSON.stringify(createdOrder));
      }
      // Keep URL query in sync
      const currentUrl = new URL(window.location.href);
      if (currentStep === 2 || currentStep === 3 || currentStep === 'receipt' || currentStep === 'otp') {
        currentUrl.searchParams.set('step', String(currentStep));
      } else {
        currentUrl.searchParams.delete('step');
      }
      window.history.replaceState({}, '', currentUrl.pathname + currentUrl.search);
    } catch (_) {}
  }, [currentStep, name, phone, email, companyName, domainOption, customDomainName, paymentMethod, transactionId, screenshotName, createdOrder, storageKey, buyerTier]);

  const [bkashSubtype, setBkashSubtype] = useState<'personal' | 'merchant'>('personal');

  // Authentic Payment Numbers as specified by user
  const paymentNumbers = {
    bkash_personal: {
      number: '01405005651',
      type: isEn ? 'bKash Personal (Send Money)' : 'বিকাশ পার্সোনাল (Send Money)',
      actionType: 'Send Money'
    },
    bkash_merchant: {
      number: '01614255150',
      type: isEn ? 'bKash Merchant (Make Payment)' : 'বিকাশ মার্চেন্ট (Make Payment)',
      actionType: 'Make Payment'
    },
    nagad: {
      number: '01405005651',
      type: isEn ? 'Nagad Personal (Send Money)' : 'নগদ পার্সোনাল (Send Money)',
      actionType: 'Send Money'
    },
    rocket: {
      number: '014050056514',
      type: isEn ? 'Rocket Personal (Send Money)' : 'রকেট পার্সোনাল (Send Money)',
      actionType: 'Send Money'
    },
    upay: {
      number: '01405005651',
      type: isEn ? 'Upay Personal (Send Money)' : 'উপায় পার্সোনাল (Send Money)',
      actionType: 'Send Money'
    }
  };

  const currentPaymentInfo = (() => {
    if (paymentMethod === 'bkash') {
      return bkashSubtype === 'merchant' ? paymentNumbers.bkash_merchant : paymentNumbers.bkash_personal;
    }
    return paymentNumbers[paymentMethod];
  })();

  const paymentThemes = {
    bkash: {
      brand: isEn ? 'bKash' : 'বিকাশ',
      name: isEn ? 'bKash' : 'বিকাশ',
      badgeBg: 'bg-[#E2136E]/10',
      badgeText: 'text-[#E2136E]',
      badgeBorder: 'border-[#E2136E]/30',
      containerBg: 'bg-gradient-to-b from-[#FFF0F6] via-[#FDF2F8] to-[#FFF0F6]',
      containerBorder: 'border-2 border-[#E2136E]/40',
      containerShadow: 'shadow-[0_12px_36px_-6px_rgba(226,19,110,0.18)]',
      cardActiveTab: 'bg-gradient-to-r from-[#E2136E] to-[#D81B60] text-white border-[#E2136E] shadow-md shadow-[#E2136E]/30',
      numberBoxBg: 'bg-white border-2 border-[#E2136E]/40',
      numberText: 'text-[#E2136E]',
      copyBtn: 'bg-gradient-to-r from-[#E2136E] to-[#D81B60] hover:from-[#D81B60] hover:to-[#C2185B] text-white shadow-xs',
      stepBoxBg: 'bg-white/90 border border-[#E2136E]/30',
      stepTitle: 'text-[#E2136E]',
      inputFocus: 'focus:border-[#E2136E] focus:ring-2 focus:ring-[#E2136E]/20',
      accentColor: '#E2136E',
      cardOuterBg: 'bg-gradient-to-b from-[#FFF5F9] via-white to-[#FFF0F6] border-2 border-[#E2136E]/35 shadow-[0_20px_50px_-10px_rgba(226,19,110,0.18)]',
      glowBar: 'bg-gradient-to-r from-[#E2136E] via-[#FF2E93] to-[#E2136E]',
      tagBg: 'bg-[#E2136E]',
      tagText: 'text-[#E2136E]'
    },
    nagad: {
      brand: isEn ? 'Nagad' : 'নগদ',
      name: isEn ? 'Nagad' : 'নগদ',
      badgeBg: 'bg-[#EA580C]/10',
      badgeText: 'text-[#EA580C]',
      badgeBorder: 'border-[#EA580C]/30',
      containerBg: 'bg-gradient-to-b from-[#FFF7ED] via-[#FFEDD5]/50 to-[#FFF7ED]',
      containerBorder: 'border-2 border-[#EA580C]/40',
      containerShadow: 'shadow-[0_12px_36px_-6px_rgba(234,88,12,0.18)]',
      cardActiveTab: 'bg-gradient-to-r from-[#EA580C] to-[#F97316] text-white border-[#EA580C] shadow-md shadow-[#EA580C]/30',
      numberBoxBg: 'bg-white border-2 border-[#EA580C]/40',
      numberText: 'text-[#EA580C]',
      copyBtn: 'bg-gradient-to-r from-[#EA580C] to-[#F97316] hover:from-[#C2410C] hover:to-[#EA580C] text-white shadow-xs',
      stepBoxBg: 'bg-white/90 border border-[#EA580C]/30',
      stepTitle: 'text-[#EA580C]',
      inputFocus: 'focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/20',
      accentColor: '#EA580C',
      cardOuterBg: 'bg-gradient-to-b from-[#FFF9F5] via-white to-[#FFF7ED] border-2 border-[#EA580C]/35 shadow-[0_20px_50px_-10px_rgba(234,88,12,0.18)]',
      glowBar: 'bg-gradient-to-r from-[#F7941D] via-[#FF6F00] to-[#EA580C]',
      tagBg: 'bg-[#EA580C]',
      tagText: 'text-[#EA580C]'
    },
    rocket: {
      brand: isEn ? 'Rocket' : 'রকেট',
      name: isEn ? 'Rocket' : 'রকেট',
      badgeBg: 'bg-[#8C3494]/10',
      badgeText: 'text-[#8C3494]',
      badgeBorder: 'border-[#8C3494]/30',
      containerBg: 'bg-gradient-to-b from-[#FAF5FF] via-[#F3E8FF]/50 to-[#FAF5FF]',
      containerBorder: 'border-2 border-[#8C3494]/40',
      containerShadow: 'shadow-[0_12px_36px_-6px_rgba(140,52,148,0.18)]',
      cardActiveTab: 'bg-gradient-to-r from-[#8C3494] to-[#702978] text-white border-[#8C3494] shadow-md shadow-[#8C3494]/30',
      numberBoxBg: 'bg-white border-2 border-[#8C3494]/40',
      numberText: 'text-[#8C3494]',
      copyBtn: 'bg-gradient-to-r from-[#8C3494] to-[#702978] hover:from-[#702978] hover:to-[#571B60] text-white shadow-xs',
      stepBoxBg: 'bg-white/90 border border-[#8C3494]/30',
      stepTitle: 'text-[#8C3494]',
      inputFocus: 'focus:border-[#8C3494] focus:ring-2 focus:ring-[#8C3494]/20',
      accentColor: '#8C3494',
      cardOuterBg: 'bg-gradient-to-b from-[#FAF5FF] via-white to-[#F5EEF8] border-2 border-[#8C3494]/35 shadow-[0_20px_50px_-10px_rgba(140,52,148,0.18)]',
      glowBar: 'bg-gradient-to-r from-[#8C3494] via-[#A855F7] to-[#701A75]',
      tagBg: 'bg-[#8C3494]',
      tagText: 'text-[#8C3494]'
    },
    upay: {
      brand: isEn ? 'Upay' : 'উপায়',
      name: isEn ? 'Upay' : 'উপায়',
      badgeBg: 'bg-[#0284C7]/10',
      badgeText: 'text-[#0284C7]',
      badgeBorder: 'border-[#0284C7]/30',
      containerBg: 'bg-gradient-to-b from-[#F0F9FF] via-[#E0F2FE]/50 to-[#F0F9FF]',
      containerBorder: 'border-2 border-[#0284C7]/40',
      containerShadow: 'shadow-[0_12px_36px_-6px_rgba(2,132,199,0.18)]',
      cardActiveTab: 'bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white border-[#0284C7] shadow-md shadow-[#0284C7]/30',
      numberBoxBg: 'bg-white border-2 border-[#0284C7]/40',
      numberText: 'text-[#0284C7]',
      copyBtn: 'bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#0369A1] hover:to-[#075985] text-white shadow-xs',
      stepBoxBg: 'bg-white/90 border border-[#0284C7]/30',
      stepTitle: 'text-[#0284C7]',
      inputFocus: 'focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20',
      accentColor: '#0284C7',
      cardOuterBg: 'bg-gradient-to-b from-[#F0F9FF] via-white to-[#E0F2FE]/40 border-2 border-[#0284C7]/35 shadow-[0_20px_50px_-10px_rgba(2,132,199,0.18)]',
      glowBar: 'bg-gradient-to-r from-[#00AEEF] via-[#38BDF8] to-[#0284C7]',
      tagBg: 'bg-[#0284C7]',
      tagText: 'text-[#0284C7]'
    }
  };

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(currentPaymentInfo.number);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2200);
  };

  // Step 1: User Enters Info -> Send OTP
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error('');

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setStep1Error(isEn ? 'Please enter your full name.' : 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।');
      return;
    }

    const phoneCheck = validateStrictBangladeshiPhone(cleanPhone);
    if (!phoneCheck.valid) {
      setStep1Error(
        isEn 
          ? (phoneCheck.error ? 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX).' : 'Please enter a valid 11-digit Bangladeshi mobile number.')
          : (phoneCheck.error || 'সঠিক ১১-সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন।')
      );
      return;
    }

    if (!isStrictGmail(cleanEmail)) {
      setStep1Error(
        isEn
          ? 'Only Gmail (@gmail.com) addresses are accepted.'
          : 'শুধুমাত্র জিমেইল (@gmail.com) এড্রেস গ্রহণযোগ্য।'
      );
      return;
    }

    if (!formConsent) {
      setStep1Error(
        isEn
          ? 'Please agree to our Terms and Privacy Policy.'
          : 'অনুগ্রহ করে আমাদের শর্তাবলি ও প্রাইভেসি পলিসিতে সম্মতি দিন।'
      );
      return;
    }

    setStep1Loading(true);
    try {
      const res = await apiSendEmailOtp(cleanEmail, 'signup', cleanPhone);
      if (res.success) {
        setOtpCode('');
        setOtpError('');
        setOtpCountdown(60);
        setCurrentStep('otp');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setStep1Error(
          res.error || 
          (isEn ? 'Failed to send OTP code. Please try again.' : 'ওটিপি পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
        );
      }
    } catch (err: any) {
      setStep1Error(
        err?.message || 
        (isEn ? 'Could not send verification code to your email.' : 'ইমেইলে ওটিপি পাঠানো সম্ভব হয়নি।')
      );
    } finally {
      setStep1Loading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (otpSending || otpCountdown > 0) return;
    setOtpSending(true);
    setOtpError('');
    try {
      const res = await apiSendEmailOtp(email.trim().toLowerCase(), 'signup', phone.trim());
      if (res.success) {
        setOtpCountdown(60);
      } else {
        setOtpError(
          res.error || 
          (isEn ? 'Could not resend verification code.' : 'পুনরায় কোড পাঠানো যায়নি।')
        );
      }
    } catch (_) {
      setOtpError(isEn ? 'Could not resend verification code.' : 'পুনরায় কোড পাঠানো যায়নি।');
    } finally {
      setOtpSending(false);
    }
  };

  // Verify OTP and auto-recognize old vs new user
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpCode).trim();
    if (code.length < 6 || otpVerifying) return;
    if (lastVerifiedOtpRef.current === code) return;

    setOtpVerifying(true);
    setOtpError('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const verifyRes = await apiVerifyEmailOtp(cleanEmail, code);

      if (verifyRes.success) {
        lastVerifiedOtpRef.current = code;

        // Auto-check if old user or new user
        const allUsers = await apiGetUsers().catch(() => []);
        const existing = allUsers.find(
          (u) => (u.email || '').trim().toLowerCase() === cleanEmail
        );

        if (existing) {
          const oldPhone = existing.phone || phone.trim();
          setPhone(oldPhone);
          setIsOldUserDetected(true);
          setRegisteredOldNumber(oldPhone);
          if (existing.name && !name) {
            setName(existing.name);
          }

          const updatedUser: UserAccount = {
            ...existing,
            phone: oldPhone,
            numberVerified: true
          };
          localStorage.setItem('bongoweb_user', JSON.stringify(updatedUser));
          sessionStorage.setItem('bongoweb_user', JSON.stringify(updatedUser));
        } else {
          setIsOldUserDetected(false);
          const newUser: UserAccount = {
            name: name.trim(),
            phone: phone.trim(),
            email: cleanEmail,
            registeredAt: new Date().toLocaleDateString('en-US'),
            numberVerified: true
          };
          await apiRegisterUser(newUser).catch(() => {});
          localStorage.setItem('bongoweb_user', JSON.stringify(newUser));
          sessionStorage.setItem('bongoweb_user', JSON.stringify(newUser));
        }

        // Show confirmation banner & shift to Step 2 (Domain & Payment)
        setEmailNotification(true);
        setTimeout(() => setEmailNotification(false), 4500);

        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setOtpError(
          verifyRes.error || 
          (isEn ? 'Invalid or expired OTP code! Please try again.' : 'ভুল বা মেয়াদোত্তীর্ণ ওটিপি কোড! আবার চেষ্টা করুন।')
        );
      }
    } catch (err: any) {
      setOtpError(
        err?.message || 
        (isEn ? 'Verification failed. Please try again.' : 'ওটিপি যাচাইয়ে সমস্যা হয়েছে।')
      );
    } finally {
      setOtpVerifying(false);
    }
  };

  // Auto-verify when 6 digits are typed in OTP input
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(val);
    setOtpError('');
    if (val.length === 6) {
      handleVerifyOtp(val);
    }
  };

  // Step 2 Submission: Business Name & Domain Validation -> Move to Step 3
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setStep2Error('');

    if (!companyName.trim()) {
      setStep2Error(isEn ? 'Please enter your company or business name.' : 'অনুগ্রহ করে আপনার কোম্পানি বা ব্যবসার নাম লিখুন।');
      return;
    }
    if (!domainOption) {
      setStep2Error(
        isEn 
          ? 'Do you have a domain? Please select an option (Yes, No, or I don’t know).' 
          : 'আপনার কি নিজস্ব ডোমেইন আছে? অনুগ্রহ করে একটি উত্তর নির্বাচন করুন (হ্যাঁ, না, অথবা জানি না)।'
      );
      return;
    }
    if (domainOption === 'have_domain' && !customDomainName.trim()) {
      setStep2Error(
        isEn
          ? 'Please enter your existing domain name (e.g. myshop.com).'
          : 'অনুগ্রহ করে আপনার বিদ্যমান ডোমেইন নামটি লিখুন (যেমন: myshop.com)।'
      );
      return;
    }

    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3 Submission: Main Order & Payment Checkout
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep3Error('');

    if (!transactionId.trim()) {
      setStep3Error(
        isEn 
          ? 'Please enter the Transaction ID (TrxID) after sending the payment.' 
          : 'পেমেন্ট পাঠানোর পর প্রাপ্ত ট্রানজেকশন আইডি (TrxID) লিখুন।'
      );
      return;
    }

    setSubmittingOrder(true);
    try {
      // Generate unique order number
      const uniqueNumber = Math.floor(10000 + Math.random() * 90000);
      const orderId = `#BW-${uniqueNumber}`;

      const newOrder: ClientOrder = {
        orderId,
        demoCode,
        demoTitle,
        clientName: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        companyName: companyName.trim(),
        buyerTier,
        domainExtension: domainTierInfo.tld,
        domainOption,
        customDomain: domainOption === 'have_domain' ? customDomainName.trim() : undefined,
        paymentMethod,
        paymentPhone: currentPaymentInfo.number,
        transactionId: transactionId.trim().toUpperCase(),
        makingCharge: demoNumericPrice || 1990,
        monthlyCost: 250,
        status: 'pending',
        createdAt: isEn ? new Date().toLocaleString('en-US') : new Date().toLocaleString('bn-BD'),
        screenshotName: screenshotName || undefined
      };

      // Store in backend and local cache
      try {
        await apiCreateOrder(newOrder);
      } catch (err) {
        console.error(err);
      }

      setCreatedOrder(newOrder);
      localStorage.setItem('bongoweb_latest_order', JSON.stringify(newOrder));
      setCurrentStep('receipt');
      if (onOrderCompleted) onOrderCompleted(newOrder);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err: any) {
      setStep3Error(
        err?.message || 
        (isEn ? 'Failed to submit order. Please try again.' : 'অর্ডার সাবমিট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।')
      );
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F5FC] text-[#1F1F2E] flex flex-col font-sans pb-24 sm:pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-[#5B2C8A] border-b border-[#4A1F6E] shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => {
                if (currentStep === 'receipt') {
                  onBackToDashboard();
                } else if (currentStep === 3) {
                  setCurrentStep(2);
                } else if (currentStep === 2) {
                  setCurrentStep(1);
                } else if (currentStep === 'otp') {
                  setCurrentStep(1);
                } else if (onBackToWebsite && demoCode) {
                  onBackToWebsite(cleanCode);
                } else {
                  onBackToDashboard();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/35 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
              <span>{isEn ? 'Back' : 'পেছনে ফিরুন'}</span>
            </button>

            <span className="px-3 py-1 rounded-xl bg-white/20 text-white text-xs font-mono font-bold shadow-xs">
              {demoCode}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white hidden xs:inline">
              {isEn ? 'Checkout & Order' : 'চেকআউট ও অর্ডার'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isEn ? '100% Secure SSL Checkout' : '১০০% নিরাপদ SSL চেকআউট'}
            </span>
          </div>
        </div>
      </header>

      {/* Floating Notification */}
      {emailNotification && (
        <div className="sticky top-16 z-50 max-w-xl mx-auto px-4 py-2 animate-slideDown">
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-xl flex items-center gap-2.5 border border-purple-400/30">
            <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
            <div className="flex-1">
              <span>{isEn ? 'Email verified successfully!' : 'ইমেইল সফলভাবে ভেরিফাইড হয়েছে!'}</span>
              <p className="text-[11px] text-white/90 font-normal mt-0.5">
                {isEn 
                  ? (isOldUserDetected
                      ? `Welcome back! Your registered number (${phone}) is verified. Please provide business name & domain below.`
                      : 'Your account is ready. Please provide business name & domain below.')
                  : (isOldUserDetected 
                      ? `স্বাগতম! আপনার নিবন্ধিত নম্বর (${phone}) ভেরিফাইড রয়েছে। নিচের ধাপে ব্যবসার নাম ও ডোমেন দিন।`
                      : 'আপনার অ্যাকাউন্ট প্রস্তুত হয়েছে। নিচের ধাপে ব্যবসার নাম ও ডোমেন দিন।')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Checkout View Container */}
      <main className="flex-1 w-full max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Easy-to-Understand 3-Step Order Progress Bar (ONLY shown before order completion, NOT shown on receipt) */}
        {currentStep !== 'receipt' && (
          <div className="mb-6 sm:mb-8 max-w-xl mx-auto">
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-white border border-[#EDE4F5] shadow-[0_2px_12px_rgba(91,44,138,0.04)]">
              {/* Step 1 */}
              <div className={`flex items-center justify-center gap-1 sm:gap-2 p-1.5 sm:p-2.5 rounded-xl transition-all ${
                currentStep === 1 || currentStep === 'otp'
                  ? 'bg-[#5B2C8A] text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
              }`}>
                <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-xs font-bold shrink-0 ${
                  currentStep === 1 || currentStep === 'otp'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-600 text-white'
                }`}>
                  {(currentStep === 2 || currentStep === 3) ? '✓' : (isEn ? '1' : '১')}
                </span>
                <div className="min-w-0 text-center">
                  <span className="block text-[10px] sm:text-xs font-bold truncate leading-tight text-center">
                    {isEn ? 'Account' : 'অ্যাকাউন্ট'}
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`flex items-center justify-center gap-1 sm:gap-2 p-1.5 sm:p-2.5 rounded-xl transition-all ${
                currentStep === 2
                  ? 'bg-[#5B2C8A] text-white shadow-xs'
                  : currentStep === 3
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                    : 'bg-[#FAF8FD] text-slate-600 border border-transparent'
              }`}>
                <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-xs font-bold shrink-0 ${
                  currentStep === 2
                    ? 'bg-white/20 text-white'
                    : currentStep === 3
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {currentStep === 3 ? '✓' : (isEn ? '2' : '২')}
                </span>
                <div className="min-w-0 text-center">
                  <span className="block text-[10px] sm:text-xs font-bold truncate leading-tight text-center">
                    {isEn ? 'Info' : 'তথ্য'}
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`flex items-center justify-center gap-1 sm:gap-2 p-1.5 sm:p-2.5 rounded-xl transition-all ${
                currentStep === 3
                  ? 'bg-[#5B2C8A] text-white shadow-xs'
                  : 'bg-[#FAF8FD] text-slate-600 border border-transparent'
              }`}>
                <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-xs font-bold shrink-0 ${
                  currentStep === 3
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {isEn ? '3' : '৩'}
                </span>
                <div className="min-w-0 text-center">
                  <span className="block text-[10px] sm:text-xs font-bold truncate leading-tight text-center">
                    {isEn ? 'Checkout' : 'চেকআউট'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep !== 'receipt' ? (
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
            {/* Desktop Order Summary Sidebar (Laptop/Computer View Only) */}
            <aside className="hidden lg:block lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-4 select-none">
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-md space-y-5 text-slate-900">
                {/* Product Thumbnail & Details */}
                <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img 
                      src={demoObj.previewImage} 
                      alt={demoTitle}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-mono text-[11px] font-bold mb-1">
                      {demoCode}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 truncate leading-tight" title={demoTitle}>
                      {demoTitle}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {demoObj.categoryLabel || (isEn ? 'Business Website' : 'ব্যবসার ওয়েবসাইট')}
                    </p>
                  </div>
                </div>

                {/* Transparent Financial Architecture Breakdown */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>{isEn ? 'Website Making & Live Setup:' : 'ওয়েবসাইট মেকিং ও লাইভ সেটআপ:'}</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {isEn ? `৳${demoNumericPrice.toLocaleString('en-US')}` : `৳${demoNumericPrice.toLocaleString('bn-BD')}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>{isEn ? `1-Year Free ${domainTierInfo.tld} Domain:` : `১ বছর ফ্রি ${domainTierInfo.tld} ডোমেইন:`}</span>
                    <span className="font-bold text-emerald-600">{isEn ? '৳0 (Free)' : '৳০ (ফ্রি)'}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>{isEn ? 'Free Hosting Lifetime:' : 'লাইফটাইম ফ্রি হোস্টিং:'}</span>
                    <span className="font-bold text-emerald-600">{isEn ? '৳0 (Free)' : '৳০ (ফ্রি)'}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>{isEn ? 'Lifetime SSL Security:' : 'লাইফটাইম SSL সিকিউরিটি:'}</span>
                    <span className="font-bold text-emerald-600">{isEn ? '৳0 (Free)' : '৳০ (ফ্রি)'}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-black text-slate-900">{isEn ? 'Total One-Time Payable:' : 'মোট এককালীন প্রদেয়:'}</span>
                    <span className="text-xl font-black text-purple-700 font-mono">
                      {isEn ? `৳${demoNumericPrice.toLocaleString('en-US')}` : `৳${demoNumericPrice.toLocaleString('bn-BD')}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1">
                    {isEn 
                      ? 'Server Maintenance: Only ৳120 / month (99.9% Uptime)' 
                      : 'সার্ভার মেইনটেন্যান্স: মাত্র ১২০ টাকা / মাস (৯৯.৯% আপটাইম)'}
                  </p>
                </div>

                {/* Core Guarantees */}
                <div className="p-3.5 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Zap className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{isEn ? 'Complete live delivery within 24 hours' : '২৪ ঘণ্টার মধ্যে সম্পূর্ণ লাইভ ডেলিভারি'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isEn ? 'Dedicated live support & launch guarantee' : 'ডেডিকেটেড লাইভ সাপোর্ট ও লঞ্চ গ্যারান্টি'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{isEn ? 'Mobile, tablet & desktop responsive' : 'মোবাইল, ট্যাবলেট ও ডেক্সটপ রেসপন্সিভ'}</span>
                  </div>
                </div>

                {/* Hotline Assistance */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{isEn ? 'Need help?' : 'সাহায্য প্রয়োজন?'}</span>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://wa.me/8801955570912"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <span className="text-slate-300">•</span>
                    <a
                      href="tel:+8801955570912"
                      className="text-purple-700 hover:text-purple-800 font-bold font-mono"
                    >
                      01955570912
                    </a>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Column: Active Step Form */}
            <div className="lg:col-span-7 xl:col-span-8">
              {/* ----------------- STEP 1: Client Information (No Password) ----------------- */}
              {currentStep === 1 && (
                <div className="bg-white border border-[#EDE4F5] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-9 shadow-[0_4px_24px_rgba(91,44,138,0.05)] max-w-2xl mx-auto animate-fadeIn text-[#1F1F2E] space-y-6">
                  {/* Clean Header */}
                  <div className="text-center pt-1">
                    <span className="px-3 py-1 rounded-full bg-[#5B2C8A]/8 text-[#5B2C8A] text-xs font-bold inline-flex items-center gap-1.5 mb-2">
                      {isEn ? 'Step 1 • Basic Information' : '১ম ধাপ • মৌলিক তথ্য'}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-[#1F1F2E] tracking-tight">
                      {isEn ? 'Easy & Secure Checkout' : 'সহজ ও নিরাপদ চেকআউট'}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 max-w-md mx-auto leading-relaxed">
                      {isEn 
                        ? 'Complete your order quickly with name, mobile number, and Gmail. No password required.' 
                        : 'নাম, মোবাইল নম্বর ও জিমেইল দিয়ে দ্রুত অর্ডার সম্পন্ন করুন। কোনো পাসওয়ার্ডের প্রয়োজন নেই।'}
                    </p>
                  </div>

                  {step1Error && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5 animate-shake">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{step1Error}</span>
                    </div>
                  )}

                  <form onSubmit={handleStep1Submit} className="space-y-4">
                    {/* Full Name Field */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1F1F2E]">
                        {isEn ? 'Your Full Name' : 'আপনার পুরো নাম'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder={isEn ? 'e.g. John Doe' : 'যেমন: মোঃ সাকিব হাসান'}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-[#FAF8FD] border border-[#EDE4F5] text-xs sm:text-sm text-[#1F1F2E] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#5B2C8A] focus:ring-2 focus:ring-[#5B2C8A]/10 transition-all font-medium"
                        />
                      </div>
                    </div>

                    {/* Phone Number Field */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1F1F2E]">
                        {isEn ? 'Mobile Number (11 digits)' : 'মোবাইল নম্বর (১১ ডিজিট)'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          maxLength={11}
                          placeholder="017XXXXXXXX"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                            if (step1Error) setStep1Error('');
                          }}
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-[#FAF8FD] border border-[#EDE4F5] text-xs sm:text-sm text-[#1F1F2E] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#5B2C8A] focus:ring-2 focus:ring-[#5B2C8A]/10 transition-all font-mono font-medium"
                        />
                      </div>
                    </div>

                    {/* Gmail Address Field */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-[#1F1F2E]">
                        {isEn ? 'Gmail Address' : 'জিমেইল এড্রেস'} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          placeholder="username@gmail.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (step1Error) setStep1Error('');
                          }}
                          className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-[#FAF8FD] border border-[#EDE4F5] text-xs sm:text-sm text-[#1F1F2E] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#5B2C8A] focus:ring-2 focus:ring-[#5B2C8A]/10 transition-all font-medium"
                        />
                      </div>
                    </div>

                    {/* Form Consent Checkbox */}
                    <div className="pt-1">
                      <label className="flex items-start gap-2.5 text-xs text-[#52525B] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formConsent}
                          onChange={(e) => {
                            setFormConsent(e.target.checked);
                            if (step1Error) setStep1Error('');
                          }}
                          className="mt-0.5 w-4 h-4 rounded text-[#5B2C8A] border-[#D1D5DB] focus:ring-[#5B2C8A] cursor-pointer"
                          required
                        />
                        <span className="leading-relaxed">
                          {isEn ? (
                            <>
                              I agree to BongoWeb's{' '}
                              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#5B2C8A] font-bold hover:underline">
                                Terms &amp; Conditions
                              </a>{' '}
                              and{' '}
                              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#5B2C8A] font-bold hover:underline">
                                Privacy Policy
                              </a>
                              .
                            </>
                          ) : (
                            <>
                              আমি BongoWeb এর{' '}
                              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#5B2C8A] font-bold hover:underline">
                                শর্তাবলি
                              </a>{' '}
                              ও{' '}
                              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#5B2C8A] font-bold hover:underline">
                                প্রাইভেসি পলিসিতে
                              </a>{' '}
                              সম্মত আছি।
                            </>
                          )}
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={step1Loading}
                        className="w-full h-12 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:bg-[#3C165C] text-white text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-60"
                      >
                        {step1Loading ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{isEn ? 'Sending OTP code...' : 'ওটিপি কোড পাঠানো হচ্ছে...'}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span>{isEn ? 'Next Step (Verify OTP)' : 'পরবর্তী ধাপ (ওটিপি যাচাই)'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}


        {/* ----------------- STEP 'otp': OTP Verification Page ----------------- */}
        {currentStep === 'otp' && (
          <div className="bg-white border border-[#EDE4F5] rounded-2xl sm:rounded-3xl p-6 sm:p-9 shadow-[0_4px_24px_rgba(91,44,138,0.05)] max-w-xl mx-auto animate-fadeIn space-y-6 text-[#1F1F2E]">
            <div className="text-center pt-1">
              <div className="w-12 h-12 rounded-2xl bg-[#5B2C8A]/8 text-[#5B2C8A] flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-[#5B2C8A]/8 text-[#5B2C8A] text-xs font-bold inline-block mb-2">
                {isEn ? 'Email OTP Verification' : 'ইমেইল ওটিপি যাচাই'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#1F1F2E] tracking-tight">
                {isEn ? 'Enter the 6-Digit Code' : '৬-সংখ্যার কোডটি লিখুন'}
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1 leading-relaxed max-w-sm mx-auto">
                {isEn ? (
                  <>
                    A 6-digit verification code has been sent to <strong className="text-[#5B2C8A] font-bold">{email}</strong>.
                  </>
                ) : (
                  <>
                    <strong className="text-[#5B2C8A] font-bold">{email}</strong> ঠিকানায় একটি ৬-সংখ্যার ভেরিফিকেশন কোড পাঠানো হয়েছে।
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="mt-1.5 text-xs text-[#5B2C8A] hover:underline font-bold cursor-pointer"
              >
                {isEn ? 'Change email or phone' : 'ইমেইল বা ফোন পরিবর্তন করুন'}
              </button>
            </div>

            {otpError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{otpError}</span>
              </div>
            )}

            {/* OTP Input Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8FD] border border-[#EDE4F5] space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{isEn ? '6-Digit Code' : '৬-ডিজিটের কোড'}</span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {isEn ? 'Auto-verifies upon typing' : 'টাইপ করলেই স্বয়ংক্রিয় ভেরিফাই হবে'}
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="● ● ● ● ● ●"
                  value={otpCode}
                  onChange={handleOtpChange}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#EDE4F5] text-center font-mono font-black tracking-[0.4em] text-xl text-[#1F1F2E] focus:outline-none focus:border-[#5B2C8A] focus:ring-2 focus:ring-[#5B2C8A]/10 transition-all shadow-2xs"
                />
                {otpVerifying && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-[#5B2C8A] font-bold bg-white px-2.5 py-1 rounded-lg border border-[#EDE4F5] shadow-xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isEn ? 'Verifying...' : 'যাচাই হচ্ছে...'}</span>
                  </div>
                )}
              </div>

              {/* Resend button */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">{isEn ? "Didn't receive code?" : 'কোড পাননি?'}</span>
                {otpCountdown > 0 ? (
                  <span className="text-slate-500 font-mono text-[11px]">
                    {isEn ? `Wait to resend: ${otpCountdown}s` : `পুনরায় পাঠাতে অপেক্ষা করুন: ${otpCountdown}s`}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={otpSending}
                    className="text-[#5B2C8A] hover:underline font-bold cursor-pointer"
                  >
                    {otpSending ? (isEn ? 'Sending...' : 'পাঠানো হচ্ছে...') : (isEn ? 'Resend Code' : 'পুনরায় কোড পাঠান')}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={otpCode.length < 6 || otpVerifying}
                className="w-full h-12 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:bg-[#3C165C] text-white text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {otpVerifying ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isEn ? 'Verifying...' : 'যাচাই হচ্ছে...'}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>{isEn ? 'Verify & Proceed to Domain Step' : 'যাচাই করুন ও ডোমেইন ধাপে যান'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
              >
                {isEn ? '← Edit Information' : '← তথ্য সংশোধন করুন'}
              </button>
            </div>
          </div>
        )}

        {/* ----------------- STEP 2: Business Name & Domain Selection ----------------- */}
        {currentStep === 2 && (
          <div className="bg-white border border-[#EDE4F5] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-9 shadow-[0_4px_24px_rgba(91,44,138,0.05)] max-w-3xl mx-auto animate-fadeIn space-y-6 text-[#1F1F2E]">
            {/* Header: Centered & Clean */}
            <div className="flex flex-col items-center text-center justify-center gap-3 pb-4 border-b border-slate-100 pt-1">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <span className="px-3 py-1 rounded-full bg-[#5B2C8A]/8 text-[#5B2C8A] text-xs font-bold inline-flex items-center gap-1.5">
                    {isEn ? 'Step 2 • Business & Domain' : '২য় ধাপ • ব্যবসা ও ডোমেন'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1F1F2E] tracking-tight text-center">
                  {isEn ? 'Business Name & Domain Selection' : 'ব্যবসার নাম ও ডোমেন নির্বাচন'}
                </h2>
                <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 leading-relaxed max-w-md mx-auto text-center">
                  {isEn 
                    ? 'Enter your company name and select your domain preference.' 
                    : 'আপনার কোম্পানির নাম লিখুন এবং আপনার ডোমেন পছন্দ নির্ধারণ করুন।'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-600 bg-[#FAF8FD] py-1.5 px-3 rounded-xl border border-[#EDE4F5] shrink-0 mx-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-800 truncate max-w-[140px] sm:max-w-[180px]">{name}</span>
                <span className="text-slate-400">•</span>
                <span className="font-mono text-slate-600">{phone}</span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-[11px] text-[#5B2C8A] hover:underline font-bold ml-1 cursor-pointer"
                >
                  {isEn ? 'Edit' : 'সংশোধন'}
                </button>
              </div>
            </div>

            {step2Error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{step2Error}</span>
              </div>
            )}

            <form onSubmit={handleProceedToPayment} className="space-y-5">
              {/* 1. Company Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1F1F2E]">
                  {isEn ? 'Company or Business Name' : 'কোম্পানি বা ব্যবসার নাম'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder={isEn ? 'e.g. Style Mart or Tech Zone' : 'যেমন: স্টাইল মার্ট বা টেক জোন'}
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (step2Error) setStep2Error('');
                    }}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-[#FAF8FD] border border-[#EDE4F5] text-xs sm:text-sm text-[#1F1F2E] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#5B2C8A] focus:ring-2 focus:ring-[#5B2C8A]/10 transition-all font-medium"
                  />
                </div>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  {isEn 
                    ? 'This name will be set across your website branding, logo, and footer.' 
                    : 'এই নামটি আপনার ওয়েবসাইটের ব্র্যান্ডিং, লোগো ও ফুটারে সেট করা হবে।'}
                </p>
              </div>

              {/* 2. Domain Choice */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-[#1F1F2E]">
                  {isEn ? 'Have you bought a domain before?' : 'আপনি কি পূর্বে কখনও ডোমেইন কিনেছেন?'}
                </label>

                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {/* Button 1: Yes */}
                  <button
                    type="button"
                    onClick={() => {
                      setDomainOption('have_domain');
                      if (step2Error) setStep2Error('');
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      domainOption === 'have_domain'
                        ? 'bg-[#5B2C8A] text-white border-[#5B2C8A] shadow-xs'
                        : 'bg-white text-slate-700 border-[#EDE4F5] hover:border-slate-300 hover:bg-[#FAF8FD]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        domainOption === 'have_domain' ? 'border-white bg-white' : 'border-slate-300 bg-white'
                      }`}>
                        {domainOption === 'have_domain' && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#5B2C8A]" />}
                      </span>
                      <span className="text-xs sm:text-sm font-bold truncate">
                        {isEn ? 'Yes' : 'হ্যাঁ'}
                      </span>
                    </div>
                    <span className={`text-[10px] truncate ${
                      domainOption === 'have_domain' ? 'text-white/85' : 'text-slate-400'
                    }`}>
                      {isEn ? 'Existing Domain' : 'বিদ্যমান ডোমেইন'}
                    </span>
                  </button>

                  {/* Button 2: No */}
                  <button
                    type="button"
                    onClick={() => {
                      setDomainOption('no_domain');
                      if (step2Error) setStep2Error('');
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      domainOption === 'no_domain'
                        ? 'bg-[#5B2C8A] text-white border-[#5B2C8A] shadow-xs'
                        : 'bg-white text-slate-700 border-[#EDE4F5] hover:border-slate-300 hover:bg-[#FAF8FD]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        domainOption === 'no_domain' ? 'border-white bg-white' : 'border-slate-300 bg-white'
                      }`}>
                        {domainOption === 'no_domain' && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#5B2C8A]" />}
                      </span>
                      <span className="text-xs sm:text-sm font-bold truncate">
                        {isEn ? 'No' : 'না'}
                      </span>
                    </div>
                    <span className={`text-[10px] truncate font-medium ${
                      domainOption === 'no_domain' ? 'text-white/90' : 'text-[#5B2C8A]'
                    }`}>
                      {domainTierInfo.buttonSub}
                    </span>
                  </button>

                  {/* Button 3: I don't know */}
                  <button
                    type="button"
                    onClick={() => {
                      setDomainOption('dont_know');
                      if (step2Error) setStep2Error('');
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      domainOption === 'dont_know'
                        ? 'bg-[#5B2C8A] text-white border-[#5B2C8A] shadow-xs'
                        : 'bg-white text-slate-700 border-[#EDE4F5] hover:border-slate-300 hover:bg-[#FAF8FD]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        domainOption === 'dont_know' ? 'border-white bg-white' : 'border-slate-300 bg-white'
                      }`}>
                        {domainOption === 'dont_know' && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#5B2C8A]" />}
                      </span>
                      <span className="text-xs sm:text-sm font-bold truncate">
                        {isEn ? "I don't know" : 'জানি না'}
                      </span>
                    </div>
                    <span className={`text-[10px] truncate ${
                      domainOption === 'dont_know' ? 'text-white/85' : 'text-slate-400'
                    }`}>
                      {isEn ? 'Team Will Help' : 'টিম সহায়তা করবে'}
                    </span>
                  </button>
                </div>

                {/* Conditional Feedback / Input based on selection */}
                {domainOption === 'have_domain' && (
                  <div className="mt-3 animate-fadeIn space-y-1.5">
                    <label className="block text-xs font-bold text-[#1F1F2E]">
                      {isEn ? 'Enter your existing domain name' : 'আপনার বর্তমান ডোমেইন নামটি লিখুন'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder={isEn ? 'e.g. myshop.com' : 'যেমন: mybrand.com'}
                        value={customDomainName}
                        onChange={(e) => {
                          setCustomDomainName(e.target.value);
                          if (step2Error) setStep2Error('');
                        }}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-[#FAF8FD] border border-[#EDE4F5] text-xs sm:text-sm font-mono text-[#1F1F2E] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#5B2C8A] focus:ring-2 focus:ring-[#5B2C8A]/10 transition-all font-medium"
                      />
                    </div>
                  </div>
                )}


                {domainOption === 'dont_know' && (
                  <div className="mt-3 animate-fadeIn p-3.5 rounded-xl bg-[#FAF8FD] border border-[#EDE4F5] text-xs text-[#1F1F2E] flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#5B2C8A] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold block text-[#5B2C8A]">
                        {isEn ? 'Dedicated Team Assistance' : 'টিমের সার্বক্ষণিক সহায়তা'}
                      </span>
                      <p className="text-[11px] text-[#6B7280] leading-relaxed">
                        {domainTierInfo.teamDesc}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Package Inclusion / View Features Interactive Sheet (Won't open unless down arrow is clicked) */}
              <div className="rounded-2xl border border-[#EDE4F5] bg-[#FAF8FD] overflow-hidden transition-all duration-200 shadow-2xs">
                {/* Clean Trigger Button: Minimal & Streamlined */}
                <button
                  type="button"
                  onClick={() => setShowFeaturesSheet(prev => !prev)}
                  aria-expanded={showFeaturesSheet}
                  aria-label={isEn ? 'What You Get With This Website' : 'ওয়েবসাইটে যা যা পাচ্ছেন'}
                  className={`w-full py-3 sm:py-3.5 px-4 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer select-none bg-white hover:bg-[#FAF8FC] ${
                    showFeaturesSheet ? 'border-b border-[#EDE4F5]' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Zap className="w-4 h-4 text-[#5B2C8A] shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-[#1F1F2E] tracking-tight">
                      {isEn ? 'What You Get With This Website' : 'ওয়েবসাইটে যা যা পাচ্ছেন'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#5B2C8A]/8 text-[#5B2C8A] text-[10px] font-bold">
                      {isEn ? 'Included' : 'অন্তর্ভুক্ত'}
                    </span>
                  </div>

                  <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform duration-200 shrink-0 ${
                    showFeaturesSheet ? 'rotate-180 text-[#5B2C8A]' : ''
                  }`} />
                </button>

                {/* Collapsible Features Sheet: ONLY opened when clicked */}
                {showFeaturesSheet && (
                  <div className="p-4 sm:p-5 bg-white animate-slideDown space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-900">
                          {isEn ? 'Complete Inclusions & Lifetime Guarantees' : 'সম্পূর্ণ প্যাকেজ সুবিধা ও গ্যারান্টি'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowFeaturesSheet(false)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>{isEn ? 'Close' : 'বন্ধ করুন'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                      <div className="p-2.5 rounded-xl bg-[#FAF8FD] border border-[#EDE4F5] flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className="font-semibold text-slate-900">{domainTierInfo.summaryItem}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#FAF8FD] border border-[#EDE4F5] flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className="font-semibold text-slate-900">{isEn ? 'Free Hosting Lifetime' : 'লাইফটাইম ফ্রি হোস্টিং'}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#FAF8FD] border border-[#EDE4F5] flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className="font-semibold text-slate-900">{isEn ? 'Lifetime SSL Security Certificate' : 'লাইফটাইম SSL সিকিউরিটি সার্টিফিকেট'}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#FAF8FD] border border-[#EDE4F5] flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className="font-semibold text-slate-900">{isEn ? '100% Mobile & Tablet Responsive' : '১০০% মোবাইল ও ট্যাবলেট রেসপন্সিভ'}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#FAF8FD] border border-[#EDE4F5] flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className="font-semibold text-slate-900">{isEn ? '24-Hour Live Website Delivery' : '২৪ ঘণ্টার মধ্যে লাইভ ডেলিভারি'}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#FAF8FD] border border-[#EDE4F5] flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className="font-semibold text-slate-900">{isEn ? 'Dedicated Lifetime Engineer Support' : 'আজীবন ডেডিকেটেড ইঞ্জিনিয়ার সাপোর্ট'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Buttons */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto h-12 px-7 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:bg-[#3C165C] text-white text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <span>{isEn ? 'Next Step: Payment & Checkout (Step 3)' : 'পরবর্তী ধাপ: পেমেন্ট ও চেকআউট (৩য় ধাপ)'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ----------------- STEP 3: Dedicated Checkout & Dynamic Themed Payment ----------------- */}
        {currentStep === 3 && (
          <div className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-9 shadow-[0_4px_24px_rgba(91,44,138,0.05)] max-w-3xl mx-auto animate-fadeIn space-y-5 text-slate-900 border transition-all duration-300 relative ${paymentThemes[paymentMethod].containerBg} ${paymentThemes[paymentMethod].containerBorder}`}>
            {/* Header: Clean & Informative */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200/60 pt-1">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${paymentThemes[paymentMethod].badgeBg} ${paymentThemes[paymentMethod].badgeText}`}>
                    {isEn ? 'Step 3 • Checkout' : '৩য় ধাপ: চেকআউট'}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    {isEn ? 'Secure Payment & Checkout' : 'নিরাপদ পেমেন্ট ও চেকআউট'}
                  </h2>
                </div>
              </div>
            </div>

            {step3Error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{step3Error}</span>
              </div>
            )}

            <form onSubmit={handleStep3Submit} className="space-y-4 sm:space-y-5">
              {/* Payment Method Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    {isEn ? 'Select Payment Method' : 'পেমেন্ট মেথড নির্বাচন করুন'}
                  </label>
                  {paymentMethod === 'bkash' && (
                    <div className="inline-flex items-center gap-1 bg-[#FFF0F6] p-0.5 rounded-lg border border-[#E2136E]/30 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setBkashSubtype('personal')}
                        className={`px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                          bkashSubtype === 'personal'
                            ? 'bg-[#E2136E] text-white shadow-2xs'
                            : 'text-[#E2136E] hover:bg-[#E2136E]/10'
                        }`}
                      >
                        {isEn ? 'Personal' : 'পার্সোনাল'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBkashSubtype('merchant')}
                        className={`px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                          bkashSubtype === 'merchant'
                            ? 'bg-[#E2136E] text-white shadow-2xs'
                            : 'text-[#E2136E] hover:bg-[#E2136E]/10'
                        }`}
                      >
                        {isEn ? 'Merchant' : 'মার্চেন্ট'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['bkash', 'nagad', 'rocket', 'upay'] as const).map((method) => {
                    const isSelected = paymentMethod === method;
                    const methodNames: Record<string, string> = {
                      bkash: isEn ? 'bKash' : 'বিকাশ',
                      nagad: isEn ? 'Nagad' : 'নগদ',
                      rocket: isEn ? 'Rocket' : 'রকেট',
                      upay: isEn ? 'Upay' : 'উপায়'
                    };
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? paymentThemes[method].cardActiveTab
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {methodNames[method]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Account Number Box */}
              <div className="bg-white/95 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-white/90 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${paymentThemes[paymentMethod].badgeBg} ${paymentThemes[paymentMethod].badgeText}`}>
                        {currentPaymentInfo.type}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {isEn ? currentPaymentInfo.actionType : `${currentPaymentInfo.actionType} করুন`}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {isEn ? '৳1,990' : '১,৯৯০ ৳'}
                      </span>
                    </div>
                    <div className={`text-2xl sm:text-3xl font-mono font-black tracking-wider mt-1.5 ${paymentThemes[paymentMethod].numberText}`}>
                      {currentPaymentInfo.number}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0 ${paymentThemes[paymentMethod].copyBtn}`}
                  >
                    {copiedNumber ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                    <span>
                      {copiedNumber 
                        ? (isEn ? 'Copied!' : 'কপি হয়েছে!') 
                        : (isEn ? 'Copy Number' : 'নাম্বার কপি করুন')}
                    </span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isEn 
                      ? `Send ৳1,990 to the number above from your ${paymentThemes[paymentMethod].name} app, then copy and paste the TrxID below.`
                      : `আপনার ${paymentThemes[paymentMethod].name} অ্যাপ থেকে উপরের নম্বরে ১,৯৯০ ৳ পাঠিয়ে TrxID কপি করে নিচে বসান।`}
                  </span>
                </div>
              </div>

              {/* TrxID */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isEn ? 'Transaction ID (TrxID)' : 'ট্রানজেকশন আইডি (TrxID)'}</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'e.g. 8N7X2Q9L' : 'যেমন: 8N7X2Q9L'}
                  value={transactionId}
                  onChange={(e) => {
                    setTransactionId(e.target.value);
                    if (step3Error) setStep3Error('');
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-mono font-black text-slate-900 placeholder:text-slate-400 uppercase outline-none transition-all ${paymentThemes[paymentMethod].inputFocus} shadow-2xs`}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {isEn 
                    ? 'TrxID from confirmation SMS or transaction statement' 
                    : 'টাকা পাঠানোর পর প্রাপ্ত SMS বা স্টেটমেন্টের TrxID'}
                </p>
              </div>

              {/* Bottom Buttons */}
              <div className="pt-3 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-white/80 text-xs font-bold transition-all cursor-pointer text-center sm:text-left"
                >
                  {isEn ? '← Back to Previous Step' : '← আগের ধাপে (ব্যবসা ও ডোমেন) ফিরুন'}
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="text-center sm:text-right">
                    <div className="flex items-baseline gap-1.5 justify-center sm:justify-end">
                      <span className="text-xs text-slate-500">{isEn ? 'Total Payable:' : 'মোট প্রদেয়:'}</span>
                      <span className="text-xl font-black text-slate-900 font-mono">{isEn ? '৳1,990' : '১,৯৯০ ৳'}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[#E53935] hover:bg-[#D32F2F] active:bg-[#C62828] text-white text-xs sm:text-sm font-black shadow-md shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submittingOrder ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isEn ? 'Processing...' : 'প্রসেসিং হচ্ছে...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isEn ? 'Confirm Order (৳1,990)' : 'অর্ডার নিশ্চিত করুন (১,৯৯০ ৳)'}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
            </div>
          </div>
        ) : null}

        {/* ----------------- RECEIPT: Standalone Clean Official Receipt (NOT in section way) ----------------- */}
        {currentStep === 'receipt' && (
          <div className="max-w-2xl lg:max-w-3xl mx-auto space-y-6 animate-fadeIn text-slate-900">
            {/* Success Celebration Banner */}
            <div className="bg-white border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
              
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              <div className="space-y-1">
                <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black font-mono inline-block border border-emerald-300">
                  {isEn ? `Order ID: ${createdOrder?.orderId || '#BW-PENDING'}` : `অর্ডার আইডি: ${createdOrder?.orderId || '#BW-PENDING'}`}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {isEn ? 'Congratulations! Your order has been placed successfully' : 'অভিনন্দন! আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
                  {isEn ? (
                    <>
                      Thank you, <strong className="text-slate-900">{createdOrder?.clientName || name}</strong>! Our engineering team will prepare and launch your website within 24 hours.
                    </>
                  ) : (
                    <>
                      ধন্যবাদ <strong className="text-slate-900">{createdOrder?.clientName || name}</strong>! আগামী ২৪ ঘণ্টার মধ্যে আমাদের ইঞ্জিনিয়ার টিম আপনার ওয়েবসাইটটি সম্পূর্ণ প্রস্তুত ও লাইভ করবে।
                    </>
                  )}
                </p>
              </div>

              {/* Status Alert */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 flex items-center justify-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {isEn 
                    ? 'Payment verification is in progress (automatically confirmed within 1 minute to 1 hour).' 
                    : 'পেমেন্ট ভেরিফিকেশন প্রক্রিয়াধীন রয়েছে (১ মিনিট থেকে ১ ঘণ্টার মধ্যে সিস্টেম স্বয়ংক্রিয়ভাবে নিশ্চিত করবে)।'}
                </span>
              </div>
            </div>

            {/* Official Order Receipt Card / Invoice */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {isEn ? 'Official Invoice & Receipt' : 'অফিসিয়াল ইনভয়েস ও রসিদ'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isEn ? 'BongoWeb • 24-Hour Live Delivery Guarantee' : 'BongoWeb • ২৪ ঘণ্টা লাইভ ডেলিভারি গ্যারান্টি'}
                  </p>
                </div>
                <div className="text-xs sm:text-right text-slate-500">
                  <span>{isEn ? 'Date: ' : 'তারিখ: '}{createdOrder?.createdAt || (isEn ? new Date().toLocaleString('en-US') : new Date().toLocaleString('bn-BD'))}</span>
                </div>
              </div>

              {/* Receipt Details Table */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'Client Name:' : 'গ্রাহকের নাম:'}</span>
                  <span className="font-bold text-slate-900">{createdOrder?.clientName || name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'Company / Business Name:' : 'কোম্পানি / ব্যবসার নাম:'}</span>
                  <span className="font-bold text-slate-900">{createdOrder?.companyName || companyName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'Phone Number:' : 'মোবাইল নম্বর:'}</span>
                  <span className="font-bold font-mono text-slate-900">{createdOrder?.phone || phone}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'Email Address:' : 'ইমেইল এড্রেস:'}</span>
                  <span className="font-bold font-mono text-slate-900">{createdOrder?.email || email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'Selected Website Code:' : 'নির্বাচিত ওয়েবসাইট কোড:'}</span>
                  <span className="font-bold font-mono text-purple-700">{createdOrder?.demoCode || demoCode}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'Domain Status:' : 'ডোমেন স্ট্যাটাস:'}</span>
                  <span className="font-bold text-slate-900">
                    {(createdOrder?.domainOption || domainOption) === 'have_domain'
                      ? (isEn ? `Existing Domain (${createdOrder?.customDomain || customDomainName})` : `বিদ্যমান ডোমেইন (${createdOrder?.customDomain || customDomainName})`)
                      : (createdOrder?.domainOption || domainOption) === 'no_domain'
                        ? (isEn ? `1-Year Free ${createdOrder?.domainExtension || domainTierInfo.tld} Domain Included` : `১ বছর ফ্রি ${createdOrder?.domainExtension || domainTierInfo.tld} ডোমেইন অন্তর্ভুক্ত`)
                        : (isEn ? `Support team will assist with ${domainTierInfo.tld} domain selection` : `পরে সাপোর্ট টিম ${domainTierInfo.tld} ডোমেইন নির্ধারণে সাহায্য করবে`)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'Payment Method:' : 'পেমেন্ট মেথড:'}</span>
                  <span className="font-bold text-slate-900 uppercase">
                    {(createdOrder?.paymentMethod || paymentMethod)} {createdOrder?.paymentPhone ? `(${createdOrder.paymentPhone})` : ''}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'Transaction ID (TrxID):' : 'ট্রানজেকশন আইডি (TrxID):'}</span>
                  <span className="font-bold font-mono text-emerald-600 font-black">{createdOrder?.transactionId || transactionId}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'Making Charge (Paid):' : 'মেকিং চার্জ (পরিশোধিত):'}</span>
                  <span className="font-black text-sm text-slate-900 font-mono">{isEn ? '৳1,990' : '১,৯৯০ ৳'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">{isEn ? 'Monthly Hosting Cost:' : 'মাসিক হোস্টিং খরচ:'}</span>
                  <span className="font-bold text-purple-700 font-mono">{isEn ? '৳250 / month' : '২৫০ টাকা / মাস'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">{isEn ? 'Order Status:' : 'অর্ডার স্ট্যাটাস:'}</span>
                  <span className="font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {isEn ? 'Pending Verification (1 min - 1 hr)' : 'পেন্ডিং ভেরিফিকেশন (১ মিনিট - ১ ঘণ্টা)'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Print, WhatsApp, Dashboard */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-500/25"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isEn ? 'Print / Download Receipt' : 'রসিদ প্রিন্ট / ডাউনলোড করুন'}</span>
                </button>

                <a
                  href={`https://wa.me/8801955570912?text=${encodeURIComponent(isEn ? `Hello, I placed an order on BongoWeb. Order ID: ${createdOrder?.orderId || ''}, TrxID: ${createdOrder?.transactionId || ''}` : `আসসালামু আলাইকুম, আমি BongoWeb থেকে অর্ডার করেছি। অর্ডার আইডি: ${createdOrder?.orderId || ''}, TrxID: ${createdOrder?.transactionId || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isEn ? 'WhatsApp Support (01955570912)' : 'হোয়াটসঅ্যাপ সাপোর্ট (01955570912)'}</span>
                </a>

                <button
                  type="button"
                  onClick={onBackToDashboard}
                  className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-purple-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isEn ? 'Return to Dashboard' : 'ড্যাশবোর্ডে ফিরুন'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
