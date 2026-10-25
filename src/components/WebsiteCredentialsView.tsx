import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Key, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Copy, 
  Check, 
  Calendar, 
  User, 
  ShoppingBag, 
  ShieldCheck, 
  X,
  Lock,
  Globe,
  Sparkles,
  Loader2,
  XCircle
} from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import { ClientOrder, WebsiteDeliveryCredentials, UserAccount } from '../types';
import { 
  apiGetOrders, 
  apiGetCredentials, 
  subscribeToOrders, 
  subscribeToDeliveredCredentials, 
  normalizePhone 
} from '../utils/api';
import { formatDisplayPrice } from './CategoryWebsitesView';

interface WebsiteCredentialsViewProps {
  onGoToDashboard?: () => void;
  onOpenLiveChat?: () => void;
}

export default function WebsiteCredentialsView({ 
  onGoToDashboard, 
  onOpenLiveChat 
}: WebsiteCredentialsViewProps) {
  const { language, t } = useLanguage();

  const [allOrders, setAllOrders] = useState<ClientOrder[]>(() => {
    try {
      const stored = localStorage.getItem('bongoweb_orders') || localStorage.getItem('bongoweb_placed_orders');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [];
  });

  const [allCredentials, setAllCredentials] = useState<WebsiteDeliveryCredentials[]>(() => {
    try {
      const stored = localStorage.getItem('bongoweb_delivered_credentials');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [];
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem('bongoweb_user');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return null;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCredItem, setSelectedCredItem] = useState<{
    order?: ClientOrder;
    cred?: WebsiteDeliveryCredentials;
    websiteTitle: string;
    websiteCode: string;
    orderId: string;
    hasCredentials?: boolean;
  } | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Sync user from local storage
  useEffect(() => {
    const handleUserUpdate = () => {
      try {
        const stored = localStorage.getItem('bongoweb_user');
        setCurrentUser(stored ? JSON.parse(stored) : null);
      } catch (_) {}
    };
    window.addEventListener('storage', handleUserUpdate);
    window.addEventListener('bongoweb_user_updated', handleUserUpdate);
    return () => {
      window.removeEventListener('storage', handleUserUpdate);
      window.removeEventListener('bongoweb_user_updated', handleUserUpdate);
    };
  }, []);

  // Fetch initial orders & credentials
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [ordersList, credsList] = await Promise.all([
        apiGetOrders(),
        apiGetCredentials()
      ]);
      if (Array.isArray(ordersList)) setAllOrders(ordersList);
      if (Array.isArray(credsList)) setAllCredentials(credsList);
    } catch (err) {
      console.warn('Credentials fetch error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Real-time Firestore subscriptions for live updates when admin edits/delivers
  useEffect(() => {
    loadData();

    const unsubOrders = subscribeToOrders((orders) => {
      if (Array.isArray(orders)) setAllOrders(orders);
    });

    const unsubCreds = subscribeToDeliveredCredentials((creds) => {
      if (Array.isArray(creds)) setAllCredentials(creds);
    });

    const handleUpdated = () => {
      loadData();
    };

    window.addEventListener('bongoweb_orders_updated', handleUpdated);
    window.addEventListener('bongoweb_credentials_updated', handleUpdated);

    return () => {
      unsubOrders();
      unsubCreds();
      window.removeEventListener('bongoweb_orders_updated', handleUpdated);
      window.removeEventListener('bongoweb_credentials_updated', handleUpdated);
    };
  }, [loadData]);

  // Merge and pair orders with their delivered credentials
  const credentialCards = useMemo(() => {
    const userPhoneClean = currentUser?.phone ? normalizePhone(currentUser.phone).slice(-10) : '';
    const userEmailClean = currentUser?.email ? currentUser.email.trim().toLowerCase() : '';

    // First, list from orders
    const pairedItems: Array<{
      order?: ClientOrder;
      cred?: WebsiteDeliveryCredentials;
      websiteTitle: string;
      websiteCode: string;
      orderId: string;
      customerName: string;
      phone: string;
      email: string;
      orderDate: string;
      priceTag: string;
      status: string;
      hasCredentials: boolean;
    }> = [];

    const matchedCredIds = new Set<string>();

    allOrders.forEach((ord, idx) => {
      if (!ord) return;
      const oId = String(ord.orderId || (ord as any).id || `#BW-${1000 + idx}`);
      const oPhoneClean = ord.phone || ord.customerPhone ? normalizePhone(ord.phone || ord.customerPhone || '').slice(-10) : '';
      const oEmailClean = (ord.email || ord.customerEmail || '').trim().toLowerCase();
      const oCode = String(ord.demoCode || ord.websiteCode || '#BW-ONLINE');

      // Match credentials by orderId or client phone/code
      let matchedCred = allCredentials.find((c) => {
        if (!c) return false;
        if (c.orderId && oId && (c.orderId === oId || (c as any).id === oId)) return true;
        const cPhoneClean = c.userPhone ? normalizePhone(c.userPhone).slice(-10) : '';
        if (oPhoneClean && cPhoneClean && oPhoneClean === cPhoneClean) {
          if (!c.websiteCode || !oCode || c.websiteCode === oCode) return true;
        }
        return false;
      });

      // Also check if order itself carries delivered credentials from admin
      if (!matchedCred && (ord.deliveredAdminId || ord.hasDeliveredCredentials)) {
        matchedCred = {
          id: `ord_embed_${oId}`,
          orderId: oId,
          userPhone: ord.phone || '',
          userEmail: ord.email || '',
          websiteTitle: ord.companyName || ord.demoTitle || 'Custom Website',
          websiteCode: oCode,
          websiteAdminId: ord.deliveredAdminId || 'admin',
          websiteAdminPass: ord.deliveredAdminPass || 'pass1234',
          deliveredAt: ord.deliveredAt || new Date().toLocaleString('bn-BD')
        };
      }

      if (matchedCred && matchedCred.id) {
        matchedCredIds.add(matchedCred.id);
      }

      pairedItems.push({
        order: ord,
        cred: matchedCred,
        websiteTitle: ord.companyName || ord.demoTitle || ord.websiteTitle || (matchedCred?.websiteTitle) || 'ব্যবসা ও ই-কমার্স ওয়েবসাইট',
        websiteCode: oCode,
        orderId: oId,
        customerName: ord.clientName || ord.customerName || 'সম্মানিত গ্রাহক',
        phone: ord.phone || ord.customerPhone || '',
        email: ord.email || ord.customerEmail || '',
        orderDate: ord.orderDate || (ord.createdAt ? String(ord.createdAt) : new Date().toLocaleDateString('bn-BD')),
        priceTag: ord.totalAmount || (ord.makingCharge ? `৳${ord.makingCharge}` : '৳১,৯৯০'),
        status: String(ord.status || 'pending').toLowerCase(),
        hasCredentials: !!matchedCred && !!matchedCred.websiteAdminId
      });
    });

    // Also include any standalone credentials delivered directly without an explicit order card
    allCredentials.forEach((c) => {
      if (c && c.id && !matchedCredIds.has(c.id)) {
        pairedItems.push({
          order: undefined,
          cred: c,
          websiteTitle: c.websiteTitle || 'ব্যবসা ও ই-কমার্স ওয়েবসাইট',
          websiteCode: c.websiteCode || '#BW-ONLINE',
          orderId: c.orderId || `#BW-${c.id.slice(-5)}`,
          customerName: 'সম্মানিত গ্রাহক',
          phone: c.userPhone || '',
          email: c.userEmail || '',
          orderDate: String(c.deliveredAt || new Date().toLocaleDateString('bn-BD')),
          priceTag: '৳১,৯৯০',
          status: 'completed',
          hasCredentials: !!c.websiteAdminId
        });
      }
    });

    // Filter by user authentication and search
    return pairedItems.filter((item) => {
      const itemPhoneClean = item.phone ? normalizePhone(item.phone).slice(-10) : '';
      const itemEmailClean = item.email.trim().toLowerCase();

      const isUserItem = 
        (userPhoneClean && itemPhoneClean && itemPhoneClean === userPhoneClean) ||
        (userEmailClean && itemEmailClean && itemEmailClean === userEmailClean);

      const q = searchQuery.trim().toLowerCase();
      let matchesSearch = true;
      if (q) {
        matchesSearch = 
          item.orderId.toLowerCase().includes(q) ||
          item.websiteCode.toLowerCase().includes(q) ||
          item.websiteTitle.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.phone.includes(q);
      }

      if (q) return matchesSearch;
      if (currentUser) return isUserItem;
      return true;
    });
  }, [allOrders, allCredentials, currentUser, searchQuery]);

  // Direct cards list
  const filteredCards = credentialCards;

  // Copy helper
  const handleCopy = (text: string, fieldId: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (_) {}
  };

  // Status badge helper: loading motion for processing, green tick for complete, red X for reject, yellow for in review
  const renderStatusBadge = (status: string, hasCredentials?: boolean) => {
    const s = String(status || '').toLowerCase();

    // 1. Complete (Green tick)
    if (hasCredentials || s === 'completed' || s === 'delivered') {
      return (
        <span 
          title={language === 'bn' ? 'অর্ডার সম্পন্ন ও ডেলিভারড' : 'Order Completed & Delivered'}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-xs font-bold shadow-2xs transition-all hover:bg-emerald-100/70"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.4] shrink-0" />
          <span>{hasCredentials ? (language === 'bn' ? 'আইডি-পাস রেডি' : 'ID & Pass Ready') : (language === 'bn' ? 'সম্পন্ন' : 'Completed')}</span>
        </span>
      );
    }

    // 2. Reject (Red X)
    if (s === 'cancelled' || s === 'rejected' || s === 'fake' || s === 'declined' || s === 'spam' || s === 'bin') {
      return (
        <span 
          title={language === 'bn' ? 'অর্ডার বাতিল বা রিজেক্টেড' : 'Order Cancelled or Rejected'}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/90 text-xs font-bold shadow-2xs transition-all hover:bg-rose-100/70"
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600 stroke-[2.4] shrink-0" />
          <span>{language === 'bn' ? 'অর্ডার বাতিল' : 'Rejected'}</span>
        </span>
      );
    }

    // 3. Processing (Loading motion spinner)
    if (s === 'processing' || s === 'in_progress' || s === 'verified') {
      return (
        <span 
          title={language === 'bn' ? 'ওয়েবসাইট তৈরি ও প্রসেসিং চলছে' : 'Processing & Development in progress'}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/90 text-xs font-bold shadow-2xs transition-all hover:bg-blue-100/70"
        >
          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
          <span>{language === 'bn' ? 'প্রসেসিং চলছে' : 'In Process'}</span>
        </span>
      );
    }

    // 4. In Review (Yellow / Amber something with pulse)
    return (
      <span 
        title={language === 'bn' ? 'অর্ডার তথ্য ও পেমেন্ট রিভিউ হচ্ছে' : 'Under Review & Verification'}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90 text-xs font-bold shadow-2xs transition-all hover:bg-amber-100/70"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>{language === 'bn' ? 'রিভিউ হচ্ছে' : 'In Review'}</span>
      </span>
    );
  };

  return (
    <div 
      id="website-credentials-page-view" 
      data-view="credentials"
      className="w-full min-h-[calc(100vh-4rem)] bg-[#F8F5FC] text-[#1F1F2E] font-sans pb-24 md:pb-16 select-none"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-5 sm:pt-7 space-y-5">
        
        {/* Search & Lookup Bar (Exact same design as order details) */}
        <div className="bg-white rounded-2xl border border-[#EDE4F5] p-3 sm:p-4 shadow-2xs flex items-center gap-2.5">
          <div className="relative flex-1 flex items-center bg-[#F8F5FC] border border-[#EDE4F5] rounded-xl px-3.5 py-2.5 focus-within:border-[#5B2C8A] focus-within:ring-2 focus-within:ring-[#5B2C8A]/10 transition-all">
            <Search className="w-4 h-4 text-[#6B7280] shrink-0 mr-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' 
                ? 'ওয়েবসাইট কোড বা মোবাইল দিয়ে আইডি-পাস খুঁজুন (যেমন #BW-84192 বা 017...)...' 
                : 'Search ID & Password by Website Code or phone...'}
              className="w-full bg-transparent text-xs sm:text-sm text-[#1F1F2E] placeholder-[#9CA3AF] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-[#6B7280] hover:text-[#5B2C8A] px-2 py-0.5 rounded cursor-pointer"
              >
                {language === 'bn' ? 'মুছুন' : 'Clear'}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={loadData}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 rounded-xl bg-[#F8F5FC] hover:bg-[#EDE4F5] text-[#5B2C8A] border border-[#EDE4F5] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs shrink-0"
            title={language === 'bn' ? 'ডাটা রিফ্রেশ করুন' : 'Refresh Credentials'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? (language === 'bn' ? 'আপডেট...' : 'Syncing...') : (language === 'bn' ? 'রিফ্রেশ' : 'Refresh')}</span>
          </button>
        </div>



        {/* WEBSITE LIST (Exact same design list with "View ID Pass" button) */}
        <div className="space-y-3.5">
          {filteredCards.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#EDE4F5] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#5B2C8A] border border-[#EDE4F5] flex items-center justify-center mx-auto mb-4">
                <Key className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#1F1F2E]">
                {language === 'bn' ? 'কোনো ওয়েবসাইট আইডি পাওয়া যায়নি' : 'No Website Credentials Found'}
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1 mb-6 leading-relaxed">
                {searchQuery
                  ? (language === 'bn' ? 'সার্চের সাথে কোনো ওয়েবসাইট বা আইডি মেলেনি।' : 'No credentials matched your search query.')
                  : (language === 'bn' ? 'অ্যাডমিন প্যানেল থেকে আইডি ও পাসওয়ার্ড ডেলিভারি করা হলে সরাসরি এখানে পেয়ে যাবেন।' : 'Once admin delivers credentials, they will automatically appear here.')}
              </p>
              {onGoToDashboard && (
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="px-6 py-2.5 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {language === 'bn' ? 'হোমে ফিরে যান' : 'Back to Home'}
                </button>
              )}
            </div>
          ) : (
            filteredCards.map((item, idx) => {
              const formattedPrice = formatDisplayPrice(item.priceTag, language);

              return (
                <div
                  key={`${item.orderId}-${idx}`}
                  className="bg-white rounded-2xl border border-[#EDE4F5] p-4 sm:p-5 shadow-[0_3px_14px_rgba(91,44,138,0.04)] hover:shadow-[0_8px_24px_rgba(91,44,138,0.08)] hover:border-[#5B2C8A]/30 transition-all flex flex-col gap-3.5"
                >
                  {/* Top Row: Order ID & Website Code on Left, Status Badge on Top Right */}
                  <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[#5B2C8A]/10 text-[#5B2C8A] border border-[#5B2C8A]/20">
                        {item.orderId}
                      </span>
                      {item.websiteCode && (
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          {item.websiteCode}
                        </span>
                      )}
                    </div>

                    {/* TOP RIGHT STATUS BADGE */}
                    <div className="shrink-0">
                      {renderStatusBadge(item.status, item.hasCredentials)}
                    </div>
                  </div>

                  {/* Main Card Body */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left Column: Order Name, Date & Time */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-[#1F1F2E] truncate">
                        {item.websiteTitle}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-[#6B7280] font-medium flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.orderDate}</span>
                        </span>
                        {item.customerName && (
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.customerName}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle & Right: Pricing & "View ID Pass" Button */}
                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-[#6B7280] font-bold block uppercase leading-tight">
                          {language === 'bn' ? 'প্যাকেজ মূল্য' : 'Total Price'}
                        </span>
                        <span className="text-base sm:text-lg font-black text-[#5B2C8A] leading-tight block">
                          {formattedPrice}
                        </span>
                      </div>

                      {/* Prominent "View ID Pass" Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowPassword(false);
                          setSelectedCredItem(item);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:bg-[#3C165C] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                      >
                        <Key className="w-4 h-4 text-purple-200" />
                        <span>{language === 'bn' ? 'আইডি-পাস দেখুন' : 'View ID Pass'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* VIEW ID & PASSWORD MODAL */}
      {selectedCredItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-none">
          <div 
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] animate-scaleUp text-[#1F1F2E]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#4A1A78] via-[#5B2C8A] to-[#451571] text-white p-5 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
                  <Key className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/20 text-white">
                      {selectedCredItem.orderId}
                    </span>
                    <span className="font-mono text-xs text-purple-200">
                      {selectedCredItem.websiteCode}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-xs mt-0.5">
                    {selectedCredItem.websiteTitle}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCredItem(null)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              
              {selectedCredItem.hasCredentials && selectedCredItem.cred ? (
                /* DELIVERED CREDENTIALS CARD */
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        {language === 'bn' ? 'অ্যাডমিন প্যানেল প্রদত্ত আইডি ও পাসওয়ার্ড' : 'Delivered Admin Credentials'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {language === 'bn' ? 'ভেরিফাইড ও সক্রিয়' : 'Verified & Active'}
                    </span>
                  </div>

                  {/* Username / ID Box */}
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Admin Login ID / Username
                      </span>
                      <span className="font-mono text-sm sm:text-base font-black text-slate-900 block truncate select-text mt-0.5">
                        {selectedCredItem.cred.websiteAdminId}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleCopy(selectedCredItem.cred?.websiteAdminId || '', 'user')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                        copiedField === 'user' 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {copiedField === 'user' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'user' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>

                  {/* Password Box */}
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Admin Login Password
                      </span>
                      <span className="font-mono text-sm sm:text-base font-black text-slate-900 block truncate select-text mt-0.5">
                        {showPassword ? selectedCredItem.cred.websiteAdminPass : '••••••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleCopy(selectedCredItem.cred?.websiteAdminPass || '', 'pass')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          copiedField === 'pass' 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {copiedField === 'pass' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'pass' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Website Link */}
                  {selectedCredItem.cred.liveUrl && (
                    <a
                      href={selectedCredItem.cred.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98"
                    >
                      <Globe className="w-4 h-4" />
                      <span>{language === 'bn' ? 'লাইভ ওয়েবসাইট ভিজিট করুন' : 'Open Live Website'}</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                    </a>
                  )}

                  {/* Delivery Note */}
                  {selectedCredItem.cred.notes && (
                    <div className="p-3 rounded-xl bg-white/80 border border-emerald-100 text-xs text-slate-600 leading-relaxed">
                      <span className="font-bold text-emerald-800 block mb-0.5">অ্যাডমিন মেসেজ:</span>
                      {selectedCredItem.cred.notes}
                    </div>
                  )}

                </div>
              ) : (
                /* CREDENTIALS PENDING CARD */
                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-amber-950">
                    {language === 'bn' ? 'আইডি ও পাসওয়ার্ড প্রসেসিং চলছে' : 'Credentials Processing'}
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed max-w-sm mx-auto">
                    {language === 'bn' 
                      ? 'আমাদের সফটওয়্যার ইঞ্জিনিয়ারিং টিম ওয়েবসাইটটি সেটআপ করছেন। অ্যাডমিন প্যানেল থেকে আইডি ও পাসওয়ার্ড ডেলিভারি দেওয়া মাত্রই স্বয়ংক্রিয়ভাবে এখানে দৃশ্যমান হবে।' 
                      : 'Our engineering team is actively setting up your website. Your admin credentials will appear here as soon as delivered.'}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-200 text-amber-800 text-[11px] font-bold">
                    <span>সাধারণত ২৪ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়</span>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedCredItem(null)}
                className="w-full py-2.5 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
