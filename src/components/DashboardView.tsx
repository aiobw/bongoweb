import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Layers,
  UtensilsCrossed, 
  Briefcase,
  ShoppingCart, 
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Phone,
  PhoneCall,
  Clock,
  X
} from 'lucide-react';
import { WebsiteCategory, WebsiteDemo } from '../types';
import { useLanguage } from '../utils/LanguageContext';

interface DashboardViewProps {
  initialCategory?: WebsiteCategory;
  onOpenLiveDemo?: (demo: WebsiteDemo) => void;
  onOpenOrder: (demo: WebsiteDemo) => void;
  onSelectCategoryWebsites?: (category: WebsiteCategory) => void;
  onChangeCategoryLanding?: () => void;
}

export default function DashboardView({
  onOpenOrder,
  onSelectCategoryWebsites
}: DashboardViewProps) {
  const { language, t } = useLanguage();

  // Exactly 4 categories in order requested: 
  // 1st Ecommerce, 2nd Landing Page, 3rd Restaurant & Cafe, 4th Portfolio Website
  const categories = [
    {
      id: 'ecommerce' as WebsiteCategory,
      titleEn: 'Ecommerce',
      titleBn: 'ই-কমার্স',
      descEn: 'Fashion, gadgets, natural food & products',
      descBn: 'পোশাক, গ্যাজেট, প্রাকৃতিক খাদ্য ও পণ্য',
      icon: ShoppingBag,
      codeHint: '#2085'
    },
    {
      id: 'landing' as WebsiteCategory,
      titleEn: 'Landing Page',
      titleBn: 'ল্যান্ডিং পেজ',
      descEn: 'Single product, promo & lead capture',
      descBn: 'সিঙ্গেল প্রোডাক্ট, অফার ও কাস্টমার লিড',
      icon: Layers,
      codeHint: '#3091'
    },
    {
      id: 'restaurant' as WebsiteCategory,
      titleEn: 'Restaurant & Cafe',
      titleBn: 'রেস্টুরেন্ট ও ক্যাফে',
      descEn: 'Burger, pizza, cafe drinks & takeaway',
      descBn: 'বার্গার, পিজ্জা, কফি, ডাইন-ইন ও পার্সেল',
      icon: UtensilsCrossed,
      codeHint: '#1042'
    },
    {
      id: 'portfolio' as WebsiteCategory,
      titleEn: 'Portfolio Website',
      titleBn: 'পোর্টফোলিও ওয়েবসাইট',
      descEn: 'Agency, personal brand, CV & showcase',
      descBn: 'এজেন্সি, ব্যক্তিগত ব্র্যান্ড, সিভি ও সার্ভিস',
      icon: Briefcase,
      codeHint: '#4812'
    }
  ];

  const handleCardClick = (catId: WebsiteCategory) => {
    if (onSelectCategoryWebsites) {
      onSelectCategoryWebsites(catId);
    }
  };

  return (
    <div 
      id="dashboard-home-view"
      data-view="dashboard"
      className="w-full min-h-[calc(100vh-4rem)] bg-[#F8F5FC] text-[#1F1F2E] font-sans pb-20 md:pb-12 lg:pb-16"
    >
      {/* 1. Purple Header Extension / Hero Section (Flows seamlessly with the #5B2C8A Header) */}
      <section className="w-full bg-[#5B2C8A] text-white pt-6 pb-16 sm:pt-8 sm:pb-20 md:pt-10 md:pb-24 lg:pt-12 lg:pb-28 px-4 sm:px-6 md:px-8 lg:px-10 relative overflow-hidden">
        {/* Subtle background ambient purple glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 lg:w-96 lg:h-96 bg-[#7C3AED]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 lg:w-96 lg:h-96 bg-[#4A1F6E]/40 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto text-center relative z-10 px-2">
          {/* Main heading */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight lg:leading-tight">
            {language === 'bn' ? 'আপনার ব্যবসার ক্যাটাগরি বেছে নিন' : 'Choose Your Business Category'}
          </h1>
          
          {/* Subtext */}
          <p className="text-xs sm:text-sm md:text-base text-purple-100/90 font-medium mt-1.5 sm:mt-2 md:mt-3 max-w-xl mx-auto leading-relaxed">
            {language === 'bn' 
              ? 'পছন্দের ক্যাটাগরি বেছে নিয়ে লাইভ ওয়েবসাইট টেমপ্লেট দেখুন' 
              : 'Select your business category to explore live website templates'}
          </p>
        </div>
      </section>

      {/* 2. Overlapping White Rounded Container with Soft Shadow */}
      <section className="max-w-2xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 -mt-10 sm:-mt-12 md:-mt-14 lg:-mt-16 relative z-20">
        <div className="w-full bg-[#FFFFFF] rounded-[20px] md:rounded-[28px] border border-[#EDE4F5] shadow-[0_10px_35px_-5px_rgba(91,44,138,0.12)] p-4 sm:p-6 md:p-7 lg:p-8 xl:p-10">
          
          <div className="mb-4 md:mb-6 pb-3 md:pb-4 border-b border-[#EDE4F5] flex items-center justify-between">
            <span className="text-xs sm:text-sm md:text-base font-bold text-[#1F1F2E]">
              {language === 'bn' ? 'ক্যাটাগরি তালিকা' : 'Available Categories'}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-[#5B2C8A] bg-[#F8F5FC] px-2.5 py-0.5 rounded-full border border-[#EDE4F5]">
              {categories.length} {language === 'bn' ? 'টি ক্যাটাগরি' : 'Categories'}
            </span>
          </div>

          {/* Category List: Mobile vertical cards / Laptop & Desktop 4-column grid */}
          <div className="space-y-3 sm:space-y-3.5 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4 lg:gap-5">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;

              return (
                <div
                  key={cat.id}
                  onClick={() => handleCardClick(cat.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${cat.titleEn}`}
                  className="group w-full p-4 sm:p-4.5 md:p-5 lg:p-6 rounded-[16px] md:rounded-[22px] bg-[#FFFFFF] hover:bg-[#F8F5FC] border border-[#EDE4F5] hover:border-[#5B2C8A]/40 shadow-xs hover:shadow-[0_8px_24px_rgba(91,44,138,0.12)] active:scale-[0.99] transition-all duration-200 cursor-pointer flex items-center justify-between gap-3.5 sm:gap-4 md:flex-col md:items-start md:justify-between md:h-full"
                >
                  {/* Laptop Top Row / Mobile Left Icon Container */}
                  <div className="shrink-0 md:w-full md:flex md:items-center md:justify-between">
                    <div className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-2xl bg-[#F8F5FC] group-hover:bg-[#5B2C8A] text-[#5B2C8A] group-hover:text-white border border-[#EDE4F5] flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                      <Icon className="w-6 h-6 md:w-7 md:h-7 stroke-[2]" />
                    </div>

                    {/* Right Badge on Laptop & Desktop */}
                    <div className="hidden md:flex items-center gap-1.5">
                      {idx === 0 && (
                        <span className="text-[10px] font-bold text-[#5B2C8A] bg-[#F8F5FC] border border-[#EDE4F5] px-2 py-0.5 rounded-full">
                          {language === 'bn' ? 'জনপ্রিয়' : 'Popular'}
                        </span>
                      )}
                      <span className="text-[11px] font-mono font-bold text-[#6B7280] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {cat.codeHint}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Bold Title + Description */}
                  <div className="flex-1 min-w-0 md:w-full md:mt-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base md:text-lg font-bold text-[#1F1F2E] group-hover:text-[#5B2C8A] transition-colors leading-tight line-clamp-1">
                        {language === 'bn' ? cat.titleBn : cat.titleEn}
                      </h2>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold text-[#5B2C8A] bg-[#F8F5FC] border border-[#EDE4F5] px-2 py-0.5 rounded-full shrink-0 md:hidden">
                          {language === 'bn' ? 'জনপ্রিয়' : 'Popular'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#6B7280] font-normal mt-1 leading-snug line-clamp-1 md:line-clamp-2">
                      {language === 'bn' ? cat.descBn : cat.descEn}
                    </p>
                  </div>

                  {/* Right: Chevron Arrow on Mobile (< md) */}
                  <div className="md:hidden w-8 h-8 rounded-xl bg-transparent group-hover:bg-white text-[#6B7280] group-hover:text-[#5B2C8A] flex items-center justify-center shrink-0 transition-all border border-transparent group-hover:border-[#EDE4F5]">
                    <ChevronRight className="w-5 h-5 stroke-[2.2] group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  {/* Laptop & Desktop Bottom Card Action */}
                  <div className="hidden md:flex items-center justify-between w-full pt-4 mt-3 border-t border-[#EDE4F5] text-xs font-bold text-[#5B2C8A] group-hover:text-[#4A1F6E]">
                    <span>{language === 'bn' ? 'টেমপ্লেট দেখুন' : 'Explore Templates'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>


          {/* Quick Action: Explore All Templates */}
          <div className="mt-5 lg:mt-8 pt-4 lg:pt-6 border-t border-[#EDE4F5] text-center">
            <button
              type="button"
              onClick={() => handleCardClick('all')}
              className="w-full lg:max-w-md lg:mx-auto py-3 lg:py-3.5 px-4 lg:px-6 rounded-xl lg:rounded-2xl bg-[#F8F5FC] hover:bg-[#EDE4F5]/60 text-[#5B2C8A] hover:text-[#4A1F6E] border border-[#EDE4F5] text-xs sm:text-sm lg:text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer group shadow-2xs hover:shadow-xs"
            >
              <span>
                {language === 'bn' 
                  ? 'সবগুলো রেডি টেমপ্লেট একসাথে দেখুন' 
                  : 'Browse All Ready Website Templates'}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

        {/* Feature Signals & Trust Footnote */}
        <div className="mt-6 lg:mt-8 flex items-center justify-center gap-4 sm:gap-6 lg:gap-12 text-xs sm:text-sm text-[#6B7280] flex-wrap font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{t('২৪ ঘণ্টায় ডেলিভারি', '24-Hour Launch')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{t('১০০% মোবাইল রেসপন্সিভ', '100% Mobile Ready')}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{t('লাইভ কাস্টমার সাপোর্ট', '24/7 Live Support')}</span>
          </span>
        </div>
      </section>
    </div>
  );
}
