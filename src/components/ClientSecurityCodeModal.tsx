import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, X, Clock, AlertCircle, LogIn } from 'lucide-react';
import { UserAccount } from '../types';
import { getClientSecurityCode, getSecurityCodeRemainingSeconds, formatRemainingTime } from '../utils/securityCode';

interface ClientSecurityCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToLogin?: () => void;
}

export default function ClientSecurityCodeModal({
  isOpen,
  onClose,
  onGoToLogin
}: ClientSecurityCodeModalProps) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [copied, setCopied] = useState(false);
  const [codeRemainingSec, setCodeRemainingSec] = useState<number>(getSecurityCodeRemainingSeconds());

  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem('bongoweb_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser(null);
      }
    } catch (_) {
      setCurrentUser(null);
    }
  }, [isOpen]);

  // Security code timer countdown
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCodeRemainingSec(getSecurityCodeRemainingSeconds());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCode = currentUser
    ? getClientSecurityCode(currentUser.phone || currentUser.email)
    : '';

  const handleCopy = () => {
    if (!currentCode) return;
    try {
      navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-[#0e0e12] text-[#f5f5f7] rounded-2xl p-6 sm:p-7 shadow-dark-card border border-white/[0.08] relative space-y-4 animate-slideUpModal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#a1a1b0] hover:text-[#f5f5f7] rounded-full hover:bg-white/[0.06] transition-colors cursor-pointer"
          aria-label="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        {!currentUser ? (
          <div className="text-center space-y-4 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-2xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[#f5f5f7]">
              সিকিউরিটি কোড যাচাইকরণ
            </h3>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-300 leading-relaxed">
              “কোড পেতে আগে Account-এ লগইন বা সাইন আপ করুন। তারপর আমরা আপনার সমস্যা সমাধান করব।”
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onGoToLogin) onGoToLogin();
                }}
                className="flex-1 py-2.5 rounded-full bg-[#3b5bff] hover:bg-[#324ecc] text-white text-xs font-medium transition-all shadow-md shadow-[#3b5bff]/25 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Account-এ যান</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full bg-white/[0.04] text-[#a1a1b0] hover:text-[#f5f5f7] text-xs font-medium cursor-pointer border border-white/[0.08]"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/[0.05] text-[#3b5bff] border border-white/[0.08] flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <span className="text-[10px] font-medium text-[#3b5bff] uppercase tracking-wider block">
                  ভেরিফিকেশন সুরক্ষা কোড
                </span>
                <h3 className="text-base font-semibold text-[#f5f5f7]">
                  Your Security Code
                </h3>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center space-y-2">
              <span className="text-xs text-[#a1a1b0] font-normal block">
                আপনার বর্তমান ৫-মিনিটের সক্রিয় সিকিউরিটি কোড:
              </span>
              <div className="text-3xl sm:text-4xl font-bold font-mono tracking-[0.25em] text-[#3b5bff] select-all py-1">
                {currentCode}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#71717a] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  মেয়াদ বাকি: <strong className="text-[#f5f5f7] font-mono">{formatRemainingTime(codeRemainingSec)}</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className={`w-full py-3 rounded-full font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#3b5bff] hover:bg-[#324ecc] text-white shadow-[#3b5bff]/25'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Security Code কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Security Code (কোড কপি করুন)</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-[#71717a] text-center leading-relaxed">
              * এই কোডটি প্রতি ৫ মিনিটে পরিবর্তিত হয়। চ্যাটে অ্যাডমিনকে এই কোডটি জানিয়ে দিন যাতে নিশ্চিত হওয়া যায় আপনি এই অ্যাকাউন্টের প্রকৃত মালিক।
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
