import React, { useState, useEffect } from 'react';
import { 
  X, Key, Copy, Check, ExternalLink, ShieldCheck, 
  Lock, Eye, EyeOff, Globe, Sparkles 
} from 'lucide-react';
import { UserAccount, WebsiteDeliveryCredentials } from '../types';
import { apiGetCredentials, normalizePhone } from '../utils/api';

interface WebsiteCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToDashboard?: () => void;
}

export default function WebsiteCredentialsModal({
  isOpen,
  onClose,
  onGoToDashboard
}: WebsiteCredentialsModalProps) {
  const [credentials, setCredentials] = useState<WebsiteDeliveryCredentials[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!isOpen) return;

    let user: UserAccount | null = null;
    try {
      const stored = localStorage.getItem('bongoweb_user');
      if (stored) {
        user = JSON.parse(stored);
        setCurrentUser(user);
      }
    } catch (_) {}

    const loadCreds = async () => {
      setLoading(true);
      try {
        const allCreds = await apiGetCredentials();
        if (user && user.phone) {
          const norm = normalizePhone(user.phone);
          const userCreds = allCreds.filter(c => normalizePhone(c.customerPhone || '') === norm);
          setCredentials(userCreds);
        } else {
          setCredentials(allCreds.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load credentials:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCreds();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (_) {}
  };

  const togglePassword = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-purple-100 relative space-y-5 animate-slideUpModal max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#5B2C8A] flex items-center justify-center shadow-xs">
              <Key className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Website Credentials
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                লাইভ ওয়েবসাইট ও অ্যাডমিন অ্যাক্সেস
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-medium animate-pulse">
            ক্রেডেনশিয়াল লোড হচ্ছে...
          </div>
        ) : credentials.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xs mx-auto">
              এখনো কোনো ওয়েবসাইটের ক্রেডেনশিয়াল ডেলিভারি হয়নি। অর্ডার ডেলিভারি সম্পন্ন হলে এখানে অ্যাক্সেস দেখতে পাবেন।
            </p>
            {onGoToDashboard && (
              <button
                type="button"
                onClick={onGoToDashboard}
                className="px-4 py-2 rounded-xl bg-[#5B2C8A] text-white text-xs font-bold cursor-pointer hover:bg-[#4A1F6E] transition-all"
              >
                ড্যাশবোর্ডে যান
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {credentials.map((cred, idx) => (
              <div 
                key={cred.id || idx}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5B2C8A]">
                    {cred.websiteTitle || 'Delivered Website'}
                  </span>
                  <a
                    href={cred.liveUrl?.startsWith('http') ? cred.liveUrl : `https://${cred.liveUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                  >
                    <span>ভিজিট সাইট</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* Admin URL */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Admin URL:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-[11px] truncate max-w-[160px]">
                        {cred.adminUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(cred.adminUrl || '', `admin-url-${idx}`)}
                        className="p-1 hover:text-[#5B2C8A] cursor-pointer"
                        title="Copy"
                      >
                        {copiedKey === `admin-url-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Username:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-[11px]">
                        {cred.adminUsername}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(cred.adminUsername || '', `admin-user-${idx}`)}
                        className="p-1 hover:text-[#5B2C8A] cursor-pointer"
                        title="Copy"
                      >
                        {copiedKey === `admin-user-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Password:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-[11px]">
                        {showPassword[cred.id || idx] ? (cred.adminPassword || '••••••••') : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePassword(cred.id || String(idx))}
                        className="p-1 hover:text-[#5B2C8A] cursor-pointer"
                        title="Toggle visibility"
                      >
                        {showPassword[cred.id || idx] ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(cred.adminPassword || '', `admin-pass-${idx}`)}
                        className="p-1 hover:text-[#5B2C8A] cursor-pointer"
                        title="Copy"
                      >
                        {copiedKey === `admin-pass-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
