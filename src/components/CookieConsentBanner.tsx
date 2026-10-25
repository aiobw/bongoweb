import React, { useState, useEffect } from 'react';
import { Shield, Cookie, X, Check, SlidersHorizontal, ExternalLink } from 'lucide-react';

export interface CookiePreferences {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'bongoweb_cookie_consent';

export default function CookieConsentBanner({
  onNavigateToCookies
}: {
  onNavigateToCookies?: () => void;
}) {
  const [hasInteracted, setHasInteracted] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<{
    necessary: boolean;
    preferences: boolean;
    analytics: boolean;
  }>({
    necessary: true,
    preferences: true,
    analytics: false
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHasInteracted(true);
        const parsed: CookiePreferences = JSON.parse(stored);
        setPreferences({
          necessary: true,
          preferences: parsed.preferences ?? true,
          analytics: parsed.analytics ?? false
        });
      } else {
        setHasInteracted(false);
      }
    } catch (_) {
      setHasInteracted(false);
    }

    const handleOpenModal = () => {
      setModalOpen(true);
    };

    window.addEventListener('bongoweb_open_cookie_preferences', handleOpenModal);
    return () => {
      window.removeEventListener('bongoweb_open_cookie_preferences', handleOpenModal);
    };
  }, []);

  const saveConsent = (prefs: { necessary: boolean; preferences: boolean; analytics: boolean }) => {
    const payload: CookiePreferences = {
      ...prefs,
      necessary: true,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {}
    setPreferences(prefs);
    setHasInteracted(true);
    setModalOpen(false);
  };

  const handleAcceptAll = () => {
    saveConsent({ necessary: true, preferences: true, analytics: true });
  };

  const handleRejectNonEssential = () => {
    saveConsent({ necessary: true, preferences: false, analytics: false });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  return (
    <>
      {/* Bottom Sticky Consent Notice */}
      {!hasInteracted && (
        <div 
          role="region" 
          aria-label="Cookie consent banner"
          className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-[#EDE4F5] shadow-[0_-8px_30px_rgba(91,44,138,0.12)] text-[#1F1F2E] animate-fadeIn"
        >
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3 text-xs sm:text-sm">
              <div className="w-10 h-10 rounded-xl bg-[#F8F5FC] text-[#5B2C8A] border border-[#EDE4F5] flex items-center justify-center shrink-0">
                <Cookie className="w-5 h-5 stroke-[2.2]" />
              </div>
              <p className="leading-relaxed text-[#4A4A5A]">
                <strong className="text-[#1F1F2E] font-bold">Privacy & Cookies:</strong> We only use strictly necessary cookies to ensure secure order processing and essential platform functions. Optional analytics are disabled by default in accordance with India&apos;s DPDP Act, 2023 & global privacy laws.{' '}
                {onNavigateToCookies ? (
                  <button
                    type="button"
                    onClick={onNavigateToCookies}
                    className="underline text-[#5B2C8A] hover:text-[#4A1F6E] font-medium cursor-pointer"
                  >
                    Read Cookie Policy
                  </button>
                ) : (
                  <a href="/cookies" className="underline text-[#5B2C8A] hover:text-[#4A1F6E] font-medium">
                    Read Cookie Policy
                  </a>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#F8F5FC] hover:bg-[#EDE4F5] text-[#5B2C8A] border border-[#EDE4F5] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Customize</span>
              </button>

              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition-all cursor-pointer text-center"
              >
                Essential Only
              </button>

              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] text-white text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Configuration Modal */}
      {modalOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative text-[#1F1F2E] animate-slideUpModal max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Close cookie preferences"
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#F8F5FC] text-[#5B2C8A] border border-[#EDE4F5] flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h2 id="cookie-modal-title" className="text-base sm:text-lg font-bold text-[#1F1F2E]">
                Cookie & Privacy Preferences
              </h2>
            </div>
            <p className="text-xs text-[#6B7280] mb-4">
              Manage how cookies and local storage tokens are used on BongoWeb. You can update these settings at any time from our website footer.
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {/* 1. Necessary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    Strictly Necessary (Required)
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Always Active
                  </span>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  Required for core site features: maintaining shopping selection, processing secure payments, CSRF defense, and authenticating user account sessions.
                </p>
              </div>

              {/* 2. Preferences */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-900">Functional & Language</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.preferences}
                      onChange={(e) => setPreferences(prev => ({ ...prev, preferences: e.target.checked }))}
                      className="sr-only peer"
                      aria-label="Toggle Functional and Language cookies"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5B2C8A]"></div>
                  </label>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  Remember your chosen language (English or Bengali), view preferences, and navigational return paths so you don&apos;t have to reselect them.
                </p>
              </div>

              {/* 3. Analytics */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-900">Performance & Diagnostics</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                      className="sr-only peer"
                      aria-label="Toggle Performance and Diagnostics cookies"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5B2C8A]"></div>
                  </label>
                </div>
                <p className="text-[#6B7280] leading-relaxed">
                  Helps us detect broken links and diagnose crash events using strictly anonymized metrics. Never linked to your personal identity.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer text-center"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-5 py-2.5 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] text-white text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
