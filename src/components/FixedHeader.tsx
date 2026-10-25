import React, { useState } from 'react';
import { Menu, ArrowLeft, Languages, Bell, Home, LayoutGrid, MessageCircle, User, Phone, Clock, ArrowRight } from 'lucide-react';
import { BottomTabType } from './FixedBottomNav';
import BongoWebLogo from './BongoWebLogo';
import { useLanguage } from '../utils/LanguageContext';

interface FixedHeaderProps {
  onBackToCategoryPicker: () => void;
  onOpenNotifications?: () => void;
  onOpenMenu: () => void;
  unreadCount?: number;
  showBackArrow?: boolean;
  activeTab?: BottomTabType;
  onTabChange?: (tab: BottomTabType) => void;
  unreadChatCount?: number;
}

export default function FixedHeader({
  onBackToCategoryPicker,
  onOpenNotifications,
  onOpenMenu,
  unreadCount = 0,
  showBackArrow = false,
  activeTab = 'home',
  onTabChange,
  unreadChatCount = 0
}: FixedHeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const handleToggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const desktopNavItems = [
    { id: 'home' as BottomTabType, labelBn: 'হোম', labelEn: 'Home', icon: Home },
    { id: 'templates' as BottomTabType, labelBn: 'টেমপ্লেট', labelEn: 'Templates', icon: LayoutGrid },
    { id: 'live-chat' as BottomTabType, labelBn: 'লাইভ চ্যাট', labelEn: 'Live Chat', icon: MessageCircle, badge: unreadChatCount },
    { id: 'account' as BottomTabType, labelBn: 'অ্যাকাউন্ট', labelEn: 'Account', icon: User }
  ];

  const normalizedActive: 'home' | 'templates' | 'live-chat' | 'account' = (() => {
    if (activeTab === 'home' || activeTab === 'dashboard') return 'home';
    if (activeTab === 'templates') return 'templates';
    if (activeTab === 'live-chat') return 'live-chat';
    if (activeTab === 'account') return 'account';
    return 'home';
  })();

  return (
    <div className="fixed top-0 left-0 right-0 z-40 w-full select-none">
      <header 
        id="fixed-main-header"
        className="w-full bg-[#5B2C8A] border-b border-[#4A1F6E] shadow-[0_2px_14px_rgba(91,44,138,0.25)] h-16 sm:h-[68px] md:h-[72px] lg:h-[76px] flex items-center transition-colors"
      >
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 flex items-center justify-between gap-3 md:gap-4 h-full">
          
          {/* Left: Logo (+ Back Arrow on subpages) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 md:flex-1 md:justify-start">
            {/* Back Arrow (only shown on subpages) */}
            {showBackArrow && (
              <button
                type="button"
                onClick={onBackToCategoryPicker}
                aria-label="Go Back to Home"
                title="Go Back"
                className="inline-flex px-3 py-1.5 rounded-xl text-white bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold transition-all items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-white stroke-[2.2]" />
                <span className="hidden sm:inline">{language === 'bn' ? 'ফিরে যান' : 'Back'}</span>
              </button>
            )}

            {/* Logo: Placed in top left, returns home */}
            <div 
              onClick={onBackToCategoryPicker}
              className="flex items-center justify-center cursor-pointer group active:scale-95 transition-transform"
              title="BongoWeb"
            >
              <BongoWebLogo size="md" variant="white" />
            </div>
          </div>

          {/* Center: Desktop Navigation Links (Centered frosted glass capsule) */}
          {onTabChange && (
            <div className="hidden md:flex items-center justify-center shrink-0">
              <nav 
                aria-label="Desktop Navigation"
                className="flex items-center p-1 bg-white/[0.10] hover:bg-white/[0.14] border border-white/20 rounded-2xl backdrop-blur-md shadow-xs transition-colors gap-1"
              >
                {desktopNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = normalizedActive === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onTabChange(item.id)}
                      className={`relative px-3.5 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all duration-150 flex items-center gap-2 cursor-pointer select-none ${
                        isActive
                          ? 'bg-white text-[#5B2C8A] shadow-[0_2px_10px_rgba(0,0,0,0.14)] scale-[1.02]'
                          : 'text-purple-100 hover:text-white hover:bg-white/15 active:scale-95'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#5B2C8A]' : 'text-purple-200'}`} />
                      <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                      {item.badge && item.badge > 0 ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#5B2C8A] animate-pulse shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Right Action: Direct Hotline Phone + Language + Menu Button (For Laptop & Mobile) */}
          <div className="flex items-center gap-2 md:gap-2.5 shrink-0 md:flex-1 md:justify-end">
            {/* Direct Phone Hotline Call */}
            <a
              href="tel:+8801955570912"
              aria-label="Call Hotline & Support: 01955570912"
              title={language === 'bn' ? 'সরাসরি হটলাইনে কল করুন: 01955570912' : 'Call Hotline: 01955570912'}
              className="relative p-2 sm:p-2.5 rounded-xl text-white bg-emerald-500/20 hover:bg-emerald-500/30 active:bg-emerald-500/40 border border-emerald-400/40 transition-all cursor-pointer flex items-center justify-center shadow-2xs group"
            >
              <Phone className="w-4.5 h-4.5 text-emerald-300 stroke-[2.2] group-hover:scale-105 transition-transform" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#5B2C8A] animate-pulse" />
            </a>

            {/* Language Switcher Button */}
            <button
              type="button"
              onClick={handleToggleLanguage}
              aria-label="Change Language"
              title={language === 'bn' ? 'Switch to English' : 'বাংলা ভাষায় পরিবর্তন করুন'}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-white bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Languages className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white stroke-[2.2]" />
              <span className="text-xs font-bold text-purple-100 hidden sm:inline uppercase">
                {language === 'bn' ? 'বাংলা' : 'EN'}
              </span>
            </button>

            {/* Menu Button (On the RIGHT SIDE for Laptop & Mobile) */}
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="Open Navigation Menu"
              title={language === 'bn' ? 'মেনু খুলুন' : 'Open Menu'}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl text-white bg-white/15 hover:bg-white/25 active:bg-white/35 border border-white/25 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs group"
            >
              <Menu className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white stroke-[2.4] group-hover:scale-110 transition-transform" />
              <span className="font-bold hidden sm:inline">{language === 'bn' ? 'মেনু' : 'Menu'}</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
