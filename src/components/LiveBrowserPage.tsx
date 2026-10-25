import { useState, useRef } from 'react';
import { 
  ArrowLeft, Search, 
  ShoppingBag, Star, ArrowRight, Clock, Smartphone,
  Sparkles, ShieldCheck, ChevronRight, ChevronDown, ChevronUp,
  ShoppingBasket, UtensilsCrossed, Newspaper, Store, CheckCircle2,
  PhoneCall, MessageCircle, Rocket, Zap
} from 'lucide-react';
import { WebsiteDemo, WebsiteCategory, SubscriptionPlanId } from '../types';
import { WEBSITE_DEMOS } from '../data/mockData';
import { useLanguage } from '../utils/LanguageContext';
import { formatDisplayPrice } from './CategoryWebsitesView';

interface LiveBrowserPageProps {
  onBack: () => void;
  onSelectForOrder: (demo: WebsiteDemo) => void;
  initialCategory?: string;
}

export default function LiveBrowserPage({
  onBack,
  onSelectForOrder,
  initialCategory = 'ecommerce'
}: LiveBrowserPageProps) {
  const { language } = useLanguage();
  // Survey steps: 'survey-cat' (category choice) | 'survey-sub' (subscription package) | 'catalog' (websites list) | 'preview' (live interactive demo)
  const [viewState, setViewState] = useState<'survey-cat' | 'survey-sub' | 'catalog' | 'preview'>('survey-cat');
  
  // Selected category in survey
  const [selectedCategory, setSelectedCategory] = useState<WebsiteCategory>(
    (initialCategory as WebsiteCategory) || 'ecommerce'
  );

  // Selected subscription plan
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>('starter');
  // Collapsible detailed box toggle
  const [isDetailsExpanded, setIsDetailsExpanded] = useState<boolean>(false);
  // Collapsible inline post-order process details toggle
  const [isOrderProcessExpanded, setIsOrderProcessExpanded] = useState<boolean>(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Active website being previewed in 'preview' state
  const [activeDemo, setActiveDemo] = useState<WebsiteDemo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState<number>(0);
  const [lastAddedItem, setLastAddedItem] = useState<string | null>(null);

  // 4 Primary Categories
  const PRIMARY_CATEGORIES = [
    {
      id: 'ecommerce' as WebsiteCategory,
      title: 'ই-কমার্স ও অনলাইন শপ',
      icon: ShoppingBasket,
      tag: 'জনপ্রিয়',
      desc: 'অনলাইন শপিং, কার্ট, ইনভেন্টরি ও স্বয়ংক্রিয় কুরিয়ার ট্র্যাকিং।'
    },
    {
      id: 'restaurant' as WebsiteCategory,
      title: 'রেস্তোরাঁ ও ক্যাফে',
      icon: UtensilsCrossed,
      tag: 'ফুড ও ডাইনিং',
      desc: 'ডিজিটাল ফুড মেনু, টেবিল বুকিং ও অনলাইন পার্সেল অর্ডার।'
    },
    {
      id: 'blogging' as WebsiteCategory,
      title: 'ব্লগ ও অনলাইন মিডিয়া',
      icon: Newspaper,
      tag: 'সংবাদ ও ম্যাগাজিন',
      desc: 'নিউজ পোর্টাল, আর্টিকেল প্রকাশনা ও কন্টেন্ট পাবলিশিং।'
    },
    {
      id: 'grocery' as WebsiteCategory,
      title: 'মুদি ও সুপারশপ',
      icon: Store,
      tag: 'নিত্যপ্রয়োজনীয়',
      desc: 'দ্রুত পণ্য ফিল্টারিং, কাঁচাবাজার ও নিত্যপ্রয়োজনীয় শপিং।'
    }
  ];

  // Filtered demos based on active category and search
  const filteredDemos = WEBSITE_DEMOS.filter((demo) => {
    const matchesCategory = selectedCategory === 'all' || demo.category === selectedCategory;
    const matchesSearch = 
      demo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (demo.englishTitle?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (demo.banglaTitle?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      demo.fourDigitCode.includes(searchQuery) ||
      demo.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenDemo = (demo: WebsiteDemo) => {
    setActiveDemo(demo);
    setViewState('preview');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSelectCategory = (catId: WebsiteCategory) => {
    setSelectedCategory(catId);
    setViewState('survey-sub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlan = (planId: SubscriptionPlanId) => {
    setSelectedPlanId(planId);
  };

  const handleProceedToCatalog = () => {
    setViewState('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (itemName: string) => {
    setCartCount(prev => prev + 1);
    setLastAddedItem(itemName);
    setTimeout(() => {
      setLastAddedItem(null);
    }, 2500);
  };

  const DETAILED_SUBSCRIPTION_PLANS = [
    {
      id: 'starter' as SubscriptionPlanId,
      name: 'Starter Launch',
      englishName: 'Starter Launch',
      tagline: 'Ideal for home ventures, startups, and new retail initiatives',
      oneTimeFee: '৳৯৯৯ BDT',
      monthly: '৳১২০ BDT',
      popular: true,
      suitabilityText: 'Perfect for small retailers, home-based businesses, single-branch boutiques, and individual service providers.',
      features: [
        'Complete ready-made website delivery within 24 hours',
        'Official custom domain setup & cloud server hosting',
        'Lifetime SSL encryption certificate',
        'Unlimited product catalog with high-res photos',
        'Direct 1-click WhatsApp order button',
        'Bangla language mobile management interface',
        'Step-by-step video training and admin panel orientation'
      ],
      serverSpecs: 'Server Backup: Weekly automated cloud backups (120 BDT/mo) · Free SSL included'
    },
    {
      id: 'pro' as SubscriptionPlanId,
      name: 'Business Pro',
      englishName: 'Business Pro',
      tagline: 'Built for high-volume order flows and automated courier tracking',
      oneTimeFee: '৳১,৪৯৯ BDT',
      monthly: '৳২৫০ BDT',
      popular: false,
      suitabilityText: 'Best for established wholesalers, fast-scaling retail brands, and multi-category departmental shops processing dozens of orders daily.',
      features: [
        'All features included in Starter Launch',
        'Pathao, Steadfast & RedX automated API integration',
        'Live SMS confirmation dispatch for every client checkout',
        'Automated abandoned checkout SMS alerts',
        'Staff multi-account access (order manager & support)',
        'Priority 24/7 dedicated WhatsApp hotline engineer'
      ],
      serverSpecs: 'Server Backup: Daily automated cloud backups (250 BDT/mo) · Priority business support'
    },
    {
      id: 'enterprise' as SubscriptionPlanId,
      name: 'Premium Enterprise',
      englishName: 'Premium Enterprise',
      tagline: 'Custom automation for multi-branch mega brands',
      oneTimeFee: '৳২,৪৯৯ BDT',
      monthly: '৳৩৯৯ BDT',
      popular: false,
      suitabilityText: 'Ideal for large supermarket chains, multi-vendor mega stores, high-traffic corporate portals, and custom automated workflows.',
      features: [
        'All features included in Business Pro',
        'Dedicated high-speed cloud node with 99.99% SLA',
        'Custom bespoke layout & database engineering',
        'Multi-branch inventory synchronization',
        'Corporate employee roles & permission matrix',
        'Direct phone line to Lead Solutions Architect'
      ],
      serverSpecs: 'Server Backup: Hourly snapshot backups (399 BDT/mo) · 24/7 Enterprise SLA hotline'
    }
  ];

  const activePlan = DETAILED_SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId);

  return (
    <div 
      id="live-browser-page"
      className="min-h-screen w-full bg-[#FBF9F5] text-[#1C1614] flex flex-col font-sans transition-colors duration-300"
    >
      {/* ========================================================================= */}
      {/* 1. SURVEY STEP 1: CATEGORY SELECTION                                     */}
      {/* ========================================================================= */}
      {viewState === 'survey-cat' && (
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 max-w-4xl mx-auto w-full animate-fadeIn">
          {/* Top navigation */}
          <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-[#E7E0D6]">
            <button
              onClick={onBack}
              id="survey-back-to-home-btn"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#800020]/5 text-[#1C1614] text-xs sm:text-sm font-semibold transition-all border border-[#E7E0D6] cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <ArrowLeft className="w-4 h-4 text-[#800020]" />
              <span>← Return to Dashboard</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="font-bold text-[#800020] bg-[#800020]/10 px-2 py-0.5 rounded-md border border-[#800020]/20">01</span>
              <span className="text-[#800020]/30">/</span>
              <span className="text-[#7A6A66] font-medium">02</span>
            </div>
          </div>

          <div className="w-full bg-white rounded-3xl border border-[#E7E0D6] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-10 relative overflow-hidden text-[#1C1614]">
            {/* Top Maroon Line */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#800020]/40 to-transparent" />

            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#800020]/10 text-[#800020] border border-[#800020]/25 mb-3 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#800020]" />
                <span>ধাপ ১: আপনার ক্যাটাগরি বেছে নিন</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1614] tracking-tight leading-tight">
                আপনার ব্যবসার ধরণ{' '}
                <span className="text-[#800020] underline decoration-[#800020]/40 underline-offset-4">
                  নির্বাচন করুন
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#800020] font-semibold mt-2 bg-[#800020]/8 p-2.5 rounded-xl border border-[#800020]/20">
                💡 <span className="font-bold">নির্দেশনা:</span> সঠিক ক্যাটাগরি বেছে নিয়ে সংশ্লিষ্ট লাইভ ডেমো ওয়েবসাইটগুলো সরাসরি টেস্ট করুন।
              </p>
            </div>

            {/* 4 Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {PRIMARY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`group relative p-5 sm:p-6 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-start gap-4 ${
                      isSelected
                        ? 'border-2 border-[#800020] bg-[#800020]/5 shadow-[0_4px_16px_rgba(128,0,32,0.12)] scale-[1.01]'
                        : 'border-[#E7E0D6] bg-[#FAF7F2] hover:border-[#800020]/30 hover:bg-[#800020]/5 shadow-2xs hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 stroke-[2]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-[#1C1614] group-hover:text-[#800020] transition-colors">
                          {cat.title}
                        </span>
                        <span className="text-[10px] font-bold text-[#800020] bg-[#800020]/10 border border-[#800020]/20 px-2 py-0.5 rounded-full font-mono">
                          {cat.tag}
                        </span>
                      </div>
                      <p className="text-xs text-[#5C4E4B] leading-relaxed font-normal">
                        {cat.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SURVEY STEP 2: SUBSCRIPTION PLAN CHOICE                               */}
      {/* ========================================================================= */}
      {viewState === 'survey-sub' && (
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 max-w-4xl mx-auto w-full animate-fadeIn">
          {/* Top navigation */}
          <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-[#E7E0D6]">
            <button
              onClick={() => setViewState('survey-cat')}
              id="survey-return-btn"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#800020]/5 text-[#1C1614] text-xs sm:text-sm font-semibold transition-all border border-[#E7E0D6] cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <ArrowLeft className="w-4 h-4 text-[#800020]" />
              <span>← Back to Categories</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="font-bold text-[#800020] bg-[#800020]/10 px-2 py-0.5 rounded-md border border-[#800020]/20">02</span>
              <span className="text-[#800020]/30">/</span>
              <span className="text-[#7A6A66] font-medium">02</span>
            </div>
          </div>

          <div className="w-full bg-white rounded-3xl border border-[#E7E0D6] shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-10 relative overflow-hidden text-[#1C1614]">
            {/* Top Maroon Line */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#800020]/40 to-transparent" />

            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#800020]/10 text-[#800020] border border-[#800020]/25 mb-3 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-[#800020]" />
                <span>ধাপ ২: আপনার সুবিধাজনক প্যাকেজ বেছে নিন</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1614] tracking-tight leading-tight">
                এখনই কেনার প্রয়োজন নেই,{' '}
                <span className="text-[#800020] underline decoration-[#800020]/40 underline-offset-4">
                  শুধু আপনার বাজেট পছন্দ করুন
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-[#800020] font-semibold mt-2 bg-[#800020]/8 p-2.5 rounded-xl border border-[#800020]/20">
                💡 <span className="font-bold">তথ্য:</span> ডেমো ওয়েবসাইটগুলো দেখতে ও পরীক্ষা করতে কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই।
              </p>
            </div>

            {/* 3 Pack Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {DETAILED_SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                      isSelected
                        ? 'border-2 border-[#800020] bg-[#800020]/5 shadow-[0_4px_16px_rgba(128,0,32,0.1)] scale-[1.01]'
                        : 'border-[#E7E0D6] bg-[#FAF7F2] hover:border-[#800020]/30 hover:bg-white shadow-2xs hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Top Left Most Popular Badge */}
                    {plan.popular && (
                      <div className="absolute top-3.5 left-3.5 z-10">
                        <span className="text-[10px] font-bold text-white bg-[#800020] px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-white" />
                          <span>Most Popular</span>
                        </span>
                      </div>
                    )}

                    {/* Top Right Corner View Details Button */}
                    <div className="absolute top-3.5 right-3.5 z-10">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPlan(plan.id);
                          setIsDetailsExpanded(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold text-[#800020] bg-white border border-[#E7E0D6] hover:bg-[#800020] hover:text-white shadow-2xs transition-all cursor-pointer"
                        title={`View all specifications for ${plan.name}`}
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="pt-7">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#7A6A66] mb-2">
                        <span className="text-[#800020] font-bold">{plan.englishName}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#800020] text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-[#1C1614] mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-[#5C4E4B] mb-4 line-clamp-2">
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E7E0D6]">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xs text-[#7A6A66] font-medium">Setup:</span>
                        <span className="text-xl font-bold font-mono text-[#1C1614]">{plan.oneTimeFee}</span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-[#7A6A66] font-medium">Monthly Upkeep:</span>
                        <span className="font-bold text-[#800020] font-mono">{plan.monthly}/mo</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Continue Action Button - Only visible when view details is closed */}
            {!isDetailsExpanded && (
              <div className="flex items-center justify-center mb-6 animate-fadeIn">
                <button
                  type="button"
                  id="btn-continue-with-plan"
                  onClick={handleProceedToCatalog}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl btn-maroon text-white text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Continue with this Plan</span>
                  <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
                </button>
              </div>
            )}

            {/* Expandable Details Section */}
            {isDetailsExpanded && activePlan && (
              <div 
                ref={detailsRef}
                id="package-details-section"
                className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E7E0D6] mb-6 animate-fadeIn shadow-xs"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D6] mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#1C1614]">
                      {activePlan.name} Specifications
                    </h3>
                    <p className="text-xs text-[#7A6A66] font-medium">
                      {activePlan.oneTimeFee} setup fee · {activePlan.monthly}/month cloud hosting
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDetailsExpanded(false)}
                    className="text-xs text-[#7A6A66] hover:text-[#800020] font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <p className="text-xs text-[#5C4E4B] mb-4 leading-relaxed">
                  {activePlan.suitabilityText}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {activePlan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#1C1614]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-[#7A6A66] font-mono pt-3 border-t border-[#E7E0D6] mb-5">
                  {activePlan.serverSpecs}
                </div>

                {/* Bottom Action inside Details Section */}
                <div className="pt-4 border-t border-[#E7E0D6] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDetailsExpanded(false)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E7E0D6] bg-white hover:bg-[#800020]/5 text-[#1C1614] text-xs font-semibold transition-all cursor-pointer shadow-xs"
                  >
                    Close Specifications
                  </button>

                  <button
                    type="button"
                    id="btn-details-continue-with-plan"
                    onClick={handleProceedToCatalog}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl btn-maroon text-white text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>Continue with this Plan</span>
                    <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. WEBSITES CATALOG GRID                                                  */}
      {/* ========================================================================= */}
      {viewState === 'catalog' && (
        <div className="flex-1 flex flex-col">
          {/* Sticky Header Bar */}
          <header className="sticky top-0 z-30 w-full bg-[#FBF9F5]/90 backdrop-blur-xl border-b border-[#E7E0D6] shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
              <button
                onClick={onBack}
                id="catalog-back-to-dashboard-btn"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#800020]/5 text-[#1C1614] text-xs sm:text-sm font-semibold transition-all border border-[#E7E0D6] cursor-pointer shadow-xs active:scale-[0.99] shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-[#800020]" />
                <span>← Return to Dashboard</span>
              </button>

              {/* Search Bar */}
              <div className="relative w-64 sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A66]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by code (#1042) or keyword..."
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#E7E0D6] rounded-xl text-xs sm:text-sm text-[#1C1614] placeholder-[#7A6A66]/60 focus:outline-none focus:border-[#800020] transition-all shadow-xs"
                />
              </div>
            </div>

            {/* MANDATORY BANNER: What we do after your order */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 pt-1">
              <button
                type="button"
                onClick={() => setIsOrderProcessExpanded(prev => !prev)}
                id="btn-what-we-do-after-order"
                className="w-full relative group inline-flex items-center justify-between px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-[#FAF7F2] text-[#800020] cursor-pointer shadow-xs border border-[#800020]/30 hover:border-[#800020]/60 transition-all duration-200 overflow-hidden"
              >
                {/* Left Side: Bold Exact Statement with Live Pulse */}
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#800020] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#800020]"></span>
                  </span>
                  <span className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-[#800020] select-none">
                    অর্ডার করার পর আমরা আপনার জন্য কী কী করব (নির্দেশনা ও ধাপসমূহ)
                  </span>
                </div>

                {/* Right Side: Chevron Capsule */}
                <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] text-[#800020] flex items-center justify-center border border-[#800020]/25 group-hover:border-[#800020] transition-all duration-200 shrink-0">
                  {isOrderProcessExpanded ? (
                    <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  )}
                </div>
              </button>
            </div>
          </header>

          {/* Main Catalog Body */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
            {/* Inline Expanded Process Details */}
            {isOrderProcessExpanded && (
              <div 
                id="order-process-inline-details"
                className="p-6 rounded-3xl bg-white border border-[#800020]/25 shadow-sm mb-8 animate-fadeIn"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {/* Point 1 */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7E0D6] flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-[#800020] text-white flex items-center justify-center shrink-0 font-mono font-black text-xs shadow-xs">
                      01
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-[#800020] shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-[#1C1614] leading-snug">
                        সরাসরি ফোন কল বা হোয়াটসঅ্যাপে কথা বলে আপনার প্ল্যান চূড়ান্ত করা হবে (আপনার সাথে কথা বলেই কাজ শুরু হবে)
                      </span>
                    </div>
                  </div>

                  {/* Point 2 */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7E0D6] flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-[#800020] text-white flex items-center justify-center shrink-0 font-mono font-black text-xs shadow-xs">
                      02
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#800020] shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-[#1C1614] leading-snug">
                        আপনার ব্র্যান্ডের লোগো, স্লোগান, নাম এবং ডোমেন সংগ্রহ করা হবে
                      </span>
                    </div>
                  </div>

                  {/* Point 3 */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7E0D6] flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-[#800020] text-white flex items-center justify-center shrink-0 font-mono font-black text-xs shadow-xs">
                      03
                    </div>
                    <div className="flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-[#800020] shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-[#1C1614] leading-snug">
                        ডোমেন কানেকশন করে মাত্র ২৪ ঘণ্টার মধ্যে সম্পূর্ণ লাইভ ওয়েবসাইট ডেলিভারি
                      </span>
                    </div>
                  </div>

                  {/* Point 4 */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7E0D6] flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-[#800020] text-white flex items-center justify-center shrink-0 font-mono font-black text-xs shadow-xs">
                      04
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-[#800020] shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-[#1C1614] leading-snug">
                        যেকোনো প্রয়োজনে আমাদের অফিসিয়াল হোয়াটসঅ্যাপে আজীবন নিরবচ্ছিন্ন সাপোর্ট
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsOrderProcessExpanded(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#800020]/10 text-[#800020] text-xs font-semibold cursor-pointer transition-colors border border-[#800020]/25"
                  >
                    Hide Details
                  </button>
                </div>
              </div>
            )}

            {/* Demos Grid */}
            {filteredDemos.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white rounded-3xl border border-[#E7E0D6] max-w-md mx-auto my-8 shadow-xs text-[#1C1614]">
                <Search className="w-8 h-8 text-[#7A6A66] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#1C1614]">No websites match your search</h3>
                <p className="text-xs text-[#5C4E4B] mt-1 mb-4">
                  Try searching for another keyword or check another category.
                </p>
                <button
                  onClick={onBack}
                  className="px-4 py-2 btn-maroon text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDemos.map((demo, idx) => (
                  <div
                    key={demo.fourDigitCode ? `live-${demo.fourDigitCode.replace('#', '')}-${demo.id || idx}` : (demo.id || `live-${idx}`)}
                    onClick={() => handleOpenDemo(demo)}
                    className="group bg-white rounded-3xl border border-[#E7E0D6] shadow-xs hover:border-[#800020]/40 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer hover:-translate-y-1"
                  >
                    <div>
                      {/* Browser Chrome Window Frame */}
                      <div className="px-4 py-2.5 bg-[#FAF7F2] border-b border-[#E7E0D6] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#E7E0D6]"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#800020]/30"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-[#800020]"></span>
                        </div>
                        
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white text-[#800020] tracking-wider border border-[#E7E0D6] shadow-2xs">
                          {demo.fourDigitCode}
                        </span>
                      </div>

                      {/* Image Preview with Hover Lift */}
                      <div className="relative overflow-hidden aspect-16/10 bg-[#FAF7F2]">
                        <img
                          src={demo.previewImage}
                          alt={demo.title}
                          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                        />



                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/95 text-[#800020] shadow-xs backdrop-blur-xs border border-[#E7E0D6]">
                            {demo.categoryLabel}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono font-medium text-[#7A6A66]">
                            Code: {demo.fourDigitCode}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#D4AF37]">
                            <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                            <span className="text-[#1C1614]">{demo.rating}</span>
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-[#1C1614] group-hover:text-[#800020] transition-colors leading-snug">
                          {demo.englishTitle || demo.title}
                        </h3>
                        <p className="text-xs text-[#5C4E4B] mt-1 line-clamp-2 leading-relaxed">
                          {demo.description}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {(demo.features || []).slice(0, 3).map((feat, idx) => (
                            <span key={idx} className="text-[10px] font-medium bg-[#FAF7F2] text-[#800020] border border-[#E7E0D6] px-2 py-0.5 rounded-md">
                              ✓ {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-5 pt-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDemo(demo);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl btn-maroon text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
                      >
                        <span>Visit Live Demo</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ACTIVE LIVE WEBSITE PREVIEW SIMULATOR                                 */}
      {/* ========================================================================= */}
      {viewState === 'preview' && (
        <div id="preview-simulator-active" className="flex-1 flex flex-col relative w-full bg-[#FBF9F5] text-[#1C1614] animate-fadeIn min-h-screen">
          {/* Top Sticky Bar: High Contrast Cream & Maroon */}
          <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-[#E7E0D6] shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
              {/* Left Side: Return to Dashboard */}
              <button
                onClick={onBack}
                id="simulator-return-to-dashboard-btn"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#FAF7F2] hover:bg-[#800020] hover:text-white text-[#1C1614] transition-all cursor-pointer border border-[#E7E0D6] shadow-xs flex items-center justify-center hover:-translate-x-0.5 active:translate-x-0 shrink-0"
                title="Return to Dashboard"
                aria-label="Return to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-current shrink-0" />
              </button>

              {/* Right Side: Primary Maroon Action CTA Button */}
              <button
                type="button"
                onClick={() => onSelectForOrder(activeDemo)}
                id="header-checkout-this-website-btn"
                className="group relative inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl btn-maroon text-white text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shrink-0 overflow-hidden"
                title={`ওয়েবসাইট কিনুন ${activeDemo.fourDigitCode}`}
              >
                {/* Live pulsing radar beacon */}
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-85"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>

                {/* Shopping Bag Icon */}
                <ShoppingBag className="w-4 h-4 text-white shrink-0" />

                {/* Action Title in Bangla with Hashtag Code */}
                <span className="tracking-tight font-bold whitespace-nowrap text-white">
                  <span className="hidden sm:inline">এই ওয়েবসাইটটি কিনুন </span>
                  <span className="sm:hidden">ওয়েবসাইট কিনুন </span>
                  <span className="font-mono text-xs font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-md border border-white/30 ml-1">
                    {activeDemo.fourDigitCode}
                  </span>
                </span>

                {/* Forward Arrow with glide animation */}
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform shrink-0 stroke-[2.5]" />
              </button>
            </div>
          </header>

          {/* Authentic Live Website - Full Width & Natural Page Scrolling */}
          <main className="w-full bg-white flex-1 flex flex-col">
            {/* Website Internal Top Nav Header */}
            <div className="w-full border-b border-[#E7E0D6] bg-[#FAF7F2] shadow-xs">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                {/* Clean Authentic Brand Name */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#800020] text-white flex items-center justify-center font-black text-base shadow-xs">
                    {(activeDemo?.englishTitle || activeDemo?.title || 'BongoWeb Store').replace(/^#\d+\s*/, '').split('—')[0].trim().charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-base sm:text-lg text-[#1C1614] tracking-tight leading-tight">
                      {(activeDemo?.englishTitle || activeDemo?.title || 'BongoWeb Store').replace(/^#\d+\s*/, '').split('—')[0].trim()}
                    </span>
                    <span className="text-[10px] text-[#7A6A66] font-medium">
                      Official Store
                    </span>
                  </div>
                </div>

                <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#5C4E4B]">
                  <span className="text-[#800020] cursor-pointer font-bold">Home</span>
                  <span className="hover:text-[#800020] transition-colors cursor-pointer">Shop Collection</span>
                  <span className="hover:text-[#800020] transition-colors cursor-pointer">New Arrivals</span>
                  <span className="hover:text-[#800020] transition-colors cursor-pointer">About Brand</span>
                  <span className="hover:text-[#800020] transition-colors cursor-pointer">Contact Us</span>
                </nav>

                <div className="flex items-center gap-2.5 text-xs">
                  <button 
                    onClick={() => handleAddToCart(activeDemo.mockData?.items?.[0]?.name || 'Special Item')}
                    className="p-2 rounded-xl bg-white hover:bg-[#800020] hover:text-white text-[#1C1614] transition-colors cursor-pointer relative border border-[#E7E0D6]"
                    title="Cart"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#800020] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Store Hero Banner */}
            <div className="w-full bg-[#FAF7F2] text-[#1C1614] py-12 sm:py-20 px-4 sm:px-8 relative overflow-hidden border-b border-[#E7E0D6]">
              <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#800020]/10 text-[#800020] border border-[#800020]/25 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-[#800020]" />
                    <span>{(activeDemo.categoryLabel || activeDemo.category || 'WEBSITE').toUpperCase()} · 2026 EDITION</span>
                  </span>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#1C1614] leading-tight">
                    {activeDemo.heroHeadline || activeDemo.englishTitle || activeDemo.title}
                  </h1>
                  <p className="text-sm sm:text-base text-[#5C4E4B] mt-4 leading-relaxed max-w-xl">
                    {activeDemo.mockData?.heroSub || 'Explore curated selections with fast delivery.'}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleAddToCart(activeDemo.mockData?.items?.[0]?.name || 'Special Offer')}
                      className="px-6 py-3 rounded-xl btn-maroon text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center gap-2 active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4 text-white" />
                      <span>Shop Featured Collection</span>
                    </button>
                    <a
                      href={`https://wa.me/8801955570912?text=${encodeURIComponent(
                        `Hello, I would like to order website design ${activeDemo.fourDigitCode} (${activeDemo.title}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-3 rounded-xl bg-white hover:bg-[#800020]/5 text-[#800020] border border-[#800020]/30 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Order</span>
                    </a>
                  </div>
                </div>

                <div className="lg:col-span-5 hidden lg:block">
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-[#E7E0D6] aspect-4/3 relative">
                    <img 
                      src={activeDemo.previewImage} 
                      alt={activeDemo.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <span className="font-mono text-xs font-bold bg-white text-[#800020] px-3 py-1 rounded-md shadow-sm border border-[#E7E0D6]">
                        Verified 100% Responsive
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges Bar */}
            <div className="w-full border-b border-[#E7E0D6] bg-white py-4 px-4 sm:px-6">
              <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-[#1C1614]">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#800020] shrink-0" />
                  <span>24-Hour Express Delivery</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#800020] shrink-0" />
                  <span>Free SSL & Cloud Hosting</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-[#800020] shrink-0" />
                  <span>Mobile & Android Ready</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-[#800020] shrink-0" />
                  <span>Lifetime Website Ownership</span>
                </div>
              </div>
            </div>

            {/* Featured Store Items Catalog */}
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-12">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <span className="text-xs font-bold text-[#800020] uppercase tracking-wider block font-mono">
                    Product Showcase
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1C1614] tracking-tight mt-1">
                    Featured Store Catalog
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5C4E4B] mt-1">
                    Try adding products to test the live cart experience.
                  </p>
                </div>

                {lastAddedItem && (
                  <div className="p-2.5 px-4 bg-[#800020]/10 border border-[#800020]/25 text-[#800020] rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-[#800020] shrink-0" />
                    <span>Added "{lastAddedItem}" to cart!</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeDemo.mockData?.items || []).map((item, idx) => (
                  <div key={idx} className="group p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7E0D6] shadow-xs hover:border-[#800020]/30 hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="relative overflow-hidden rounded-xl aspect-4/3 mb-3 bg-white">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-[#800020] shadow-2xs font-mono border border-[#E7E0D6]">
                          In Stock
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1C1614] transition-colors">
                        {item.name}
                      </h4>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm font-mono font-extrabold text-[#1C1614]">
                          {item.price}
                        </span>
                        <span className="text-[10px] text-[#7A6A66] line-through font-mono">
                          ৳{parseInt(String(item?.price || '500').replace(/[^0-9]/g, '') || '500') + 350}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(item.name)}
                      className="mt-4 w-full py-2.5 rounded-xl btn-maroon text-white text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-2 active:scale-[0.99]"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials section */}
            <div className="w-full bg-[#FAF7F2] py-12 px-4 sm:px-6 border-t border-[#E7E0D6]">
              <div className="max-w-7xl mx-auto">
                <div className="text-center max-w-xl mx-auto mb-8">
                  <h3 className="text-xl font-bold text-[#1C1614]">What Customers Say</h3>
                  <p className="text-xs text-[#5C4E4B] mt-1">Customer satisfaction guaranteed with every website build.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Kazi Farhan', role: 'Online Fashion Seller', text: 'Our website launched in less than 24 hours. The WhatsApp ordering integration tripled our sales!' },
                    { name: 'Nusrat Jahan', role: 'Boutique Owner, Dhaka', text: 'I had no coding knowledge, but managing products from my phone is effortless.' },
                    { name: 'Tanvir Ahmed', role: 'Gadget Store Entrepreneur', text: 'Fast cloud hosting, bKash & Nagad payments configured flawlessly right from day one.' }
                  ].map((rev, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white border border-[#E7E0D6] shadow-2xs">
                      <div className="flex items-center gap-1 text-[#D4AF37] mb-2">
                        {[...Array(5)].map((_, s) => (
                          <Star key={s} className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                        ))}
                      </div>
                      <p className="text-xs text-[#5C4E4B] italic leading-relaxed">"{rev.text}"</p>
                      <div className="mt-3 pt-3 border-t border-[#E7E0D6] flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1C1614]">{rev.name}</span>
                        <span className="text-[10px] text-[#7A6A66]">{rev.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Authentic Live Footer */}
            <footer className="w-full bg-white text-[#5C4E4B] py-12 px-4 sm:px-6 border-t border-[#E7E0D6]">
              <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
                <div>
                  <h4 className="text-sm font-bold text-[#1C1614] mb-3">
                    {activeDemo.englishTitle || activeDemo.title}
                  </h4>
                  <p className="leading-relaxed text-[#5C4E4B]">
                    Official live responsive demo. Delivered with full ownership, custom domain, and cloud server hosting.
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-[#1C1614] mb-2">Quick Navigation</h5>
                  <ul className="space-y-1.5">
                    <li>Home</li>
                    <li>Featured Products</li>
                    <li>Privacy Policy</li>
                    <li>Terms of Service</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-[#1C1614] mb-2">Delivery & Support</h5>
                  <ul className="space-y-1.5">
                    <li>24/7 WhatsApp Hotline</li>
                    <li>Dhaka & Nationwide Courier Integration</li>
                    <li>Free SSL & Automated Backups</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-[#1C1614] mb-2">Accepted Payments</h5>
                  <p className="mb-2 text-[#5C4E4B]">bKash, Nagad, Rocket, Upay, Visa, Mastercard, AMEX.</p>
                  <span className="inline-block text-[10px] font-mono text-[#800020] bg-[#800020]/10 border border-[#800020]/25 px-2 py-0.5 rounded">
                    ✓ Secured by BongoWeb Gateway
                  </span>
                </div>
              </div>
              <div className="max-w-7xl mx-auto pt-6 border-t border-[#E7E0D6] text-center text-[11px] text-[#7A6A66]">
                © {new Date().getFullYear()} {activeDemo.englishTitle || activeDemo.title}. All rights reserved. Powered by BongoWeb Technologies.
              </div>
            </footer>
          </main>

          {/* Floating Stitched Right-Wall "Buy Now" Button (Cart/Drawer Style Dock) */}
          <aside
            id="live-browser-floating-right-buy-btn"
            aria-label="এখনই কিনুন - সাইড বাটন"
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50 select-none group"
          >
            <button
              type="button"
              onClick={() => onSelectForOrder(activeDemo)}
              aria-label={`এখনই কিনুন ${activeDemo.title}`}
              title={`এখনই এই ওয়েবসাইটটি কিনুন (${activeDemo.fourDigitCode})`}
              className="relative flex flex-col items-center justify-center py-4 px-2 sm:px-3 rounded-l-2xl sm:rounded-l-3xl rounded-r-none bg-gradient-to-b from-[#800020] via-[#9e1b32] to-[#5a0016] text-white shadow-[-8px_4px_30px_rgba(128,0,32,0.45)] hover:shadow-[-14px_8px_40px_rgba(128,0,32,0.65)] border-y-2 border-l-2 border-r-0 border-amber-300/60 cursor-pointer transition-all duration-300 ease-out transform hover:-translate-x-2 sm:hover:-translate-x-3 active:scale-95"
            >
              {/* Stitched grip notches */}
              <div className="absolute right-0.5 top-3 bottom-3 w-1 flex flex-col justify-between items-center opacity-40">
                <span className="w-1 h-1 rounded-full bg-white block" />
                <span className="w-1 h-1 rounded-full bg-white block" />
                <span className="w-1 h-1 rounded-full bg-white block" />
                <span className="w-1 h-1 rounded-full bg-white block" />
              </div>

              {/* Glowing radar beacon + Shopping Bag */}
              <div className="relative mb-2 flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-amber-200 opacity-80" />
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 backdrop-blur-xs border border-white/50 flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-white text-[#800020] transition-all duration-300">
                  <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white group-hover:text-[#800020] transition-colors stroke-[2.4]" />
                </div>
              </div>

              {/* Primary Call to Action */}
              <div className="flex flex-col items-center text-center font-black tracking-wider uppercase leading-none drop-shadow-md">
                <span className="text-[11px] sm:text-xs text-white">
                  এখনই
                </span>
                <span className="text-[11px] sm:text-xs text-amber-300 mt-0.5">
                  কিনুন
                </span>
              </div>

              {/* Price pill */}
              <div className="mt-2.5 px-1.5 sm:px-2 py-0.5 rounded-lg bg-black/40 border border-white/30 text-[10px] sm:text-[11px] font-mono font-black text-amber-200 text-center whitespace-nowrap shadow-xs">
                {formatDisplayPrice(activeDemo.priceTag, language)}
              </div>

              {/* Code badge */}
              <span className="mt-1 px-1 rounded bg-white/15 text-[9px] font-mono font-bold text-white/90 tracking-tight">
                {activeDemo.fourDigitCode}
              </span>

              {/* Hover arrow */}
              <div className="mt-2 w-5 h-5 rounded-full bg-white/20 group-hover:bg-white text-white group-hover:text-[#800020] flex items-center justify-center transition-all duration-200 shadow-2xs">
                <ArrowRight className="w-3 h-3 stroke-[3] group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Floating Slide-out Tooltip */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2.5 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-xl border border-amber-400/40 pointer-events-none animate-fadeIn">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>১-ক্লিকে ওয়েবসাইটটি কিনুন</span>
                <div className="w-2 h-2 bg-slate-900 rotate-45 absolute -right-1 top-1/2 -translate-y-1/2 border-r border-t border-amber-400/40" />
              </div>
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
