import React, { useState, useEffect, useCallback } from 'react';
import { WebsiteCategory, WebsiteDemo } from './types';
import FixedHeader from './components/FixedHeader';
import FixedBottomNav, { BottomTabType } from './components/FixedBottomNav';
import DashboardView from './components/DashboardView';
import AfterOrderView from './components/AfterOrderView';
import LiveChatView from './components/LiveChatView';
import AccountView from './components/AccountView';
import WebsiteDetailPage from './components/WebsiteDetailPage';
import OrderPageView from './components/OrderPageView';
import NotificationsModal from './components/NotificationsModal';
import SideMenuDrawer from './components/SideMenuDrawer';
import AdminPanelView from './components/AdminPanelView';
import CategoryWebsitesView from './components/CategoryWebsitesView';
import PrivacyPolicyView from './components/legal/PrivacyPolicyView';
import TermsConditionsView from './components/legal/TermsConditionsView';
import CookiePolicyView from './components/legal/CookiePolicyView';
import RefundPolicyView from './components/legal/RefundPolicyView';
import NotFoundView from './components/NotFoundView';
import AppFooter from './components/AppFooter';
import CookieConsentBanner from './components/CookieConsentBanner';
import WebsiteCredentialsView from './components/WebsiteCredentialsView';
import { updatePageSEO } from './utils/seo';
import { apiGetWebsites, subscribeToWebsites } from './utils/api';

type ViewMode = 
  | 'dashboard' 
  | 'category-websites'
  | 'after-order' 
  | 'credentials'
  | 'live-chat' 
  | 'account' 
  | 'website-detail' 
  | 'order-page' 
  | 'admin'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'refund'
  | 'not-found';

// Helper to extract demo by code (e.g. 1042 or #1042 from live catalog)
// Placed at module level so reference never causes infinite component re-renders
function findDemoByCode(rawCode: string): WebsiteDemo | null {
  const clean = decodeURIComponent(String(rawCode || '')).replace('#', '').trim().toLowerCase();
  if (!clean) return null;
  
  // Search in custom uploaded websites (from Firestore / server / admin)
  try {
    const raw = localStorage.getItem('bongoweb_custom_websites') || localStorage.getItem('bongoweb_custom_catalog');
    if (raw) {
      const parsed: WebsiteDemo[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const found = parsed.find((d) => {
          if (!d) return false;
          const code = String(d?.fourDigitCode || '').replace('#', '').trim().toLowerCase();
          const id = String(d?.id || '').toLowerCase();
          const title = String(d?.title || '').toLowerCase();
          return code === clean || id === clean || id.endsWith(clean) || title.includes(clean);
        });
        if (found) return found;
      }
    }
  } catch (_) {}

  return null;
}

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const p = (window.location.pathname || '').toLowerCase();
      const h = (window.location.hash || '').toLowerCase();
      const s = (window.location.search || '').toLowerCase();

      // Reliable admin route detection on initial boot / reload
      if (
        p === '/admin' || 
        p.startsWith('/admin') || 
        h === '#/admin' || 
        h === '#admin' || 
        h.startsWith('#/admin') ||
        s.includes('view=admin') ||
        s.includes('tab=admin')
      ) {
        return 'admin';
      }

      if (p.startsWith('/website')) return 'website-detail';
      if (p.startsWith('/order')) return 'order-page';
      if (p.startsWith('/after-order')) return 'after-order';
      if (p.startsWith('/credentials') || p.startsWith('/website-credentials')) return 'credentials';
      if (p.startsWith('/live-chat')) return 'live-chat';
      if (p.startsWith('/account') || p.startsWith('/recover-email')) return 'account';
      if (p.startsWith('/dashboard')) return 'dashboard';

      const saved = sessionStorage.getItem('bongoweb_active_view') || localStorage.getItem('bongoweb_active_view');
      if (saved === 'admin') return 'admin';
      if (saved === 'dashboard') return 'dashboard';
      if (saved === 'account') return 'account';
      if (saved === 'live-chat') return 'live-chat';
      if (saved === 'after-order') return 'after-order';
      if (saved === 'credentials') return 'credentials';
    }
    // Directly land on Dashboard for any visitor (logged-in or guest)
    return 'dashboard';
  });
  const [selectedCategory, setSelectedCategory] = useState<WebsiteCategory>('ecommerce');
  const [activeDemo, setActiveDemo] = useState<WebsiteDemo | null>(null);
  const [afterOrderKey, setAfterOrderKey] = useState(0);

  // Modals state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  // Track previous path before opening website detail so Back returns to where user came from (e.g. templates, category, etc.)
  const [returnPath, setReturnPath] = useState<string>(() => {
    try {
      return sessionStorage.getItem('bongoweb_return_path') || '/templates';
    } catch {
      return '/templates';
    }
  });

  // Parse path from window.location.pathname, hash, or search
  // Using functional updaters with equality guards to guarantee zero duplicate re-renders
  const parseCurrentUrl = useCallback(() => {
    let rawPath = window.location.pathname || '/';

    // Support hash fallback (e.g. #/account, #/live-chat, #/order/1042)
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      rawPath = window.location.hash.replace(/^#/, '');
    } else if (window.location.hash && window.location.hash.length > 1 && !window.location.hash.includes('=')) {
      rawPath = '/' + window.location.hash.replace(/^#\/?/, '');
    }

    // Support query param fallback (e.g. ?view=account or ?tab=account)
    if (window.location.search) {
      try {
        const params = new URLSearchParams(window.location.search);
        const queryView = params.get('view') || params.get('tab') || params.get('page');
        if (queryView) {
          rawPath = '/' + queryView.replace(/^\//, '');
        }
      } catch (_) {}
    }

    const path = decodeURIComponent(rawPath).replace(/\/+$/, '') || '/';
    const lowerPath = path.toLowerCase();

    if (lowerPath === '/admin' || lowerPath.startsWith('/admin') || lowerPath === 'admin') {
      setViewMode(prev => prev === 'admin' ? prev : 'admin');
      return;
    }

    if (path === '/testing-mode' || path === '/test' || path === '/testing' || path.startsWith('/testing-mode') || path.startsWith('/descope-test')) {
      setViewMode(prev => prev === 'dashboard' ? prev : 'dashboard');
      window.history.replaceState({}, '', '/');
      return;
    }

    if (path.startsWith('/website')) {
      const code = path.replace(/^\/website\/?/, '').split('/')[0].split('?')[0];
      const demo = findDemoByCode(code);
      setActiveDemo(demo);
      setViewMode(prev => prev === 'website-detail' ? prev : 'website-detail');
      return;
    }

    if (path.startsWith('/order')) {
      const code = path.replace(/^\/order\/?/, '').split('/')[0].split('?')[0];
      const demo = findDemoByCode(code);
      setActiveDemo(demo);
      setViewMode(prev => prev === 'order-page' ? prev : 'order-page');
      return;
    }

    if (path === '/after-order' || path.startsWith('/after-order')) {
      setViewMode(prev => prev === 'after-order' ? prev : 'after-order');
      return;
    }

    if (path === '/credentials' || path.startsWith('/credentials') || path === '/website-credentials' || path.startsWith('/website-credentials')) {
      setViewMode(prev => prev === 'credentials' ? prev : 'credentials');
      return;
    }

    if (path === '/live-chat' || path.startsWith('/live-chat')) {
      setViewMode(prev => prev === 'live-chat' ? prev : 'live-chat');
      return;
    }

    if (path === '/account' || path.startsWith('/account') || path === '/recover-email' || path.startsWith('/recover-email')) {
      setViewMode(prev => prev === 'account' ? prev : 'account');
      return;
    }

    if (path.startsWith('/category')) {
      const cat = path.replace(/^\/category\/?/, '').split('/')[0].split('?')[0];
      if (cat) {
        setSelectedCategory(prev => prev === (cat as WebsiteCategory) ? prev : (cat as WebsiteCategory));
      }
      setViewMode(prev => prev === 'category-websites' ? prev : 'category-websites');
      return;
    }

    if (path === '/templates' || path.startsWith('/templates')) {
      setSelectedCategory(prev => prev === 'all' ? prev : 'all');
      setViewMode(prev => prev === 'category-websites' ? prev : 'category-websites');
      return;
    }

    if (path === '/preview' || path.startsWith('/preview')) {
      setViewMode(prev => prev === 'website-detail' ? prev : 'website-detail');
      return;
    }

    if (path === '/help' || path.startsWith('/help')) {
      setViewMode(prev => prev === 'live-chat' ? prev : 'live-chat');
      return;
    }

    if (path === '/privacy' || path === '/privacy-policy' || path.startsWith('/privacy')) {
      setViewMode(prev => prev === 'privacy' ? prev : 'privacy');
      return;
    }

    if (path === '/terms' || path === '/terms-and-conditions' || path.startsWith('/terms')) {
      setViewMode(prev => prev === 'terms' ? prev : 'terms');
      return;
    }

    if (path === '/cookies' || path === '/cookie-policy' || path.startsWith('/cookies')) {
      setViewMode(prev => prev === 'cookies' ? prev : 'cookies');
      return;
    }

    if (path === '/refund' || path === '/refund-policy' || path.startsWith('/refund')) {
      setViewMode(prev => prev === 'refund' ? prev : 'refund');
      return;
    }

    if (path === '/404') {
      setViewMode(prev => prev === 'not-found' ? prev : 'not-found');
      return;
    }

    if (path === '/dashboard' || path.startsWith('/dashboard')) {
      setViewMode(prev => prev === 'dashboard' ? prev : 'dashboard');
      return;
    }

    // Default root path "/"
    if (path === '/' || path === '') {
      const savedCategory = sessionStorage.getItem('bongoweb_chosen_category') || localStorage.getItem('bongoweb_chosen_category');
      if (savedCategory) {
        setSelectedCategory(prev => prev === (savedCategory as WebsiteCategory) ? prev : (savedCategory as WebsiteCategory));
      }
      setViewMode(prev => prev === 'dashboard' ? prev : 'dashboard');
      return;
    }

    // Any other unrecognized route -> 404 Custom Not Found View
    setViewMode(prev => prev === 'not-found' ? prev : 'not-found');
  }, []);

  // Synchronize current view mode to storage
  useEffect(() => {
    try {
      localStorage.setItem('bongoweb_active_view', viewMode);
      sessionStorage.setItem('bongoweb_active_view', viewMode);
    } catch (_) {}
  }, [viewMode]);

  // Initialize and listen to popstate and hashchange
  useEffect(() => {
    // 0. Clean slate purge of old users, orders, and chats for fresh start
    try {
      const FRESH_KEY = 'bongoweb_clean_slate_20261017_v3';
      if (!localStorage.getItem(FRESH_KEY)) {
        localStorage.removeItem('bongoweb_orders');
        localStorage.removeItem('bongoweb_placed_orders');
        localStorage.removeItem('bongoweb_all_orders');
        localStorage.removeItem('bongoweb_support_chats');
        localStorage.removeItem('bongoweb_registered_users');
        localStorage.removeItem('bongoweb_delivered_credentials');
        localStorage.removeItem('bongoweb_reset_requests');
        localStorage.removeItem('bongoweb_reports');
        localStorage.removeItem('bongoweb_user');
        localStorage.removeItem('bongoweb_chat_active_session');
        localStorage.removeItem('bongoweb_last_otp');
        localStorage.removeItem('bongoweb_pending_email');
        localStorage.removeItem('bongoweb_notifications');
        sessionStorage.removeItem('bongoweb_user');
        sessionStorage.removeItem('bongoweb_active_view');
        sessionStorage.removeItem('bongoweb_chat_active_session');
        localStorage.setItem(FRESH_KEY, 'true');
      }
    } catch (_) {}

    // 1. Initial route resolution
    parseCurrentUrl();

    // 2. Fetch custom websites from Cloud Firestore & server vault so all devices sync instantly
    apiGetWebsites()
      .then((customWebsites: WebsiteDemo[]) => {
        if (Array.isArray(customWebsites) && customWebsites.length > 0) {
          localStorage.setItem('bongoweb_custom_websites', JSON.stringify(customWebsites));
          localStorage.setItem('bongoweb_custom_catalog', JSON.stringify(customWebsites));
          const path = window.location.pathname || '';
          if (path.startsWith('/website') || path.startsWith('/order')) {
            parseCurrentUrl();
          }
        }
      })
      .catch(() => {});

    // 3. Real-time Cloud Firestore subscription for instantaneous catalog sync
    const unsubWebsites = subscribeToWebsites((cloudSites) => {
      if (Array.isArray(cloudSites) && cloudSites.length > 0) {
        localStorage.setItem('bongoweb_custom_websites', JSON.stringify(cloudSites));
        localStorage.setItem('bongoweb_custom_catalog', JSON.stringify(cloudSites));
        const path = window.location.pathname || '';
        if (path.startsWith('/website') || path.startsWith('/order')) {
          parseCurrentUrl();
        }
      }
    });

    const handleNavigation = () => {
      parseCurrentUrl();
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    const handleWebsitesUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        localStorage.setItem('bongoweb_custom_websites', JSON.stringify(e.detail));
        localStorage.setItem('bongoweb_custom_catalog', JSON.stringify(e.detail));
        parseCurrentUrl();
      }
    };

    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('bongoweb_websites_updated', handleWebsitesUpdated);
    return () => {
      unsubWebsites();
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('bongoweb_websites_updated', handleWebsitesUpdated);
    };
  }, [parseCurrentUrl]);

  // Select Category -> Enters Dashboard (URL is root domain "/")
  const handleSelectCategory = (category: WebsiteCategory) => {
    setSelectedCategory(category);
    sessionStorage.setItem('bongoweb_chosen_category', category);
    localStorage.setItem('bongoweb_chosen_category', category);
    localStorage.setItem('bongoweb_active_view', 'dashboard');
    setViewMode('dashboard');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Open Category Websites View with unique URL: /category/:category
  const handleOpenCategoryWebsites = (category: WebsiteCategory) => {
    setSelectedCategory(category);
    sessionStorage.setItem('bongoweb_chosen_category', category);
    localStorage.setItem('bongoweb_chosen_category', category);
    setViewMode('category-websites');
    window.history.pushState({}, '', `/category/${category}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Open Website in dedicated full page with unique URL: /website/:code
  const handleOpenWebsiteDetail = (demo: WebsiteDemo) => {
    const currentPath = window.location.pathname || '/';
    if (!currentPath.startsWith('/website') && !currentPath.startsWith('/order')) {
      setReturnPath(currentPath);
      try {
        sessionStorage.setItem('bongoweb_return_path', currentPath);
      } catch (_) {}
    }
    setActiveDemo(demo);
    const cleanCode = String(demo?.fourDigitCode || '2085').replace('#', '');
    setViewMode('website-detail');
    window.history.pushState({ prevPath: currentPath }, '', `/website/${cleanCode}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Open Order in dedicated full page with unique URL: /order/:code
  const handleOpenOrder = (demo: WebsiteDemo | string | null) => {
    let resolvedDemo: WebsiteDemo | null = null;
    if (typeof demo === 'string') {
      resolvedDemo = findDemoByCode(demo);
    } else if (demo) {
      resolvedDemo = demo;
    }

    if (!resolvedDemo) {
      resolvedDemo = activeDemo;
    }

    setActiveDemo(resolvedDemo);
    const cleanCode = resolvedDemo?.fourDigitCode ? String(resolvedDemo.fourDigitCode).replace('#', '') : 'custom';
    setViewMode('order-page');
    window.history.pushState({}, '', `/order/${cleanCode}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Change Fixed Bottom Nav tab with unique URLs
  const handleTabChange = (tab: BottomTabType) => {
    if (tab === 'home' || tab === 'dashboard') {
      setViewMode('dashboard');
      window.history.pushState({}, '', '/');
    } else if (tab === 'templates') {
      setSelectedCategory('all');
      sessionStorage.setItem('bongoweb_chosen_category', 'all');
      localStorage.setItem('bongoweb_chosen_category', 'all');
      setViewMode('category-websites');
      window.history.pushState({}, '', '/templates');
    } else if (tab === 'live-chat') {
      setViewMode('live-chat');
      window.history.pushState({}, '', '/live-chat');
    } else if (tab === 'help' || tab === 'after-order') {
      setAfterOrderKey((prev) => prev + 1);
      setViewMode('after-order');
      window.history.pushState({}, '', '/after-order');
    } else if (tab === 'preview') {
      if (activeDemo) {
        setViewMode('website-detail');
        const cleanCode = String(activeDemo.fourDigitCode || 'custom').replace('#', '');
        window.history.pushState({}, '', `/website/${cleanCode}`);
      } else {
        setSelectedCategory('all');
        setViewMode('category-websites');
        window.history.pushState({}, '', '/templates');
      }
    } else if (tab === 'credentials' as any) {
      setViewMode('credentials');
      window.history.pushState({}, '', '/credentials');
    } else if (tab === 'account') {
      setViewMode('account');
      window.history.pushState({}, '', '/account');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Return to Dashboard (Home)
  const handleReturnToDashboard = () => {
    setViewMode('dashboard');
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Navigate to Legal & Compliance pages
  const handleNavigateLegal = (page: 'privacy' | 'terms' | 'cookies' | 'refund') => {
    setViewMode(page);
    window.history.pushState({}, '', `/${page}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Return to previous view (Templates, Category, Home, etc.) when clicking Back from Website Detail / Preview
  const handleBackFromWebsite = () => {
    let target = returnPath;
    try {
      const stored = sessionStorage.getItem('bongoweb_return_path');
      if (stored && !stored.startsWith('/website') && !stored.startsWith('/order')) {
        target = stored;
      }
    } catch (_) {}

    // Fallback if target is invalid or self
    if (!target || target.startsWith('/website') || target.startsWith('/order')) {
      const savedCat = sessionStorage.getItem('bongoweb_chosen_category') || selectedCategory;
      if (savedCat && savedCat !== 'all') {
        target = `/category/${savedCat}`;
      } else {
        target = '/templates';
      }
    }

    window.history.pushState({}, '', target);
    parseCurrentUrl();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Helper for active tab indicator in bottom nav
  const getActiveBottomTab = (): BottomTabType => {
    if (viewMode === 'category-websites') return 'templates';
    if (viewMode === 'live-chat') return 'live-chat';
    if (viewMode === 'account' || viewMode === 'credentials') return 'account';
    if (viewMode === 'after-order') return 'help';
    if (viewMode === 'website-detail') {
      return (returnPath && (returnPath.startsWith('/templates') || returnPath.startsWith('/category'))) ? 'templates' : 'home';
    }
    return 'home';
  };

  return (
    <div className="min-h-screen bg-[#F8F5FC] text-[#1F1F2E] antialiased selection:bg-[#5B2C8A] selection:text-white flex flex-col justify-between font-sans">
      {/* 1. Standalone Executive Admin Panel */}
      {viewMode === 'admin' && (
        <AdminPanelView onBackToApp={handleReturnToDashboard} />
      )}

      {/* 2. Dedicated Website Full Page (Unique URL: /website/:code) */}
      {viewMode === 'website-detail' && (
        <div className="w-full min-h-screen flex flex-col bg-[#F8F5FC] text-[#1F1F2E]">
          <WebsiteDetailPage
            demo={(() => {
              if (activeDemo) return activeDemo;
              const p = window.location.pathname || '';
              const code = p.replace(/^\/website\/?/, '').split('/')[0].split('?')[0];
              return findDemoByCode(code) as any;
            })()}
            onBackToDashboard={handleBackFromWebsite}
            onBack={handleBackFromWebsite}
            onGoToOrder={handleOpenOrder}
          />
        </div>
      )}

      {/* 3. Dedicated Order Full Page (Unique URL: /order/:code) */}
      {viewMode === 'order-page' && (
        <OrderPageView
          demo={(() => {
            if (activeDemo) return activeDemo;
            const p = window.location.pathname || '';
            const code = p.replace(/^\/order\/?/, '').split('/')[0].split('?')[0];
            return findDemoByCode(code) as any;
          })()}
          onBackToDashboard={handleBackFromWebsite}
          onBackToWebsite={(code) => {
            const demo = findDemoByCode(code);
            if (demo) handleOpenWebsiteDetail(demo);
            else handleBackFromWebsite();
          }}
        />
      )}

      {/* 4. Main App Container (Dashboard/Home, Templates, After Order, Live Chat, Account) */}
      {viewMode !== 'admin' && viewMode !== 'website-detail' && viewMode !== 'order-page' && (
        <div className="w-full min-h-screen flex flex-col bg-[#F8F5FC] text-[#1F1F2E]">
          {/* Fixed Header */}
          <FixedHeader
            onBackToCategoryPicker={handleReturnToDashboard}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onOpenMenu={() => setSideMenuOpen(true)}
            unreadCount={unreadNotifications}
            showBackArrow={viewMode === 'category-websites' || viewMode === 'after-order' || viewMode === 'account' || viewMode === 'live-chat'}
            activeTab={getActiveBottomTab()}
            onTabChange={handleTabChange}
            unreadChatCount={(() => {
              if (viewMode === 'live-chat') return 0;
              try {
                return localStorage.getItem('bongoweb_chat_active_session') ? 1 : 0;
              } catch (_) {
                return 0;
              }
            })()}
          />

          {/* Dynamic Content Views */}
          <main className="flex-1 w-full pt-16 sm:pt-[72px] lg:pt-[76px]">
            {/* Dashboard (URL: "/") */}
            {viewMode === 'dashboard' && (
              <DashboardView
                initialCategory={selectedCategory}
                onOpenLiveDemo={handleOpenWebsiteDetail}
                onOpenOrder={handleOpenOrder}
                onSelectCategoryWebsites={handleOpenCategoryWebsites}
                onChangeCategoryLanding={handleReturnToDashboard}
              />
            )}

            {/* Category Websites List (URL: "/category/:category") */}
            {viewMode === 'category-websites' && (
              <CategoryWebsitesView
                category={selectedCategory}
                onBackToDashboard={handleReturnToDashboard}
                onOpenWebsiteDetail={handleOpenWebsiteDetail}
                onOpenOrder={handleOpenOrder}
              />
            )}

            {/* After Order (URL: "/after-order") */}
            {viewMode === 'after-order' && (
              <AfterOrderView
                key={afterOrderKey}
                onGoToDashboard={() => handleTabChange('dashboard')}
                onOpenLiveChat={() => handleTabChange('live-chat')}
              />
            )}

            {/* Website ID & Password (URL: "/credentials") */}
            {viewMode === 'credentials' && (
              <WebsiteCredentialsView
                onGoToDashboard={() => handleTabChange('dashboard')}
                onOpenLiveChat={() => handleTabChange('live-chat')}
              />
            )}

            {/* Live Chat (URL: "/live-chat") */}
            {viewMode === 'live-chat' && (
              <LiveChatView onExitChat={() => handleTabChange('home')} />
            )}

            {/* Account (URL: "/account") */}
            {viewMode === 'account' && (
              <AccountView 
                onGoToDashboard={() => handleTabChange('dashboard')}
                onOpenAdminPanel={() => {
                  setViewMode('admin');
                  window.history.pushState({}, '', '/admin');
                  window.scrollTo({ top: 0, behavior: 'instant' });
                }}
              />
            )}

            {/* Privacy Policy (URL: "/privacy") */}
            {viewMode === 'privacy' && (
              <PrivacyPolicyView
                onBack={handleReturnToDashboard}
                onNavigateToTerms={() => handleNavigateLegal('terms')}
                onNavigateToCookies={() => handleNavigateLegal('cookies')}
              />
            )}

            {/* Terms & Conditions (URL: "/terms") */}
            {viewMode === 'terms' && (
              <TermsConditionsView
                onBack={handleReturnToDashboard}
                onNavigateToPrivacy={() => handleNavigateLegal('privacy')}
                onNavigateToRefund={() => handleNavigateLegal('refund')}
              />
            )}

            {/* Cookie Policy (URL: "/cookies") */}
            {viewMode === 'cookies' && (
              <CookiePolicyView
                onBack={handleReturnToDashboard}
                onNavigateToPrivacy={() => handleNavigateLegal('privacy')}
              />
            )}

            {/* Refund Policy (URL: "/refund") */}
            {viewMode === 'refund' && (
              <RefundPolicyView
                onBack={handleReturnToDashboard}
                onNavigateToLiveChat={() => handleTabChange('live-chat')}
              />
            )}

            {/* Custom 404 Page */}
            {viewMode === 'not-found' && (
              <NotFoundView
                onGoHome={handleReturnToDashboard}
                onGoTemplates={() => handleTabChange('templates')}
                onGoSupport={() => handleTabChange('live-chat')}
              />
            )}

            {/* Global Comprehensive Footer */}
            {(viewMode === 'dashboard' || viewMode === 'category-websites' || viewMode === 'privacy' || viewMode === 'terms' || viewMode === 'cookies' || viewMode === 'refund' || viewMode === 'not-found') && (
              <AppFooter
                onNavigateHome={handleReturnToDashboard}
                onNavigateTemplates={() => handleTabChange('templates')}
                onNavigateLiveChat={() => handleTabChange('live-chat')}
                onNavigateAccount={() => handleTabChange('account')}
                onNavigatePrivacy={() => handleNavigateLegal('privacy')}
                onNavigateTerms={() => handleNavigateLegal('terms')}
                onNavigateCookies={() => handleNavigateLegal('cookies')}
                onNavigateRefund={() => handleNavigateLegal('refund')}
              />
            )}
          </main>
        </div>
      )}

      {/* Global Fixed Bottom Navigation Bar (4 Options: Home, Category, Live Chat, Account) */}
      {viewMode !== 'admin' && viewMode !== 'website-detail' && (
        <FixedBottomNav
          activeTab={getActiveBottomTab()}
          onTabChange={handleTabChange}
          unreadChatCount={viewMode === 'live-chat' ? 0 : 1}
        />
      )}

      {/* Notifications Drawer Modal */}
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => {
          setNotificationsOpen(false);
          setUnreadNotifications(0);
        }}
        onClearAll={() => setUnreadNotifications(0)}
        onNavigateToAccount={() => {
          handleTabChange('account');
        }}
      />

      {/* Side Menu Drawer - Directly navigates to dedicated separate pages */}
      <SideMenuDrawer
        isOpen={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        onSelectTab={handleTabChange}
        onGoToCategoryLanding={() => handleTabChange('templates')}
        onOpenOrderDetails={() => handleTabChange('help')}
        onOpenWebsiteCredentials={() => handleTabChange('account')}
        onNavigateLegal={handleNavigateLegal}
      />

      {/* Cookie Consent Banner & Preferences Modal */}
      <CookieConsentBanner 
        onNavigateToCookies={() => handleNavigateLegal('cookies')} 
      />
    </div>
  );
}
