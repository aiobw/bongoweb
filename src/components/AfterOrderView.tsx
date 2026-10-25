import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Eye, 
  ShieldCheck, 
  Phone, 
  MessageCircle, 
  ExternalLink, 
  Key, 
  ShoppingBag, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  X, 
  Sparkles,
  Layers,
  FileText,
  User,
  Check,
  Loader2,
  XCircle
} from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import { ClientOrder, WebsiteDeliveryCredentials, UserAccount } from '../types';
import { apiGetOrders, subscribeToOrders, normalizePhone, apiGetCredentials } from '../utils/api';
import { formatDisplayPrice } from './CategoryWebsitesView';

interface AfterOrderViewProps {
  onGoToDashboard?: () => void;
  onOpenLiveChat?: () => void;
}

export default function AfterOrderView({ onGoToDashboard, onOpenLiveChat }: AfterOrderViewProps) {
  const { language, t } = useLanguage();

  // Local & Firestore Orders State
  const [allOrders, setAllOrders] = useState<ClientOrder[]>(() => {
    try {
      const stored = localStorage.getItem('bongoweb_orders') || localStorage.getItem('bongoweb_placed_orders');
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

  const [allCredentials, setAllCredentials] = useState<WebsiteDeliveryCredentials[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'rejected'>('all');
  const [selectedOrderForView, setSelectedOrderForView] = useState<ClientOrder | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Sync current user on storage events
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
  const loadOrdersAndCreds = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [ordersList, credsList] = await Promise.all([
        apiGetOrders(),
        apiGetCredentials()
      ]);
      if (Array.isArray(ordersList)) {
        setAllOrders(ordersList);
      }
      if (Array.isArray(credsList)) {
        setAllCredentials(credsList);
      }
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrdersAndCreds();

    // Real-time Firestore subscription: updates automatically when admin changes order status!
    const unsub = subscribeToOrders((cloudOrders) => {
      if (Array.isArray(cloudOrders)) {
        setAllOrders(cloudOrders);
      }
    });

    const handleOrdersUpdated = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setAllOrders(e.detail);
      } else {
        loadOrdersAndCreds();
      }
    };

    window.addEventListener('bongoweb_orders_updated', handleOrdersUpdated);
    window.addEventListener('bongoweb_order_placed', handleOrdersUpdated);

    return () => {
      unsub();
      window.removeEventListener('bongoweb_orders_updated', handleOrdersUpdated);
      window.removeEventListener('bongoweb_order_placed', handleOrdersUpdated);
    };
  }, [loadOrdersAndCreds]);

  // Keep selected order in sync with real-time updates from admin panel
  useEffect(() => {
    if (!selectedOrderForView) return;
    const currentId = selectedOrderForView.orderId || (selectedOrderForView as any).id;
    const matched = allOrders.find(o => (o.orderId && o.orderId === currentId) || ((o as any).id && (o as any).id === currentId));
    if (matched) {
      setSelectedOrderForView(matched);
    }
  }, [allOrders, selectedOrderForView]);

  // Filter orders for the user
  const clientFilteredOrders = useMemo(() => {
    const userPhoneClean = currentUser?.phone ? normalizePhone(currentUser.phone).slice(-10) : '';
    const userEmailClean = currentUser?.email ? currentUser.email.trim().toLowerCase() : '';

    return allOrders.filter((order) => {
      if (!order) return false;
      const orderPhoneClean = order.phone || order.customerPhone ? normalizePhone(order.phone || order.customerPhone || '').slice(-10) : '';
      const orderEmailClean = (order.email || order.customerEmail || '').trim().toLowerCase();

      // If user is logged in, prioritize their orders; if not logged in or searching, allow search lookup
      const isUserOrder = 
        (userPhoneClean && orderPhoneClean && orderPhoneClean === userPhoneClean) ||
        (userEmailClean && orderEmailClean && orderEmailClean === userEmailClean);

      // Search query filter (Order ID, Phone, Customer Name, Website Title, Code)
      const q = searchQuery.trim().toLowerCase();
      let matchesSearch = true;
      if (q) {
        const orderIdStr = String(order.orderId || (order as any).id || '').toLowerCase();
        const demoCodeStr = String(order.demoCode || order.websiteCode || '').toLowerCase();
        const clientNameStr = String(order.clientName || order.customerName || '').toLowerCase();
        const websiteTitleStr = String(order.companyName || order.demoTitle || order.websiteTitle || '').toLowerCase();
        const phoneStr = String(order.phone || order.customerPhone || '');

        matchesSearch = 
          orderIdStr.includes(q) ||
          demoCodeStr.includes(q) ||
          clientNameStr.includes(q) ||
          websiteTitleStr.includes(q) ||
          phoneStr.includes(q);
      }

      // If search is active, show matching orders regardless of login
      if (q) return matchesSearch;

      // If user is logged in, show only their orders
      if (currentUser) {
        return isUserOrder;
      }

      // If guest with no search, show orders stored locally in this device's session
      return true;
    });
  }, [allOrders, currentUser, searchQuery]);

  // Apply Status Filter Tab (All / Pending / Processing / Completed / Rejected)
  const displayedOrders = useMemo(() => {
    return clientFilteredOrders.filter((order) => {
      if (statusFilter === 'all') return true;
      const s = String(order.status || '').toLowerCase();
      if (statusFilter === 'pending') {
        return s === 'pending' || !s;
      }
      if (statusFilter === 'processing') {
        return s === 'processing' || s === 'in_progress' || s === 'verified';
      }
      if (statusFilter === 'completed') {
        return s === 'completed' || s === 'delivered';
      }
      if (statusFilter === 'rejected') {
        return s === 'cancelled' || s === 'rejected' || s === 'fake' || s === 'declined' || s === 'spam' || s === 'bin';
      }
      return true;
    });
  }, [clientFilteredOrders, statusFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let rejected = 0;

    clientFilteredOrders.forEach((o) => {
      const s = String(o.status || '').toLowerCase();
      if (s === 'processing' || s === 'in_progress' || s === 'verified') {
        processing++;
      } else if (s === 'completed' || s === 'delivered') {
        completed++;
      } else if (s === 'cancelled' || s === 'rejected' || s === 'fake' || s === 'declined' || s === 'spam' || s === 'bin') {
        rejected++;
      } else {
        pending++;
      }
    });

    return {
      all: clientFilteredOrders.length,
      pending,
      processing,
      completed,
      rejected
    };
  }, [clientFilteredOrders]);

  // Find credentials for selected order
  const activeOrderCredentials = useMemo(() => {
    if (!selectedOrderForView) return null;
    const targetId = selectedOrderForView.orderId || (selectedOrderForView as any).id;
    const phoneDigits = selectedOrderForView.phone ? normalizePhone(selectedOrderForView.phone).slice(-10) : '';

    return allCredentials.find((c) => {
      if (targetId && c.orderId && (c.orderId === targetId || (c as any).id === targetId)) return true;
      if (phoneDigits && c.userPhone && normalizePhone(c.userPhone).slice(-10) === phoneDigits) return true;
      return false;
    }) || null;
  }, [selectedOrderForView, allCredentials]);

  // Copy helper
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Helper for status badge presentation: loading motion for processing, green tick for complete, red X for reject, yellow for in review
  const renderStatusBadge = (rawStatus: string | undefined) => {
    const s = String(rawStatus || 'pending').toLowerCase();

    // 1. Complete: Green tick
    if (s === 'completed' || s === 'delivered') {
      return (
        <span 
          title={language === 'bn' ? 'অর্ডার সম্পন্ন ও ডেলিভারড' : 'Order Completed & Delivered'}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-xs font-bold shadow-2xs transition-all hover:bg-emerald-100/70"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.4] shrink-0" />
          <span>{language === 'bn' ? 'সম্পন্ন হয়েছে' : 'Completed'}</span>
        </span>
      );
    }

    // 2. Reject: Red X
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

    // 3. Processing: Loading motion spinner
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

    // 4. In Review: Yellow something with pulsing amber dot
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
      id="after-order-page-view" 
      data-view="after-order"
      className="w-full min-h-[calc(100vh-4rem)] bg-[#F8F5FC] text-[#1F1F2E] font-sans pb-24 md:pb-16 select-none"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-5 sm:pt-7 space-y-5">
        

        {/* Search & Lookup Bar */}
        <div className="bg-white rounded-2xl border border-[#EDE4F5] p-3 sm:p-4 shadow-2xs flex items-center gap-2.5">
          <div className="relative flex-1 flex items-center bg-[#F8F5FC] border border-[#EDE4F5] rounded-xl px-3.5 py-2.5 focus-within:border-[#5B2C8A] focus-within:ring-2 focus-within:ring-[#5B2C8A]/10 transition-all">
            <Search className="w-4 h-4 text-[#6B7280] shrink-0 mr-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'bn' 
                ? 'অর্ডার নম্বর বা মোবাইল দিয়ে সার্চ করুন (যেমন #BW-84192 বা 017...)...' 
                : 'Search by Order ID or phone (e.g. #BW-84192 or 017...)...'}
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
            onClick={loadOrdersAndCreds}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 rounded-xl bg-[#F8F5FC] hover:bg-[#EDE4F5] text-[#5B2C8A] border border-[#EDE4F5] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs shrink-0"
            title={language === 'bn' ? 'অর্ডার রিফ্রেশ করুন' : 'Refresh Orders'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? (language === 'bn' ? 'আপডেট...' : 'Syncing...') : (language === 'bn' ? 'রিফ্রেশ' : 'Refresh')}</span>
          </button>
        </div>

        {/* Status Filter Chips: All, Pending, In Process, Complete */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-[#5B2C8A] text-white shadow-xs'
                : 'bg-white text-[#6B7280] hover:text-[#5B2C8A] border border-[#EDE4F5]'
            }`}
          >
            <span>{language === 'bn' ? 'সকল অর্ডার' : 'All Orders'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'পেন্ডিং' : 'Pending'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
              {counts.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('processing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'processing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200/80'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{language === 'bn' ? 'প্রসেসিং' : 'In Process'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'processing' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {counts.processing}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200/80'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'কমপ্লিট' : 'Complete'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              {counts.completed}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200/80'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'রিজেক্টেড / ফেক' : 'Rejected / Fake'}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === 'rejected' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'}`}>
              {counts.rejected}
            </span>
          </button>
        </div>

        {/* ORDER LIST (Solid list format as requested by user) */}
        <div className="space-y-3.5">
          {displayedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#EDE4F5] p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#5B2C8A] border border-[#EDE4F5] flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#1F1F2E]">
                {language === 'bn' ? 'কোনো অর্ডার পাওয়া যায়নি' : 'No Orders Found'}
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1 mb-6 leading-relaxed">
                {searchQuery
                  ? (language === 'bn' ? 'সার্চ কুয়েরির সাথে কোনো অর্ডার মেলেনি। অন্য নম্বর দিয়ে সার্চ করুন।' : 'No orders matched your search.')
                  : (language === 'bn' ? 'আপনি এখনো কোনো ওয়েবসাইট অর্ডার করেননি। পছন্দের টেমপ্লেট বেছে নিয়ে অর্ডার করুন।' : 'You have not placed any orders yet. Browse live templates to place an order.')}
              </p>
              {onGoToDashboard && (
                <button
                  type="button"
                  onClick={onGoToDashboard}
                  className="px-6 py-2.5 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  {language === 'bn' ? 'ওয়েবসাইট টেমপ্লেট দেখুন' : 'Explore Website Demos'}
                </button>
              )}
            </div>
          ) : (
            displayedOrders.map((order, idx) => {
              const orderId = order.orderId || (order as any).id || `#BW-${Math.floor(10000 + idx * 7)}`;
              const websiteName = order.companyName || order.demoTitle || order.websiteTitle || 'ব্যবসা ও ই-কমার্স ওয়েবসাইট';
              const websiteCode = order.demoCode || order.websiteCode || '#BW-ONLINE';
              const priceTag = order.totalAmount || (order.makingCharge ? `৳${order.makingCharge}` : '৳১,৯৯০');
              const formattedPrice = formatDisplayPrice(priceTag, language);
              const advanceAmount = order.advanceAmount ? `৳${order.advanceAmount}` : '৳২০০';
              const dueAmount = order.dueAmount ? `৳${order.dueAmount}` : '৳১,৭৯০';
              const orderDateStr = order.orderDate || (order.createdAt ? String(order.createdAt) : new Date().toLocaleDateString('bn-BD'));

              return (
                <div
                  key={orderId}
                  className="bg-white rounded-2xl border border-[#EDE4F5] p-4 sm:p-5 shadow-[0_3px_14px_rgba(91,44,138,0.04)] hover:shadow-[0_8px_24px_rgba(91,44,138,0.08)] hover:border-[#5B2C8A]/30 transition-all flex flex-col gap-3.5"
                >
                  {/* Top Row: Order ID & Website Code on Left, Status Badge on Top Right */}
                  <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[#5B2C8A]/10 text-[#5B2C8A] border border-[#5B2C8A]/20">
                        {orderId}
                      </span>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {websiteCode}
                      </span>
                    </div>

                    {/* TOP RIGHT STATUS BADGE */}
                    <div className="shrink-0">
                      {renderStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Main Card Body */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left Column: Order Name, Date & Time */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-[#1F1F2E] truncate">
                        {websiteName}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-[#6B7280] font-medium flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{orderDateStr}</span>
                        </span>
                        {order.clientName && (
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.clientName}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Pricing Breakdown & Right: "View Order" Button */}
                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-[#6B7280] font-bold block uppercase leading-tight">
                          {language === 'bn' ? 'প্যাকেজ মূল্য' : 'Total Price'}
                        </span>
                        <span className="text-base sm:text-lg font-black text-[#5B2C8A] leading-tight block">
                          {formattedPrice}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedOrderForView(order)}
                        className="px-4 py-2.5 rounded-xl bg-[#5B2C8A] hover:bg-[#4A1F6E] active:bg-[#3C165C] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{language === 'bn' ? 'অর্ডার দেখুন' : 'View Order'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* DETAILED VIEW ORDER MODAL (Directly shows live stage, credentials & status managed from Admin Panel) */}
      {selectedOrderForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-none">
          <div 
            className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] animate-scaleUp text-[#1F1F2E]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#4A1A78] via-[#5B2C8A] to-[#451571] text-white p-5 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
                  <FileText className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/20 text-white">
                      {selectedOrderForView.orderId || (selectedOrderForView as any).id}
                    </span>
                    <span className="font-mono text-xs text-purple-200">
                      {selectedOrderForView.demoCode || selectedOrderForView.websiteCode}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-xs mt-0.5">
                    {selectedOrderForView.companyName || selectedOrderForView.demoTitle || selectedOrderForView.websiteTitle || 'অর্ডার বিবরণ'}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderForView(null)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              
              {/* 1. Live Order Stage Card (Directly driven by Admin Panel) */}
              <div className="p-4 rounded-2xl bg-[#F8F5FC] border border-[#EDE4F5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    {language === 'bn' ? 'অ্যাডমিন লাইভ স্ট্যাটাস' : 'Admin Live Status'}
                  </span>
                  {renderStatusBadge(selectedOrderForView.status)}
                </div>

                {/* 3-Step Live Timeline: Pending -> In Process -> Complete (or Rejected) */}
                {(() => {
                  const s = String(selectedOrderForView.status || '').toLowerCase();
                  const isRejected = s === 'cancelled' || s === 'rejected' || s === 'fake' || s === 'declined' || s === 'spam' || s === 'bin';

                  if (isRejected) {
                    return (
                      <div className="space-y-3 pt-2 border-t border-[#EDE4F5]">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center space-y-1">
                            <div className="w-7 h-7 mx-auto rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold">
                              ১
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 block leading-tight">
                              {language === 'bn' ? '১. অর্ডার সাবমিট' : '1. Submitted'}
                            </span>
                            <span className="text-[9px] text-slate-500 block">
                              পেন্ডিং যাচাই
                            </span>
                          </div>

                          <div className="text-center space-y-1">
                            <div className="w-7 h-7 mx-auto rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold ring-4 ring-rose-100">
                              ✕
                            </div>
                            <span className="text-[11px] font-bold text-rose-700 block leading-tight">
                              {language === 'bn' ? '২. বাতিল / রিজেক্টেড' : '2. Rejected / Fake'}
                            </span>
                            <span className="text-[9px] text-rose-600 font-semibold block">
                              ফেক বা ভুল অর্ডার
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            {language === 'bn' 
                              ? 'ভুয়া তথ্য বা পেমেন্ট অমিলের কারণে অ্যাডমিন প্যানেল থেকে এই অর্ডারটি বাতিল/রিজেক্ট করা হয়েছে।' 
                              : 'This order was rejected from the admin panel due to fake details or payment mismatch.'}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EDE4F5]">
                      {/* Step 1: Pending */}
                      <div className="text-center space-y-1">
                        <div className="w-7 h-7 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                        <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                          {language === 'bn' ? '১. অর্ডার গৃহীত' : '1. Received'}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          কনফার্মেশন সম্পন্ন
                        </span>
                      </div>

                      {/* Step 2: In Process / Processing */}
                      <div className="text-center space-y-1">
                        <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                          s === 'processing' || s === 'in_progress' || s === 'verified' || s === 'completed' || s === 'delivered'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {s === 'completed' || s === 'delivered' ? '✓' : '২'}
                        </div>
                        <span className={`text-[11px] font-bold block leading-tight ${
                          s === 'processing' || s === 'in_progress'
                            ? 'text-blue-700'
                            : 'text-slate-700'
                        }`}>
                          {language === 'bn' ? '২. প্রসেসিং' : '2. In Process'}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          {s === 'processing' ? 'ইঞ্জিনিয়ার কাজ করছেন' : 'ডেভেলপমেন্ট'}
                        </span>
                      </div>

                      {/* Step 3: Complete */}
                      <div className="text-center space-y-1">
                        <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                          s === 'completed' || s === 'delivered'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {s === 'completed' || s === 'delivered' ? '✓' : '৩'}
                        </div>
                        <span className={`text-[11px] font-bold block leading-tight ${
                          s === 'completed' || s === 'delivered'
                            ? 'text-emerald-700'
                            : 'text-slate-700'
                        }`}>
                          {language === 'bn' ? '৩. সম্পূর্ণ' : '3. Complete'}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          {s === 'completed' ? 'রেডি ও ডেলিভারড' : 'ডেলিভারি অপেক্ষা'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedOrderForView(null)}
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
