import React, { useState, useEffect } from 'react';
import { 
  ShoppingBasket, UtensilsCrossed, Newspaper, Briefcase, 
  ChevronRight, ArrowRight, CheckCircle2, Globe
} from 'lucide-react';
import BongoWebLogo from './BongoWebLogo';
import { WebsiteCategory, UserAccount } from '../types';
import { useLanguage } from '../utils/LanguageContext';

interface CategorySelectionLandingProps {
  onSelectCategory: (category: WebsiteCategory) => void;
  onNavigateToTab?: (tab: 'dashboard' | 'after-order' | 'live-chat' | 'account') => void;
}

export default function CategorySelectionLanding({ 
  onSelectCategory,
  onNavigateToTab: _onNavigateToTab
}: CategorySelectionLandingProps) {
  const [selectedId, setSelectedId] = useState<WebsiteCategory | null>(null);
  const { language, setLanguage, t } = useLanguage();

  // Exactly 4 categories in order: 
  // 1st: Ecommerce
  // 2nd: Landing Page
  // 3rd: Restaurant & Cafe
  // 4th: Portfolio Website
  const categories = [
    {
      id: 'ecommerce' as WebsiteCategory,
      titleEnglish: 'Ecommerce',
      titleBangla: 'ই-কমার্স',
      subtitleBn: 'পোশাক, গ্যাজেট, প্রাকৃতিক খাদ্য ও পণ্য',
      subtitleEn: 'Cloths, gadgets, natural food & products',
      featuresBn: 'bKash Auto · Courier Sync',
      featuresEn: 'Auto Payment · Courier Sync',
      icon: ShoppingBasket,
      tagBn: 'সর্বাধিক জনপ্রিয়',
      tagEn: 'Most Popular',
      accentColor: '#60A5FA',
      bgGradient: 'from-[#172554] via-[#1D4ED8] to-[#2563EB]',
      cardBorder: 'border-blue-400/40 hover:border-blue-300',
      cardShadow: 'shadow-[0_12px_32px_rgba(29,78,216,0.24)] hover:shadow-[0_20px_48px_rgba(29,78,216,0.40)]',
      selectedRing: 'ring-4 ring-white/60 border-white',
      titleColor: 'text-white',
      subtitleColor: 'text-blue-200',
      descColor: 'text-blue-100/90',
      tagBadgeBg: 'bg-white/15 text-white border-white/25 backdrop-blur-md',
      tagDotColor: '#93C5FD',
      iconBoxBg: 'bg-white/20 text-white border-white/30 backdrop-blur-md shadow-inner',
      chipBg: 'bg-black/20 text-blue-100 border-white/15',
      bottomTextColor: 'text-white group-hover:text-blue-100',
      actionBtnBg: 'bg-white text-[#1D4ED8] group-hover:bg-blue-50'
    },
    {
      id: 'landing' as WebsiteCategory,
      titleEnglish: 'Landing Page',
      titleBangla: 'ল্যান্ডিং পেজ',
      subtitleBn: 'সিঙ্গেল প্রোডাক্ট, অফার ও কাস্টমার লিড',
      subtitleEn: 'Single product, promo & lead capture',
      featuresBn: 'High Conversion · 1-Page Pay',
      featuresEn: 'High Conversion · 1-Page Pay',
      icon: Newspaper,
      tagBn: 'হাই কনভার্সন',
      tagEn: 'High Conversion',
      accentColor: '#D8B4FE',
      bgGradient: 'from-[#3B0764] via-[#6D28D9] to-[#7C3AED]',
      cardBorder: 'border-purple-400/40 hover:border-purple-300',
      cardShadow: 'shadow-[0_12px_32px_rgba(109,40,217,0.24)] hover:shadow-[0_20px_48px_rgba(109,40,217,0.40)]',
      selectedRing: 'ring-4 ring-white/60 border-white',
      titleColor: 'text-white',
      subtitleColor: 'text-purple-200',
      descColor: 'text-purple-100/90',
      tagBadgeBg: 'bg-white/15 text-white border-white/25 backdrop-blur-md',
      tagDotColor: '#E9D5FF',
      iconBoxBg: 'bg-white/20 text-white border-white/30 backdrop-blur-md shadow-inner',
      chipBg: 'bg-black/20 text-purple-100 border-white/15',
      bottomTextColor: 'text-white group-hover:text-purple-100',
      actionBtnBg: 'bg-white text-[#6D28D9] group-hover:bg-purple-50'
    },
    {
      id: 'restaurant' as WebsiteCategory,
      titleEnglish: 'Restaurant & Cafe',
      titleBangla: 'রেস্টুরেন্ট ও ক্যাফে',
      subtitleBn: 'বার্গার, পিজ্জা, কফি, ডাইন-ইন ও পার্সেল',
      subtitleEn: 'Burger, pizza, cafe drinks & takeaway',
      featuresBn: 'Fast Delivery · QR Menu',
      featuresEn: 'Fast Delivery · QR Menu',
      icon: UtensilsCrossed,
      tagBn: 'ট্রেন্ডিং চয়েস',
      tagEn: 'Trending Choice',
      accentColor: '#FDBA74',
      bgGradient: 'from-[#7C2D12] via-[#C2410C] to-[#EA580C]',
      cardBorder: 'border-orange-400/40 hover:border-orange-300',
      cardShadow: 'shadow-[0_12px_32px_rgba(194,65,12,0.24)] hover:shadow-[0_20px_48px_rgba(194,65,12,0.40)]',
      selectedRing: 'ring-4 ring-white/60 border-white',
      titleColor: 'text-white',
      subtitleColor: 'text-orange-200',
      descColor: 'text-orange-100/90',
      tagBadgeBg: 'bg-white/15 text-white border-white/25 backdrop-blur-md',
      tagDotColor: '#FED7AA',
      iconBoxBg: 'bg-white/20 text-white border-white/30 backdrop-blur-md shadow-inner',
      chipBg: 'bg-black/20 text-orange-100 border-white/15',
      bottomTextColor: 'text-white group-hover:text-orange-100',
      actionBtnBg: 'bg-white text-[#C2410C] group-hover:bg-orange-50'
    },
    {
      id: 'portfolio' as WebsiteCategory,
      titleEnglish: 'Portfolio Website',
      titleBangla: 'পোর্টফোলিও ওয়েবসাইট',
      subtitleBn: 'এজেন্সি, ব্যক্তিগত ব্র্যান্ড, সিভি ও সার্ভিস',
      subtitleEn: 'Agency, personal brand, CV & showcase',
      featuresBn: 'Client Inquiry · Project Showcase',
      featuresEn: 'Client Inquiry · Project Showcase',
      icon: Briefcase,
      tagBn: 'প্রফেশনাল চয়েস',
      tagEn: 'Professional Choice',
      accentColor: '#A78BFA',
      bgGradient: 'from-[#1E1B4B] via-[#4338CA] to-[#4F46E5]',
      cardBorder: 'border-indigo-400/40 hover:border-indigo-300',
      cardShadow: 'shadow-[0_12px_32px_rgba(67,56,202,0.24)] hover:shadow-[0_20px_48px_rgba(67,56,202,0.40)]',
      selectedRing: 'ring-4 ring-white/60 border-white',
      titleColor: 'text-white',
      subtitleColor: 'text-indigo-200',
      descColor: 'text-indigo-100/90',
      tagBadgeBg: 'bg-white/15 text-white border-white/25 backdrop-blur-md',
      tagDotColor: '#C7D2FE',
      iconBoxBg: 'bg-white/20 text-white border-white/30 backdrop-blur-md shadow-inner',
      chipBg: 'bg-black/20 text-indigo-100 border-white/15',
      bottomTextColor: 'text-white group-hover:text-indigo-100',
      actionBtnBg: 'bg-white text-[#4338CA] group-hover:bg-indigo-50'
    }
  ];

  const handleCardClick = (catId: WebsiteCategory) => {
    setSelectedId(catId);
    setTimeout(() => {
      onSelectCategory(catId);
    }, 100);
  };

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] text-[#0D253D] flex flex-col justify-between font-sans select-none overflow-y-auto">
      {/* 1. Top Header */}
      <header className="w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_16px_rgba(15,23,42,0.03)] shrink-0 h-16 sm:h-[68px] px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
        {/* Left Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group">
          <BongoWebLogo size="md" />
        </div>

        {/* Right Actions: STRICTLY LANGUAGE SELECTION BUTTON */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                language === 'bn'
                  ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/5 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 font-semibold'
              }`}
              title="বাংলা ভাষা নির্বাচন করুন"
            >
              <span className="text-sm leading-none">🇧🇩</span>
              <span>বাংলা</span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                language === 'en'
                  ? 'bg-white text-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/5 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 font-semibold'
              }`}
              title="Select English Language"
            >
              <span className="text-sm leading-none">🇬🇧</span>
              <span>English</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Viewport: All 4 categories with premium studio presence */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full flex flex-col justify-center items-center relative overflow-hidden">
        {/* Subtle Ambient Background Spotlight */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-[#6B46C1]/[0.09] via-[#7C3AED]/[0.06] to-[#10B981]/[0.04] rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Hero Title Section */}
        <div className="text-center mb-7 sm:mb-9 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FAF5FF] to-indigo-50/80 border border-[#DDD6FE] text-[#6B46C1] text-[11px] font-bold mb-4 shadow-xs select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6B46C1] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6B46C1]"></span>
            </span>
            <span>
              {t(
                '২৪ ঘণ্টা এক্সপ্রেস ডেলিভারি · ১০০% রেডি লাইভ ডিজাইন',
                '⚡ 24-Hour Express Launch Guaranteed · 100% Live Demos'
              )}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            {language === 'bn' ? (
              <>
                Select Your Website <span className="bg-gradient-to-r from-[#5521B5] via-[#6B46C1] to-[#9F7AEA] bg-clip-text text-transparent">Category</span>
              </>
            ) : (
              <>
                Choose Your Website <span className="bg-gradient-to-r from-[#5521B5] via-[#6B46C1] to-[#9F7AEA] bg-clip-text text-transparent">Category</span>
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-500 mt-2.5 max-w-xl mx-auto leading-relaxed font-normal">
            {t(
              'আপনার ব্যবসার জন্য প্রস্তুত সম্পূর্ণ রেডি লাইভ ডিজাইন বেছে নিন। সরাসরি ডেমো ব্রাউজ করুন এবং ১ ক্লিকে শুরু করুন।',
              'Select a ready-to-launch live design tailored for your business. Browse interactive previews and get started with 1 click.'
            )}
          </p>
        </div>

        {/* 2x2 Grid: 
            Row 1: E-Commerce & Restaurant side-by-side
            Row 2: Blogs & Groceries side-by-side
            Each button/card features its unique, modern, premium background color with matching high-contrast text */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedId === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => handleCardClick(cat.id)}
                className={`group relative p-5 sm:p-6 sm:py-7 rounded-[24px] sm:rounded-[28px] border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[230px] sm:min-h-[275px] md:min-h-[290px] bg-gradient-to-br ${cat.bgGradient} ${cat.cardShadow} hover:-translate-y-1.5 overflow-hidden select-none ${
                  isSelected
                    ? `${cat.selectedRing} scale-[1.01]`
                    : `${cat.cardBorder}`
                }`}
              >
                {/* Top Corner Ambient Glow on Hover */}
                <div 
                  className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-25 group-hover:opacity-50 blur-2xl transition-opacity duration-500 pointer-events-none bg-white"
                />

                <div className="relative z-10">
                  {/* Top Bar: Icon + Status Indicator */}
                  <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm ${cat.iconBoxBg}`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                    </div>

                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold shadow-2xs transition-colors ${cat.tagBadgeBg}`}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: cat.tagDotColor }} />
                      <span className="hidden xs:inline-block">
                        {language === 'en' ? cat.tagEn : cat.tagBn}
                      </span>
                    </div>
                  </div>

                  {/* Titles */}
                  <h3 className={`text-base sm:text-lg md:text-xl font-black ${cat.titleColor} transition-colors leading-tight`}>
                    {cat.titleEnglish}
                  </h3>

                  {language === 'bn' ? (
                    <span className={`text-xs sm:text-sm font-bold ${cat.subtitleColor} block mt-0.5 mb-1.5 sm:mb-2`}>
                      {cat.titleBangla}
                    </span>
                  ) : (
                    <span className={`text-xs sm:text-sm font-bold ${cat.subtitleColor} block mt-0.5 mb-1.5 sm:mb-2`}>
                      {cat.tagEn}
                    </span>
                  )}

                  <p className={`text-[11px] sm:text-xs ${cat.descColor} line-clamp-2 leading-relaxed mb-3`}>
                    {language === 'en' ? cat.subtitleEn : cat.subtitleBn}
                  </p>

                  {/* Micro features separator */}
                  <div className={`hidden sm:inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-lg ${cat.chipBg}`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.tagDotColor }} />
                    <span>{language === 'en' ? cat.featuresEn : cat.featuresBn}</span>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className={`relative z-10 pt-3.5 sm:pt-4 mt-3 sm:mt-4 border-t border-white/20 flex items-center justify-between text-xs sm:text-sm font-bold ${cat.bottomTextColor}`}>
                  <span className="transition-colors drop-shadow-xs">
                    {t('ক্যাটালগ দেখুন', 'Explore Catalog')}
                  </span>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm ${cat.actionBtnBg}`}>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Button & Reassurance Signals */}
        <div className="mt-7 sm:mt-9 text-center flex flex-col items-center gap-4">
          <button
            onClick={() => onSelectCategory('all')}
            className="inline-flex items-center gap-2.5 px-6 py-3 sm:px-7 sm:py-3.5 rounded-2xl bg-white hover:bg-[#FAF5FF] text-slate-800 hover:text-[#6B46C1] border border-slate-200/90 hover:border-[#DDD6FE] font-extrabold text-xs sm:text-sm transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_-4px_rgba(107,70,193,0.18)] cursor-pointer group active:scale-[0.99]"
          >
            <span>{t('সবগুলো ক্যাটাগরি একসাথে ব্রাউজ করুন', 'Browse All Categories Together')}</span>
            <ArrowRight className="w-4 h-4 text-[#6B46C1] transition-transform group-hover:translate-x-1 stroke-[2.5]" />
          </button>

          {/* Trust Reassurance Footnotes */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 text-[11px] font-medium text-slate-500 flex-wrap pt-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00B261]" />
              <span>{t('ফ্রি লাইভ সাপোর্ট', 'Free Live Support')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00B261]" />
              <span>{t('১০০% মোবাইল রেসপন্সিভ', '100% Mobile Responsive')}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00B261]" />
              <span>{t('সম্পূর্ণ লাইভ ডেমো রেডি', 'Full Live Demo Ready')}</span>
            </span>
          </div>
        </div>
      </main>

      {/* 3. Clean Footer */}
      <footer className="w-full py-2.5 shrink-0 border-t border-[#E5EDF5] bg-[#FFFFFF] text-center text-[10px] sm:text-xs text-[#64748D]">
        <p>© 2026 BongoWeb — All Rights Reserved.</p>
      </footer>
    </div>
  );
}
