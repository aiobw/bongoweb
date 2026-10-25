import { useState } from 'react';
import { 
  Globe, Image, ArrowRight, ArrowDown, ShieldCheck, Star, 
  ExternalLink, Sparkles, RotateCcw, 
  CreditCard, CheckCircle2, Lock, FileText, Server, 
  Menu, X, ChevronRight, ChevronUp, Zap, Eye, Laptop, Clock, Smartphone, MessageCircle, User,
  Play, Film
} from 'lucide-react';
import BongoWebLogo from './BongoWebLogo';
import { TESTIMONIALS } from '../data/mockData';
import { WebsiteDemo } from '../types';

interface MainPreviewZoneProps {
  onBackToWizard: () => void;
  onOpenLiveBrowser: () => void;
  onOpenPhotoShowcase: () => void;
  onOpenPackages: () => void;
  onOpenVideoFaq: () => void;
  onOpenOrderModal: (demo?: WebsiteDemo | string) => void;
}

export default function MainPreviewZone({
  onBackToWizard,
  onOpenLiveBrowser,
  onOpenPhotoShowcase,
  onOpenPackages,
  onOpenVideoFaq,
  onOpenOrderModal
}: MainPreviewZoneProps) {
  const [expandedLiveCard, setExpandedLiveCard] = useState(false);
  const [expandedPhotoCard, setExpandedPhotoCard] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  return (
    <div 
      id="main-preview-zone"
      className="w-full flex flex-col min-h-screen relative z-10 transition-all duration-300 font-sans bg-[#FBF9F5] text-[#1C1614]"
    >
      {/* 1. Header Bar: Minimal, Elegant, Sticky, High-End Cream Glass */}
      <header 
        id="main-header"
        className="sticky top-0 z-40 w-full bg-[#FBF9F5]/90 backdrop-blur-xl border-b border-[#E7E0D6] shadow-[0_2px_16px_rgba(0,0,0,0.03)] transition-all"
      >
        <div className="max-w-6xl lg:max-w-7xl xl:max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[68px] flex items-center justify-between gap-4 relative">
          {/* Top Left: Official BongoWeb Logo */}
          <div 
            onClick={onBackToWizard}
            id="bongo-web-logo"
            className="flex items-center cursor-pointer select-none group py-1"
            title="BongoWeb — Home"
          >
            <BongoWebLogo size="md" />
          </div>

          {/* Desktop Center Navigation Links (>= 1024px) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[#5C4E4B]">
            <button 
              onClick={onOpenLiveBrowser}
              className="hover:text-[#800020] transition-colors cursor-pointer py-2 min-h-[44px] flex items-center"
            >
              Live Catalog
            </button>
            <button 
              onClick={onOpenPhotoShowcase}
              className="hover:text-[#800020] transition-colors cursor-pointer py-2 min-h-[44px] flex items-center"
            >
              Photo Showcase
            </button>
            <button 
              onClick={onOpenPackages}
              className="hover:text-[#800020] transition-colors cursor-pointer py-2 min-h-[44px] flex items-center"
            >
              Pricing & Plans
            </button>
            <button 
              onClick={onOpenVideoFaq}
              className="hover:text-[#800020] transition-colors cursor-pointer py-2 min-h-[44px] flex items-center"
            >
              Video Guides
            </button>
          </nav>

          {/* Top Right: Account Portal & Primary Action */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Account Icon */}
            <button
              onClick={() => {
                setAccountModalOpen(!accountModalOpen);
                setMobileMenuOpen(false);
              }}
              id="header-account-btn"
              className="min-h-[48px] px-3.5 py-2.5 rounded-xl text-[#1C1614] bg-white hover:bg-[#800020]/5 border border-[#E7E0D6] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer text-xs font-semibold active:scale-95 touch-manipulation"
              aria-label="Account Portal"
              title="My Account"
            >
              <User className="w-4 h-4 text-[#800020]" />
              <span className="hidden sm:inline">Client Portal</span>
            </button>

            {/* Quick Order Button - Solid Maroon Primary CTA */}
            <button
              onClick={() => onOpenOrderModal('Standard Starter Website')}
              className="hidden sm:inline-flex items-center gap-1.5 min-h-[48px] px-5 py-2.5 rounded-xl text-xs font-bold text-white btn-maroon shadow-md cursor-pointer hover:scale-[1.02] active:scale-95 touch-manipulation"
            >
              <span>Order Website</span>
              <ArrowRight className="w-3.5 h-3.5 text-white stroke-[2.5]" />
            </button>

            {/* Mobile & Tablet Collapsible Menu Toggle (< 1024px) */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setAccountModalOpen(false);
              }}
              id="header-menu-btn"
              className="min-h-[48px] min-w-[48px] p-3 rounded-xl text-[#1C1614] bg-white hover:bg-[#800020]/5 border border-[#E7E0D6] lg:hidden flex items-center justify-center cursor-pointer active:scale-95 transition-all touch-manipulation shadow-xs"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#800020]" /> : <Menu className="w-5 h-5 text-[#1C1614]" />}
            </button>
          </div>

          {/* Account Dropdown Modal */}
          {accountModalOpen && (
            <div className="absolute right-4 sm:right-6 top-16 sm:top-[66px] w-[calc(100vw-2rem)] sm:w-84 max-w-sm bg-white rounded-2xl shadow-[0_20px_50px_rgba(80,10,25,0.15)] border border-[#E7E0D6] p-5 space-y-4 z-50 animate-fadeIn text-[#1C1614]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E0D6]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#800020]/10 border border-[#800020]/20 text-[#800020] flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4 text-[#800020]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1C1614] leading-tight">Entrepreneur Portal</div>
                    <div className="text-[11px] text-[#7A6A66] font-medium">Fast tracking & engineering help</div>
                  </div>
                </div>
                <button
                  onClick={() => setAccountModalOpen(false)}
                  className="min-h-[44px] min-w-[44px] text-[#7A6A66] hover:text-[#800020] p-2 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E7E0D6] text-xs">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#800020] mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#800020]"></span>
                  <span>24-Hour Deployment Guarantee</span>
                </div>
                <span className="text-[11px] text-[#5C4E4B] block leading-relaxed">
                  Every order is custom-configured, branded, and connected to your domain within 24 hours of confirmation.
                </span>
              </div>

              <button
                onClick={() => {
                  setAccountModalOpen(false);
                  onOpenOrderModal('Standard Starter Website');
                }}
                className="w-full min-h-[48px] py-3 rounded-xl text-xs font-bold text-white btn-maroon flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 touch-manipulation"
              >
                <span>Launch New Website (৳৯৯৯ BDT)</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>

              <a
                href="https://wa.me/8801955570912"
                target="_blank"
                rel="noreferrer"
                className="w-full min-h-[48px] py-3 rounded-xl text-xs font-semibold text-[#800020] bg-white hover:bg-[#800020]/5 border border-[#800020]/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 touch-manipulation"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#800020]" />
                <span>Contact Direct WhatsApp Advisor</span>
              </a>
            </div>
          )}

          {/* Right Menu Dropdown Drawer (Mobile & Tablet < 1024px) */}
          {mobileMenuOpen && (
            <div className="absolute right-4 top-16 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-[0_20px_50px_rgba(80,10,25,0.15)] border border-[#E7E0D6] p-4 space-y-1.5 z-50 animate-fadeIn text-[#1C1614] lg:hidden">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLiveBrowser();
                }}
                className="w-full min-h-[48px] flex items-center justify-between p-3 rounded-xl hover:bg-[#800020]/5 text-[#1C1614] font-semibold text-xs sm:text-sm transition-colors cursor-pointer text-left active:bg-[#800020]/10 touch-manipulation"
              >
                <span className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-[#800020]" />
                  <span>Browse Live Websites</span>
                </span>
                <span className="text-[10px] font-bold text-[#800020] bg-[#800020]/10 border border-[#800020]/20 px-2 py-0.5 rounded font-mono">60+ Demos</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPhotoShowcase();
                }}
                className="w-full min-h-[48px] flex items-center justify-between p-3 rounded-xl hover:bg-[#800020]/5 text-[#1C1614] font-semibold text-xs sm:text-sm transition-colors cursor-pointer text-left active:bg-[#800020]/10 touch-manipulation"
              >
                <span className="flex items-center gap-3">
                  <Image className="w-4 h-4 text-[#800020]" />
                  <span>Design Photo Gallery</span>
                </span>
                <span className="text-[10px] font-bold text-[#800020] bg-[#800020]/10 border border-[#800020]/20 px-2 py-0.5 rounded font-mono">Photos</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenVideoFaq();
                }}
                className="w-full min-h-[48px] flex items-center justify-between p-3 rounded-xl hover:bg-[#800020]/5 text-[#1C1614] font-semibold text-xs sm:text-sm transition-colors cursor-pointer text-left active:bg-[#800020]/10 touch-manipulation"
              >
                <span className="flex items-center gap-3">
                  <Film className="w-4 h-4 text-[#800020]" />
                  <span>Video Guides & FAQ</span>
                </span>
                <span className="text-[10px] font-bold text-[#800020] bg-[#800020]/10 border border-[#800020]/20 px-2 py-0.5 rounded font-mono">Videos</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPackages();
                }}
                className="w-full min-h-[48px] flex items-center justify-between p-3 rounded-xl hover:bg-[#800020]/5 text-[#1C1614] font-semibold text-xs sm:text-sm transition-colors cursor-pointer text-left active:bg-[#800020]/10 touch-manipulation"
              >
                <span className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-[#800020]" />
                  <span>Packages & Pricing</span>
                </span>
                <span className="text-[10px] font-bold text-[#800020] bg-[#800020]/10 border border-[#800020]/20 px-2 py-0.5 rounded font-mono">From ৳999 BDT</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onBackToWizard();
                }}
                className="w-full min-h-[48px] flex items-center justify-between p-3 rounded-xl hover:bg-[#800020]/5 text-[#5C4E4B] font-medium text-xs sm:text-sm transition-colors cursor-pointer text-left active:bg-[#800020]/10 touch-manipulation"
              >
                <span className="flex items-center gap-3">
                  <RotateCcw className="w-4 h-4 text-[#7A6A66]" />
                  <span>Restart Onboarding</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#7A6A66]" />
              </button>

              <div className="pt-2 border-t border-[#E7E0D6]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenOrderModal('Standard Starter Website');
                  }}
                  className="w-full min-h-[48px] py-3 rounded-xl text-xs sm:text-sm font-bold text-white btn-maroon flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 touch-manipulation"
                >
                  <span>Checkout Now (৳999 BDT)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl lg:max-w-7xl xl:max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 flex flex-col justify-start">
        {/* Editorial Section Intro */}
        <div className="text-center max-w-2xl lg:max-w-4xl mx-auto mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#800020] bg-white border border-[#E7E0D6] shadow-xs mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#800020] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#800020]"></span>
            </span>
            <span>Interactive Production Gallery</span>
            <span className="text-[#800020]/40">·</span>
            <span className="text-[#800020] font-bold">60+ Live Designs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#1C1614] tracking-tight leading-tight lg:leading-[1.16]">
            ২৪ ঘণ্টার মধ্যে আপনার নামে, আপনার লোগো দিয়ে{' '}
            <span className="text-[#800020] underline decoration-[#800020]/40 underline-offset-6">
              আপনার কাস্টমাইজেশনে ওয়েবসাইট বুঝে নিন
            </span>
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-[#800020] font-semibold mt-2 lg:mt-3 max-w-2xl mx-auto bg-[#800020]/8 p-2.5 rounded-xl border border-[#800020]/20">
            💡 <span className="font-bold">তথ্য:</span> আপনাকে দেখানোর জন্য আমাদের ১০০+ রেডিমেড ওয়েবসাইট প্রস্তুত রয়েছে।
          </p>
        </div>

        {/* Dual Choice Cards - Cream White & Maroon Architecture */}
        <section 
          id="dual-choice-cards" 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto w-full mb-12 relative items-stretch"
        >
          {/* Left Card: Live Interactive Websites */}
          <div 
            id="choice-card-live-browse"
            onClick={() => {
              if (!expandedLiveCard) {
                setExpandedLiveCard(true);
                setExpandedPhotoCard(true);
              }
            }}
            className={`group relative p-7 sm:p-8 lg:p-9 rounded-3xl bg-white text-[#1C1614] border border-[#E7E0D6] hover:border-[#800020]/40 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between overflow-hidden h-full min-h-[380px] sm:min-h-[420px] lg:min-h-[450px] ${
              !expandedLiveCard ? 'cursor-pointer hover:-translate-y-1' : ''
            }`}
          >
            {/* Top Maroon Line */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#800020]/60 via-[#800020]/25 to-transparent" />

            {!expandedLiveCard ? (
              <div className="flex-1 flex flex-col items-center justify-between text-center py-4 sm:py-6 h-full">
                <div className="w-14 h-14 rounded-2xl bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-sm">
                  <Globe className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1C1614] tracking-tight min-h-[32px] sm:min-h-[36px] flex items-center justify-center">
                    আমাদের লাইভ ওয়েবসাইটসমূহ
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5C4E4B] mt-2 mb-7 max-w-xs mx-auto min-h-[40px] sm:min-h-[44px] flex items-center justify-center leading-relaxed">
                    বাস্তব ব্রাউজার ডেমো, লাইভ কার্ট, এবং কার্যকরী পেমেন্ট সিস্টেম সরাসরি টেস্ট করুন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedLiveCard(true);
                    setExpandedPhotoCard(true);
                  }}
                  className="group/btn relative inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-[#FAF7F2] hover:bg-[#800020]/8 text-[#800020] font-bold text-xs sm:text-sm cursor-pointer border border-[#E7E0D6] shadow-2xs transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                >
                  <span>বিস্তারিত ও স্পেসিফিকেশন দেখুন</span>
                  <span className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-[#800020]/10 border border-[#800020]/20 text-[#800020] shadow-inner group-hover/btn:bg-[#800020] group-hover/btn:text-white transition-colors">
                    <ArrowDown className="w-3.5 h-3.5 stroke-[3] animate-bounce" />
                  </span>
                </button>
              </div>
            ) : (
              <div className="animate-fadeIn flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-[#E7E0D6] h-[56px]">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#1C1614] tracking-tight">
                        আমাদের লাইভ ওয়েবসাইটসমূহ
                      </h2>
                      <p className="text-xs text-[#800020] font-semibold">
                        লাইভ ওয়েবসাইট ক্যাটালগ
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedLiveCard(false);
                        setExpandedPhotoCard(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#800020]/10 text-[#800020] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#E7E0D6]"
                    >
                      <span>সংক্ষিপ্ত করুন</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mb-6 text-xs text-[#1C1614]">
                    <div className="min-h-[58px] flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E7E0D6] shadow-2xs hover:border-[#800020]/30 transition-colors">
                      <Laptop className="w-4 h-4 text-[#800020] shrink-0" />
                      <span className="font-semibold text-[#1C1614] flex-1">৬০+ লাইভ রেসপনসিভ ওয়েবসাইট ডেমো</span>
                      <span className="text-[10px] text-[#800020] font-bold bg-[#800020]/10 px-2 py-0.5 rounded border border-[#800020]/20 font-mono">Live Browse</span>
                    </div>

                    <div className="min-h-[58px] flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E7E0D6] shadow-2xs hover:border-[#800020]/30 transition-colors">
                      <Sparkles className="w-4 h-4 text-[#800020] shrink-0" />
                      <span className="font-semibold text-[#1C1614] flex-1">আপনার নাম এবং লোগো সহ সম্পূর্ণ রেডি</span>
                      <span className="text-[10px] text-[#800020] font-bold bg-[#800020]/10 px-2 py-0.5 rounded border border-[#800020]/20 font-mono">100% Custom</span>
                    </div>

                    <div className="min-h-[58px] flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E7E0D6] shadow-2xs hover:border-[#800020]/30 transition-colors">
                      <Clock className="w-4 h-4 text-[#800020] shrink-0" />
                      <span className="font-semibold text-[#1C1614] flex-1">২৪ ঘণ্টার মধ্যে সম্পূর্ণ সাইট লাইভ ডেলিভারি</span>
                      <span className="text-[10px] text-[#800020] font-bold bg-[#800020]/10 px-2 py-0.5 rounded border border-[#800020]/20 font-mono">24h Express</span>
                    </div>

                    <div className="min-h-[58px] flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E7E0D6] shadow-2xs hover:border-[#800020]/30 transition-colors">
                      <Smartphone className="w-4 h-4 text-[#800020] shrink-0" />
                      <span className="font-semibold text-[#1C1614] flex-1">মোবাইল থেকে সহজ ম্যানেজমেন্ট ও পেমেন্ট</span>
                      <span className="text-[10px] text-[#800020] font-bold bg-[#800020]/10 px-2 py-0.5 rounded border border-[#800020]/20 font-mono">Easy Admin</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOpenLiveBrowser}
                  id="btn-live-web-visit"
                  className="w-full min-h-[50px] py-3.5 px-6 rounded-xl text-xs sm:text-sm font-bold text-white btn-maroon shadow-md flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <ExternalLink className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>লাইভ ক্যাটালগ খুলুন (৬০+ ডেমো)</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Card: Design Photo Gallery */}
          <div 
            id="choice-card-photo-showcase"
            onClick={() => {
              if (!expandedPhotoCard) {
                setExpandedLiveCard(true);
                setExpandedPhotoCard(true);
              }
            }}
            className={`group relative p-7 sm:p-8 lg:p-9 rounded-3xl bg-white text-[#1C1614] border border-[#E7E0D6] hover:border-[#800020]/40 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 flex flex-col justify-between overflow-hidden h-full min-h-[380px] sm:min-h-[420px] lg:min-h-[450px] ${
              !expandedPhotoCard ? 'cursor-pointer hover:-translate-y-1' : ''
            }`}
          >
            {/* Top Maroon Line */}
            <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#800020]/60 via-[#800020]/25 to-transparent" />

            {!expandedPhotoCard ? (
              <div className="flex-1 flex flex-col items-center justify-between text-center py-4 sm:py-6 h-full">
                <div className="w-14 h-14 rounded-2xl bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-sm">
                  <Image className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1C1614] tracking-tight min-h-[32px] sm:min-h-[36px] flex items-center justify-center">
                    আমাদের ওয়েবসাইট ফটো গ্যালারি
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5C4E4B] mt-2 mb-7 max-w-xs mx-auto min-h-[40px] sm:min-h-[44px] flex items-center justify-center leading-relaxed">
                    হাই-রেজ্যুলেশন ফটো মকআপ, জুম ভিউ এবং স্পষ্ট ডিজাইন স্পেসিফিকেশন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedLiveCard(true);
                    setExpandedPhotoCard(true);
                  }}
                  className="group/btn relative inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-[#FAF7F2] hover:bg-[#800020]/8 text-[#800020] font-bold text-xs sm:text-sm cursor-pointer border border-[#E7E0D6] shadow-2xs transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                >
                  <span>বিস্তারিত ও স্পেসিফিকেশন দেখুন</span>
                  <span className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-[#800020]/10 border border-[#800020]/20 text-[#800020] shadow-inner group-hover/btn:bg-[#800020] group-hover/btn:text-white transition-colors">
                    <ArrowDown className="w-3.5 h-3.5 stroke-[3] animate-bounce" />
                  </span>
                </button>
              </div>
            ) : (
              <div className="animate-fadeIn flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-[#E7E0D6] h-[56px]">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#1C1614] tracking-tight">
                        আমাদের ওয়েবসাইট ফটো গ্যালারি
                      </h2>
                      <p className="text-xs text-[#800020] font-semibold">
                        হাই-রেজ্যুলেশন ডিজাইন মকআপ গ্যালারি
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedLiveCard(false);
                        setExpandedPhotoCard(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#800020]/10 text-[#800020] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#E7E0D6]"
                    >
                      <span>সংক্ষিপ্ত করুন</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mb-6 text-xs text-[#1C1614]">
                    <div className="min-h-[58px] flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E7E0D6] shadow-2xs hover:border-[#800020]/30 transition-colors">
                      <Laptop className="w-4 h-4 text-[#800020] shrink-0" />
                      <span className="font-semibold text-[#1C1614] flex-1">৬০+ কিউরেটেড হাই-রেজ্যুলেশন ডিজাইন</span>
                      <span className="text-[10px] text-[#800020] font-bold bg-[#800020]/10 px-2 py-0.5 rounded border border-[#800020]/20 font-mono">HD Gallery</span>
                    </div>

                    <div className="min-h-[58px] flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E7E0D6] shadow-2xs hover:border-[#800020]/30 transition-colors">
                      <Sparkles className="w-4 h-4 text-[#800020] shrink-0" />
                      <span className="font-semibold text-[#1C1614] flex-1">আপনার ব্র্যান্ড নাম ও লোগোর সাথে সাজানো</span>
                      <span className="text-[10px] text-[#800020] font-bold bg-[#800020]/10 px-2 py-0.5 rounded border border-[#800020]/20 font-mono">100% Custom</span>
                    </div>

                    <div className="min-h-[58px] flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E7E0D6] shadow-2xs hover:border-[#800020]/30 transition-colors">
                      <Clock className="w-4 h-4 text-[#800020] shrink-0" />
                      <span className="font-semibold text-[#1C1614] flex-1">২৪ ঘণ্টার মধ্যে সম্পূর্ণ সাইট ডেলিভারি</span>
                      <span className="text-[10px] text-[#800020] font-bold bg-[#800020]/10 px-2 py-0.5 rounded border border-[#800020]/20 font-mono">24h Express</span>
                    </div>

                    <div className="min-h-[58px] flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-[#E7E0D6] shadow-2xs hover:border-[#800020]/30 transition-colors">
                      <Smartphone className="w-4 h-4 text-[#800020] shrink-0" />
                      <span className="font-semibold text-[#1C1614] flex-1">মোবাইল থেকে সহজ ম্যানেজমেন্ট ও পরিচালনা</span>
                      <span className="text-[10px] text-[#800020] font-bold bg-[#800020]/10 px-2 py-0.5 rounded border border-[#800020]/20 font-mono">Easy Admin</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOpenPhotoShowcase}
                  id="btn-photo-showcase-view"
                  className="w-full min-h-[50px] py-3.5 px-6 rounded-xl text-xs sm:text-sm font-bold text-white btn-maroon shadow-md flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Eye className="w-4 h-4 text-white stroke-[2.5]" />
                  <span>ফটো গ্যালারি প্রদর্শনী খুলুন</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Video FAQ Spotlight Banner */}
        <section 
          id="project-video-faq-banner"
          className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto w-full mb-12 p-6 sm:p-7 lg:p-8 rounded-3xl bg-white text-[#1C1614] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#E7E0D6] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center justify-center shrink-0">
              <Film className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#7A6A66] mb-1">
                <span>Video Walkthrough</span>
                <span>·</span>
                <span className="text-[#800020] font-bold bg-[#800020]/10 px-2 py-0.5 rounded border border-[#800020]/20">Self-Paced Guide</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#1C1614]">
                প্রজেক্ট ভিডিও গাইড এবং সচরাচর জিজ্ঞাসিত প্রশ্নাবলী
              </h3>
              <p className="text-xs sm:text-sm text-[#800020] font-semibold mt-1 max-w-lg leading-relaxed">
                💡 আমাদের ২৪ ঘণ্টার ডেলিভারি, ডোমেন সংযোগ এবং স্টোর ম্যানেজমেন্ট কীভাবে কাজ করে তা দেখে নিন।
              </p>
            </div>
          </div>

          <button
            onClick={onOpenVideoFaq}
            id="btn-open-video-faq"
            className="w-full md:w-auto px-7 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white btn-maroon transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02] active:scale-[0.99]"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
            <span>Watch Videos</span>
          </button>
        </section>

        {/* Supported Payment Gateways */}
        <section id="payment-gateways" className="max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto w-full mb-14">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#800020]/10 text-[#800020] border border-[#800020]/20 mb-2 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#800020]" />
              <span>Safe & Regulated Channels</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1C1614] tracking-tight">
              Supported Payment Methods
            </h2>
            <p className="text-xs sm:text-sm text-[#5C4E4B] mt-1 max-w-lg mx-auto">
              Settle your one-time setup fee and monthly server hosting via bKash, Nagad, Card, or direct bank transfer.
            </p>
          </div>

          {/* Six Brand Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* 1. bKash */}
            <div className="p-4 rounded-2xl bg-white border border-[#E7E0D6] hover:border-[#800020]/30 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-between text-center hover:-translate-y-0.5">
              <img 
                src="/bkash-logo.svg" 
                alt="bKash" 
                className="w-10 h-10 rounded-xl mb-2 object-contain" 
              />
              <h4 className="text-xs font-bold text-[#1C1614]">
                bKash
              </h4>
              <p className="text-[10px] text-[#7A6A66] mt-0.5">
                Merchant & Send
              </p>
              <span className="mt-2 text-[9px] font-bold text-[#800020] bg-[#800020]/10 border border-[#800020]/20 px-2 py-0.5 rounded-full font-mono">
                Instant
              </span>
            </div>

            {/* 2. Nagad */}
            <div className="p-4 rounded-2xl bg-white border border-[#E7E0D6] hover:border-[#800020]/30 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-between text-center hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E7E0D6] flex items-center justify-center p-1 mb-2">
                <img 
                  src="/nagad-logo.svg" 
                  alt="Nagad" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <h4 className="text-xs font-bold text-[#1C1614]">
                Nagad
              </h4>
              <p className="text-[10px] text-[#7A6A66] mt-0.5">
                Fast & Secure
              </p>
              <span className="mt-2 text-[9px] font-bold text-[#800020] bg-[#800020]/10 border border-[#800020]/20 px-2 py-0.5 rounded-full font-mono">
                Quick Pay
              </span>
            </div>

            {/* 3. Rocket */}
            <div className="p-4 rounded-2xl bg-white border border-[#E7E0D6] hover:border-[#800020]/30 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-between text-center hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E7E0D6] flex items-center justify-center p-1.5 mb-2">
                <img 
                  src="/rocket-logo.svg" 
                  alt="Rocket" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <h4 className="text-xs font-bold text-[#1C1614]">
                Rocket
              </h4>
              <p className="text-[10px] text-[#7A6A66] mt-0.5">
                DBBL Wallet
              </p>
              <span className="mt-2 text-[9px] font-bold text-[#800020] bg-[#800020]/10 border border-[#800020]/20 px-2 py-0.5 rounded-full font-mono">
                DBBL Pay
              </span>
            </div>

            {/* 4. Upay */}
            <div className="p-4 rounded-2xl bg-white border border-[#E7E0D6] hover:border-[#800020]/30 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-between text-center hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] text-[#800020] border border-[#E7E0D6] flex items-center justify-center mb-2">
                <CreditCard className="w-5 h-5 text-[#800020]" />
              </div>
              <h4 className="text-xs font-bold text-[#1C1614]">
                Upay
              </h4>
              <p className="text-[10px] text-[#7A6A66] mt-0.5">
                UCB Digital
              </p>
              <span className="mt-2 text-[9px] font-bold text-[#800020] bg-[#800020]/10 border border-[#800020]/20 px-2 py-0.5 rounded-full font-mono">
                UCB Pay
              </span>
            </div>

            {/* 5. Card Payment */}
            <div className="p-4 rounded-2xl bg-white border border-[#E7E0D6] hover:border-[#800020]/30 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-between text-center hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] text-[#800020] border border-[#E7E0D6] flex items-center justify-center mb-2 shadow-xs">
                <CreditCard className="w-5 h-5 text-[#800020]" />
              </div>
              <h4 className="text-xs font-bold text-[#1C1614]">
                Card Payment
              </h4>
              <p className="text-[10px] text-[#7A6A66] mt-0.5">
                Visa, MC, AMEX
              </p>
              <span className="mt-2 text-[9px] font-bold text-[#800020] bg-[#800020]/10 border border-[#800020]/20 px-2 py-0.5 rounded-full font-mono">
                All Cards
              </span>
            </div>

            {/* 6. Bank Transfer */}
            <div className="p-4 rounded-2xl bg-white border border-[#E7E0D6] hover:border-[#800020]/30 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-between text-center hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] text-[#800020] border border-[#E7E0D6] flex items-center justify-center mb-2 shadow-xs">
                <Server className="w-5 h-5 text-[#800020]" />
              </div>
              <h4 className="text-xs font-bold text-[#1C1614]">
                Bank Transfer
              </h4>
              <p className="text-[10px] text-[#7A6A66] mt-0.5">
                NPSB & BEFTN
              </p>
              <span className="mt-2 text-[9px] font-bold text-[#800020] bg-[#800020]/10 border border-[#800020]/20 px-2 py-0.5 rounded-full font-mono">
                Direct Bank
              </span>
            </div>
          </div>

          {/* Trust Certifications Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-white rounded-2xl border border-[#E7E0D6] shadow-2xs">
            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 rounded-lg bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1C1614] block leading-tight">256-bit SSL Security</span>
                <span className="text-[10px] text-[#7A6A66]">Bank-level Encryption</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 rounded-lg bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1C1614] block leading-tight">Instant Order Processing</span>
                <span className="text-[10px] text-[#7A6A66]">Automated Verification</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 rounded-lg bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1C1614] block leading-tight">Official Invoicing</span>
                <span className="text-[10px] text-[#7A6A66]">Instant Digital Receipts</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 rounded-lg bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1C1614] block leading-tight">Zero Hidden Fees</span>
                <span className="text-[10px] text-[#7A6A66]">100% Transparent</span>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section id="customer-reviews" className="max-w-4xl mx-auto w-full mb-14">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E7E0D6]">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl font-extrabold text-[#1C1614] tracking-tight font-mono">4.9</span>
                <div className="flex items-center text-[#D4AF37]">
                  <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                  <Star className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                </div>
                <span className="text-xs text-[#7A6A66] font-semibold">/ 5.0 Rating</span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C4E4B] font-medium">
                Verified Entrepreneur Feedback & Case Studies
              </p>
            </div>

            <div className="px-3.5 py-1.5 bg-white text-[#800020] border border-[#E7E0D6] rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#800020] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#800020]"></span>
              </span>
              <span>450+ Active Client Websites</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TESTIMONIALS.map((test) => (
              <div
                key={test.id}
                className="p-6 rounded-2xl bg-white border border-[#E7E0D6] shadow-xs hover:border-[#800020]/30 hover:shadow-md transition-all flex flex-col justify-between text-[#1C1614]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-0.5 text-[#D4AF37]">
                      {[...Array(test.stars)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                      ))}
                    </div>
                    <span className="text-[11px] text-[#7A6A66] font-mono font-medium">
                      {test.date}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#1C1614] mb-2 leading-snug">
                    "{test.highlight}"
                  </h3>

                  <p className="text-xs text-[#5C4E4B] leading-relaxed font-normal mb-5">
                    {test.quote}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[#E7E0D6]">
                  <img
                    src={test.avatar}
                    alt={test.name}
                    className="w-9 h-9 rounded-full object-cover border border-[#E7E0D6] shadow-2xs"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#1C1614] truncate">
                        {test.name}
                      </span>
                      <span className="text-[9px] font-bold text-white bg-[#800020] px-1.5 py-0.2 rounded shrink-0">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7A6A66] truncate mt-0.5">
                      {test.role}, {test.business} ({test.location})
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer: Cream White & Maroon */}
      <footer id="main-footer" className="w-full bg-[#FAF7F2] text-[#5C4E4B] border-t border-[#E7E0D6] pt-12 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl lg:max-w-7xl xl:max-w-[1360px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
          {/* Col 1 */}
          <div>
            <div className="flex items-baseline font-black text-xl mb-3 select-none">
              <span className="text-[#1C1614] tracking-tight">Bongo</span>
              <span className="text-[#800020] tracking-tight ml-0.5">Web</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#800020] ml-1 mb-0.5 shrink-0" />
            </div>
            <p className="text-[#5C4E4B] leading-relaxed text-xs mb-3">
              Affordable, reliable, turnkey website infrastructure engineered for modern businesses.
            </p>
            <div className="text-[11px] text-[#800020] font-mono font-bold">
              24-Hour Deployment Guarantee
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="text-[#1C1614] font-bold text-xs tracking-wider uppercase mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={onOpenLiveBrowser} className="hover:text-[#800020] transition-colors cursor-pointer">
                  Live Website Catalog
                </button>
              </li>
              <li>
                <button onClick={onOpenPhotoShowcase} className="hover:text-[#800020] transition-colors cursor-pointer">
                  Photo Mockup Gallery
                </button>
              </li>
              <li>
                <button onClick={onOpenPackages} className="hover:text-[#800020] transition-colors cursor-pointer">
                  Plans & Pricing (৳999 BDT)
                </button>
              </li>
              <li>
                <button onClick={onOpenVideoFaq} className="hover:text-[#800020] transition-colors cursor-pointer">
                  Video Guides & Walkthrough
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="text-[#1C1614] font-bold text-xs tracking-wider uppercase mb-3">
              Deliverables
            </h4>
            <ul className="space-y-2 text-xs text-[#5C4E4B]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                <span>Custom Domain & SSL Included</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                <span>1-Click WhatsApp Ordering</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                <span>bKash & Card Payment Gateways</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                <span>Lifetime Technical Assistance</span>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className="text-[#1C1614] font-bold text-xs tracking-wider uppercase mb-3">
              Infrastructure
            </h4>
            <div className="p-4 rounded-2xl bg-white border border-[#E7E0D6] text-xs shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#800020] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#800020]"></span>
                </span>
                <span className="font-bold text-[#1C1614]">All Cloud Nodes Healthy</span>
              </div>
              <p className="text-[#5C4E4B] text-[11px] leading-relaxed">
                99.9% uptime SLA with automated 24/7 cloud server health monitoring.
              </p>
              <div className="mt-3 pt-2.5 border-t border-[#E7E0D6] flex items-center justify-between text-[11px] text-[#7A6A66] font-medium">
                <span>Edge Regions:</span>
                <span className="text-[#800020] font-mono font-semibold">Asia-Pacific & Global</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-6xl lg:max-w-7xl xl:max-w-[1360px] mx-auto pt-6 border-t border-[#E7E0D6] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-[#7A6A66]">
          <div>
            © {new Date().getFullYear()} BongoWeb Inc. All rights reserved.
          </div>
          <div className="text-[#7A6A66] font-medium">
            High-speed turnkey digital infrastructure for modern enterprises
          </div>
        </div>
      </footer>
    </div>
  );
}
