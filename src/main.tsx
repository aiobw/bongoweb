import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@descope/react-sdk';
import App from './App.tsx';
import './index.css';
import { initGlobalClickSound } from './utils/sound';
import { LanguageProvider } from './utils/LanguageContext';

initGlobalClickSound();

// Instant purge of legacy mock data so client devices start clean and superfast
try {
  const legacyMockCodes = ['#1042', '#2085', '#3091', '#4150', '#5218', '#6372', '#7481', '#8593', '1042', '2085', '3091', '4150', '5218', '6372', '7481', '8593'];
  const stored = localStorage.getItem('bongoweb_custom_websites') || localStorage.getItem('bongoweb_custom_catalog');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      const realOnly = parsed.filter((site: any) => {
        const c = String(site?.fourDigitCode || site?.id || '').replace('#', '').trim();
        return !legacyMockCodes.includes(c) && !site?.mockData;
      });
      localStorage.setItem('bongoweb_custom_catalog', JSON.stringify(realOnly));
      localStorage.setItem('bongoweb_custom_websites', JSON.stringify(realOnly));
    }
  }
} catch (_) {}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class SafeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[BongoWeb] Safe error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-[#F8F5FC] text-[#1F1F2E] flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-purple-100 max-w-md w-full">
            <div className="w-16 h-16 bg-[#F8F5FC] text-[#5B2C8A] border border-[#EDE4F5] rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-sm">
              BW
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">পেজটি সুরক্ষিতভাবে রিলোড করুন</h2>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              একটি সাময়িক রেন্ডারিং সমস্যা দেখা দিয়েছিল। নিচের বাটনে ক্লিক করে স্বাভাবিকভাবে ব্রাউজ করুন।
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = window.location.pathname.startsWith('/admin') ? '/admin' : '/';
                }}
                className="w-full py-3 bg-[#5B2C8A] hover:bg-[#4a2370] text-white text-xs font-bold rounded-xl transition shadow cursor-pointer"
              >
                {window.location.pathname.startsWith('/admin') ? 'অ্যাডমিন প্যানেলে ফিরুন' : 'হোমপেজে ফিরুন'}
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                পুনরায় লোড করুন (Reload)
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SafeErrorBoundary>
      <AuthProvider projectId="P3K6LwIDJRlYK19nBi2yewOjmo22">
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </AuthProvider>
    </SafeErrorBoundary>
  </StrictMode>,
);
