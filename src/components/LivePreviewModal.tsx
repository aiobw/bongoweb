import React, { useState } from 'react';
import { 
  X, Laptop, Smartphone, ExternalLink, ArrowRight, 
  ShoppingBag, CheckCircle2, Star, ShieldCheck, RefreshCw 
} from 'lucide-react';
import { WebsiteDemo } from '../types';

interface LivePreviewModalProps {
  demo: WebsiteDemo | null;
  onClose: () => void;
  onOrderThis: (demo: WebsiteDemo) => void;
}

export default function LivePreviewModal({
  demo,
  onClose,
  onOrderThis
}: LivePreviewModalProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [addedItem, setAddedItem] = useState<string | null>(null);

  if (!demo) return null;

  const handleTestAddToCart = (itemName: string) => {
    setAddedItem(itemName);
    setTimeout(() => setAddedItem(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-6xl h-[92vh] bg-[#0e0e12] text-[#f5f5f7] rounded-2xl border border-white/[0.08] shadow-dark-card flex flex-col overflow-hidden animate-slideUpModal">
        {/* Top Control Bar */}
        <div className="p-3 sm:p-4 bg-[#14141a]/80 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          {/* Left Title & 4-Digit Code */}
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-white/[0.05] text-[#3b5bff] border border-white/[0.08] text-xs font-mono font-medium">
              {demo.fourDigitCode}
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[#f5f5f7] line-clamp-1">
                {demo.title}
              </h3>
              <p className="text-[11px] text-[#a1a1b0] font-mono">
                https://{demo.demoUrl}
              </p>
            </div>
          </div>

          {/* Center Device Switcher */}
          <div className="hidden sm:flex items-center bg-white/[0.04] p-1 rounded-full border border-white/[0.08]">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                deviceMode === 'desktop'
                  ? 'bg-[#3b5bff] text-white shadow-xs'
                  : 'text-[#a1a1b0] hover:text-[#f5f5f7]'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                deviceMode === 'mobile'
                  ? 'bg-[#3b5bff] text-white shadow-xs'
                  : 'text-[#a1a1b0] hover:text-[#f5f5f7]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          {/* Right Action & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOrderThis(demo)}
              className="px-4 py-2 rounded-full bg-[#3b5bff] hover:bg-[#324ecc] active:scale-95 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-md shadow-[#3b5bff]/25 cursor-pointer"
            >
              <span>এই সাইটটি অর্ডার করুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#a1a1b0] hover:text-[#f5f5f7] hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Simulator Body */}
        <div className="flex-1 bg-[#09090b] p-2 sm:p-4 overflow-y-auto flex items-center justify-center">
          <div
            className={`transition-all duration-300 bg-[#0e0e12] rounded-2xl border border-white/[0.08] shadow-dark-card overflow-y-auto max-h-full ${
              deviceMode === 'mobile'
                ? 'w-[360px] h-[640px] rounded-3xl border-4 border-white/[0.1] shadow-2xl'
                : 'w-full h-full'
            }`}
          >
            {/* Simulated Website Hero */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
              <img
                src={demo.previewImage}
                alt={demo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-[#0e0e12]/60 to-transparent p-6 sm:p-8 flex flex-col justify-end text-white">
                <span className="px-3 py-1 rounded-full bg-white/[0.1] backdrop-blur-md border border-white/[0.15] text-[#f5f5f7] text-xs font-medium w-fit mb-2">
                  {demo.categoryLabel} • Verified Template
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold leading-tight text-[#f5f5f7] mb-2">
                  {demo.heroHeadline}
                </h2>
                <p className="text-xs sm:text-sm text-[#a1a1b0] max-w-xl font-normal">
                  {demo.mockData?.heroSub || demo.description}
                </p>
              </div>
            </div>

            {/* Simulated Live Product Catalog */}
            <div className="p-4 sm:p-6 bg-[#0e0e12]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-[#f5f5f7]">
                    Featured Items & Interactive Demo
                  </h4>
                  <p className="text-xs text-[#a1a1b0]">
                    Click any item to test live customer cart action
                  </p>
                </div>
                {addedItem && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20 animate-fadeIn">
                    ✓ Added to Cart!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {demo.mockData?.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-[#3b5bff]/40 transition-all flex flex-col justify-between"
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3 bg-white/[0.02]">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#f5f5f7] line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs font-mono font-medium text-[#3b5bff] mt-1">
                        {item.price}
                      </p>
                    </div>
                    <button
                      onClick={() => handleTestAddToCart(item.name)}
                      className="mt-3 w-full py-1.5 px-3 rounded-full bg-white/[0.05] hover:bg-[#3b5bff] text-[#f5f5f7] hover:text-white text-xs font-medium transition-all cursor-pointer border border-white/[0.08]"
                    >
                      Add to Order
                    </button>
                  </div>
                ))}
              </div>

              {/* Bottom Reassurance in Simulator */}
              <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <h5 className="text-xs font-medium text-[#f5f5f7]">
                    পছন্দ হয়েছে? এই ডিজাইনটি দিয়ে আজই আপনার ওয়েবসাইট চালু করুন
                  </h5>
                  <p className="text-[11px] text-[#a1a1b0]">
                    ২৪ ঘণ্টার মধ্যে .com ডোমেইন এবং বিকাশ পেমেন্ট সহ লাইভ করে দেওয়া হবে।
                  </p>
                </div>
                <button
                  onClick={() => onOrderThis(demo)}
                  className="px-4 py-2 rounded-full bg-[#3b5bff] hover:bg-[#324ecc] text-white text-xs font-medium transition-all shadow-md shadow-[#3b5bff]/25 shrink-0 cursor-pointer"
                >
                  কনফার্ম করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
