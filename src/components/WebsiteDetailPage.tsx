import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, ShoppingBag, CheckCircle2, 
  ChevronDown, X, Check,
  Signal, Wifi, Search,
  ExternalLink, RotateCw, Monitor, Smartphone,
  Lock, ArrowRight, ShieldCheck, Zap,
  ChevronLeft, ChevronRight, Share2, Heart
} from 'lucide-react';
import { WebsiteDemo } from '../types';
import { playClickSound } from '../utils/sound';
import { useLanguage } from '../utils/LanguageContext';
import { formatDisplayPrice } from './CategoryWebsitesView';

interface WebsiteDetailPageProps {
  demo: WebsiteDemo;
  onBackToDashboard?: () => void;
  onBack?: () => void;
  onGoToOrder: (demo: WebsiteDemo) => void;
}

export default function WebsiteDetailPage({
  demo,
  onBackToDashboard,
  onBack,
  onGoToOrder
}: WebsiteDetailPageProps) {
  const { language, t } = useLanguage();
  const handleBack = onBack || onBackToDashboard;
  const [showFeaturesChart, setShowFeaturesChart] = useState(false);
  const [showOrderChart, setShowOrderChart] = useState(false);

  // By default, laptop formal browser is always active and opened ("by default this will be clicked not the iphone once")
  const [activeDevice, setActiveDevice] = useState<'laptop' | 'mobile'>('laptop');

  // Target URL uploaded from Admin Panel (Checking all possible keys)
  const targetUrl = useMemo(() => {
    const raw = (demo?.demoUrl || demo?.url || demo?.link || demo?.secretUrl || demo?.websiteUrl || '').trim();
    if (!raw) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('//')) return `https:${raw}`;
    return `https://${raw}`;
  }, [demo?.demoUrl, demo?.url, demo?.link, demo?.secretUrl, demo?.websiteUrl]);

  // Check if domain is an unhosted placeholder (strictly fallback root with no path)
  const isPlaceholderDomain = useMemo(() => {
    if (!targetUrl) return true;
    const clean = targetUrl.toLowerCase().replace(/\/+$/, '');
    return clean === 'https://bongoweb.site' || clean === 'http://bongoweb.site';
  }, [targetUrl]);

  const hasLiveLink = Boolean(targetUrl && !isPlaceholderDomain);

  // Mode: 'template' (100% working interactive template) or 'live' (direct iframe for uploaded link)
  // If uploaded URL is live, default to 'live'; if mock placeholder, default to 'template' so it NEVER fails!
  const [previewMode, setPreviewMode] = useState<'template' | 'live'>(() => {
    return hasLiveLink ? 'live' : 'template';
  });

  useEffect(() => {
    if (hasLiveLink) {
      setPreviewMode('live');
    }
  }, [hasLiveLink]);

  const [iframeKey, setIframeKey] = useState(0);
  const [cartCount, setCartCount] = useState<number>(0);
  const [addedItemNotification, setAddedItemNotification] = useState<string | null>(null);

  // Floating right-wall Buy Now dock:
  // Starts closed, opens automatically after 4 seconds.
  // Can be retracted (closed) with the arrow button, and brought back (opened) with the arrow button.
  const [isDockOpen, setIsDockOpen] = useState(false);

  useEffect(() => {
    if (!demo) return;
    const timer = setTimeout(() => {
      setIsDockOpen(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [demo?.id]);

  const handleRefresh = () => {
    playClickSound();
    setIframeKey(prev => prev + 1);
  };

  const handleAddToCart = (itemName: string) => {
    playClickSound();
    setCartCount(prev => prev + 1);
    setAddedItemNotification(itemName);
    setTimeout(() => {
      setAddedItemNotification(null);
    }, 2500);
  };

  const handleToggleFeatures = () => {
    playClickSound();
    const nextState = !showFeaturesChart;
    setShowFeaturesChart(nextState);
    if (nextState) setShowOrderChart(false);
  };

  const handleToggleOrderChart = () => {
    playClickSound();
    const nextState = !showOrderChart;
    setShowOrderChart(nextState);
    if (nextState) setShowFeaturesChart(false);
  };

  // Steps after order
  const afterOrderSteps = language === 'bn' ? [
    '১. ফোনে কথা বলে রিকোয়ারমেন্ট বুঝে নেব',
    '২. লোগো ও প্রয়োজনীয় তথ্য সংগ্রহ করব',
    '৩. পছন্দের কালার অনুযায়ী ওয়েবসাইট রেডি করব',
    '৪. ৪৮ ঘণ্টার মধ্যে লাইভ ডেলিভারি ও সাপোর্ট'
  ] : [
    '1. Call you to understand project requirements',
    '2. Collect your logo & business details',
    '3. Customize and prepare your website',
    '4. Live delivery within 48 hours + free support'
  ];

  // Features list
  const includedFeaturesList = language === 'bn' ? [
    '১. সম্পূর্ণ রেসপন্সিভ ও মোবাইল অপ্টিমাইজড আর্কিটেকচার',
    '২. ১ বছর ফ্রি .com ডোমেইন এবং লাইফটাইম ফ্রি হোস্টিং + SSL',
    '৩. বিকাশ, নগদ, রকেট ও কার্ড অটো পেমেন্ট গেটওয়ে ইন্টিগ্রেশন',
    '৪. Steadfast, Pathao ও RedX অটো কুরিয়ার ট্র্যাকিং',
    '৫. ২৪ ঘণ্টায় ফুল ডেলিভারি ও আজীবন ডেডিকেটেড ইঞ্জিনিয়ার সাপোর্ট'
  ] : [
    '1. Fully responsive & 100% mobile-optimized architecture',
    '2. 1-year free .com domain & free hosting lifetime + SSL',
    '3. bKash, Nagad, Rocket & card automated payment gateway',
    '4. Steadfast, Pathao & RedX automated courier tracking',
    '5. 24-hour full launch & lifetime dedicated engineer support'
  ];

  const brandDisplayName = (demo.englishTitle || demo.title || 'Brand Store')
    .replace(/^#\d+\s*/, '')
    .split('—')[0]
    .trim();

  // Domain TLD determination according to website pricing:
  // - 999 tk website -> .shop (domain.shop)
  // - 1490 tk website -> .xyz (domain.xyz)
  // - 2450 tk website -> .com (domain.com)
  // The real domain name is kept completely hidden in backend (never displayed to customers)
  const domainInfo = useMemo(() => {
    const rawPrice = (demo.priceTag || '').toString();
    const bengaliToEnglish: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    const normalizedPrice = rawPrice.replace(/[০-৯]/g, d => bengaliToEnglish[d] || d);
    const priceNum = parseInt(normalizedPrice.replace(/[^0-9]/g, ''), 10) || 0;

    let tld = 'com';
    if (priceNum === 999 || (priceNum > 0 && priceNum <= 1200) || rawPrice.includes('999') || rawPrice.includes('৯৯৯')) {
      tld = 'shop';
    } else if (priceNum === 1490 || (priceNum > 1200 && priceNum <= 1990) || rawPrice.includes('1490') || rawPrice.includes('১,৪৯০') || rawPrice.includes('1,490')) {
      tld = 'xyz';
    } else if (priceNum >= 2000 || rawPrice.includes('2450') || rawPrice.includes('২,৪৫০') || rawPrice.includes('2,450')) {
      tld = 'com';
    } else {
      tld = 'com';
    }

    return {
      tld,
      displayDomain: `domain.${tld}`
    };
  }, [demo?.priceTag]);

  const formalDisplayDomain = domainInfo.displayDomain;
  const formattedPrice = useMemo(() => formatDisplayPrice(demo?.priceTag || '১,৯৯০ ৳', language), [demo?.priceTag, language]);

  if (!demo) {
    return (
      <div className="w-full min-h-screen bg-[#F8F5FC] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#EDE4F5] shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#5B2C8A] flex items-center justify-center mx-auto">
            <Monitor className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {language === 'bn' ? 'কোনো ওয়েবসাইট পাওয়া যায়নি' : 'No Website Found'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'bn' 
              ? 'এই কোডের কোনো ওয়েবসাইট ক্যাটালগে নেই। ক্যাটালগ থেকে ওয়েবসাইট ব্রাউজ করুন।' 
              : 'This website is not currently available in the catalog. Browse all live websites from the catalog.'}
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="w-full py-3 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] text-white font-bold text-sm cursor-pointer transition-colors shadow-md"
          >
            {language === 'bn' ? 'ক্যাটালগ দেখুন' : 'Browse Catalog'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0A0D14] text-[#1F1F2E] flex flex-col font-sans relative overflow-hidden select-none">
      
      {/* 1. Purple Header (#5B2C8A Theme) - 3-Zone Layout: Left Back, Center Features, Right Next Steps */}
      <header className="h-14 sm:h-16 w-full bg-gradient-to-r from-[#4A1A78] via-[#5B2C8A] to-[#451571] border-b border-[#6E35A5]/40 shadow-[0_4px_24px_rgba(25,8,42,0.35)] z-50 shrink-0 px-2 sm:px-4 lg:px-6 backdrop-blur-md">
        <div className="w-full h-full flex items-center justify-between gap-2 sm:gap-4 select-none">
          {/* Left Cluster: Back Button + Next After It: "After Order What We Do" */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Back Button */}
            <button
              type="button"
              onClick={handleBack}
              aria-label={t('টেমপ্লেট তালিকায় ফিরে যান', 'Back to All Templates')}
              title={t('টেমপ্লেট তালিকায় ফিরে যান', 'Back to All Templates')}
              className="h-10 sm:h-11 px-2.5 sm:px-3.5 rounded-xl bg-black/25 hover:bg-white/15 active:bg-white/25 text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 group shadow-inner shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:-translate-x-1 stroke-[2.3] shrink-0" />
              <span className="hidden md:inline font-bold text-xs sm:text-sm whitespace-nowrap text-white/95">
                {t('টেমপ্লেট তালিকায় ফিরে যান', 'Back to All Templates')}
              </span>
              <span className="hidden sm:inline md:hidden font-bold text-xs whitespace-nowrap text-white/95">
                {t('তালিকায় ফিরে যান', 'Back to Templates')}
              </span>
            </button>

            {/* Next After Back Button: "After Order What We Do" */}
            <button
              type="button"
              onClick={handleToggleOrderChart}
              aria-expanded={showOrderChart}
              aria-label={language === 'bn' ? 'অর্ডারের পর আমরা যা করি' : 'After Order What We Do'}
              title={language === 'bn' ? 'অর্ডারের পর আমরা যা করি - বিস্তারিত দেখুন' : 'After order what we do - view steps'}
              className={`h-10 sm:h-11 px-2.5 sm:px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 font-bold select-none cursor-pointer active:scale-95 shadow-md shrink-0 ${
                showOrderChart
                  ? 'bg-white text-[#5B2C8A] font-black ring-2 ring-white/60 shadow-lg'
                  : 'bg-black/25 text-white hover:bg-white/15 border border-white/10 hover:border-white/20'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors ${showOrderChart ? 'text-[#5B2C8A]' : 'text-emerald-300'}`} />
              <span className="hidden xs:inline font-bold text-[11px] sm:text-xs md:text-sm whitespace-nowrap tracking-tight">
                {language === 'bn' ? 'অর্ডারের পর আমরা যা করি' : 'After Order What We Do'}
              </span>
              <span className="xs:hidden font-bold text-[11px] whitespace-nowrap tracking-tight">
                {language === 'bn' ? 'অর্ডারের পর যা করি' : 'After Order'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 ${showOrderChart ? 'rotate-180 text-[#5B2C8A]' : 'text-white/70'}`} />
            </button>
          </div>

          {/* Right: Open Live Site Button + Features Option */}
          <div className="flex items-center gap-2 sm:gap-2.5 justify-end shrink-0">
            {hasLiveLink && (
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  window.open(targetUrl, '_blank', 'noopener,noreferrer');
                }}
                className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer active:scale-95 shrink-0"
                title={language === 'bn' ? 'সরাসরি নতুন ট্যাবে ওয়েবসাইটটি ওপেন করুন' : 'Open live website in new tab'}
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span className="hidden xs:inline">{language === 'bn' ? 'লাইভ সাইট ওপেন করুন' : 'Open Live Site'}</span>
                <span className="xs:hidden">{language === 'bn' ? 'লাইভ সাইট' : 'Live'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleFeatures}
              aria-expanded={showFeaturesChart}
              aria-label={t('ওয়েবসাইটে যা যা পাচ্ছেন', 'What You Get With This Website')}
              title={t('ওয়েবসাইটে যা যা পাচ্ছেন - বিস্তারিত দেখুন', 'View included website features')}
              className={`h-10 sm:h-11 px-3 sm:px-5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2.5 font-bold select-none cursor-pointer active:scale-95 shadow-md ${
                showFeaturesChart
                  ? 'bg-white text-[#5B2C8A] font-black ring-2 ring-white/60 shadow-lg'
                  : 'bg-black/25 text-white hover:bg-white/15 border border-white/10 hover:border-white/20'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors ${showFeaturesChart ? 'text-[#5B2C8A] fill-[#5B2C8A]' : 'text-amber-300 fill-amber-300'}`} />
              <span className="hidden sm:inline font-bold text-xs sm:text-sm whitespace-nowrap tracking-tight">
                {t('ওয়েবসাইটে যা যা পাচ্ছেন', 'What You Get With This Website')}
              </span>
              <span className="sm:hidden font-bold text-xs whitespace-nowrap tracking-tight">
                {t('যা যা পাচ্ছেন', "What's Included")}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 ${showFeaturesChart ? 'rotate-180 text-[#5B2C8A]' : 'text-white/70'}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Cart Notification Toast (During Simulation) */}
      {addedItemNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1F1F2E] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-2.5 animate-fadeIn text-xs font-medium">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
            <Check className="w-3 h-3 stroke-[3]" />
          </span>
          <span>
            {language === 'bn' 
              ? `"${addedItemNotification}" কার্টে যুক্ত হয়েছে!` 
              : `Added "${addedItemNotification}" to preview cart!`}
          </span>
        </div>
      )}

      {/* Toggled Modal Drawers (Smooth Dropdown) */}
      {showFeaturesChart && (
        <div className="absolute top-14 sm:top-16 left-0 right-0 z-40 bg-[#F8F5FC] border-b-2 border-purple-200/80 p-4 sm:p-6 animate-slideDown shadow-xl max-h-[75vh] overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B2C8A] shrink-0" />
                <h4 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900">
                  {t('ওয়েবসাইটে যে যে ফিচার পাচ্ছেন', 'Features You Get With This Website')}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowFeaturesChart(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border border-purple-100"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('বন্ধ করুন', 'Close')}</span>
              </button>
            </div>

            <div className="space-y-2">
              {includedFeaturesList.map((feature, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-purple-100/80 hover:border-purple-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-[#5B2C8A] text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono shadow-2xs">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-[13px] font-bold text-slate-800 truncate">
                      {feature}
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showOrderChart && (
        <div className="absolute top-14 sm:top-16 left-0 right-0 z-40 bg-[#F8F5FC] border-b-2 border-purple-200/80 p-4 sm:p-6 animate-slideDown shadow-xl max-h-[75vh] overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5B2C8A] shrink-0" />
                <h4 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900">
                  {language === 'bn' ? 'অর্ডারের পর আমরা যা করি' : 'After Order What We Do'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowOrderChart(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border border-purple-100"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('বন্ধ করুন', 'Close')}</span>
              </button>
            </div>

            <div className="space-y-2">
              {afterOrderSteps.map((instruction, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-purple-100/80 hover:border-purple-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-[#5B2C8A] text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono shadow-2xs">
                      {idx + 1}
                    </span>
                    <p className="text-xs sm:text-[13px] font-bold text-slate-800 truncate">
                      {instruction}
                    </p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DYNAMIC WORKSPACE: LAPTOP FORMAL BROWSER VS PERFECTED MOBILE VIEW      */}
      {/* ========================================================================= */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-hidden flex flex-col bg-[#0B0F19] relative">

        {/* ======================================================================= */}
        {/* VIEW A: LAPTOP BROWSING - FORMAL BROWSER (NO MOBILE VIEW ON LAPTOP)    */}
        {/* Full-width, professional browser chrome with 100% working template     */}
        {/* ======================================================================= */}
        {activeDevice === 'laptop' && (
          <div className="w-full h-full flex flex-col bg-[#111827] overflow-hidden animate-fadeIn">
            
            {/* Formal Browser Chrome Header Bar */}
            <div className="h-10 sm:h-11 w-full bg-[#1F2937] border-b border-[#374151] px-3 sm:px-4 flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 select-none">
              
              {/* Left: Window Control Dots & Navigation Controls */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#EF4444] border border-[#DC2626]/40 inline-block shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B] border border-[#D97706]/40 inline-block shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-[#10B981] border border-[#059669]/40 inline-block shadow-xs" />
                </div>

                {/* Back / Forward / Refresh controls */}
                <div className="hidden sm:flex items-center gap-1 text-slate-400 pl-1 border-l border-slate-700/60">
                  <button 
                    type="button"
                    className="p-1 rounded-md hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Back"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    className="p-1 rounded-md hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Forward"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={handleRefresh}
                    className="p-1 rounded-md hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Reload page"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Center: Formal Browser Address Bar with SSL Padlock */}
              <div className="flex-1 max-w-xl mx-auto flex items-center justify-center">
                <div 
                  onClick={() => {
                    if (hasLiveLink) {
                      playClickSound();
                      window.open(targetUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className={`w-full h-7 sm:h-8 rounded-lg bg-[#0F172A] border border-slate-700/80 px-3 flex items-center justify-between text-xs font-mono text-slate-300 shadow-inner ${
                    hasLiveLink ? 'cursor-pointer hover:border-emerald-500/60 transition-colors' : ''
                  }`}
                  title={hasLiveLink ? 'সরাসরি ওয়েবসাইটে প্রবেশ করতে ক্লিক করুন' : ''}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400 font-bold select-none text-[11px]">https://</span>
                    <span className="text-slate-100 truncate text-[11px] font-mono font-bold tracking-wide">
                      {hasLiveLink ? targetUrl.replace(/^https?:\/\//, '') : formalDisplayDomain}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasLiveLink && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                        <ExternalLink className="w-3 h-3" />
                        <span className="hidden sm:inline">{language === 'bn' ? 'নতুন ট্যাবে দেখুন' : 'Open'}</span>
                      </span>
                    )}
                    <span className="hidden md:inline text-[10px] font-sans font-bold px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300 border border-purple-500/30 shrink-0">
                      {demo.fourDigitCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Domain Package Badge (Real link kept hidden in backend) */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0F172A] border border-slate-700/80 text-[11px] font-medium text-slate-300 shadow-inner">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-slate-400">
                    {language === 'bn' ? 'ডোমেইন প্যাকেজ:' : 'Domain:'}
                  </span>
                  <span className="font-mono font-bold text-emerald-300">
                    .{domainInfo.tld}
                  </span>
                </div>
              </div>

            </div>

            {/* Formal Browser Viewport Body */}
            <div className="w-full flex-1 bg-white overflow-y-auto relative flex flex-col text-slate-900">
              {hasLiveLink ? (
                <div className="w-full h-full relative bg-slate-900 flex flex-col">
                  {/* Live helper status strip */}
                  <div className="w-full bg-[#1E293B] border-b border-[#334155] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 text-xs text-slate-200 shrink-0 shadow-sm">
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="font-semibold text-white truncate text-[11px] sm:text-xs">
                        {language === 'bn' 
                          ? 'লাইভ ওয়েবসাইট প্রিভিউ সক্রিয়। পুরো ওয়েবসাইট নতুন ট্যাবে দেখতে পারেন:' 
                          : 'Live website preview active. You can browse the full site in a new tab:'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        window.open(targetUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'সরাসরি সাইট ওপেন করুন' : 'Open Live Site'}</span>
                    </button>
                  </div>

                  <iframe
                    key={`desktop-formal-iframe-${iframeKey}`}
                    src={targetUrl}
                    title={demo.title || 'Website Live View'}
                    className="w-full flex-1 border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    loading="eager"
                  />
                </div>
              ) : (
                /* Full-Width Interactive Ready Desktop Website Template */
                <div className="w-full min-h-full flex flex-col bg-white text-slate-900">
                  
                  {/* Announcement Bar */}
                  <div className="w-full bg-[#4A1F6E] text-white text-xs py-2 px-4 flex items-center justify-between">
                    <span className="font-medium mx-auto">
                      {language === 'bn' 
                        ? '⚡ সারাদেশে হোম ডেলিভারি · ৪৮ ঘণ্টার মধ্যে আপনার নিজস্ব ওয়েবসাইট রেডি ও লাইভ' 
                        : '⚡ Fast Delivery Nationwide · Ready & Live Website within 48 Hours'}
                    </span>
                  </div>

                  {/* Desktop Store Header Bar */}
                  <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 px-6 lg:px-12 py-3.5 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#5B2C8A] text-white font-black text-lg flex items-center justify-center shadow-sm">
                        {brandDisplayName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="font-extrabold text-lg text-slate-900 leading-tight">
                          {brandDisplayName}
                        </h2>
                        <span className="text-[11px] text-emerald-600 font-bold block">
                          ✓ {demo.categoryLabel || 'Verified Store'}
                        </span>
                      </div>
                    </div>

                    {/* Search bar simulation */}
                    <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
                      <div className="w-full relative">
                        <input
                          type="text"
                          readOnly
                          placeholder={language === 'bn' ? 'পণ্য বা ক্যাটাগরি সার্চ করুন...' : 'Search products...'}
                          className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 outline-none"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                    </div>

                    {/* Navigation links & cart */}
                    <div className="flex items-center gap-5 text-sm font-semibold text-slate-700">
                      <span className="hover:text-[#5B2C8A] cursor-pointer">হোম</span>
                      <span className="hover:text-[#5B2C8A] cursor-pointer">প্রোডাক্টস</span>
                      <span className="hover:text-[#5B2C8A] cursor-pointer">অফারসমূহ</span>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(demo.mockData?.items?.[0]?.name || 'Item')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 text-[#5B2C8A] font-bold text-xs border border-purple-200 hover:bg-[#5B2C8A] hover:text-white transition-all cursor-pointer relative"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>কার্ট</span>
                        {cartCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center">
                            {cartCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </header>

                  {/* Desktop Hero Section */}
                  <section className="relative w-full bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white py-12 px-6 lg:px-12 overflow-hidden">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                          <Zap className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? '৫০% বিশেষ লঞ্চিং অফার' : '50% Launching Offer'}</span>
                        </div>
                        <h1 className="text-3xl lg:text-5xl font-black leading-tight tracking-tight">
                          {demo.heroHeadline || demo.title}
                        </h1>
                        <p className="text-sm lg:text-base text-slate-300 max-w-lg leading-relaxed">
                          {demo.description}
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              onGoToOrder(demo);
                            }}
                            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer flex items-center gap-2"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>{language === 'bn' ? 'এখনই অর্ডার করুন' : 'Order Now'}</span>
                            <span className="font-mono bg-black/20 px-2 py-0.5 rounded text-xs whitespace-nowrap">{formattedPrice}</span>
                          </button>
                        </div>
                      </div>

                      <div className="w-full md:w-[420px] lg:w-[480px] aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 relative group">
                        <img
                          src={demo.previewImage}
                          alt={demo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                          <span className="text-white text-xs font-bold">✓ লাইভ ইন্টারেক্টিভ ক্যাটালগ</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Trust Highlights Strip */}
                  <section className="w-full bg-slate-50 border-y border-slate-200/80 py-4 px-6 lg:px-12">
                    <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>১ বছর ফ্রি ডোমেইন ও হোস্টিং</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>বিকাশ, নগদ ও কার্ড অটো পেমেন্ট</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>অটো কুরিয়ার পার্সেল ট্র্যাকিং</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>২৪ ঘণ্টায় ফুল ডেলিভারি ও সাপোর্ট</span>
                      </div>
                    </div>
                  </section>

                  {/* Products Grid Section */}
                  <section className="w-full py-10 px-6 lg:px-12 bg-white flex-1">
                    <div className="max-w-6xl mx-auto">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-900">
                            {language === 'bn' ? 'জনপ্রিয় পণ্যসমূহ' : 'Featured Products'}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {language === 'bn' ? 'সরাসরি কার্টে যুক্ত করে লাইভ টেস্ট করুন' : 'Test adding items to preview cart'}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-[#5B2C8A] hover:underline cursor-pointer">
                          {language === 'bn' ? 'সব দেখুন →' : 'See all →'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {(demo.mockData?.items || []).concat(demo.mockData?.items || []).slice(0, 4).map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between"
                          >
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              {item.tag && (
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#5B2C8A] text-white">
                                  {item.tag}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 leading-snug">
                              {item.name}
                            </h4>
                            <span className="text-xs sm:text-sm font-extrabold font-mono text-[#5B2C8A] mt-1">
                              {item.price}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item.name)}
                              className="mt-3 w-full py-2 rounded-xl bg-purple-50 hover:bg-[#5B2C8A] hover:text-white text-[#5B2C8A] text-xs font-bold transition-all cursor-pointer border border-purple-200 flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{language === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Ready to Launch Banner */}
                  <section className="w-full py-8 px-6 bg-purple-50 border-t border-purple-100">
                    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                      <div>
                        <h4 className="text-base font-black text-slate-900">
                          {language === 'bn' ? 'এই ওয়েবসাইটটি আপনার ব্র্যান্ডের জন্য পছন্দ হয়েছে?' : 'Ready to launch this website for your brand?'}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {language === 'bn' ? 'মাত্র ১,৯৯০ টাকায় ডোমেইন, হোস্টিং সহ সম্পূর্ণ সেটআপ ও লাইভ ডেলিভারি।' : 'Full setup including .com domain & hosting within 48 hours.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          onGoToOrder(demo);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                      >
                        {language === 'bn' ? 'অর্ডার করুন' : 'Order Now'}
                      </button>
                    </div>
                  </section>

                  {/* Desktop Footer */}
                  <footer className="w-full py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
                    <p>&copy; {new Date().getFullYear()} {brandDisplayName}. All Rights Reserved. Built with BongoWeb Engine.</p>
                  </footer>

                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* VIEW B: PERFECTED MOBILE VIEW (SCREEN INCREASED BY ~10% UP-TO-DOWN)     */}
        {/* Sleek, expansive iPhone mockup centered with no domain name displayed   */}
        {/* ======================================================================= */}
        {activeDevice === 'mobile' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-3 overflow-hidden animate-fadeIn">
            
            {/* Ambient Back Glow */}
            <div className="absolute w-[360px] sm:w-[440px] h-[660px] bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* iPhone 16 Pro Hardware Chassis - Height increased ~10% up-to-down (max-h-[660px]) */}
            <div className="relative w-full max-w-[320px] sm:max-w-[340px] h-[calc(100dvh-4.5rem)] max-h-[660px] min-h-[530px] rounded-[48px] p-[7px] bg-gradient-to-b from-[#2E2F35] via-[#1D1E22] to-[#121316] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.22)] ring-1 ring-black/90 flex flex-col justify-between transition-all duration-300">
              
              {/* Physical Action & Volume Buttons (Left Side) */}
              <div className="absolute -left-[5px] top-[80px] w-[3.5px] h-[22px] bg-slate-500/90 rounded-l-md" title="Action Button" />
              <div className="absolute -left-[5px] top-[115px] w-[3.5px] h-[44px] bg-slate-500/90 rounded-l-md" title="Volume Up" />
              <div className="absolute -left-[5px] top-[170px] w-[3.5px] h-[44px] bg-slate-500/90 rounded-l-md" title="Volume Down" />
              {/* Power Button (Right Side) */}
              <div className="absolute -right-[5px] top-[135px] w-[3.5px] h-[65px] bg-slate-500/90 rounded-r-md" title="Power Button" />

              {/* iPhone OLED Screen Container - Maximized vertical viewport */}
              <div className="rounded-[42px] overflow-hidden bg-white border border-black relative flex-1 flex flex-col text-slate-900 w-full shadow-inner">
                
                {/* Subtle Specular Glare */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent z-40" />

                {/* iOS Status Bar + Dynamic Island - ABSOLUTELY NO DOMAIN NAME BAR! */}
                <div className="relative w-full pt-2.5 pb-2 px-6 flex items-center justify-between text-black bg-white z-30 select-none shrink-0 border-b border-slate-100">
                  {/* Time */}
                  <span className="text-xs font-bold font-mono tracking-tight text-slate-900">9:41</span>
                  
                  {/* Dynamic Island */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[88px] h-[24px] bg-black rounded-full flex items-center justify-between px-2.5 shadow-xs">
                    <div className="w-2 h-2 rounded-full bg-[#0a0a0a] border border-blue-900/50 relative flex items-center justify-center">
                      <span className="w-0.5 h-0.5 rounded-full bg-blue-500/50" />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-black border border-slate-800" />
                  </div>

                  {/* Status Icons */}
                  <div className="flex items-center gap-1.5 text-slate-900">
                    <Signal className="w-3.5 h-3.5 stroke-[2.5]" />
                    <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
                    <div className="w-4 h-2 rounded-[3px] border border-slate-900 p-0.5 flex items-center">
                      <div className="h-full w-full bg-slate-900 rounded-[1px]" />
                    </div>
                  </div>
                </div>

                {/* Mobile Screen Body - Extended 10% vertical space */}
                <div className="flex-1 w-full overflow-hidden relative bg-white flex flex-col">
                  {hasLiveLink ? (
                    <div className="w-full h-full relative bg-slate-50 flex flex-col">
                      {/* Mobile Top Bar with Direct Open Option */}
                      <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between text-[11px] shrink-0 border-b border-slate-800">
                        <span className="truncate max-w-[180px] font-mono text-emerald-400 font-medium text-[10px]">
                          {targetUrl.replace(/^https?:\/\//, '')}
                        </span>
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-xs active:scale-95 transition-transform"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{language === 'bn' ? 'লাইভ সাইট' : 'Live Site'}</span>
                        </a>
                      </div>

                      <iframe
                        key={`mobile-extended-iframe-${iframeKey}`}
                        src={targetUrl}
                        title="Mobile Website Preview"
                        className="w-full h-full border-0 bg-white flex-1"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        loading="eager"
                      />
                    </div>
                  ) : (
                    /* Interactive Simulation View (Fallback / Offline Demo) */
                    <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col text-left">
                      {/* Mobile Header */}
                      <div className="w-full bg-[#5B2C8A] text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs sticky top-0 z-20 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-white text-[#5B2C8A] font-black text-xs flex items-center justify-center shrink-0">
                            {brandDisplayName.charAt(0)}
                          </div>
                          <span className="font-extrabold text-xs truncate max-w-[140px] leading-tight">
                            {brandDisplayName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <Search className="w-4 h-4 text-white/80" />
                          <div className="relative">
                            <ShoppingBag className="w-4 h-4 text-white" />
                            {cartCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center">
                                {cartCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Announcement */}
                      <div className="bg-[#4A1F6E] text-white/90 text-[10px] py-1.5 px-3 text-center font-medium shrink-0">
                        {language === 'bn' ? '⚡ সারাদেশে দ্রুত ডেলিভারি · ৪৮ ঘণ্টায় সাইট' : '⚡ Fast Delivery · 48h Live Website'}
                      </div>

                      {/* Mobile Hero Banner */}
                      <div className="relative aspect-16/9 bg-slate-200 overflow-hidden shrink-0">
                        <img
                          src={demo.previewImage}
                          alt={demo.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-black/25 to-transparent flex flex-col justify-end p-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold w-fit mb-1">
                            {language === 'bn' ? '৫০% বিশেষ ছাড়' : '50% Off'}
                          </span>
                          <p className="text-white text-xs sm:text-sm font-black line-clamp-1 leading-snug">
                            {demo.heroHeadline || demo.title}
                          </p>
                          <p className="text-[11px] text-white/90 font-mono font-bold mt-0.5 whitespace-nowrap">
                            {formattedPrice}
                          </p>
                        </div>
                      </div>

                      {/* Mobile Trust Bar */}
                      <div className="grid grid-cols-2 gap-2 p-2 bg-white border-b border-slate-200/80 text-[10px] font-semibold text-slate-700 shrink-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{language === 'bn' ? 'বিকাশ ও নগদ পেমেন্ট' : 'bKash/Nagad'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{language === 'bn' ? '২৪ ঘণ্টায় সাইট লাইভ' : '24h Delivery'}</span>
                        </div>
                      </div>

                      {/* Mobile Product Items */}
                      <div className="p-3 flex-1">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-black text-slate-900">
                            {language === 'bn' ? 'জনপ্রিয় প্রোডাক্টস' : 'Top Items'}
                          </span>
                          <span className="text-[10px] font-bold text-[#5B2C8A] hover:underline cursor-pointer">
                            {language === 'bn' ? 'সব দেখুন' : 'See all'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          {(demo.mockData?.items || []).slice(0, 4).map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs flex flex-col justify-between"
                            >
                              <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 mb-1.5">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                              <h5 className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">
                                {item.name}
                              </h5>
                              <span className="text-[11px] font-bold font-mono text-[#5B2C8A] mt-0.5">
                                {item.price}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item.name)}
                                className="mt-2 w-full py-1.5 rounded-lg bg-purple-50 hover:bg-[#5B2C8A] hover:text-white text-[#5B2C8A] text-[10px] font-bold transition-colors cursor-pointer border border-purple-200 flex items-center justify-center gap-1"
                              >
                                <ShoppingBag className="w-3 h-3" />
                                <span>{language === 'bn' ? 'কার্ট' : 'Add'}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mobile Bottom Order Prompt inside phone */}
                      <div className="p-3 bg-purple-50 border-t border-purple-100 flex items-center justify-between gap-3 shrink-0">
                        <div className="leading-tight min-w-0">
                          <span className="text-[11px] font-bold text-slate-900 block truncate">{demo.title}</span>
                          <span className="text-[9px] text-slate-500 font-medium whitespace-nowrap">{formattedPrice}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            onGoToOrder(demo);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                        >
                          {language === 'bn' ? 'অর্ডার করুন' : 'Order Now'}
                        </button>
                      </div>

                    </div>
                  )}
                </div>

                {/* iOS Bottom Navigation & Home Indicator */}
                <div className="w-full bg-white pt-1.5 pb-2 flex flex-col items-center shrink-0 z-30 border-t border-slate-100">
                  <div className="w-28 h-1 bg-slate-800/80 rounded-full" />
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Floating Right-Wall "Buy Now" Dock Button with Arrow Close/Expand Toggle */}
      <aside
        id="floating-right-wall-buy-now-dock"
        aria-label={t('এখনই কিনুন - সাইড বাটন', 'Floating Buy Now')}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 select-none flex items-stretch transition-transform duration-500 ease-in-out ${
          isDockOpen ? 'translate-x-0' : 'translate-x-[calc(100%-32px)]'
        }`}
      >
        {/* Side arrow toggle button to close or bring back dock */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            playClickSound();
            setIsDockOpen((prev) => !prev);
          }}
          aria-label={isDockOpen ? t('ডক বন্ধ করুন', 'Close Dock') : t('ডক খুলুন', 'Open Dock')}
          title={isDockOpen ? (language === 'bn' ? 'লুকান' : 'Collapse') : (language === 'bn' ? 'খুলুন' : 'Expand')}
          className="w-8 flex flex-col items-center justify-center bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white rounded-l-xl border-y border-l border-emerald-400/50 shadow-[-4px_4px_12px_rgba(0,0,0,0.25)] cursor-pointer transition-colors z-10 py-3"
        >
          {isDockOpen ? (
            <ChevronRight className="w-4 h-4 text-emerald-100 hover:translate-x-0.5 transition-transform" />
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <ChevronLeft className="w-4 h-4 text-emerald-100 animate-pulse" />
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-300" />
            </div>
          )}
        </button>

        {/* Main Buy Now Button */}
        <button
          type="button"
          onClick={() => {
            playClickSound();
            onGoToOrder(demo);
          }}
          aria-label={`${t('এখনই অর্ডার করুন', 'Order Now')} - ${demo.title}`}
          title={`${t('এখনই অর্ডার করুন', 'Order Now')} (${demo.fourDigitCode})`}
          className="flex flex-col items-center justify-center py-3.5 px-3 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-[-6px_4px_20px_rgba(5,150,105,0.4)] border-y border-emerald-400/40 cursor-pointer transition-all duration-200 transform hover:-translate-x-0.5 active:scale-95"
        >
          <ShoppingBag className="w-5 h-5 text-white mb-1 stroke-[2.2]" />
          <span className="text-xs font-bold tracking-tight text-white leading-tight">
            {language === 'bn' ? 'অর্ডার করুন' : 'Buy Now'}
          </span>
          <span className="mt-1 text-[11px] font-extrabold font-mono text-emerald-100 bg-emerald-800/60 px-1.5 py-0.5 rounded border border-emerald-400/30 whitespace-nowrap">
            {formattedPrice}
          </span>
        </button>
      </aside>

    </div>
  );
}
