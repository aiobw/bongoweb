import React, { useEffect } from 'react';
import { Home, LayoutGrid, MessageCircle, ArrowLeft, Search, Compass } from 'lucide-react';
import { updatePageSEO } from '../utils/seo';
import BongoWebLogo from './BongoWebLogo';

interface NotFoundViewProps {
  onGoHome: () => void;
  onGoTemplates: () => void;
  onGoSupport: () => void;
}

export default function NotFoundView({
  onGoHome,
  onGoTemplates,
  onGoSupport
}: NotFoundViewProps) {
  useEffect(() => {
    updatePageSEO({
      title: '404 — Page Not Found',
      description: 'The page you are looking for does not exist or has been moved. Explore our website templates or return to BongoWeb home.',
      canonicalPath: '/404'
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 bg-[#F8F5FC] text-[#1F1F2E] font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#EDE4F5] shadow-sm p-6 sm:p-8 text-center animate-fadeIn">
        
        {/* Clickable Logo */}
        <div 
          onClick={onGoHome}
          className="inline-flex items-center justify-center cursor-pointer mb-6 group active:scale-95 transition-transform"
          title="Return to BongoWeb Home"
        >
          <BongoWebLogo size="lg" />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-[#F8F5FC] text-[#5B2C8A] border border-[#EDE4F5] flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8 stroke-[2.2] animate-spin-slow" />
        </div>

        <span className="px-3 py-1 rounded-full bg-purple-100 text-[#5B2C8A] text-xs font-mono font-bold tracking-wider inline-block mb-2">
          ERROR 404
        </span>

        <h1 className="text-xl sm:text-2xl font-black text-[#1F1F2E] tracking-tight">
          Page Not Found / পৃষ্ঠাটি পাওয়া যায়নি
        </h1>

        <p className="text-xs sm:text-sm text-[#6B7280] mt-2 mb-6 leading-relaxed">
          The link you followed may be broken, or the page may have been moved. You can browse all ready templates or return to the main dashboard.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onGoHome}
            className="w-full py-3 px-4 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home (হোমপেজে যান)</span>
          </button>

          <button
            type="button"
            onClick={onGoTemplates}
            className="w-full py-3 px-4 rounded-xl bg-[#F8F5FC] hover:bg-[#EDE4F5] active:scale-[0.99] text-[#5B2C8A] border border-[#EDE4F5] text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Browse Templates (টেমপ্লেট ক্যাটালগ)</span>
          </button>

          <button
            type="button"
            onClick={onGoSupport}
            className="w-full py-2.5 px-4 rounded-xl text-[#6B7280] hover:text-[#1F1F2E] hover:bg-slate-50 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Need Help? Contact 24/7 Live Support</span>
          </button>
        </div>

      </div>
    </div>
  );
}
