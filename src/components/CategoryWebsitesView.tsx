import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowRight, 
  Eye, 
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  UtensilsCrossed,
  BookOpen,
  ShoppingCart,
  Briefcase,
  Star
} from 'lucide-react';
import { WebsiteCategory, WebsiteDemo } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { apiGetWebsites, subscribeToWebsites } from '../utils/api';

// Generate consistent star rating between 4.2 and 5.0 for each template
function getTemplateRating(demo: WebsiteDemo, idx: number): string {
  if (typeof demo.rating === 'number' && demo.rating >= 4.2 && demo.rating <= 5.0) {
    return demo.rating.toFixed(1);
  }
  const codeNum = parseInt(String(demo.fourDigitCode || '').replace(/\D/g, ''), 10);
  const seed = (!isNaN(codeNum) && codeNum > 0) ? codeNum : (idx * 17 + 29);
  const ratingSteps = [4.8, 4.9, 4.7, 5.0, 4.6, 4.9, 4.8, 4.5, 5.0, 4.7, 4.6, 4.9, 4.8, 4.3, 4.7, 4.9, 5.0, 4.8, 4.4, 4.2];
  return (ratingSteps[seed % ratingSteps.length]).toFixed(1);
}

// Format price cleanly without text wrapping and respect chosen language (English digits in English mode)
export function formatDisplayPrice(priceTag: string | undefined, language: 'bn' | 'en'): string {
  const raw = String(priceTag || '999');
  const bnToEn: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  const enToBn: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };

  const englishDigits = raw.replace(/[০-৯]/g, d => bnToEn[d] || d).replace(/[^\d]/g, '');
  const num = parseInt(englishDigits, 10);
  const validNum = (!isNaN(num) && num > 0) ? num : 999;

  if (language === 'bn') {
    const formattedBn = validNum.toLocaleString('en-US').replace(/\d/g, d => enToBn[d] || d);
    return `৳${formattedBn}`;
  }
  return `৳${validNum.toLocaleString('en-US')}`;
}

interface CategoryWebsitesViewProps {
  category: WebsiteCategory;
  onBackToDashboard: () => void;
  onOpenWebsiteDetail: (demo: WebsiteDemo) => void;
  onOpenOrder: (demo: WebsiteDemo) => void;
}

export default function CategoryWebsitesView({
  category: initialCategory,
  onBackToDashboard: _onBackToDashboard,
  onOpenWebsiteDetail,
  onOpenOrder
}: CategoryWebsitesViewProps) {
  const { language } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState<string>(() => {
    if (initialCategory && initialCategory !== 'all') {
      return initialCategory;
    }
    return 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [layoutMode] = useState<'single' | 'grid'>('single');

  useEffect(() => {
    setSelectedFilter(initialCategory || 'all');
  }, [initialCategory]);

  // Filter chips specification
  const filterChips = [
    { id: 'all', labelEn: 'All', labelBn: 'সকল' },
    { id: 'ecommerce', labelEn: 'Ecommerce', labelBn: 'ই-কমার্স' },
    { id: 'landing', labelEn: 'Landing Page', labelBn: 'ল্যান্ডিং পেজ' },
    { id: 'restaurant', labelEn: 'Restaurant & Cafe', labelBn: 'রেস্টুরেন্ট ও ক্যাফে' },
    { id: 'portfolio', labelEn: 'Portfolio Website', labelBn: 'পোর্টফোলিও ওয়েবসাইট' }
  ];

  // Dynamic custom websites fetched from backend/vault
  const [customWebsites, setCustomWebsites] = useState<WebsiteDemo[]>(() => {
    try {
      const raw = localStorage.getItem('bongoweb_custom_websites') || localStorage.getItem('bongoweb_custom_catalog');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  });

  useEffect(() => {
    apiGetWebsites()
      .then((sites) => {
        if (Array.isArray(sites) && sites.length > 0) setCustomWebsites(sites);
      })
      .catch(() => {});

    const unsubWebsites = subscribeToWebsites((cloudSites) => {
      if (Array.isArray(cloudSites) && cloudSites.length > 0) {
        setCustomWebsites(cloudSites);
      }
    });

    const handleWebsitesUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setCustomWebsites(e.detail);
      } else {
        try {
          const raw = localStorage.getItem('bongoweb_custom_websites') || localStorage.getItem('bongoweb_custom_catalog');
          if (raw) setCustomWebsites(JSON.parse(raw));
        } catch (_) {}
      }
    };

    window.addEventListener('bongoweb_websites_updated', handleWebsitesUpdate);
    window.addEventListener('bongoweb_custom_websites_updated', handleWebsitesUpdate);
    return () => {
      unsubWebsites();
      window.removeEventListener('bongoweb_websites_updated', handleWebsitesUpdate);
      window.removeEventListener('bongoweb_custom_websites_updated', handleWebsitesUpdate);
    };
  }, []);

  const allDemos = useMemo(() => {
    const map = new Map<string, WebsiteDemo>();
    (customWebsites || []).forEach((site) => {
      if (!site) return;
      const key = String(site.fourDigitCode || site.id).replace('#', '').trim().toLowerCase();
      if (!key) return;
      if (site.id?.startsWith('legacy-mock') || (site as any).isMock === true) return;
      map.set(key, site);
    });
    return Array.from(map.values());
  }, [customWebsites]);

  // Filter logic
  const filteredDemos = useMemo(() => {
    return allDemos.filter((demo) => {
      // 1. Category filter
      if (selectedFilter !== 'all') {
        const matchesCategory = 
          demo.category === selectedFilter ||
          (selectedFilter === 'landing' && (demo.category === 'landing' || demo.category === 'blogging')) ||
          (selectedFilter === 'portfolio' && (demo.category === 'portfolio' || demo.category === 'corporate'));
        if (!matchesCategory) return false;
      }

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        demo.title.toLowerCase().includes(q) ||
        (demo.englishTitle?.toLowerCase() || '').includes(q) ||
        (demo.banglaTitle?.toLowerCase() || '').includes(q) ||
        demo.category.toLowerCase().includes(q) ||
        demo.fourDigitCode.toLowerCase().includes(q) ||
        demo.description.toLowerCase().includes(q)
      );
    });
  }, [allDemos, selectedFilter, searchQuery]);

  return (
    <div 
      id="templates-page-view"
      data-view="templates"
      className="w-full min-h-[calc(100vh-4rem)] bg-[#F8F5FC] text-[#1F1F2E] font-sans pb-20 md:pb-12"
    >
      <div className="max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto px-4 sm:px-6 md:px-8 pt-5 sm:pt-7 md:pt-8 space-y-4 sm:space-y-5">
        
        {/* 1. Clean Title Section */}
        <section className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1F1F2E] tracking-tight text-center truncate">
            {language === 'bn' ? 'টেমপ্লেট বেছে নিন' : 'Choose a Template'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] font-medium text-center truncate">
            {language === 'bn' 
              ? 'লাইভ ডেমো দেখুন ও ২৪ ঘণ্টায় ডেলিভারি নিন' 
              : 'Browse live demos & launch in 24 hours'}
          </p>
        </section>

        {/* 2. Streamlined Search Bar */}
        <section className="w-full">
          <div className="relative w-full flex items-center bg-[#FFFFFF] border border-[#EDE4F5] rounded-xl sm:rounded-2xl px-4 py-3 shadow-2xs hover:border-[#5B2C8A]/40 focus-within:border-[#5B2C8A] focus-within:ring-2 focus-within:ring-[#5B2C8A]/10 transition-all">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#6B7280] shrink-0 mr-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' ? 'টেমপ্লেট বা কোড খুঁজুন (যেমন #2085)...' : 'Search template or code (e.g. #2085)...'}
              className="w-full bg-transparent text-sm sm:text-base text-[#1F1F2E] placeholder-[#9CA3AF] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-[#6B7280] hover:text-[#5B2C8A] px-2 py-0.5 rounded cursor-pointer transition-colors"
              >
                {language === 'bn' ? 'মুছুন' : 'Clear'}
              </button>
            )}
          </div>
        </section>

        {/* 3. Refined Filter Chips */}
        <section className="w-full">
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto md:overflow-visible md:flex-wrap pb-1 md:pb-0 no-scrollbar">
            {filterChips.map((chip) => {
              const isActive = selectedFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedFilter(chip.id)}
                  className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#5B2C8A] text-[#FFFFFF] shadow-xs'
                      : 'bg-[#FFFFFF] text-[#6B7280] hover:text-[#5B2C8A] border border-[#EDE4F5] hover:border-[#5B2C8A]/40'
                  }`}
                >
                  {language === 'bn' ? chip.labelBn : chip.labelEn}
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Template Gallery */}
        <section className="w-full pt-1 space-y-4">

          {filteredDemos.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#EDE4F5] rounded-3xl p-8 sm:p-10 text-center max-w-lg mx-auto my-6 shadow-[0_8px_30px_rgba(91,44,138,0.06)]">
              <div className="w-14 h-14 rounded-2xl bg-[#F8F5FC] text-[#5B2C8A] border border-[#EDE4F5] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1F1F2E]">
                {allDemos.length === 0 
                  ? (language === 'bn' ? 'কোনো ওয়েবসাইট এখনও যুক্ত করা হয়নি' : 'No Live Websites Published Yet')
                  : (language === 'bn' ? 'কোনো ওয়েবসাইট পাওয়া যায়নি' : 'No Websites Found')}
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 mb-6 max-w-md mx-auto leading-relaxed">
                {allDemos.length === 0
                  ? (language === 'bn' 
                      ? 'অ্যাডমিন প্যানেল থেকে নতুন ওয়েবসাইট আপলোড করে সরাসরি লাইভ ক্যাটালগে যুক্ত করুন।' 
                      : 'Upload and publish live websites from the Admin Panel to display them in this catalog.')
                  : (language === 'bn' 
                      ? 'অন্য কোনো কি-ওয়ার্ড দিয়ে সার্চ করুন অথবা ফিল্টার রিসেট করুন।' 
                      : 'Try searching with another keyword or resetting the category filter.')}
              </p>
              <div className="flex items-center justify-center gap-3">
                {allDemos.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      window.history.pushState({}, '', '/admin');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    className="px-5 py-2.5 bg-[#5B2C8A] hover:bg-[#4A1F6E] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    {language === 'bn' ? 'অ্যাডমিন প্যানেলে যান' : 'Go to Admin Panel'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedFilter('all');
                    }}
                    className="px-5 py-2.5 bg-[#5B2C8A] hover:bg-[#4A1F6E] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    {language === 'bn' ? 'সকল ওয়েবসাইট দেখুন' : 'Show All Websites'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* LAPTOP / DESKTOP VIEW (md: and up) - 3 in a row grid layout */}
              <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-3 gap-4.5 lg:gap-6">
                {filteredDemos.map((demo, idx) => {
                  const categoryLabel = language === 'bn' ? (
                    demo.category === 'ecommerce' ? 'ই-কমার্স' :
                    demo.category === 'restaurant' ? 'রেস্তোরাঁ ও ফাস্ট ফুড' :
                    demo.category === 'landing' || demo.category === 'blogging' ? 'ল্যান্ডিং পেজ' :
                    demo.category === 'grocery' ? 'গ্রোসারি' : 
                    demo.category === 'portfolio' ? 'পোর্টফোলিও' : 'ব্যবসা'
                  ) : (
                    demo.category === 'ecommerce' ? 'Ecommerce' :
                    demo.category === 'restaurant' ? 'Restaurant & Fast Food' :
                    demo.category === 'landing' || demo.category === 'blogging' ? 'Landing Page' :
                    demo.category === 'grocery' ? 'Grocery' : 
                    demo.category === 'portfolio' ? 'Portfolio' : 'Business'
                  );

                  const uniqueKey = demo.fourDigitCode 
                    ? `laptop-tmpl-${String(demo.fourDigitCode).replace('#', '')}-${demo.id || idx}`
                    : `laptop-tmpl-${demo.id || idx}`;

                  // Clean price formatting respecting language (English vs Bengali numerals)
                  const formattedPrice = formatDisplayPrice(demo.priceTag, language);

                  const templateRating = getTemplateRating(demo, idx);

                  return (
                    <div
                      key={uniqueKey}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-[#EDE4F5] shadow-[0_4px_20px_rgba(91,44,138,0.06)] hover:shadow-[0_12px_32px_rgba(91,44,138,0.12)] hover:border-[#5B2C8A]/40 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* 1. Window Browser Header: Slim & compact to maximize thumbnail picture space */}
                        <div className="px-4 sm:px-5 py-1.5 sm:py-2 flex items-center justify-between bg-white border-b border-[#F4EEFA]">
                          {/* 3 Window Control Dots (macOS style) */}
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#FF5F56] shadow-2xs" />
                            <span className="w-2 h-2 rounded-full bg-[#FFBD2E] shadow-2xs" />
                            <span className="w-2 h-2 rounded-full bg-[#27C93F] shadow-2xs" />
                          </div>

                          {/* Right: Solid Dark Purple Pill for Exact Category Name */}
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[10px] sm:text-[11px] text-white bg-[#5B2C8A] px-2.5 py-0.5 rounded-full shadow-2xs truncate max-w-[140px] sm:max-w-[170px]">
                              {categoryLabel}
                            </span>
                          </div>
                        </div>

                        {/* 2. Realistic Website Preview Image with Star Rating Badge */}
                        <div 
                          onClick={() => onOpenWebsiteDetail(demo)}
                          className="relative w-full h-[195px] sm:h-[210px] md:h-[220px] lg:h-[235px] overflow-hidden bg-[#F8F5FC] cursor-pointer group/img"
                        >
                          <img
                            src={demo.previewImage}
                            alt={demo.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover/img:scale-104 transition-transform duration-300"
                          />

                          {/* Star Rating Badge (4.2 - 5.0) - Left Side */}
                          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/75 backdrop-blur-md text-white border border-white/20 shadow-md text-xs font-bold pointer-events-none transition-transform group-hover/img:scale-105">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            <span>{templateRating}</span>
                          </div>
                        </div>

                        {/* 3. Title & Price Row (Code to Recognize) */}
                        <div className="px-4 sm:px-5 pt-3.5 pb-1 flex items-center justify-between gap-2 min-w-0">
                          {/* Left: Code to Recognize */}
                          <h3 
                            onClick={() => onOpenWebsiteDetail(demo)}
                            className="text-base sm:text-lg md:text-xl font-mono font-bold text-[#1C1614] hover:text-[#5B2C8A] transition-colors truncate cursor-pointer leading-tight flex-1"
                            title={demo.fourDigitCode}
                          >
                            {demo.fourDigitCode}
                          </h3>

                          {/* Right: Small Price Label & Value */}
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-[#71717A] font-medium block leading-tight whitespace-nowrap">
                              {language === 'bn' ? 'মূল্য' : 'Price'}
                            </span>
                            <span className="font-bold text-lg sm:text-xl text-[#5B2C8A] leading-tight block whitespace-nowrap">
                              {formattedPrice}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Action Buttons (Buy Now & See First) + Trust Guarantee */}
                      <div>
                        {/* Action Buttons Row */}
                        <div className="px-4 sm:px-5 py-2.5 flex items-center gap-2">
                          {/* Solid Purple "Buy Now" Button */}
                          <button
                            type="button"
                            onClick={() => onOpenOrder(demo)}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:bg-[#3C165C] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-[0.98]"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                            <span>{language === 'bn' ? 'এখনই কিনুন' : 'Buy Now'}</span>
                          </button>

                          {/* White Outline "See First" Button */}
                          <button
                            type="button"
                            onClick={() => onOpenWebsiteDetail(demo)}
                            className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-[#FAF5FF] text-[#5B2C8A] border border-[#E9D5FF] hover:border-[#5B2C8A] font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#5B2C8A] shrink-0" />
                            <span>{language === 'bn' ? 'আগে দেখুন' : 'See First'}</span>
                          </button>
                        </div>

                        {/* Bottom Trust Guarantee */}
                        <div className="px-4 sm:px-5 pb-3.5 pt-0.5 flex items-center justify-center gap-1.5 text-[11px] text-[#52525B] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                          <span>
                            {language === 'bn' 
                              ? '২৪ ঘণ্টার মধ্যে রেডি ওয়েবসাইট ডেলিভারি' 
                              : 'Ready website delivery within 24 hours'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MOBILE VIEW (< md) - Preserves the user-requested locked compact layout */}
              <div className="block md:hidden">
                {layoutMode === 'single' ? (
                  /* 1 IN A ROW MOBILE: Image on top with #code, straight line, bottom bar with pricing + Visit First + Buy Now */
                  <div className="grid grid-cols-1 gap-3.5">
                    {filteredDemos.map((demo, idx) => {
                      const uniqueKey = demo.fourDigitCode 
                        ? `template-single-${String(demo.fourDigitCode).replace('#', '')}-${demo.id || idx}`
                        : `template-single-${demo.id || idx}`;

                      const templateRating = getTemplateRating(demo, idx);

                      // Clean price formatting respecting language (English vs Bengali numerals)
                      const formattedPrice = formatDisplayPrice(demo.priceTag, language);

                      return (
                        <div
                          key={uniqueKey}
                          className="group bg-[#FFFFFF] rounded-2xl border border-[#EDE4F5] shadow-soft hover:shadow-soft-lg hover:border-[#5B2C8A]/40 transition-all duration-200 overflow-hidden flex flex-col justify-between"
                        >
                          {/* Up Side: Full-width website preview image (height increased an additional 10% for mobile view only) */}
                          <div 
                            onClick={() => onOpenWebsiteDetail(demo)}
                            className="relative w-full overflow-hidden bg-[#F8F5FC] cursor-pointer h-[164px] sm:h-[187px]"
                          >
                            <img
                              src={demo.previewImage}
                              alt={demo.title}
                              loading="lazy"
                              className="w-full h-full object-cover object-top group-hover:scale-103 transition-transform duration-300"
                            />

                            {/* Top Left Star Rating Badge (4.2 - 5.0) */}
                            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-xs text-[11px] font-bold pointer-events-none">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                              <span>{templateRating}</span>
                            </div>

                            {/* Top Right Code Badge (#2314 etc) */}
                            <span className="absolute top-2.5 right-2.5 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-white/95 text-[#1F1F2E] shadow-xs border border-[#EDE4F5] backdrop-blur-xs">
                              {demo.fourDigitCode}
                            </span>
                          </div>

                          {/* Down Side: Redesigned Mobile Bottom Bar */}
                          <div className="w-full border-t border-[#EDE4F5] bg-white px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0">
                            {/* Price Column - shrink-0 & whitespace-nowrap prevents line breaks */}
                            <div className="flex flex-col justify-center shrink-0">
                              <span className="text-[10px] font-semibold text-[#8E8B99] uppercase tracking-wider leading-none whitespace-nowrap">
                                {language === 'bn' ? 'মূল্য' : 'Price'}
                              </span>
                              <span className="text-base font-black text-[#5B2C8A] tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                                {formattedPrice}
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Secondary: See First */}
                              <button
                                type="button"
                                onClick={() => onOpenWebsiteDetail(demo)}
                                className="h-9 px-3 rounded-xl bg-[#F8F5FC] hover:bg-[#F0EAF8] active:bg-[#E9DFFA] text-[#5B2C8A] border border-[#E9DCFA] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.97]"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#5B2C8A] shrink-0" />
                                <span>{language === 'bn' ? 'আগে দেখুন' : 'See First'}</span>
                              </button>

                              {/* Primary: Buy Now */}
                              <button
                                type="button"
                                onClick={() => onOpenOrder(demo)}
                                className="h-9 px-3.5 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:bg-[#3C165C] text-white text-xs font-bold transition-all cursor-pointer shadow-[0_2px_8px_rgba(91,44,138,0.25)] hover:shadow-[0_4px_12px_rgba(91,44,138,0.35)] active:scale-[0.97] inline-flex items-center gap-1.5"
                              >
                                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                                <span>{language === 'bn' ? 'এখনই কিনুন' : 'Buy Now'}</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* 2 IN A ROW GRID MOBILE */
                  <div className="grid grid-cols-2 gap-3.5">
                    {filteredDemos.map((demo, idx) => {
                      const uniqueKey = demo.fourDigitCode 
                        ? `template-grid-${String(demo.fourDigitCode).replace('#', '')}-${demo.id || idx}`
                        : `template-grid-${demo.id || idx}`;

                      const templateRating = getTemplateRating(demo, idx);

                      return (
                        <div
                          key={uniqueKey}
                          className="group bg-[#FFFFFF] rounded-2xl border border-[#EDE4F5] shadow-soft hover:shadow-soft-lg hover:border-[#5B2C8A]/40 transition-all duration-200 overflow-hidden flex flex-col justify-between min-h-[160px] max-h-[205px]"
                        >
                          <div 
                            onClick={() => onOpenWebsiteDetail(demo)}
                            className="relative w-full flex-1 overflow-hidden bg-[#F8F5FC] cursor-pointer min-h-[121px]"
                          >
                            <img
                              src={demo.previewImage}
                              alt={demo.title}
                              loading="lazy"
                              className="w-full h-full object-cover object-top group-hover:scale-103 transition-transform duration-300"
                            />

                            {/* Top Left Star Rating Badge (4.2 - 5.0) */}
                            <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-xs text-[10px] font-bold pointer-events-none">
                              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                              <span>{templateRating}</span>
                            </div>

                            {/* Top Right Code Badge */}
                            <span className="absolute top-2 right-2 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/95 text-[#1F1F2E] shadow-xs border border-[#EDE4F5]">
                              {demo.fourDigitCode}
                            </span>
                          </div>

                          <div className="w-full border-t border-[#EDE4F5] bg-white px-2.5 py-2 flex items-center justify-between gap-1 shrink-0">
                            <span className="font-extrabold text-[11px] text-[#5B2C8A] bg-[#5B2C8A]/8 border border-[#5B2C8A]/15 px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                              {formatDisplayPrice(demo.priceTag, language)}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => onOpenWebsiteDetail(demo)}
                                className="text-[#5B2C8A] hover:text-[#4A1F6E] text-[11px] font-bold inline-flex items-center gap-0.5 cursor-pointer py-1"
                              >
                                <span>{language === 'bn' ? 'দেখুন' : 'Visit'}</span>
                                <ArrowRight className="w-3 h-3 stroke-[2.2]" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenOrder(demo)}
                                className="px-2 py-1 rounded-lg bg-[#5B2C8A] hover:bg-[#4A1F6E] active:bg-[#3C165C] text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                              >
                                <span>{language === 'bn' ? 'কিনুন' : 'Buy'}</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

      </div>
    </div>
  );
}
