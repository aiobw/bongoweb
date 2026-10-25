import { Home, LayoutGrid, MessageCircle, User } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

export type BottomTabType = 
  | 'home' 
  | 'templates' 
  | 'live-chat' 
  | 'account'
  | 'preview'
  | 'help'
  | 'dashboard' 
  | 'after-order'
  | 'credentials';

interface FixedBottomNavProps {
  activeTab: BottomTabType;
  onTabChange: (tab: BottomTabType) => void;
  unreadChatCount?: number;
}

export default function FixedBottomNav({
  activeTab,
  onTabChange,
  unreadChatCount = 0
}: FixedBottomNavProps) {
  const { language } = useLanguage();

  // Normalize active tab
  const normalizedActive: 'home' | 'templates' | 'live-chat' | 'account' = (() => {
    if (activeTab === 'home' || activeTab === 'dashboard') return 'home';
    if (activeTab === 'templates') return 'templates';
    if (activeTab === 'live-chat') return 'live-chat';
    if (activeTab === 'account') return 'account';
    return 'home';
  })();

  const tabs = [
    {
      id: 'home' as BottomTabType,
      labelBn: 'হোম',
      labelEn: 'Home',
      icon: Home
    },
    {
      id: 'templates' as BottomTabType,
      labelBn: 'টেমপ্লেট',
      labelEn: 'Templates',
      icon: LayoutGrid
    },
    {
      id: 'live-chat' as BottomTabType,
      labelBn: 'লাইভ চ্যাট',
      labelEn: 'Live Chat',
      icon: MessageCircle,
      badge: unreadChatCount
    },
    {
      id: 'account' as BottomTabType,
      labelBn: 'Account',
      labelEn: 'Account',
      icon: User
    }
  ];

  return (
    <nav
      id="fixed-bottom-nav"
      role="navigation"
      aria-label="Footer Navigation - 4 Items"
      className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 w-full bg-[#5B2C8A] border-t border-[#4A1F6E] shadow-[0_-4px_25px_rgba(91,44,138,0.35)] h-16 sm:h-[68px] items-center select-none"
    >
      <div className="max-w-md sm:max-w-xl md:max-w-2xl w-full mx-auto px-4 sm:px-6 h-full flex items-center justify-around gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = normalizedActive === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              id={`bottom-nav-${tab.id}`}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 cursor-pointer touch-manipulation min-h-[48px] group ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-purple-200/80 hover:text-white font-medium'
              }`}
            >
              {/* Active Tab Highlight Indicator */}
              {isActive && (
                <span className="absolute inset-x-2 inset-y-1 bg-white/15 rounded-xl -z-10 shadow-xs border border-white/20 transition-all" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative mb-0.5 flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive 
                      ? 'scale-105 stroke-[2.4] text-white drop-shadow-[0_2px_6px_rgba(255,255,255,0.4)]' 
                      : 'stroke-[1.9] text-purple-200/80 group-hover:text-white'
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#10B981] text-white text-[9px] font-black shadow-xs ring-2 ring-[#5B2C8A]">
                    {tab.badge}
                  </span>
                ) : null}
              </div>

              {/* Tab Title */}
              <span
                className={`text-[11px] sm:text-xs leading-tight tracking-tight transition-colors ${
                  isActive ? 'text-white font-bold' : 'text-purple-200/80 group-hover:text-white'
                }`}
              >
                {language === 'bn' ? tab.labelBn : tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
