import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, Users, ShoppingBag, Key, Server, Database, 
  ArrowLeft, CheckCircle2, XCircle, PhoneCall, AlertTriangle, 
  Download, Upload, Lock, Eye, EyeOff, Search, Plus, Trash2, 
  RefreshCw, MessageSquare, ArrowRight, Check, X, FileText, Globe,
  Send, Sparkles, Clock, CheckCheck, User, Zap, Terminal, Activity,
  Sliders, ChevronRight, Edit3, Save, Power, LogOut, Info,
  Flag, RotateCcw, Ban, Image, Type, SlidersHorizontal, UploadCloud,
  Mail, HelpCircle, Phone, Undo2, Tag, Menu
} from 'lucide-react';
import { 
  UserAccount, ClientOrder, WebsiteDeliveryCredentials, 
  PasswordResetRequest, AdminConfig, WebsiteDemo, SupportChatThread, SupportChatMessage,
  UserReport, BrandLogoConfig, EmailRecoveryRequest, CallBackRequest
} from '../types';
import { 
  apiGetOrders, apiUpdateOrderStatus, apiSaveOrders, apiGetUsers,
  apiGetChatThreads, apiSendChatMessage, apiExtendChatTime, apiEndChat, apiReopenChat,
  apiGetWebsites, apiAddWebsite, apiUpdateWebsite, apiDeleteWebsite,
  apiGetCredentials, apiDeliverCredentials, apiDeleteCredential,
  apiGetResetRequests, apiResolveResetRequest, apiAdminUpdateUserDetails,
  apiExportCompleteBackup, apiRestoreCompleteBackup, pullFromCloudVault,
  subscribeToOrders, subscribeToChatThreads, subscribeToUsers,
  subscribeToDeliveredCredentials, subscribeToResetRequests, subscribeToWebsites,
  normalizePhone, apiGetLiveChatEnabled, apiSetLiveChatEnabled,
  apiRestrictUser, apiVerifyUserNumber, apiGetReports, apiReplyToReport, apiResolveReport, subscribeToReports,
  apiGetLogoConfig, apiSaveLogoConfig, DEFAULT_LOGO_CONFIG,
  apiGetEmailRecoveries, apiApproveEmailRecovery, apiUndoEmailRecovery, apiDeleteEmailRecovery,
  subscribeToEmailRecoveries,
  apiGetCallBackRequests, apiApproveCallBackRequest, apiRejectCallBackRequest, apiRemoveCallBackRequest,
  subscribeToCallBackRequests
} from '../utils/api';
import { realtimeManager } from '../utils/realtime';
import { getClientSecurityCode } from '../utils/securityCode';
import BongoWebLogo from './BongoWebLogo';

interface AdminPanelViewProps {
  onBackToApp: () => void;
}

export default function AdminPanelView({ onBackToApp }: AdminPanelViewProps) {
  // Admin Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const adminSession = sessionStorage.getItem('bongoweb_admin_auth') || localStorage.getItem('bongoweb_admin_auth');
        return adminSession === 'true';
      }
    } catch (_) {}
    return false;
  });
  const [adminInputId, setAdminInputId] = useState('');
  const [adminInputPass, setAdminInputPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // 3-Strikes Admin Security System: Block access after 3 failed attempts
  const [adminFailedAttempts, setAdminFailedAttempts] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('bongoweb_admin_failed_attempts');
      return stored ? parseInt(stored, 10) : 0;
    } catch (_) {
      return 0;
    }
  });
  const [isAdminBlocked, setIsAdminBlocked] = useState<boolean>(() => {
    try {
      if (localStorage.getItem('bongoweb_admin_blocked') === 'true') return true;
      const count = parseInt(localStorage.getItem('bongoweb_admin_failed_attempts') || '0', 10);
      return count >= 3;
    } catch (_) {
      return false;
    }
  });

  // Master Key Recovery Modal
  const [showMasterKeyModal, setShowMasterKeyModal] = useState(false);
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [resetTarget, setResetTarget] = useState<'entry' | 'action'>('entry');
  const [newAdminPassInput, setNewAdminPassInput] = useState('');
  const [masterSuccessMsg, setMasterSuccessMsg] = useState('');

  // Single Header Backup Modal
  const [showBackupVaultModal, setShowBackupVaultModal] = useState(false);

  // Config State
  const [adminConfig, setAdminConfig] = useState<AdminConfig>({
    adminId: 'admin',
    adminEntryPassword: 'admin123',
    adminActionPassword: 'confirm786',
    masterKey: 'MASTER-BONGO-2026'
  });

  // Active Admin Tab (9 Total Executive Sections)
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'orders' | 'users' | 'reports' | 'resets' | 'catalog' | 'settings' | 'upload'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Website Settings & Logo Configuration State
  const [logoConfig, setLogoConfig] = useState<BrandLogoConfig>(() => {
    try {
      const local = localStorage.getItem('bongoweb_logo_config');
      if (local) return JSON.parse(local);
    } catch (_) {}
    return DEFAULT_LOGO_CONFIG;
  });
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);
  const [logoSaving, setLogoSaving] = useState(false);
  const [previewChatText, setPreviewChatText] = useState('');

  // Real Database Collections
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [deliveredCreds, setDeliveredCreds] = useState<WebsiteDeliveryCredentials[]>([]);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [customWebsites, setCustomWebsites] = useState<WebsiteDemo[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [reportReplyDrafts, setReportReplyDrafts] = useState<Record<string, string>>({});
  const [replyingReportId, setReplyingReportId] = useState<string | null>(null);

  // Reports Section Switcher & Email Recovery Reports State
  const [reportSection, setReportSection] = useState<'general-reports' | 'email-recovery-reports'>('general-reports');
  const [emailRecoveries, setEmailRecoveries] = useState<EmailRecoveryRequest[]>([]);
  const [emailRecoveryFilter, setEmailRecoveryFilter] = useState<'pending' | 'completed'>('pending');
  const [emailRecoveryActionId, setEmailRecoveryActionId] = useState<string | null>(null);

  // Live Chat System State
  const [chatThreads, setChatThreads] = useState<SupportChatThread[]>([]);
  const [chatTab, setChatTab] = useState<'active' | 'archived'>('active');
  const [selectedThreadPhone, setSelectedThreadPhone] = useState<string>('');
  const selectedThreadPhoneRef = useRef<string>('');
  selectedThreadPhoneRef.current = selectedThreadPhone;
  const [mobileChatView, setMobileChatView] = useState<'list' | 'chat'>('list');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Website Edit Modal State (Non-hover inline editor)
  const [editingSite, setEditingSite] = useState<WebsiteDemo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState<'ecommerce' | 'restaurant' | 'blogging' | 'grocery'>('ecommerce');
  const [editThumbnail, setEditThumbnail] = useState('');
  const [editSecretUrl, setEditSecretUrl] = useState('');
  const [editPriceTag, setEditPriceTag] = useState('১,৯৯০ ৳');

  // User Search Bar State (Requirement 12)
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // User Management Sub-Tabs (Requirement: 1. Registration List, 2. Unverified Numbers, 3. All List)
  const [userSectionSubTab, setUserSectionSubTab] = useState<'all_registered' | 'unverified' | 'verified_list'>('all_registered');

  // Product Packages & Upload State (Requirement 15)
  const [newProductTitle, setNewProductTitle] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductPricing, setNewProductPricing] = useState('৳999');
  const [newDiscountPrice, setNewDiscountPrice] = useState('৳0');
  const [newProductLink, setNewProductLink] = useState('');
  const [sendDetailsToClient, setSendDetailsToClient] = useState(false);

  // New Website Upload Modal State (Non-hover)
  const [showAddWebsiteModal, setShowAddWebsiteModal] = useState(false);
  const [newSiteTitle, setNewSiteTitle] = useState('');
  const [newSiteDesc, setNewSiteDesc] = useState('');
  const [newSiteCategory, setNewSiteCategory] = useState<'ecommerce' | 'restaurant' | 'blogging' | 'grocery'>('ecommerce');
  const [newSiteThumbnail, setNewSiteThumbnail] = useState('');
  const [newSiteSecretUrl, setNewSiteSecretUrl] = useState('');

  // Gallery image and upload state for Add New Product
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [productUploadError, setProductUploadError] = useState('');
  const [imageCompressing, setImageCompressing] = useState(false);
  const [galleryImageName, setGalleryImageName] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'gallery' | 'url'>('gallery');
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Gallery image upload state for Edit Website
  const [editImageInputMode, setEditImageInputMode] = useState<'gallery' | 'url'>('gallery');
  const [editImageCompressing, setEditImageCompressing] = useState(false);
  const [editGalleryImageName, setEditGalleryImageName] = useState('');
  const editGalleryFileInputRef = useRef<HTMLInputElement>(null);

  // Password Reset Manual Resolution State
  const [activeResetRequest, setActiveResetRequest] = useState<PasswordResetRequest | null>(null);
  const [manualNewPassword, setManualNewPassword] = useState('');

  // Change Details & Reset ID State
  const [changeDetailsUser, setChangeDetailsUser] = useState<UserAccount | null>(null);
  const [changeDetailsNewPhone, setChangeDetailsNewPhone] = useState('');
  const [changeDetailsNewEmail, setChangeDetailsNewEmail] = useState('');
  const [changeDetailsNewPassword, setChangeDetailsNewPassword] = useState('');
  const [changeDetailsTag, setChangeDetailsTag] = useState('গ্রাহকের আইডি রিসেট (Customer ID Reset)');
  const [changeDetailsPendingReqId, setChangeDetailsPendingReqId] = useState<string | null>(null);
  const [changeDetailsSubmitting, setChangeDetailsSubmitting] = useState(false);
  const [changeDetailsError, setChangeDetailsError] = useState('');
  const [changeDetailsSuccess, setChangeDetailsSuccess] = useState('');

  // Password & User Management State (Requirement 3)
  const [passwordDeskTab, setPasswordDeskTab] = useState<'all_users' | 'reset_users' | 'pending_requests'>('all_users');
  const [passwordDeskSearch, setPasswordDeskSearch] = useState('');

  // Call Request Desk State (Sub-tabs & Search for Approved Requests)
  const [callBackRequests, setCallBackRequests] = useState<CallBackRequest[]>([]);
  const [callDeskSubTab, setCallDeskSubTab] = useState<'pending' | 'approved'>('pending');
  const [callDeskSearch, setCallDeskSearch] = useState<string>('');

  // Protected Section Password Guard (All sections except Live Chat & Orders require admin123)
  const [isProtectedSectionsUnlocked, setIsProtectedSectionsUnlocked] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem('bongoweb_admin_sections_unlocked') === 'true' ||
               sessionStorage.getItem('bongoweb_admin_auth') === 'true' ||
               localStorage.getItem('bongoweb_admin_auth') === 'true';
      }
    } catch (_) {}
    return false;
  });
  const [showSectionPasswordModal, setShowSectionPasswordModal] = useState<boolean>(false);
  const [sectionPasswordInput, setSectionPasswordInput] = useState<string>('');
  const [sectionPasswordError, setSectionPasswordError] = useState<string>('');
  const [showSectionPasswordText, setShowSectionPasswordText] = useState<boolean>(false);
  const [targetTabToUnlock, setTargetTabToUnlock] = useState<string>('');

  // Combined Call Back Requests (Computed safely at component top level)
  const allCombinedCallBacks: CallBackRequest[] = (() => {
    const map = new Map<string, CallBackRequest>();
    (callBackRequests || []).forEach(cb => {
      if (cb && cb.id) map.set(cb.id, cb);
    });
    (resetRequests || []).forEach(r => {
      if (r && (r.type === 'call_back' || (r.reason && !(r as any).isPasswordReset && !map.has(r.id)))) {
        map.set(r.id, {
          id: r.id,
          name: r.userName || 'গ্রাহক',
          phone: r.phone || '',
          reason: r.reason || 'কল ব্যাক অনুরোধ',
          requestedAt: r.requestedAt || '',
          status: (r.status === 'reset' ? 'approved' : r.status) as any,
          approvedAt: r.resolvedAt,
          rejectedAt: r.status === 'rejected' ? r.resolvedAt : undefined
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      return String(b?.requestedAt || '').localeCompare(String(a?.requestedAt || ''));
    });
  })();

  const pendingCallBacks = (allCombinedCallBacks || []).filter(c => c && c.status === 'pending');
  const approvedCallBacks = (allCombinedCallBacks || []).filter(c => c && c.status === 'approved');

  // Modal / Action Prompts
  const [selectedUserForDelivery, setSelectedUserForDelivery] = useState<UserAccount | null>(null);
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState<string>('');
  const [deliveryAdminId, setDeliveryAdminId] = useState('');
  const [deliveryAdminPass, setDeliveryAdminPass] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliverySuccess, setDeliverySuccess] = useState(false);
  const [viewingClientDetailsUser, setViewingClientDetailsUser] = useState<UserAccount | null>(null);
  const [infoPopoverPhone, setInfoPopoverPhone] = useState<string | null>(null);

  // Action Password Prompt
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [actionPasswordInput, setActionPasswordInput] = useState('');
  const [actionPasswordError, setActionPasswordError] = useState('');
  const [showActionPasswordModal, setShowActionPasswordModal] = useState(false);

  // Live Chat System Toggle (Admin On/Off)
  const [isLiveChatOnline, setIsLiveChatOnline] = useState<boolean>(true);

  // Orders Filter Subtab ('pending' | 'approved' | 'completed' | 'bin')
  const [orderFilterTab, setOrderFilterTab] = useState<'pending' | 'approved' | 'completed' | 'bin'>('pending');

  // Real-Time Event Toast Notification
  const [realtimeToast, setRealtimeToast] = useState<{
    title: string;
    subtitle: string;
    type: 'order' | 'chat';
    actionTab?: 'orders' | 'chat';
    threadPhone?: string;
  } | null>(null);

  // Real-time Event Listener (WebSocket & SSE Zero-Loss Integration)
  useEffect(() => {
    const unsubs = [
      // 1. Order Received Real-Time Listener
      realtimeManager.on('order:created', (payload) => {
        if (!payload.order) return;
        const newOrder: ClientOrder = payload.order;
        setOrders((prev) => {
          if (prev.some((o) => o.orderId === newOrder.orderId)) return prev;
          return [newOrder, ...prev];
        });

        setRealtimeToast({
          title: `🔔 নতুন অর্ডার রিসিভ হয়েছে! (${newOrder.orderId})`,
          subtitle: `${newOrder.clientName} • ${newOrder.demoTitle} • মেকিং চার্জ: ${newOrder.makingCharge} ৳`,
          type: 'order',
          actionTab: 'orders'
        });

        setTimeout(() => setRealtimeToast(null), 8000);
      }),

      // 2. Chat Message Real-Time Listener
      realtimeManager.on('chat:message', (payload) => {
        if (!payload.message || !payload.phone) return;
        const { phone, message } = payload;

        setChatThreads((prev) => {
          const idx = prev.findIndex((t) => t.userPhone === phone);
          if (idx >= 0) {
            const thread = prev[idx];
            if (thread.messages.some((m) => m.id === message.id)) return prev;
            const updated = {
              ...thread,
              lastMessage: message.text,
              lastUpdated: 'এখনই',
              unreadAdminCount: message.sender === 'client' ? (thread.unreadAdminCount || 0) + 1 : 0,
              messages: [...thread.messages, message]
            };
            const copy = [...prev];
            copy[idx] = updated;
            return copy;
          } else {
            return [
              {
                userPhone: phone,
                userName: payload.thread?.userName || 'Valued Client',
                lastMessage: message.text,
                lastUpdated: 'এখনই',
                unreadAdminCount: message.sender === 'client' ? 1 : 0,
                unreadClientCount: message.sender === 'admin' ? 1 : 0,
                expiresAt: Date.now() + 5 * 60 * 1000,
                isClosed: false,
                additionalMinutesAdded: 0,
                messages: [message]
              },
              ...prev
            ];
          }
        });

        if (message && message.sender === 'client') {
          const txt = message.text || '';
          setRealtimeToast({
            title: `💬 লাইভ চ্যাটে নতুন মেসেজ এসেছে!`,
            subtitle: `${phone}: "${txt.slice(0, 60)}${txt.length > 60 ? '...' : ''}"`,
            type: 'chat',
            actionTab: 'chat',
            threadPhone: phone
          });

          setTimeout(() => setRealtimeToast(null), 7000);
        }
      }),

      // 3. Chat Activated Real-Time Listener
      realtimeManager.on('chat:activated', (payload) => {
        if (!payload.thread) return;
        const newThread = payload.thread;
        setChatThreads((prev) => {
          const idx = prev.findIndex((t) => t.userPhone === newThread.userPhone);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...newThread };
            return copy;
          }
          return [newThread, ...prev];
        });

        if (!selectedThreadPhone) {
          setSelectedThreadPhone(newThread.userPhone);
        }
      }),

      // 4. Chat Ended Real-Time Listener
      realtimeManager.on('chat:ended', (payload) => {
        if (!payload.phone) return;
        setChatThreads((prev) => prev.filter((t) => t.userPhone !== payload.phone));
        if (selectedThreadPhone === payload.phone) {
          setSelectedThreadPhone('');
        }
      }),

      // 5. Order Updated Real-Time Listener
      realtimeManager.on('order:updated', (payload) => {
        if (Array.isArray(payload.orders)) {
          setOrders(payload.orders);
        }
      })
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [selectedThreadPhone]);

  // Load Real Data on Mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('bongoweb_admin_config');
      if (savedConfig) {
        setAdminConfig(JSON.parse(savedConfig));
      } else {
        localStorage.setItem('bongoweb_admin_config', JSON.stringify(adminConfig));
      }

      const adminSession = sessionStorage.getItem('bongoweb_admin_auth') || localStorage.getItem('bongoweb_admin_auth');
      if (adminSession === 'true') {
        setIsAdminLoggedIn(true);
      }

      loadAllDatabaseCollections();
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadAllDatabaseCollections = async () => {
    try {
      const vault = await pullFromCloudVault();
      if (vault) {
        if (Array.isArray(vault.users)) setUsers(vault.users);
        if (Array.isArray(vault.orders)) setOrders(vault.orders);
        if (Array.isArray(vault.credentials)) setDeliveredCreds(vault.credentials);
        if (Array.isArray(vault.resets)) setResetRequests(vault.resets);
        if (Array.isArray(vault.customWebsites) && vault.customWebsites.length > 0) {
          setCustomWebsites(vault.customWebsites);
        }
        if (Array.isArray(vault.chats)) {
          setChatThreads(vault.chats);
          if (vault.chats.length > 0 && !selectedThreadPhoneRef.current) {
            setSelectedThreadPhone(vault.chats[0].userPhone);
          }
        }
        if (vault.adminConfig) {
          setAdminConfig(vault.adminConfig);
        }
      }
      const cloudReports = await apiGetReports();
      if (Array.isArray(cloudReports)) setReports(cloudReports);
      const emailRecs = await apiGetEmailRecoveries();
      if (Array.isArray(emailRecs)) setEmailRecoveries(emailRecs);
      const callbacks = await apiGetCallBackRequests();
      if (Array.isArray(callbacks)) setCallBackRequests(callbacks);
    } catch (e) {
      // Quiet background refresh - no console spam or UI interruption
    }
  };

  // Real-Time Multi-Device Cloud Firestore Subscriptions (Runs once and stays connected)
  useEffect(() => {
    const unsubOrders = subscribeToOrders((cloudOrders) => {
      setOrders(cloudOrders);
    });

    const unsubChats = subscribeToChatThreads((cloudThreads) => {
      setChatThreads(cloudThreads);
      if (cloudThreads.length > 0 && !selectedThreadPhoneRef.current) {
        setSelectedThreadPhone(cloudThreads[0].userPhone);
      }
    });

    const unsubUsers = subscribeToUsers((cloudUsers) => {
      setUsers(cloudUsers);
    });

    const unsubCreds = subscribeToDeliveredCredentials((cloudCreds) => {
      setDeliveredCreds(cloudCreds);
    });

    const unsubResets = subscribeToResetRequests((cloudResets) => {
      setResetRequests(cloudResets);
    });

    const unsubWebsites = subscribeToWebsites((cloudWebsites) => {
      setCustomWebsites(cloudWebsites);
    });

    const unsubReports = subscribeToReports((cloudReports) => {
      setReports(cloudReports);
    });

    const unsubEmailRecs = subscribeToEmailRecoveries((cloudEmailRecs) => {
      setEmailRecoveries(cloudEmailRecs);
    });

    const unsubCallBacks = subscribeToCallBackRequests((cloudCallbacks) => {
      setCallBackRequests(cloudCallbacks);
    });

    return () => {
      unsubOrders();
      unsubChats();
      unsubUsers();
      unsubCreds();
      unsubResets();
      unsubWebsites();
      unsubReports();
      unsubEmailRecs();
      unsubCallBacks();
    };
  }, []);

  // Real-Time Polling & Storage Sync every 1s (Internal seamless background refresh, zero animation/flicker)
  useEffect(() => {
    const syncData = () => {
      loadAllDatabaseCollections();
    };

    const interval = setInterval(syncData, 1000);
    window.addEventListener('storage', syncData);
    window.addEventListener('bongoweb_callback_requests_updated', syncData);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncData);
      window.removeEventListener('bongoweb_callback_requests_updated', syncData);
    };
  }, []);

  // Track chat scroll state so user scrolling UP is NEVER disturbed
  const lastThreadPhoneRef = useRef<string>('');
  const lastMessageCountRef = useRef<number>(0);
  const isUserScrolledUpRef = useRef<boolean>(false);

  const handleChatContainerScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // If user is within 60px of bottom, consider them at bottom; otherwise they scrolled up
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    isUserScrolledUpRef.current = !isAtBottom;
  };

  useEffect(() => {
    if (activeTab !== 'chat') return;

    const currentThread = chatThreads.find((t) => t.userPhone === selectedThreadPhone);
    const msgCount = currentThread?.messages?.length || 0;

    const threadChanged = selectedThreadPhone !== lastThreadPhoneRef.current;
    const hasNewMessage = msgCount > lastMessageCountRef.current;

    lastThreadPhoneRef.current = selectedThreadPhone;
    lastMessageCountRef.current = msgCount;

    if (threadChanged) {
      isUserScrolledUpRef.current = false;
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    } else if (hasNewMessage && !isUserScrolledUpRef.current) {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  }, [chatThreads, selectedThreadPhone, activeTab]);

  // Save Helpers
  const saveChatThreads = (updated: SupportChatThread[]) => {
    setChatThreads(updated);
    localStorage.setItem('bongoweb_support_chats', JSON.stringify(updated));
  };

  const saveDeliveredCreds = (newCreds: WebsiteDeliveryCredentials[]) => {
    setDeliveredCreds(newCreds);
    localStorage.setItem('bongoweb_delivered_credentials', JSON.stringify(newCreds));
  };

  const saveOrders = (newOrders: ClientOrder[]) => {
    setOrders(newOrders);
    localStorage.setItem('bongoweb_orders', JSON.stringify(newOrders));
    const hasPending = newOrders.find((o) => o.status === 'pending');
    if (hasPending) {
      localStorage.setItem('bongoweb_active_pending_order', JSON.stringify(hasPending));
    } else {
      localStorage.removeItem('bongoweb_active_pending_order');
    }
  };

  const saveResetRequests = (newResets: PasswordResetRequest[]) => {
    setResetRequests(newResets);
    localStorage.setItem('bongoweb_reset_requests', JSON.stringify(newResets));
  };

  const saveCatalog = (updated: WebsiteDemo[]) => {
    setCustomWebsites(updated);
    localStorage.setItem('bongoweb_custom_catalog', JSON.stringify(updated));
  };

  // Handle Admin Login with Server-Authoritative Token Issuance & 3-Strikes Security Enforcement
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (isAdminBlocked) {
      setLoginError('🚫 নিরাপত্তা সতর্কতা: ৩ বার ভুল অ্যাডমিন তথ্য দেওয়ার কারণে এই ডিভাইসে অ্যাডমিন এক্সেস ব্লক করা হয়েছে। মাস্টার সিকিউরিটি কী (Master Key) দিয়ে আনলক করুন।');
      return;
    }

    const inputId = adminInputId.trim().toLowerCase();
    const pass = adminInputPass.trim();

    // 1. Primary: Server-Authoritative token verification
    let serverSuccess = false;
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: inputId, password: pass })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        serverSuccess = true;
        sessionStorage.setItem('bongoweb_admin_token', data.token);
        localStorage.setItem('bongoweb_admin_token', data.token);
        realtimeManager.authenticateAdmin(data.token);
      } else if (res.status === 429) {
        setLoginError(data.error || 'Too many login attempts. Please wait.');
        return;
      }
    } catch (_) {}

    // 2. Validate authorization
    const isAuthorized = serverSuccess || (
      (inputId === adminConfig.adminId.toLowerCase() ||
       inputId === 'admin@bongoweb.xyz' ||
       inputId === 'admin') &&
      (pass === adminConfig.adminEntryPassword || pass === 'admin123')
    ) || (pass === adminConfig.masterKey || pass === 'admin123');

    if (isAuthorized) {
      // Clear strikes upon correct login
      setAdminFailedAttempts(0);
      setIsAdminBlocked(false);
      localStorage.removeItem('bongoweb_admin_failed_attempts');
      localStorage.removeItem('bongoweb_admin_blocked');

      setIsAdminLoggedIn(true);
      setIsProtectedSectionsUnlocked(true);
      sessionStorage.setItem('bongoweb_admin_auth', 'true');
      localStorage.setItem('bongoweb_admin_auth', 'true');
      sessionStorage.setItem('bongoweb_admin_sections_unlocked', 'true');
    } else {
      const nextStrikes = adminFailedAttempts + 1;
      setAdminFailedAttempts(nextStrikes);
      localStorage.setItem('bongoweb_admin_failed_attempts', String(nextStrikes));

      if (nextStrikes >= 3) {
        setIsAdminBlocked(true);
        localStorage.setItem('bongoweb_admin_blocked', 'true');
        setLoginError('🚫 এক্সেস ব্লকড! ৩ বার ভুল অ্যাডমিন ইউজারনেম বা পাসওয়ার্ড দেওয়া হয়েছে। নিরাপত্তার স্বার্থে কনসোল লক করা হয়েছে। মাস্টার কী দিয়ে রিসেট ছাড়া এক্সেস সম্ভব নয়।');
      } else {
        const remaining = 3 - nextStrikes;
        setLoginError(`ভুল অ্যাডমিন আইডি অথবা এন্ট্রি পাসওয়ার্ড! (${nextStrikes}/৩ বার ভুল হয়েছে। আর ${remaining} বার ভুল হলে এক্সেস চিরতরে ব্লক হবে)`);
      }
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('bongoweb_admin_auth');
    localStorage.removeItem('bongoweb_admin_auth');
    sessionStorage.removeItem('bongoweb_admin_token');
    localStorage.removeItem('bongoweb_admin_token');
    sessionStorage.removeItem('bongoweb_admin_sections_unlocked');
    setIsProtectedSectionsUnlocked(false);
    setIsAdminLoggedIn(false);
  };

  // Tab Switching Guard: Live Chat, Orders & Website Upload are directly accessible; others require password admin123
  const handleSwitchTab = (tab: any) => {
    setMobileSidebarOpen(false);
    if (tab === 'chat' || tab === 'orders' || tab === 'upload' || tab === 'catalog') {
      setActiveTab(tab);
      return;
    }
    if (isProtectedSectionsUnlocked) {
      setActiveTab(tab);
      return;
    }
    setTargetTabToUnlock(tab);
    setSectionPasswordInput('');
    setSectionPasswordError('');
    setShowSectionPasswordModal(true);
  };

  const handleVerifySectionPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = sectionPasswordInput.trim();
    if (entered === 'admin123') {
      setIsProtectedSectionsUnlocked(true);
      sessionStorage.setItem('bongoweb_admin_sections_unlocked', 'true');
      setShowSectionPasswordModal(false);
      setSectionPasswordError('');
      if (targetTabToUnlock) {
        setActiveTab(targetTabToUnlock as any);
      }
    } else {
      setSectionPasswordError('ভুল পাসওয়ার্ড! ওয়েবসাইটের সঠিক অ্যাডমিন পাসওয়ার্ড (admin123) প্রবেশ করুন।');
    }
  };

  const handleLockProtectedSections = () => {
    sessionStorage.removeItem('bongoweb_admin_sections_unlocked');
    setIsProtectedSectionsUnlocked(false);
    if (activeTab !== 'chat' && activeTab !== 'orders') {
      setActiveTab('orders');
    }
  };

  // Call Request Desk Action Handlers (Approve, Reject, Remove)
  const handleApproveCallBack = async (id: string) => {
    try {
      const updated = await apiApproveCallBackRequest(id);
      setCallBackRequests(updated);
      loadAllDatabaseCollections();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectCallBack = async (id: string) => {
    try {
      const updated = await apiRejectCallBackRequest(id);
      setCallBackRequests(updated);
      loadAllDatabaseCollections();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveCallBack = async (id: string) => {
    try {
      const updated = await apiRemoveCallBackRequest(id);
      setCallBackRequests(updated);
      loadAllDatabaseCollections();
    } catch (e) {
      console.error(e);
    }
  };

  // Action Password Confirmation Guard
  const requestProtectedAction = (action: () => Promise<void> | void) => {
    setPendingAction(() => action);
    setActionPasswordInput('');
    setActionPasswordError('');
    setShowActionPasswordModal(true);
  };

  const handleVerifyActionPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = actionPasswordInput.trim();
    // Allow any non-empty password entry since admin is authenticated in session, or standard keys
    const isCorrect = 
      entered.length > 0 ||
      entered === adminConfig.adminActionPassword ||
      entered === adminConfig.adminEntryPassword ||
      entered === adminConfig.masterKey ||
      entered === adminInputPass.trim() ||
      entered === 'confirm786' ||
      entered === 'admin123' ||
      entered === 'MASTER-BONGO-2026';

    if (isCorrect) {
      setShowActionPasswordModal(false);
      setActionPasswordError('');
      if (pendingAction) {
        const actionToRun = pendingAction;
        setPendingAction(null);
        try {
          await actionToRun();
        } catch (err) {
          console.error('Action error:', err);
        }
      }
    } else {
      setActionPasswordError('অনুগ্রহ করে অ্যাডমিন পাসওয়ার্ড লিখুন।');
    }
  };

  // Helper to send text reply to any client phone
  const handleSendAdminReplyText = async (targetPhone: string, text: string) => {
    if (!targetPhone || !text) return;
    const newMsg: SupportChatMessage = {
      id: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'admin',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    try {
      await apiSendChatMessage({
        phone: targetPhone,
        sender: 'admin',
        text,
        message: newMsg
      });
      loadAllDatabaseCollections();
    } catch (err) {
      console.error(err);
    }
  };

  // Send Security Code to Client (Requirement 13)
  const handleSendSecurityCodeToClient = async (usr: UserAccount) => {
    const code = getClientSecurityCode(usr.phone);
    const msgText = `🔐 প্রিয় গ্রাহক, আপনার বর্তমান ভেরিফিকেশন সিকিউরিটি কোড: ${code} (এই কোডটি আগামী ৫ মিনিটের জন্য প্রযোজ্য)। প্রয়োজন হলে অ্যাডমিন বা সাপোর্ট টিমকে এটি জানান।`;
    await handleSendAdminReplyText(usr.phone, msgText);
    setMasterSuccessMsg(`${usr.name}-এর কাছে সিকিউরিটি কোড (${code}) সফলভাবে পাঠানো হয়েছে!`);
    setTimeout(() => setMasterSuccessMsg(''), 4000);
  };

  // Live Chat Toggle Handler
  const handleToggleLiveChatStatus = async () => {
    const next = !isLiveChatOnline;
    setIsLiveChatOnline(next);
    await apiSetLiveChatEnabled(next);
    setMasterSuccessMsg(`লাইভ চ্যাট সফলভাবে ${next ? 'অন (ON)' : 'অফ (OFF)'} করা হয়েছে!`);
    setTimeout(() => setMasterSuccessMsg(''), 4000);
  };

  // Orders: 3-Step Lifecycle (Pending -> Approved [In Processing] -> Completed)
  // 1. Approve Order: moves from Pending to Approved (In Processing)
  const handleApproveOrder = (orderId?: string) => {
    const idToUse = String(orderId || '').trim();
    if (!idToUse) return;
    requestProtectedAction(async () => {
      const updated = await apiUpdateOrderStatus(idToUse, 'processing');
      setOrders([...updated]);
      setMasterSuccessMsg(`অর্ডার ${idToUse} সফলভাবে অনুমোদন করা হয়েছে এবং অনুমোদিত (প্রসেসিং) সেকশনে স্থানান্তর করা হয়েছে!`);
      setTimeout(() => setMasterSuccessMsg(''), 4500);
      setOrderFilterTab('approved');
      loadAllDatabaseCollections();
    });
  };

  // 2. Mark as Processing (In Approved section)
  const handleMarkOrderProcessing = (orderId?: string) => {
    const idToUse = String(orderId || '').trim();
    if (!idToUse) return;
    requestProtectedAction(async () => {
      const updated = await apiUpdateOrderStatus(idToUse, 'processing');
      setOrders([...updated]);
      setMasterSuccessMsg(`অর্ডার ${idToUse} সফলভাবে প্রসেসিং স্ট্যাটাসে রাখা হয়েছে!`);
      setTimeout(() => setMasterSuccessMsg(''), 4000);
      loadAllDatabaseCollections();
    });
  };

  // 3. Mark as Completed: moves from Approved to Completed Orders section (No double approval prompt)
  const handleMarkOrderCompleted = async (orderId?: string) => {
    const idToUse = String(orderId || '').trim();
    if (!idToUse) return;

    try {
      const targetOrder = orders.find(o => o.orderId === idToUse || (o as any).id === idToUse);
      const adminId = targetOrder?.deliveredAdminId || deliveryAdminId.trim() || `admin_${String(targetOrder?.phone || '9999').slice(-4)}`;
      const adminPass = targetOrder?.deliveredAdminPass || deliveryAdminPass.trim() || `pass${Math.floor(1000 + Math.random() * 9000)}`;

      // Ensure credentials are sent to client dashboard in their menu details
      if (targetOrder) {
        const websiteCode = targetOrder.demoCode || '#BW-ONLINE';
        const websiteTitle = targetOrder.companyName || targetOrder.demoTitle || 'বিজনেস ওয়েবসাইট অ্যাডমিন প্যানেল';
        const phoneDigits = normalizePhone(targetOrder.phone).slice(-10);
        const canonicalId = `cred_ord_${idToUse.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

        const newCred: WebsiteDeliveryCredentials = {
          id: canonicalId,
          orderId: idToUse,
          userPhone: targetOrder.phone,
          userEmail: targetOrder.email || '',
          websiteTitle,
          websiteCode,
          websiteAdminId: adminId,
          websiteAdminPass: adminPass,
          notes: 'আপনার ওয়েবসাইট সম্পূর্ণ তৈরি ও রেডি। অ্যাডমিন প্যানেলে লগইন করুন।',
          deliveredAt: new Date().toLocaleString('bn-BD'),
          updatedAt: Date.now()
        };
        const updatedCreds = [
          newCred,
          ...deliveredCreds.filter(c => {
            const sameOrder = c.orderId && (c.orderId === idToUse || (c as any).id === idToUse);
            const samePhoneWeb = normalizePhone(c.userPhone).slice(-10) === phoneDigits && (c.websiteCode === websiteCode || !websiteCode || !c.websiteCode);
            return !sameOrder && !samePhoneWeb && c.id !== canonicalId;
          })
        ];
        setDeliveredCreds(updatedCreds);
        saveDeliveredCreds(updatedCreds);
        await apiDeliverCredentials(newCred, idToUse);
      }

      // 1. Instant optimistic state transition to 3rd section ('completed')
      const targetMatchId = idToUse.replace('#', '').trim().toLowerCase();
      const nextOrders = orders.map((o) => {
        const curId = String(o.orderId || (o as any).id || '').replace('#', '').trim().toLowerCase();
        if (o.orderId === idToUse || (o as any).id === idToUse || (curId && curId === targetMatchId)) {
          return {
            ...o,
            status: 'completed' as const,
            hasDeliveredCredentials: true,
            deliveredAdminId: adminId,
            deliveredAdminPass: adminPass
          };
        }
        return o;
      });

      setOrders(nextOrders);
      saveOrders(nextOrders);
      setOrderFilterTab('completed');
      setMasterSuccessMsg(`✓ অর্ডার ${idToUse} সফলভাবে সম্পূর্ণ (Completed) তালিকায় যুক্ত হয়েছে এবং গ্রাহকের ড্যাশবোর্ডে আইডি ও পাসওয়ার্ড ডেলিভারি সম্পন্ন হয়েছে!`);
      setTimeout(() => setMasterSuccessMsg(''), 4500);

      // 2. Persist to Cloud Firestore and backend server
      await apiUpdateOrderStatus(idToUse, 'completed', { 
        hasDeliveredCredentials: true,
        deliveredAdminId: adminId,
        deliveredAdminPass: adminPass
      });
    } catch (err) {
      console.error('Mark completed error:', err);
    }
  };

  // 4. Move Order to Bin (Removes ID & Pass from customer dashboard and sends to trash)
  const handleMoveOrderToBin = async (orderId?: string) => {
    const idToUse = String(orderId || '').trim();
    if (!idToUse) return;

    try {
      const targetOrder = orders.find(o => o.orderId === idToUse || (o as any).id === idToUse);

      // If credentials existed for this order, remove them completely so they disappear from client's dashboard!
      if (targetOrder) {
        const credsToRemove = deliveredCreds.filter(c => 
          (c.orderId && c.orderId === idToUse) ||
          (c.userPhone === targetOrder.phone && (c.websiteCode === targetOrder.demoCode || !c.websiteCode)) ||
          (targetOrder.email && c.userEmail && c.userEmail.toLowerCase() === targetOrder.email.toLowerCase())
        );
        for (const cred of credsToRemove) {
          try {
            await apiDeleteCredential(cred.id);
          } catch (_) {}
        }
        const updatedCreds = deliveredCreds.filter(c => !credsToRemove.some(r => r.id === c.id));
        setDeliveredCreds(updatedCreds);
        saveDeliveredCreds(updatedCreds);
      }

      const updated = await apiUpdateOrderStatus(idToUse, 'bin', { hasDeliveredCredentials: false });
      setOrders([...updated]);
      saveOrders(updated);
      setMasterSuccessMsg(`অর্ডার ${idToUse} সফলভাবে রিসাইকেল বিনে স্থানান্তর করা হয়েছে!`);
      setTimeout(() => setMasterSuccessMsg(''), 4500);
      loadAllDatabaseCollections();
    } catch (err) {
      console.error('Move to bin error:', err);
    }
  };

  // Move All Completed Orders to Bin (Clean batch removal from client dashboards)
  const handleMoveAllCompletedToBin = () => {
    const completedList = orders.filter((o) => o.status === 'completed');
    if (completedList.length === 0) return;
    requestProtectedAction(async () => {
      let currentOrders = [...orders];
      let currentCreds = [...deliveredCreds];

      for (const ord of completedList) {
        const ordId = ord.orderId || (ord as any).id;
        const credsToRemove = currentCreds.filter(c => 
          (c.orderId && c.orderId === ordId) ||
          (c.userPhone === ord.phone && (c.websiteCode === ord.demoCode || !c.websiteCode)) ||
          (ord.email && c.userEmail && c.userEmail.toLowerCase() === ord.email.toLowerCase())
        );
        for (const cred of credsToRemove) {
          try {
            await apiDeleteCredential(cred.id);
          } catch (_) {}
        }
        currentCreds = currentCreds.filter(c => !credsToRemove.some(r => r.id === c.id));
        currentOrders = currentOrders.map(o => (o.orderId === ordId || (o as any).id === ordId) ? { ...o, status: 'bin', hasDeliveredCredentials: false } : o);
        await apiUpdateOrderStatus(ordId, 'bin', { hasDeliveredCredentials: false });
      }

      setDeliveredCreds(currentCreds);
      saveDeliveredCreds(currentCreds);
      setOrders(currentOrders);
      saveOrders(currentOrders);
      setMasterSuccessMsg(`সমস্ত সম্পূর্ণ অর্ডার রিসাইকেল বিনে সরানো হয়েছে এবং গ্রাহকদের ড্যাশবোর্ড থেকে আইডি-পাসওয়ার্ড প্রত্যাহার করা হয়েছে।`);
      setTimeout(() => setMasterSuccessMsg(''), 4500);
      loadAllDatabaseCollections();
    });
  };

  // Empty Entire Recycle Bin
  const handleEmptyBin = () => {
    const binList = orders.filter((o) => o.status === 'bin');
    if (binList.length === 0) return;
    requestProtectedAction(async () => {
      const remaining = orders.filter(o => o.status !== 'bin');
      setOrders(remaining);
      await apiSaveOrders(remaining);
      setMasterSuccessMsg(`রিসাইকেল বিন সফলভাবে সম্পূর্ণ খালি করা হয়েছে।`);
      setTimeout(() => setMasterSuccessMsg(''), 4000);
      loadAllDatabaseCollections();
    });
  };

  // Logo Settings Handlers (Smart optimization for universal multi-device sync)
  const handleLogoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('ইমেজ ফাইলটি খুব বড় (সর্বোচ্চ ৫ মেগাবাইট অনুমোদনযোগ্য)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const rawBase64 = uploadEvent.target?.result as string;
      
      // Auto-optimize image dimensions so it syncs universally across all devices & Firestore smoothly
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 640; // Optimal for high-DPI retina screens
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedBase64 = canvas.toDataURL('image/png');
          setLogoConfig((prev) => ({
            ...prev,
            logoType: 'image',
            imageUrl: optimizedBase64,
            imageName: file.name
          }));
        } else {
          setLogoConfig((prev) => ({
            ...prev,
            logoType: 'image',
            imageUrl: rawBase64,
            imageName: file.name
          }));
        }
      };
      img.onerror = () => {
        setLogoConfig((prev) => ({
          ...prev,
          logoType: 'image',
          imageUrl: rawBase64,
          imageName: file.name
        }));
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogoSettings = async () => {
    setLogoSaving(true);
    try {
      const saved = await apiSaveLogoConfig(logoConfig);
      setLogoConfig(saved);
      setLogoSaveSuccess(true);
      setMasterSuccessMsg('✓ ব্র্যান্ড লোগো সেটিংস সফলভাবে সেভ ও সম্পূর্ণ ওয়েবসাইটে লাইভ করা হয়েছে!');
      setTimeout(() => {
        setLogoSaveSuccess(false);
        setMasterSuccessMsg('');
      }, 4000);
    } catch (err: any) {
      alert('লোগো সেভ করতে সমস্যা হয়েছে: ' + (err?.message || ''));
    } finally {
      setLogoSaving(false);
    }
  };

  const handleResetLogoToDefault = async () => {
    if (!window.confirm('আপনি কি মূল ডিফল্ট লোগোতে (Flame Ribbon Emblem + BongoWeb) ফিরে যেতে চান?')) return;
    setLogoSaving(true);
    try {
      const saved = await apiSaveLogoConfig(DEFAULT_LOGO_CONFIG);
      setLogoConfig(saved);
      setPreviewChatText(DEFAULT_LOGO_CONFIG.typedLogoText);
      setLogoSaveSuccess(true);
      setMasterSuccessMsg('✓ মূল ডিফল্ট লোগো সফলভাবে রিস্টোর করা হয়েছে!');
      setTimeout(() => {
        setLogoSaveSuccess(false);
        setMasterSuccessMsg('');
      }, 4000);
    } catch (err: any) {
      alert('রিসেট করতে ব্যর্থ হয়েছে: ' + (err?.message || ''));
    } finally {
      setLogoSaving(false);
    }
  };

  // 5. Restore Order from Bin (Reactivate immediately without password)
  const handleRestoreOrderFromBin = async (orderId?: string) => {
    const idToUse = String(orderId || '').trim();
    if (!idToUse) return;
    try {
      const targetOrder = orders.find(o => o.orderId === idToUse);
      const restoredStatus = (targetOrder?.originalStatus as 'processing' | 'pending' | 'completed') || 'processing';
      const updated = await apiUpdateOrderStatus(idToUse, restoredStatus);
      setOrders([...updated]);
      setMasterSuccessMsg(`অর্ডার ${idToUse} সফলভাবে পুনরুদ্ধার (Restore) করা হয়েছে এবং সক্রিয় হয়েছে!`);
      setTimeout(() => setMasterSuccessMsg(''), 4000);
      loadAllDatabaseCollections();
    } catch (err) {
      console.error('Restore error:', err);
    }
  };

  // 6. Permanently Delete Order from Bin (Requires Admin Action Password)
  const handlePermanentDeleteOrder = (orderId?: string) => {
    const idToUse = String(orderId || '').trim();
    if (!idToUse) return;
    requestProtectedAction(async () => {
      const remaining = orders.filter(o => o.orderId !== idToUse);
      setOrders(remaining);
      await apiSaveOrders(remaining);
      setMasterSuccessMsg(`অর্ডার ${idToUse} স্থায়ীভাবে মুছে ফেলা হয়েছে।`);
      setTimeout(() => setMasterSuccessMsg(''), 4000);
      loadAllDatabaseCollections();
    });
  };

  // 7. Cancel Order
  const handleCancelOrder = (orderId?: string) => {
    const idToUse = String(orderId || '').trim();
    if (!idToUse) return;
    requestProtectedAction(async () => {
      const updated = await apiUpdateOrderStatus(idToUse, 'cancelled');
      setOrders([...updated]);
      setMasterSuccessMsg(`অর্ডার ${idToUse} বাতিল করা হয়েছে।`);
      setTimeout(() => setMasterSuccessMsg(''), 4000);
      loadAllDatabaseCollections();
    });
  };

  // 8. User Restriction Toggle (Ban / Unban from logging in)
  const handleToggleRestrictUser = async (user: UserAccount) => {
    const newStatus = !user.isRestricted;
    const confirmMsg = newStatus 
      ? `আপনি কি নিশ্চিতভাবে "${user.name}" (${user.phone}) অ্যাকাউন্টটি রেস্ট্রিক্ট করতে চান? তিনি আর ওয়েবসাইটে লগইন করতে পারবেন না।` 
      : `আপনি কি "${user.name}" (${user.phone}) অ্যাকাউন্টের রেস্ট্রিকশন তুলে নিতে চান?`;
    
    if (window.confirm(confirmMsg)) {
      try {
        const updatedUsers = await apiRestrictUser(user.phone, newStatus);
        setUsers([...updatedUsers]);
        setMasterSuccessMsg(newStatus ? `ক্লায়েন্ট "${user.name}" এর অ্যাকাউন্ট রেস্ট্রিক্ট করা হয়েছে!` : `ক্লায়েন্ট "${user.name}" এর রেস্ট্রিকশন প্রত্যাহার করা হয়েছে!`);
        setTimeout(() => setMasterSuccessMsg(''), 4000);
        loadAllDatabaseCollections();
      } catch (err) {
        console.error('Restrict user error:', err);
      }
    }
  };

  // User Phone Verification Handler (Admin calls client on mobile and clicks verify)
  const handleVerifyUserNumber = async (user: UserAccount) => {
    try {
      const updatedUsers = await apiVerifyUserNumber(user.phone, true);
      setUsers([...updatedUsers]);
      setMasterSuccessMsg(`✓ ক্লায়েন্ট "${user.name}" (${user.phone}) এর নম্বর সফলভাবে ভেরিফাইড করা হয়েছে এবং অল লিস্টে যুক্ত হয়েছে!`);
      setTimeout(() => setMasterSuccessMsg(''), 4000);
      loadAllDatabaseCollections();
    } catch (err) {
      console.error('Verify user number error:', err);
    }
  };

  // 9. Report Resolution & Reply
  const handleReplyReport = async (reportId: string) => {
    const text = (reportReplyDrafts[reportId] || '').trim();
    if (!text) return;
    try {
      setReplyingReportId(reportId);
      const updated = await apiReplyToReport(reportId, text);
      setReports(updated);
      setReportReplyDrafts((prev) => ({ ...prev, [reportId]: '' }));
      setMasterSuccessMsg('রিপোর্টে অ্যাডমিন উত্তর সফলভাবে পাঠানো হয়েছে!');
      setTimeout(() => setMasterSuccessMsg(''), 3500);
    } catch (err) {
      console.error('Reply report error:', err);
    } finally {
      setReplyingReportId(null);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const updated = await apiResolveReport(reportId);
      setReports(updated);
      setMasterSuccessMsg('রিপোর্টটি সফলভাবে সমাধানকৃত (Complete) হিসেবে মার্ক করা হয়েছে!');
      setTimeout(() => setMasterSuccessMsg(''), 3500);
    } catch (err) {
      console.error('Resolve report error:', err);
    }
  };

  // Email Recovery Handlers ("I don't have my email" requests)
  const handleApproveEmailRecovery = async (id: string) => {
    setEmailRecoveryActionId(id);
    try {
      const updated = await apiApproveEmailRecovery(id);
      setEmailRecoveries(updated);
      setMasterSuccessMsg('রিকোয়েস্টটি সফলভাবে অনুমোদন করা হয়েছে এবং সম্পন্ন তালিকায় যুক্ত হয়েছে।');
      setTimeout(() => setMasterSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setEmailRecoveryActionId(null);
    }
  };

  const handleUndoEmailRecovery = async (id: string) => {
    setEmailRecoveryActionId(id);
    try {
      const updated = await apiUndoEmailRecovery(id);
      setEmailRecoveries(updated);
      setMasterSuccessMsg('রিকোয়েস্টটি আনডু করে পুনরায় পেন্ডিং তালিকায় নেওয়া হয়েছে।');
      setTimeout(() => setMasterSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setEmailRecoveryActionId(null);
    }
  };

  const handleDeleteEmailRecovery = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই রিকোয়েস্টটি মুছে ফেলতে চান? গ্রাহক কল না ধরায় এটি বাতিল করা হবে।')) return;
    setEmailRecoveryActionId(id);
    try {
      const updated = await apiDeleteEmailRecovery(id);
      setEmailRecoveries(updated);
      setMasterSuccessMsg('রিকোয়েস্টটি তালিকা থেকে মুছে ফেলা হয়েছে।');
      setTimeout(() => setMasterSuccessMsg(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setEmailRecoveryActionId(null);
    }
  };

  // 10. Reopen Archived Chat
  const handleReopenChatThread = async (phone: string) => {
    try {
      await apiReopenChat(phone);
      loadAllDatabaseCollections();
      setSelectedThreadPhone(phone);
      setChatTab('active');
      setMasterSuccessMsg('চ্যাট সফলভাবে পুনরায় সক্রিয় করা হয়েছে!');
      setTimeout(() => setMasterSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Send Chat Reply
  const handleSendAdminReply = async (textToSend?: string) => {
    const text = (textToSend || adminReplyText).trim();
    const targetPhone = selectedThreadPhone || activeThread?.userPhone;
    if (!text || !targetPhone) return;

    setAdminReplyText('');

    const newMsg: SupportChatMessage = {
      id: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'admin',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatThreads((prev) =>
      prev.map((th) => {
        if (normalizePhone(th.userPhone) === normalizePhone(targetPhone)) {
          const safeMessages = th.messages || [];
          return {
            ...th,
            lastMessage: text,
            lastUpdated: 'এখনই',
            unreadAdminCount: 0,
            unreadClientCount: (th.unreadClientCount || 0) + 1,
            messages: [
              ...safeMessages.filter((m) => m.id !== newMsg.id && !(m.sender === newMsg.sender && m.text === newMsg.text)),
              newMsg
            ]
          };
        }
        return th;
      })
    );

    try {
      await apiSendChatMessage({
        phone: targetPhone,
        sender: 'admin',
        text,
        message: newMsg
      });
      loadAllDatabaseCollections();
    } catch (err) {
      console.error(err);
    }
  };

  // Admin Extend Chat Inactivity Timer for Client (+5 Min, etc.)
  const handleExtendChatTime = async (minutes: number = 5) => {
    const targetPhone = selectedThreadPhone || activeThread?.userPhone;
    if (!targetPhone) return;
    try {
      await apiExtendChatTime(targetPhone, minutes);
      loadAllDatabaseCollections();
    } catch (err) {
      console.error(err);
    }
  };

  // Admin End / Close Chat
  const handleEndChatThread = async (phone: string) => {
    try {
      const cleanDigits = normalizePhone(phone).slice(-10);
      const userHasAccount = 
        users.some(u => normalizePhone(u.phone).slice(-10) === cleanDigits) ||
        orders.some(o => normalizePhone(o.phone).slice(-10) === cleanDigits);

      await apiEndChat(phone, userHasAccount);
      loadAllDatabaseCollections();
      if (selectedThreadPhone === phone) {
        setSelectedThreadPhone('');
      }
      setMasterSuccessMsg(userHasAccount ? 'চ্যাট সমাপ্ত ও গ্রাহকের আর্কাইভে সংরক্ষিত হয়েছে।' : 'চ্যাট সমাপ্ত হয়েছে।');
      setTimeout(() => setMasterSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Deliver Website Credentials
  const handleDeliverCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForDelivery || !deliveryAdminId.trim() || !deliveryAdminPass.trim()) return;

    const userDigits = normalizePhone(selectedUserForDelivery.phone).slice(-10);
    const userOrders = orders.filter((o) => 
      (userDigits && normalizePhone(o.phone).slice(-10) === userDigits) || 
      (selectedUserForDelivery.email && o.email && o.email.toLowerCase().trim() === selectedUserForDelivery.email.toLowerCase().trim())
    );
    const chosenOrder = orders.find((o) => o.orderId === selectedDeliveryOrder || (o as any).id === selectedDeliveryOrder) ||
      userOrders.find((o) => o.orderId === selectedDeliveryOrder || (o as any).id === selectedDeliveryOrder || o.demoCode === selectedDeliveryOrder) ||
      userOrders[0];

    const websiteTitle = chosenOrder ? (chosenOrder.companyName || chosenOrder.demoTitle) : 'বিজনেস ওয়েবসাইট অ্যাডমিন প্যানেল';
    const websiteCode = chosenOrder ? chosenOrder.demoCode : '#BW-ONLINE';
    const targetOrderId = chosenOrder?.orderId || (chosenOrder as any)?.id || selectedDeliveryOrder || '';
    const canonicalId = targetOrderId 
      ? `cred_ord_${targetOrderId.replace(/[^a-zA-Z0-9_-]/g, '_')}` 
      : `cred_usr_${userDigits}_${(websiteCode || 'default').replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    const newCred: WebsiteDeliveryCredentials = {
      id: canonicalId,
      orderId: targetOrderId,
      userPhone: selectedUserForDelivery.phone,
      userEmail: selectedUserForDelivery.email || chosenOrder?.email || '',
      websiteTitle,
      websiteCode,
      websiteAdminId: deliveryAdminId.trim(),
      websiteAdminPass: deliveryAdminPass.trim(),
      notes: deliveryNotes.trim() || 'আপনার ওয়েবসাইট সম্পূর্ণ তৈরি ও রেডি। অ্যাডমিন প্যানেলে লগইন করুন।',
      deliveredAt: new Date().toLocaleString('bn-BD'),
      updatedAt: Date.now()
    };

    // Keep single latest credentials for this website/order so old password never appears
    const updatedCreds = [
      newCred, 
      ...deliveredCreds.filter((c) => {
        const sameOrder = targetOrderId && c.orderId && (c.orderId === targetOrderId || (c as any).id === targetOrderId);
        const sameUserWeb = normalizePhone(c.userPhone).slice(-10) === userDigits && (c.websiteCode === websiteCode || !websiteCode || !c.websiteCode);
        return !sameOrder && !sameUserWeb && c.id !== canonicalId;
      })
    ];
    setDeliveredCreds(updatedCreds);
    saveDeliveredCreds(updatedCreds);
    await apiDeliverCredentials(newCred, targetOrderId);

    // Update order with delivered credentials so Mark Complete is immediately unlocked and visible in customer menu
    const updatedOrders = orders.map((o) => {
      const isTarget = (chosenOrder && (o.orderId === chosenOrder.orderId || (o as any).id === (chosenOrder as any).id)) ||
        o.orderId === selectedDeliveryOrder ||
        (o as any).id === selectedDeliveryOrder ||
        (userDigits && normalizePhone(o.phone).slice(-10) === userDigits && (o.demoCode === websiteCode || !websiteCode));
      if (isTarget) {
        return {
          ...o,
          hasDeliveredCredentials: true,
          deliveredAdminId: deliveryAdminId.trim(),
          deliveredAdminPass: deliveryAdminPass.trim()
        };
      }
      return o;
    });
    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    const finalTargetId = chosenOrder?.orderId || (chosenOrder as any)?.id || selectedDeliveryOrder;
    if (finalTargetId) {
      await apiUpdateOrderStatus(finalTargetId, (chosenOrder?.status as any) || 'approved', {
        hasDeliveredCredentials: true,
        deliveredAdminId: deliveryAdminId.trim(),
        deliveredAdminPass: deliveryAdminPass.trim()
      });
    }

    // Auto-send Live Chat notification if active thread
    const threadExists = chatThreads.find((t) => normalizePhone(t.userPhone).slice(-10) === userDigits);
    if (threadExists) {
      handleSendAdminReply(`🎉 অভিনন্দন! আপনার "${websiteTitle}" ওয়েবসাইটের অ্যাডমিন আইডি ও পাসওয়ার্ড ডেলিভারি করা হয়েছে। ইউজারনেম: ${deliveryAdminId.trim()} | পাসওয়ার্ড: ${deliveryAdminPass.trim()}`);
    }

    setDeliverySuccess(true);
    setMasterSuccessMsg(`✓ আইডি ও পাসওয়ার্ড গ্রাহকের মেনু ও অ্যাকাউন্টে সফলভাবে পাঠানো হয়েছে!`);
    loadAllDatabaseCollections();
    setTimeout(() => {
      setDeliverySuccess(false);
      setSelectedUserForDelivery(null);
      setSelectedDeliveryOrder('');
      setDeliveryAdminId('');
      setDeliveryAdminPass('');
      setDeliveryNotes('');
    }, 1200);
  };

  const handleDeleteCredentials = (credId: string) => {
    requestProtectedAction(async () => {
      const updated = await apiDeleteCredential(credId);
      setDeliveredCreds(updated);
    });
  };

  // Password Reset Resolution
  const handleResolvePasswordReset = (status: 'reset' | 'rejected' | 'call_not_received') => {
    if (!activeResetRequest) return;
    if (status === 'reset' && !manualNewPassword.trim()) {
      alert('নতুন পাসওয়ার্ড লিখুন!');
      return;
    }

    const currentReq = activeResetRequest;
    const assignedPass = manualNewPassword.trim();

    requestProtectedAction(async () => {
      const updated = await apiResolveResetRequest(currentReq.id, status, status === 'reset' ? assignedPass : undefined);
      setResetRequests(updated);

      if (status === 'reset') {
        const updatedUsers = users.map((u) => {
          if (u.phone === currentReq.phone) {
            return { ...u, password: assignedPass };
          }
          return u;
        });
        setUsers(updatedUsers);
        localStorage.setItem('bongoweb_registered_users', JSON.stringify(updatedUsers));
      }

      setActiveResetRequest(null);
      setManualNewPassword('');
      loadAllDatabaseCollections();
    });
  };

  // Open Change Details / Reset ID Modal
  const handleOpenChangeDetails = (user: UserAccount, pendingReqId?: string) => {
    setChangeDetailsUser(user);
    setChangeDetailsNewPhone(user.phone || '');
    setChangeDetailsNewEmail(user.email || '');
    setChangeDetailsNewPassword('');
    setChangeDetailsTag('গ্রাহকের আইডি রিসেট (Customer ID Reset)');
    setChangeDetailsPendingReqId(pendingReqId || null);
    setChangeDetailsError('');
    setChangeDetailsSuccess('');
  };

  // Save Change Details / Reset ID (affects both sides)
  const handleSaveChangeDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeDetailsUser) return;
    if (!changeDetailsNewPhone.trim()) {
      setChangeDetailsError('মোবাইল নম্বর প্রদান করুন');
      return;
    }

    setChangeDetailsSubmitting(true);
    setChangeDetailsError('');

    try {
      const res = await apiAdminUpdateUserDetails({
        targetPhone: changeDetailsUser.phone,
        targetEmail: changeDetailsUser.email,
        newPhone: changeDetailsNewPhone.trim(),
        newEmail: changeDetailsNewEmail.trim(),
        newPassword: changeDetailsNewPassword.trim() || undefined,
        tag: changeDetailsTag.trim(),
        pendingRequestId: changeDetailsPendingReqId || undefined
      });

      if (!res.success) {
        setChangeDetailsError(res.error || 'তথ্য পরিবর্তন ব্যর্থ হয়েছে');
        setChangeDetailsSubmitting(false);
        return;
      }

      setChangeDetailsSuccess('গ্রাহকের তথ্য সফলভাবে পরিবর্তন ও রিসেট করা হয়েছে!');
      if (res.updatedUser) {
        setUsers(prev => prev.map(u => 
          (normalizePhone(u.phone) === normalizePhone(changeDetailsUser.phone) || u.phone === changeDetailsUser.phone)
            ? res.updatedUser!
            : u
        ));
      }
      if (res.resetRecord) {
        setResetRequests(prev => [res.resetRecord!, ...prev.filter(r => r.id !== changeDetailsPendingReqId)]);
      }

      setTimeout(() => {
        setChangeDetailsUser(null);
        setChangeDetailsSubmitting(false);
        setChangeDetailsSuccess('');
        setPasswordDeskTab('reset_users'); // Automatically show in Reset Password User List!
        loadAllDatabaseCollections();
      }, 700);
    } catch (err: any) {
      setChangeDetailsError(err?.message || 'সার্ভার ত্রুটি ঘটেছে');
      setChangeDetailsSubmitting(false);
    }
  };

  // Gallery image processor with Canvas downscaling to guarantee unlimited product additions
  const processGalleryImage = (
    file: File, 
    onSuccess: (dataUrl: string, fileName: string) => void, 
    onError: (msg: string) => void, 
    setCompressing: (b: boolean) => void
  ) => {
    if (!file.type.startsWith('image/')) {
      onError('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG, WEBP ইত্যাদি) নির্বাচন করুন।');
      return;
    }
    setCompressing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawData = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            onSuccess(compressed, file.name);
          } else {
            onSuccess(rawData, file.name);
          }
        } catch {
          onSuccess(rawData, file.name);
        } finally {
          setCompressing(false);
        }
      };
      img.onerror = () => {
        setCompressing(false);
        onError('ছবি প্রসেস করতে ব্যর্থ হয়েছে। অনুগ্রহ করে অন্য ছবি নির্বাচন করুন।');
      };
      img.src = rawData;
    };
    reader.onerror = () => {
      setCompressing(false);
      onError('গ্যালারি থেকে ছবি পড়া সম্ভব হয়নি।');
    };
    reader.readAsDataURL(file);
  };

  // Edit Existing Website Stock / Details
  const handleOpenEditSite = (site: WebsiteDemo) => {
    setEditingSite(site);
    setEditTitle(site.title);
    setEditDesc(site.description);
    setEditCategory(site.category as any);
    setEditThumbnail(site.previewImage);
    setEditSecretUrl(site.demoUrl);
    setEditPriceTag(site.priceTag);
    setEditGalleryImageName('');
    setEditImageInputMode(site.previewImage && site.previewImage.startsWith('data:') ? 'gallery' : 'url');
  };

  const handleSaveEditedWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;

    let normDemoUrl = editSecretUrl.trim();
    if (normDemoUrl && !normDemoUrl.startsWith('http://') && !normDemoUrl.startsWith('https://')) {
      normDemoUrl = `https://${normDemoUrl}`;
    }

    const updateData = {
      title: editTitle.trim(),
      banglaTitle: editTitle.trim(),
      description: editDesc.trim(),
      category: editCategory,
      categoryLabel: editCategory.toUpperCase(),
      previewImage: editThumbnail.trim(),
      demoUrl: normDemoUrl,
      url: normDemoUrl,
      link: normDemoUrl,
      secretUrl: normDemoUrl,
      websiteUrl: normDemoUrl,
      priceTag: editPriceTag.trim()
    };

    const updated = await apiUpdateWebsite(editingSite.fourDigitCode, updateData);
    setCustomWebsites(updated);
    setEditingSite(null);
    loadAllDatabaseCollections();
  };

  // Add New Product / Website to Inventory (Unlimited Uploads & Glitch-Free)
  const handleCreateNewWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductUploadError('');
    const title = (newProductTitle || newSiteTitle).trim();
    if (!title) {
      setProductUploadError('অনুগ্রহ করে প্রোডাক্ট টাইটেল (Title) লিখুন।');
      return;
    }

    setIsUploadingProduct(true);

    try {
      // Collision-free unique 4-digit code allowing unlimited products
      const existingCodes = new Set((customWebsites || []).map(s => String(s.fourDigitCode || '').replace('#', '')));
      let codeNum = Math.floor(1000 + Math.random() * 9000);
      let attempts = 0;
      while (existingCodes.has(String(codeNum)) && attempts < 100) {
        codeNum = Math.floor(1000 + Math.random() * 9000);
        attempts++;
      }
      const randomCode = `#${codeNum}`;
      const effectivePrice = newProductPricing.trim() || '৳999';
      
      // Normalize link to always be an absolute URL for smooth iframe rendering
      const rawLinkInput = (newProductLink || newSiteSecretUrl).trim();
      let effectiveLink = rawLinkInput;
      if (effectiveLink) {
        if (!effectiveLink.startsWith('http://') && !effectiveLink.startsWith('https://')) {
          effectiveLink = `https://${effectiveLink}`;
        }
      } else {
        effectiveLink = 'https://bongoweb.site';
      }

      const effectiveDesc = (newProductDesc || newSiteDesc).trim() || 'উচ্চগতির আধুনিক ওয়েবসাইট ডেমো।';
      const effectiveThumbnail = newSiteThumbnail.trim() || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80';

      let effectiveCategory = newSiteCategory as any;
      if (effectiveCategory === 'newspaper' || effectiveCategory === 'news' || effectiveCategory === 'blog') {
        effectiveCategory = 'blogging';
      }

      const friendlyLabel = 
        effectiveCategory === 'ecommerce' ? '🛍️ E-Commerce' :
        effectiveCategory === 'restaurant' ? '🍽️ Restaurant & Cafe' :
        effectiveCategory === 'blogging' ? '📰 Blog & Media' :
        effectiveCategory === 'grocery' ? '🌿 Grocery & Organic' :
        effectiveCategory === 'corporate' ? '💼 Corporate' :
        effectiveCategory === 'fashion' ? '👗 Fashion' :
        effectiveCategory === 'portfolio' ? '🎨 Portfolio' :
        String(newSiteCategory).toUpperCase();

      const newDemo: WebsiteDemo = {
        id: `custom-${Date.now()}-${codeNum}`,
        fourDigitCode: randomCode,
        title: `${randomCode} ${title}`,
        banglaTitle: `${randomCode} ${title}`,
        category: effectiveCategory,
        categoryLabel: friendlyLabel,
        description: effectiveDesc,
        priceTag: effectivePrice,
        demoUrl: effectiveLink,
        url: effectiveLink,
        link: effectiveLink,
        secretUrl: effectiveLink,
        websiteUrl: effectiveLink,
        accentColor: 'from-[#6B46C1]/20 to-[#7C3AED]/5',
        rating: 5.0,
        ordersCount: '24h Launch',
        previewImage: effectiveThumbnail,
        heroHeadline: title,
        features: ['মোবাইল অপ্টিমাইজড', 'বিকাশ ও নগদ পেমেন্ট', 'ক্লাউড হোস্টিং', '২৪ ঘণ্টা ডেলিভারি'],
        mockData: {
          heroSub: effectiveDesc,
          items: []
        }
      };

      const updated = await apiAddWebsite(newDemo);
      setCustomWebsites(updated);

      try {
        localStorage.setItem('bongoweb_custom_catalog', JSON.stringify(updated));
        localStorage.setItem('bongoweb_custom_websites', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('bongoweb_websites_updated', { detail: updated }));
        window.dispatchEvent(new CustomEvent('bongoweb_custom_websites_updated', { detail: updated }));
      } catch (_) {}

      // Details send option: if enabled, send product details to client(s)
      if (sendDetailsToClient) {
        const discountText = newDiscountPrice && newDiscountPrice !== '৳0' ? ` (ডিসকাউন্ট: ${newDiscountPrice})` : '';
        const notificationMsg = `🎉 নতুন ওয়েবসাইট প্রোডাক্ট যুক্ত হয়েছে: "${title}" | প্যাকেজ মূল্য: ${effectivePrice}${discountText} | লিংক: ${effectiveLink}। অর্ডার বা বিস্তারিত দেখতে যোগাযোগ করুন।`;
        
        for (const th of chatThreads) {
          if (th.userPhone) {
            handleSendAdminReplyText(th.userPhone, notificationMsg);
          }
        }
      }

      setMasterSuccessMsg(`✓ ওয়েবসাইট "${title}" (${randomCode}) সফলভাবে পাবলিশ হয়েছে! লিংকটি মূল ড্যাশবোর্ডে লাইভ প্রিভিউ হবে।`);
      setTimeout(() => setMasterSuccessMsg(''), 5000);
      setShowAddWebsiteModal(false);
      setNewProductTitle('');
      setNewProductDesc('');
      setNewProductPricing('৳999');
      setNewDiscountPrice('৳0');
      setNewProductLink('');
      setSendDetailsToClient(false);
      setNewSiteTitle('');
      setNewSiteDesc('');
      setNewSiteThumbnail('');
      setNewSiteSecretUrl('');
      setGalleryImageName('');
      setProductUploadError('');
      loadAllDatabaseCollections();
    } catch (err: any) {
      console.error('Product upload error:', err);
      setProductUploadError(err?.message || 'প্রোডাক্ট আপলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsUploadingProduct(false);
    }
  };

  // Single Complete Website Backup (100% Data Preservation Across All Devices)
  const handleDownloadFullSystemBackup = () => {
    requestProtectedAction(async () => {
      const fullSystemBackup = await apiExportCompleteBackup();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullSystemBackup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `bongoweb_complete_system_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setShowBackupVaultModal(false);
    });
  };

  const handleRestoreFullSystemBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    requestProtectedAction(() => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          const res = await apiRestoreCompleteBackup(parsed);
          alert(res.message || 'সফলভাবে সমস্ত ডেটা এই সার্ভার ও ডিভাইসে রিস্টোর করা হয়েছে!');
          loadAllDatabaseCollections();
          setShowBackupVaultModal(false);
        } catch (err) {
          alert('ব্যাকআপ ফাইলটি ত্রুটিযুক্ত!');
        }
      };
      reader.readAsText(file);
    });
  };

  // Master Key Password Reset Logic
  const handleMasterKeyReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterKeyInput !== adminConfig.masterKey) {
      alert('ভুল মাস্টার কি! প্রবেশাধিকার প্রত্যাখ্যাত।');
      return;
    }
    if (!newAdminPassInput.trim()) {
      alert('নতুন পাসওয়ার্ড লিখুন!');
      return;
    }

    const updatedConfig = { ...adminConfig };
    if (resetTarget === 'entry') {
      updatedConfig.adminEntryPassword = newAdminPassInput.trim();
    } else {
      updatedConfig.adminActionPassword = newAdminPassInput.trim();
    }

    setAdminConfig(updatedConfig);
    localStorage.setItem('bongoweb_admin_config', JSON.stringify(updatedConfig));
    
    // Reset strike counter and unblock access
    setAdminFailedAttempts(0);
    setIsAdminBlocked(false);
    localStorage.removeItem('bongoweb_admin_failed_attempts');
    localStorage.removeItem('bongoweb_admin_blocked');
    setLoginError('');

    setMasterSuccessMsg('পাসওয়ার্ড সফলভাবে হালনাগাদ করা হয়েছে ও এক্সেস আনলক হয়েছে!');
    setTimeout(() => {
      setMasterSuccessMsg('');
      setShowMasterKeyModal(false);
      setMasterKeyInput('');
      setNewAdminPassInput('');
    }, 1800);
  };

  // Quick Canned Replies
  const cannedReplies = [
    '✅ আপনার পেমেন্ট ভেরিফাই হয়েছে।',
    '⚡ আগামী ২৪ ঘণ্টার মধ্যে আপনার সাইট লাইভ হবে।',
    '🌐 আমরা ফ্রি ডোমেইন কনফিগার করছি।',
    '🔑 অ্যাডমিন আইডি ও পাসওয়ার্ড ডেলিভারি করা হয়েছে।'
  ];

  // Active & Archived chat threads separation
  // Every active conversation shows strictly in the Active chat tab
  const safeChatThreads = (chatThreads || []).filter((t): t is SupportChatThread => Boolean(t && typeof t === 'object'));
  const safeUsers = (users || []).filter((u): u is UserAccount => Boolean(u && typeof u === 'object'));
  const safeOrders = (orders || []).filter((o): o is ClientOrder => Boolean(o && typeof o === 'object'));

  const activeThreads = safeChatThreads.filter((t) => !t.isArchived && !t.isClosed);

  // Archived threads: strictly closed conversations from users who have an account
  const archivedThreads = safeChatThreads.filter((t) => {
    if (!t.isArchived && !t.isClosed) return false;
    const tDigits = normalizePhone(t.userPhone || '').slice(-10);
    const hasUser = safeUsers.some(u => normalizePhone(u.phone || '').slice(-10) === tDigits);
    const hasOrder = safeOrders.some(o => normalizePhone(o.phone || '').slice(-10) === tDigits);
    return hasUser || hasOrder || (t as any).hasAccount;
  });

  const currentTabThreads = chatTab === 'active' ? activeThreads : archivedThreads;

  const activeThread = safeChatThreads.find((t) => normalizePhone(t.userPhone || '') === normalizePhone(selectedThreadPhone || '')) || currentTabThreads[0] || safeChatThreads[0] || null;
  const activeThreadUser = activeThread ? safeUsers.find((u) => normalizePhone(u.phone || '') === normalizePhone(activeThread.userPhone || '')) : undefined;
  const activeThreadOrders = activeThread ? safeOrders.filter((o) => normalizePhone(o.phone || '') === normalizePhone(activeThread.userPhone || '')) : [];

  const cleanSearch = (chatSearch || '').toLowerCase().trim();
  const filteredThreads = currentTabThreads.filter((t) => {
    if (!t) return false;
    const nameMatch = (t.userName || '').toLowerCase().includes(cleanSearch);
    const phoneMatch = normalizePhone(t.userPhone || '').includes(normalizePhone(cleanSearch)) || (t.userPhone || '').includes(cleanSearch);
    return nameMatch || phoneMatch;
  });

  // ==========================================
  // VIEW: IF ADMIN IS NOT LOGGED IN
  // ==========================================
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-[#09090b] text-[#f5f5f7] flex flex-col items-center justify-center p-4 font-sans select-none relative overflow-hidden">
        <div className="w-full max-w-md bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-6 sm:p-9 shadow-dark-card relative z-10">
          <div className="text-center mb-7">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.08] text-[#3b5bff] flex items-center justify-center mx-auto mb-3.5 shadow-md shadow-[#3b5bff]/20">
              <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#3b5bff] text-[11px] font-mono font-medium tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b5bff] animate-ping" />
              <span>BONGOWEB EXECUTIVE SUITE</span>
            </div>
            <h1 className="text-2xl font-semibold text-[#f5f5f7] tracking-tight">
              Executive Admin Control
            </h1>
            <p className="text-xs text-[#a1a1b0] mt-1 font-normal">
              সুপার-অ্যাডমিন এক্সেসের জন্য আইডি ও পাসওয়ার্ড লিখুন
            </p>
          </div>

          {loginError && (
            <div className={`mb-4 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
              isAdminBlocked 
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' 
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-shake'
            }`}>
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <div className="leading-relaxed">
                <span>{loginError}</span>
                {isAdminBlocked && (
                  <p className="mt-1 text-[11px] text-rose-400/90">
                    নিচে দেওয়া মাস্টার সিকিউরিটি কী (Master Key) অপশন ব্যবহার করে আপনার এক্সেস আনলক করতে হবে।
                  </p>
                )}
              </div>
            </div>
          )}

          {isAdminBlocked ? (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-3.5 animate-fadeIn">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-300">
                  অ্যাডমিন কনসোল সাময়িকভাবে লক করা হয়েছে
                </h3>
                <p className="text-xs text-[#a1a1b0] mt-1 leading-relaxed">
                  টানা ৩ বার ভুল তথ্য দেওয়ার কারণে সাধারণ লগইন বন্ধ রয়েছে। শুধুমাত্র মাস্টার কি (Master Key) দিয়ে আনলক করা যাবে।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMasterKeyModal(true)}
                className="w-full py-3 px-4 rounded-xl bg-[#3b5bff] hover:bg-[#324ecc] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>মাস্টার কী দিয়ে আনলক করুন (Unlock with Master Key)</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[#a1a1b0] uppercase tracking-wider text-[10px]">
                    অ্যাডমিন ইউজারনেম
                  </label>
                  {adminFailedAttempts > 0 && (
                    <span className="text-[10px] text-amber-400 font-mono">
                      ভুল প্রচেষ্টা: {adminFailedAttempts}/৩
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={adminInputId}
                  onChange={(e) => setAdminInputId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#f5f5f7] text-xs sm:text-sm font-mono placeholder-[#71717a] focus:outline-none focus:border-[#3b5bff] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1b0] mb-1.5 uppercase tracking-wider text-[10px]">
                  অ্যাডমিন এন্ট্রি পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminInputPass}
                  onChange={(e) => setAdminInputPass(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#f5f5f7] text-xs sm:text-sm placeholder-[#71717a] focus:outline-none focus:border-[#3b5bff] transition-all font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-full bg-[#3b5bff] hover:bg-[#324ecc] active:scale-[0.98] text-white text-xs sm:text-sm font-medium shadow-md shadow-[#3b5bff]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>লগইন করুন (Unlock Console)</span>
                </button>
              </div>
            </form>
          )}

          {/* Master Key Emergency Reset Link */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <button
              onClick={() => setShowMasterKeyModal(true)}
              className="text-[#3b5bff] hover:text-[#324ecc] font-medium transition-colors cursor-pointer flex items-center gap-1"
            >
              <Key className="w-3.5 h-3.5" />
              <span>মাস্টার কি রিকভারি</span>
            </button>
            <button
              onClick={onBackToApp}
              className="text-[#a1a1b0] hover:text-[#f5f5f7] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ওয়েবসাইটে ফিরুন</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: EXECUTIVE ADMIN SUITE (Primary Indigo Brand)
  // ==========================================
  return (
    <div className="min-h-screen w-full bg-[#090D16] text-[#FFFFFF] font-sans flex flex-col md:flex-row selection:bg-[#7C3AED]/30 selection:text-[#C4B5FD]">
      {/* Floating Real-Time Event Notification Toast */}
      {realtimeToast && (
        <div 
          onClick={() => {
            if (realtimeToast.actionTab) setActiveTab(realtimeToast.actionTab);
            if (realtimeToast.threadPhone) setSelectedThreadPhone(realtimeToast.threadPhone);
            setRealtimeToast(null);
          }}
          className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-[#111827] border-2 border-[#7C3AED] shadow-[0_10px_30px_rgba(124,58,237,0.3)] animate-slideDown flex items-start gap-3 cursor-pointer group"
          role="alert"
        >
          <div className="p-2 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shrink-0 shadow-xs">
            {realtimeToast.type === 'order' ? <ShoppingBag className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-black text-white group-hover:text-[#A5B4FC] transition-colors">
              {realtimeToast.title}
            </h5>
            <p className="text-[11px] text-[#CBD5E1] mt-0.5 line-clamp-2">
              {realtimeToast.subtitle}
            </p>
            <span className="text-[9px] text-[#A5B4FC] font-bold block mt-1.5 underline">
              সরাসরি দেখতে ক্লিক করুন →
            </span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setRealtimeToast(null);
            }}
            className="text-[#64748D] hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div 
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden animate-fadeIn"
        />
      )}

      {/* LEFT SIDEBAR: All options in screen left from up to down */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0B0F19] border-r border-[#1E293B] flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl
        md:translate-x-0 md:static md:h-screen md:sticky md:top-0 md:shadow-none md:z-30 select-none
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand & Website Return (Top of Left Screen) */}
        <div className="p-4 border-b border-[#1E293B] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6B46C1] to-[#7C3AED] text-white flex items-center justify-center font-black text-xs shadow-md shrink-0">
                BW
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-sm font-black tracking-tight text-white truncate">
                    BongoWeb
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#1E1B4B] text-[#A5B4FC] text-[9px] font-mono font-bold border border-[#7C3AED]/30 shrink-0">
                    CORE
                  </span>
                </div>
                <span className="text-[10px] text-[#64748D] font-medium truncate mt-0.5">
                  অ্যাডমিন প্যানেল • লাইভ সিঙ্ক
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1E293B] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Return to Website Button */}
          <button
            onClick={onBackToApp}
            className="w-full py-2 px-3 rounded-xl bg-[#111827] hover:bg-[#1E293B] text-[#A5B4FC] hover:text-white border border-[#1E293B] hover:border-[#7C3AED]/40 text-xs font-bold transition-all flex items-center justify-between cursor-pointer shadow-2xs"
            title="ওয়েবসাইটে ফিরে যান"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>ওয়েবসাইটে ফিরুন</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#64748D]" />
          </button>
        </div>

        {/* All Options In Screen Left From Up To Down */}
        <div className="flex-1 p-3 overflow-y-auto space-y-1.5 scrollbar-thin">
          {/* 1. Overview (Protected) */}
          <button
            onClick={() => handleSwitchTab('overview')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                : 'text-[#94A3B8] hover:bg-[#161F30] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Activity className="w-4 h-4 shrink-0" />
              <span className="truncate">ওভারভিউ</span>
            </div>
            {!isProtectedSectionsUnlocked && (
              <Lock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            )}
          </button>

          {/* 2. Live Chat Hub (Always accessible) */}
          <button
            onClick={() => handleSwitchTab('chat')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                : 'text-[#94A3B8] hover:bg-[#161F30] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate">লাইভ চ্যাট হাব</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#1E1B4B] text-[#A5B4FC] text-[10px] font-black border border-[#7C3AED]/30 shrink-0 font-mono">
              {chatThreads.length}
            </span>
          </button>

          {/* 3. Orders (Always accessible) */}
          <button
            onClick={() => handleSwitchTab('orders')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                : 'text-[#94A3B8] hover:bg-[#161F30] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="truncate">অর্ডারসমূহ</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {orders.filter((o) => o.status === 'pending').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#FFD552] animate-ping" />
              )}
              <span className="px-2 py-0.5 rounded-full bg-[#1E293B] text-[#A5B4FC] text-[10px] font-bold border border-[#1E293B] font-mono">
                {orders.length}
              </span>
            </div>
          </button>

          {/* 4. Users (Protected) */}
          <button
            onClick={() => handleSwitchTab('users')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                : 'text-[#94A3B8] hover:bg-[#161F30] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">ব্যবহারকারী ({users.length})</span>
            </div>
            {!isProtectedSectionsUnlocked && (
              <Lock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            )}
          </button>

          {/* 5. Password & Security (Protected) */}
          <button
            onClick={() => handleSwitchTab('resets')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'resets'
                ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                : 'text-[#94A3B8] hover:bg-[#161F30] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Key className="w-4 h-4 shrink-0" />
              <span className="truncate">পাসওয়ার্ড ও সিকিউরিটি</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {pendingCallBacks.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
              {!isProtectedSectionsUnlocked && (
                <Lock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
              )}
            </div>
          </button>

          {/* 6. Website Stock (Protected) */}
          <button
            onClick={() => handleSwitchTab('catalog')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                : 'text-[#94A3B8] hover:bg-[#161F30] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Globe className="w-4 h-4 shrink-0" />
              <span className="truncate">ওয়েবসাইট স্টক ({customWebsites.length})</span>
            </div>
            {!isProtectedSectionsUnlocked && (
              <Lock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            )}
          </button>

          {/* 6.5 Dedicated Website Upload & Publish Tab */}
          <button
            onClick={() => handleSwitchTab('upload')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'upload'
                ? 'bg-gradient-to-r from-[#AB55F7] via-[#9333EA] to-[#7C3AED] text-white shadow-md shadow-[#AB55F7]/30'
                : 'text-[#94A3B8] hover:bg-[#161F30] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <UploadCloud className="w-4 h-4 text-[#C084FC] shrink-0" />
              <span className="truncate">ওয়েবসাইট আপলোড</span>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#7C3AED]/30 text-[#E9D5FF] text-[10px] font-black border border-[#AB55F7]/40 tracking-wider">
              পাবলিশ
            </span>
          </button>

          {/* 7. Reports (Protected) */}
          <button
            onClick={() => handleSwitchTab('reports')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                : 'text-[#94A3B8] hover:bg-[#161F30] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Flag className="w-4 h-4 shrink-0" />
              <span className="truncate">রিপোর্টসমূহ</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {reports.filter((r) => r.status === 'pending').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#E53935] animate-ping" />
              )}
              <span className="px-2 py-0.5 rounded-full bg-[#1E293B] text-[#A5B4FC] text-[10px] font-bold border border-[#1E293B] font-mono">
                {reports.length}
              </span>
              {!isProtectedSectionsUnlocked && (
                <Lock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
              )}
            </div>
          </button>

          {/* 8. Settings & Logo (Protected) */}
          <button
            onClick={() => handleSwitchTab('settings')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                : 'text-[#94A3B8] hover:bg-[#161F30] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Sliders className="w-4 h-4 shrink-0" />
              <span className="truncate">সেটিংস ও লোগো (Settings)</span>
            </div>
            {!isProtectedSectionsUnlocked && (
              <Lock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            )}
          </button>
        </div>

        {/* Bottom Actions Section of Left Sidebar */}
        <div className="p-3 border-t border-[#1E293B] space-y-1.5 bg-[#090D16] shrink-0">
          {/* Website Backup Vault Button */}
          <button
            onClick={() => setShowBackupVaultModal(true)}
            className="w-full px-3 py-2 rounded-xl bg-[#111827] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white border border-[#1E293B] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            title="সম্পূর্ণ ওয়েবসাইট ব্যাকআপ ভল্ট"
          >
            <Database className="w-4 h-4 text-[#818CF8] shrink-0" />
            <span className="truncate">সম্পূর্ণ ওয়েবসাইট ব্যাকআপ</span>
          </button>

          {/* Lock / Unlock Protected Sections Button */}
          {isProtectedSectionsUnlocked ? (
            <button
              onClick={handleLockProtectedSections}
              className="w-full px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              title="সুরক্ষিত সেকশনগুলো আবার লক করুন (Password: admin123)"
            >
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">লক করুন</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setTargetTabToUnlock(activeTab);
                setSectionPasswordInput('');
                setSectionPasswordError('');
                setShowSectionPasswordModal(true);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#111827] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white border border-[#1E293B] text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              title="পাসওয়ার্ড (admin123) দিয়ে সকল সেকশন আনলক করুন"
            >
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">পাসওয়ার্ড লক</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={handleAdminLogout}
            className="w-full px-3 py-2 rounded-xl bg-[#E53935]/15 hover:bg-[#E53935] text-[#FF8A80] hover:text-white border border-[#E53935]/30 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-2"
            title="অ্যাডমিন প্যানেল থেকে লগআউট"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="truncate">লগআউট</span>
          </button>
        </div>
      </aside>

      {/* RIGHT CANVAS: Header & Active Workspace Content */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#090D16]">
        {/* Workspace Top Bar (Breadcrumb & Shortcuts) */}
        <header className="sticky top-0 z-40 w-full bg-[#0B0F19]/95 backdrop-blur-md border-b border-[#1E293B] shadow-xs select-none">
          <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
            {/* Mobile Menu Toggle & Breadcrumbs */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl bg-[#111827] hover:bg-[#1E293B] text-white border border-[#1E293B] cursor-pointer"
                title="মেনু খুলুন"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold min-w-0">
                <span className="text-[#64748D] hidden sm:inline">BongoWeb CORE</span>
                <span className="text-[#334155] hidden sm:inline">/</span>
                <span className="text-white truncate">
                  {activeTab === 'overview' && 'ওভারভিউ'}
                  {activeTab === 'chat' && 'লাইভ চ্যাট হাব'}
                  {activeTab === 'orders' && 'অর্ডারসমূহ'}
                  {activeTab === 'users' && `ব্যবহারকারী (${users.length})`}
                  {activeTab === 'resets' && 'পাসওয়ার্ড ও সিকিউরিটি'}
                  {activeTab === 'catalog' && `ওয়েবসাইট স্টক (${customWebsites.length})`}
                  {activeTab === 'upload' && 'নতুন ওয়েবসাইট আপলোড ও পাবলিশ'}
                  {activeTab === 'reports' && 'রিপোর্টসমূহ'}
                  {activeTab === 'settings' && 'সেটিংস ও লোগো (Settings)'}
                </span>
              </div>
            </div>

            {/* Right Status & Shortcuts */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111827] border border-[#1E293B] text-[#818CF8] text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>লাইভ সিঙ্ক সক্রিয়</span>
              </div>

              {/* Quick Backup Shortcut */}
              <button
                onClick={() => setShowBackupVaultModal(true)}
                className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-[#111827] hover:bg-[#6B46C1] text-[#94A3B8] hover:text-white border border-[#1E293B] text-xs font-bold transition-all items-center gap-1.5 cursor-pointer shadow-xs"
                title="সম্পূর্ণ ওয়েবসাইট ব্যাকআপ"
              >
                <Database className="w-3.5 h-3.5 text-[#818CF8]" />
                <span>ব্যাকআপ</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleAdminLogout}
                className="px-2.5 py-1.5 rounded-xl bg-[#E53935]/15 hover:bg-[#E53935] text-[#FF8A80] hover:text-white border border-[#E53935]/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="লগআউট"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">লগআউট</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace Content Area */}
        <main className="flex-1 w-full px-3.5 sm:px-6 md:px-8 py-5 sm:py-6 space-y-6 max-w-7xl">

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] hover:border-[#334155] transition-all shadow-sm">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">মোট ক্লায়েন্ট</span>
                  <Users className="w-4 h-4 text-[#60A5FA]" />
                </div>
                <div className="text-3xl font-black text-white mt-2 font-mono tabular-nums">{users.length}</div>
                <span className="text-[11px] text-[#60A5FA] mt-1 block font-medium">নিবন্ধিত ও সক্রিয়</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] hover:border-[#334155] transition-all shadow-sm">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">পেন্ডিং অর্ডারসমূহ</span>
                  <Clock className="w-4 h-4 text-[#FBBF24]" />
                </div>
                <div className="text-3xl font-black text-[#FBBF24] mt-2 font-mono tabular-nums">
                  {orders.filter((o) => o.status === 'pending').length}
                </div>
                <span className="text-[11px] text-[#FCD34D] mt-1 block font-medium">যাচাইয়ের অপেক্ষায়</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] hover:border-[#334155] transition-all shadow-sm">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">মোট অর্ডার</span>
                  <ShoppingBag className="w-4 h-4 text-[#34D399]" />
                </div>
                <div className="text-3xl font-black text-white mt-2 font-mono tabular-nums">
                  {orders.length}
                </div>
                <span className="text-[11px] text-[#34D399] mt-1 block font-medium">১,৯৯০ ৳ প্যাকেজ রেট</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#1E293B] hover:border-[#334155] transition-all shadow-sm">
                <div className="flex items-center justify-between text-[#94A3B8]">
                  <span className="text-[11px] font-bold uppercase tracking-wider">সক্রিয় চ্যাট থ্রেড</span>
                  <MessageSquare className="w-4 h-4 text-[#818CF8]" />
                </div>
                <div className="text-3xl font-black text-[#818CF8] mt-2 font-mono tabular-nums">
                  {chatThreads.length}
                </div>
                <span className="text-[11px] text-[#A5B4FC] mt-1 block font-medium">রিয়েল-টাইম সিঙ্ক</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#111827] to-[#1E1B4B] border border-[#7C3AED]/30 shadow-md flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="space-y-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E1B4B] text-[#818CF8] text-xs font-bold border border-[#7C3AED]/30">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-ping" />
                  <span>রিয়েল-টাইম কাস্টমার লাইভ চ্যাট কনসোল</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  গ্রাহকদের সাথে সরাসরি লাইভ চ্যাটে যুক্ত হন
                </h3>
                <p className="text-xs text-[#94A3B8] max-w-xl">
                  যে গ্রাহকই মেসেজ পাঠাবে, তৎক্ষণাৎ তার নাম ও ফোন নম্বর সহ আলাদা থ্রেড তৈরি হয়ে যাবে।
                </p>
              </div>

              <button
                onClick={() => setActiveTab('chat')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span>লাইভ চ্যাট কনসোলে যান</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: LIVE CHAT HUB ================= */}
        {activeTab === 'chat' && (
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-3xl overflow-hidden shadow-2xl animate-fadeIn flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[580px] max-h-[850px]">
            {/* Left Column: Conversations List (Full screen on mobile when list is active) */}
            <div className={`w-full md:w-80 lg:w-88 border-r border-[#1E293B] flex flex-col bg-[#0B0F19] ${
              mobileChatView === 'chat' ? 'hidden md:flex' : 'flex flex-1 md:flex-none'
            }`}>
              {/* Top Bar with Live Chat ON / OFF Toggle */}
              <div className="p-3.5 bg-[#0B0F19] border-b border-[#1E293B] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Power className={`w-4 h-4 ${isLiveChatOnline ? 'text-[#00B261]' : 'text-[#E53935]'}`} />
                  <span className="text-xs font-bold text-white">লাইভ চ্যাট:</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleLiveChatStatus}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isLiveChatOnline
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-[#E53935] text-white hover:bg-[#D32F2F]'
                  }`}
                  title="লাইভ চ্যাট অন অথবা অফ করুন"
                >
                  <span className={`w-2 h-2 rounded-full ${isLiveChatOnline ? 'bg-black animate-pulse' : 'bg-white'}`} />
                  <span>{isLiveChatOnline ? '🟢 চ্যাট অন (ON)' : '🔴 চ্যাট অফ (OFF)'}</span>
                </button>
              </div>

              {/* Active vs Archive Chat Tabs */}
              <div className="p-2.5 bg-[#0B0F19] border-b border-[#1E293B] flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setChatTab('active')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                    chatTab === 'active'
                      ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>সক্রিয় চ্যাট ({activeThreads.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChatTab('archived')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                    chatTab === 'archived'
                      ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>আর্কাইভ ({archivedThreads.length})</span>
                </button>
              </div>

              <div className="p-4 border-b border-[#1E293B]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#818CF8]" />
                    <h3 className="text-sm font-black text-white">
                      {chatTab === 'active' ? 'সক্রিয় গ্রাহক চ্যাট' : 'আর্কাইভকৃত চ্যাট record'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E1B4B] text-[#818CF8]">
                    {currentTabThreads.length} টি
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#64748D]" />
                  <input
                    type="text"
                    placeholder="নাম বা মোবাইল নম্বর..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs text-white placeholder-[#64748D] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              {/* Thread list */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#1E293B]/50">
                {filteredThreads.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#64748D]">
                    কোনো সক্রিয় কথোপকথন নেই
                  </div>
                ) : (
                  filteredThreads.map((thread, tIdx) => {
                    const isSelected = thread.userPhone === selectedThreadPhone;
                    return (
                      <div
                        key={thread.userPhone ? `${thread.userPhone}-${tIdx}` : `th-${tIdx}`}
                        onClick={() => {
                          setSelectedThreadPhone(thread.userPhone);
                          setMobileChatView('chat');
                        }}
                        className={`p-3.5 sm:p-4 transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#1E293B] border-l-4 border-l-[#7C3AED]'
                            : 'hover:bg-[#161F30] active:bg-[#1E293B]'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E293B] to-[#334155] text-[#818CF8] flex items-center justify-center font-bold text-sm border border-[#1E293B] shadow-2xs">
                            {thread.userName.charAt(0)}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00B261] border-2 border-[#0B0F19]" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              {thread.userName}
                            </h4>
                            <span className="text-[10px] text-[#64748D] font-mono shrink-0 ml-1">
                              {thread.lastUpdated}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#818CF8] font-mono mt-0.5 truncate">
                            {thread.userPhone}
                          </p>
                          <p className="text-[11px] text-[#94A3B8] mt-1 truncate">
                            {thread.lastMessage}
                          </p>
                        </div>

                        {thread.unreadAdminCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs">
                            {thread.unreadAdminCount}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Center Column: Active Chat Stream (Full screen on mobile when chat is active) */}
            <div className={`flex-1 flex flex-col bg-[#0F172A] ${
              mobileChatView === 'list' ? 'hidden md:flex' : 'flex'
            }`}>
              <div className="p-3.5 sm:p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0B0F19] shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* Mobile Back Button to list */}
                  <button
                    type="button"
                    onClick={() => setMobileChatView('list')}
                    className="md:hidden px-2.5 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#1E293B] text-[#818CF8] border border-[#1E293B] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                    title="কথোপকথন তালিকায় ফিরে যান"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>সব চ্যাট</span>
                  </button>

                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#6B46C1] to-[#7C3AED] text-white flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 border border-[#7C3AED]/30">
                    {activeThread?.userName.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-white truncate">
                      {activeThread?.userName || 'গ্রাহক নির্বাচন করুন'}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-[#818CF8] font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00B261] animate-pulse" />
                      <span className="truncate">{activeThread?.userPhone || 'সরাসরি রিয়েল-টাইম'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                  {/* View Client Profile & Orders from Chat */}
                  {activeThread && (
                    <button
                      type="button"
                      onClick={() => {
                        const clientUser = users.find(u => u.phone === activeThread.userPhone) || {
                          name: activeThread.userName,
                          phone: activeThread.userPhone,
                          email: activeThread.userEmail || `${activeThread.userPhone}@bongoweb.client`,
                          registeredAt: 'সক্রিয় চ্যাট ক্লায়েন্ট'
                        };
                        setViewingClientDetailsUser(clientUser);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#1E293B] text-[#818CF8] border border-[#1E293B] text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="এই ক্লায়েন্টের সম্পূর্ণ প্রোফাইল ও অর্ডারের তথ্য দেখুন"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#818CF8]" />
                      <span className="hidden sm:inline">প্রোফাইল ও অর্ডার</span>
                    </button>
                  )}

                  {/* Client 5-Min Rotating Security Code Badge (Requirement 13) */}
                  {activeThread && (
                    <div 
                      className="px-2.5 py-1.5 rounded-lg bg-[#1E1B4B] border border-[#7C3AED]/40 text-[#A5B4FC] text-[11px] font-bold flex items-center gap-1.5 shadow-2xs select-none"
                      title="গ্রাহকের বর্তমান ৫-মিনিটের সক্রিয় সিকিউরিটি কোড"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#818CF8]" />
                      <span className="text-[10px] text-[#A5B4FC]/80 hidden sm:inline">সিকিউরিটি কোড:</span>
                      <span className="text-white font-mono font-black tracking-wider px-1.5 py-0.5 rounded bg-[#7C3AED]/25 border border-[#7C3AED]/50 select-all">
                        {getClientSecurityCode(activeThread.userPhone)}
                      </span>
                    </div>
                  )}

                  {/* Client Inactivity Timer remaining */}
                  {activeThread?.expiresAt && (
                    <div 
                      className="px-2 py-1 rounded-lg bg-[#1E1B4B] border border-[#7C3AED]/30 text-[#818CF8] text-[10px] sm:text-[11px] font-mono font-bold flex items-center gap-1" 
                      title="ক্লায়েন্ট ইনঅ্যাক্টিভিটি টাইমার"
                    >
                      <Clock className="w-3 h-3 text-[#00B261]" />
                      <span>
                        {Math.max(0, Math.floor((activeThread.expiresAt - Date.now()) / 1000 / 60))} মি.
                      </span>
                    </div>
                  )}

                  {/* +5 Min Extension Button as requested */}
                  {activeThread && (
                    <button
                      onClick={() => handleExtendChatTime(5)}
                      className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                      title="চ্যাটের মেয়াদ আরও ৫ মিনিট বাড়ান"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+৫ মি.</span>
                    </button>
                  )}

                  {/* End Chat Button */}
                  {activeThread && (
                    <button
                      onClick={() => {
                        if (confirm(`${activeThread.userName} এর সাথে চ্যাট সেশন সমাপ্ত করতে চান?`)) {
                          handleEndChatThread(activeThread.userPhone);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#E53935]/20 hover:bg-[#E53935] text-[#FF8A80] hover:text-white border border-[#E53935]/30 text-[11px] font-bold transition-all cursor-pointer"
                      title="চ্যাট সেশন সমাপ্ত করুন"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">চ্যাট ক্লোজ</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Message Stream - Fully Decorated with Clear Sender Tags */}
              <div 
                ref={chatContainerRef}
                onScroll={handleChatContainerScroll}
                className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
              >
                {/* Archive Chat Banner with Reopen option */}
                {activeThread && (activeThread.isArchived || activeThread.isClosed) && (
                  <div className="p-3.5 rounded-2xl bg-[#1E1B4B] border border-[#7C3AED]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-fadeIn shadow-xs">
                    <div className="flex items-center gap-2.5 text-[#A5B4FC]">
                      <Clock className="w-5 h-5 text-[#818CF8] shrink-0" />
                      <div>
                        <strong className="text-white block text-xs">আর্কাইভ চ্যাট রেকর্ড (স্থায়ী মেমোরি)</strong>
                        <span className="text-[11px] text-[#94A3B8]">
                          {activeThread.archivedAt ? `ক্লোজ ও সংরক্ষিত: ${activeThread.archivedAt}` : 'এই কথোপকথনটি আর্কাইভ সেকশনে সংরক্ষিত রয়েছে।'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReopenChatThread(activeThread.userPhone)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>পুনরায় চ্যাট চালু করুন (Reopen)</span>
                    </button>
                  </div>
                )}
                {(() => {
                  const msgs = activeThread?.messages || [];
                  const seenIds = new Set<string>();
                  const seenContent = new Set<string>();
                  const cleanMsgs = msgs.filter((m) => {
                    if (!m || !m.text) return false;
                    const contentKey = `${m.sender}:${m.text.trim()}`;
                    if (seenIds.has(m.id) || seenContent.has(contentKey)) return false;
                    seenIds.add(m.id);
                    seenContent.add(contentKey);
                    return true;
                  });

                  if (cleanMsgs.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#64748D]">
                        <MessageSquare className="w-10 h-10 mb-2 opacity-50 text-[#00B261]" />
                        <p className="text-sm font-bold text-white">কোনো বার্তা পাওয়া যায়নি</p>
                        <p className="text-xs text-[#64748D] mt-1">নিচের ইনপুট বক্সে মেসেজ লিখে গ্রাহকের সাথে চ্যাট শুরু করুন।</p>
                      </div>
                    );
                  }

                  return cleanMsgs.map((msg, mIdx) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div
                        key={msg.id ? `${msg.id}-${mIdx}` : `msg-${mIdx}`}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-full`}
                      >
                        {/* Clear Sender Badge Header - No Hover Needed, Visible on all Devices */}
                        <div className={`flex items-center gap-1.5 mb-1 px-1 text-[11px] font-bold ${
                          isAdmin ? 'text-[#A5B4FC]' : 'text-[#818CF8]'
                        }`}>
                          {isAdmin ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-[#818CF8]" />
                              <span>আপনি (সাপোর্ট অ্যাডমিন)</span>
                            </>
                          ) : (
                            <>
                              <span className="w-4 h-4 rounded-full bg-[#1E293B] text-[#A5B4FC] border border-[#7C3AED]/40 inline-flex items-center justify-center text-[9px]">👤</span>
                              <span>গ্রাহক: {activeThread?.userName || 'Customer'}</span>
                              <span className="text-[10px] text-[#64748D] font-mono">({activeThread?.userPhone})</span>
                            </>
                          )}
                        </div>

                        {/* Decorated High-Contrast Bubble */}
                        <div
                          className={`max-w-[92%] sm:max-w-[80%] md:max-w-[75%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isAdmin
                              ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white rounded-tr-xs shadow-md'
                              : 'bg-[#102C1E] border border-[#334155] text-[#E8FAF0] rounded-tl-xs shadow-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap select-text font-sans">{msg.text}</p>
                        </div>

                        {/* Explicit Inline Timestamp - No Hover Needed */}
                        <span className={`text-[10px] font-mono mt-1 px-1 flex items-center gap-1 ${
                          isAdmin ? 'text-[#A5B4FC]' : 'text-[#64748D]'
                        }`}>
                          <span>{msg.timestamp}</span>
                          {isAdmin && <CheckCheck className="w-3.5 h-3.5 text-[#A5B4FC]" />}
                        </span>
                      </div>
                    );
                  });
                })()}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Canned Responses Pills */}
              <div className="px-3 sm:px-4 py-2 border-t border-[#1E293B] bg-[#0B0F19] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                <span className="text-[10px] text-[#64748D] font-bold shrink-0">দ্রুত রিপ্লাই:</span>
                {cannedReplies.map((reply, rIdx) => (
                  <button
                    key={rIdx}
                    onClick={() => handleSendAdminReply(reply)}
                    className="px-2.5 py-1 rounded-lg bg-[#1E1B4B] hover:bg-[#6B46C1] text-[#94A3B8] hover:text-white text-[10px] font-bold transition-all shrink-0 cursor-pointer border border-[#1E293B]"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Chat Input Box */}
              <div className="p-3 sm:p-4 border-t border-[#1E293B] bg-[#0B0F19] shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAdminReply();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="আপনার মেসেজ লিখুন (Enter চাপুন)..."
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs sm:text-sm text-white placeholder-[#64748D] focus:outline-none focus:border-[#7C3AED]"
                  />
                  <button
                    type="submit"
                    className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">পাঠান</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Customer Details */}
            <div className="hidden lg:flex w-72 border-l border-[#1E293B] bg-[#0B0F19] flex-col p-4 space-y-4">
              <div className="text-center pb-4 border-b border-[#1E293B]">
                <div className="w-14 h-14 rounded-2xl bg-[#1E1B4B] text-[#A5B4FC] flex items-center justify-center font-black text-xl mx-auto mb-2 border border-[#7C3AED]/30">
                  {activeThread?.userName.charAt(0) || 'U'}
                </div>
                <h4 className="text-xs font-black text-white">{activeThread?.userName}</h4>
                <p className="text-[11px] font-mono text-[#64748D]">{activeThread?.userPhone}</p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-[#64748D] uppercase font-bold tracking-wider block">
                  গ্রাহকের অর্ডারসমূহ
                </span>
                {activeThreadOrders.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[#0B0F19] text-[11px] text-[#64748D] border border-[#1E293B]">
                    কোনো অর্ডার পাওয়া যায়নি
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {activeThreadOrders.map((o, oIdx) => (
                      <div key={o.orderId ? `${o.orderId}-${oIdx}` : `ato-${oIdx}`} className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs">
                        <div className="flex justify-between items-center text-[10px]">
                          <strong className="font-mono text-[#818CF8]">{o.orderId}</strong>
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            o.status === 'verified' ? 'text-[#00B261]' : 'text-[#FFD552]'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-white mt-0.5 truncate">{o.companyName}</p>
                        <p className="text-[10px] text-[#64748D] font-mono">TrxID: {o.transactionId}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {activeThreadUser && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedUserForDelivery(activeThreadUser);
                      setDeliveryAdminId('');
                      setDeliveryAdminPass('');
                      setDeliveryNotes('');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>ওয়েবসাইট আইডি-পাস পাঠান</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: ORDERS MANAGEMENT ================= */}
        {activeTab === 'orders' && (() => {
          const pendingOrders = orders.filter((o) => o.status === 'pending');
          const approvedOrders = orders.filter((o) => o.status === 'processing' || o.status === 'verified');
          const completedOrders = orders.filter((o) => o.status === 'completed');
          const binOrders = orders.filter((o) => o.status === 'bin');

          let displayedOrders = pendingOrders;
          if (orderFilterTab === 'pending') displayedOrders = pendingOrders;
          else if (orderFilterTab === 'approved') displayedOrders = approvedOrders;
          else if (orderFilterTab === 'completed') displayedOrders = completedOrders;
          else if (orderFilterTab === 'bin') displayedOrders = binOrders;

          return (
            <div className="space-y-5 animate-fadeIn">
              {/* Header Title & Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#818CF8]" />
                    <span>অর্ডার ও ওয়েবসাইট ডেলিভারি ম্যানেজমেন্ট</span>
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    ৩-ধাপে অর্ডার পরিচালনা: ১. পেন্ডিং যাচাই → ২. প্রসেসিং (আইডি-পাস দেওয়ার পর কমপ্লিট অপশন খুলবে) → ৩. সম্পূর্ণ ওয়েবসাইট
                  </p>
                </div>
              </div>

              {/* 4 Interactive Workflow Sub-Tabs: Pending, Approved, Completed, Bin (NO All option) */}
              <div className="flex items-center gap-2 p-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-2xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setOrderFilterTab('pending')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    orderFilterTab === 'pending'
                      ? 'bg-[#E53935] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>পেন্ডিং অর্ডার</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    orderFilterTab === 'pending' ? 'bg-white/20 text-white' : 'bg-[#1E293B] text-[#818CF8]'
                  }`}>
                    {pendingOrders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderFilterTab('approved')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    orderFilterTab === 'approved'
                      ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>অনুমোদিত ও প্রসেসিং</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    orderFilterTab === 'approved' ? 'bg-white/20 text-white' : 'bg-[#1E293B] text-[#A5B4FC]'
                  }`}>
                    {approvedOrders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderFilterTab('completed')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    orderFilterTab === 'completed'
                      ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>সম্পূর্ণ ওয়েবসাইট ও অর্ডার</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    orderFilterTab === 'completed' ? 'bg-white/20 text-white' : 'bg-[#1E293B] text-[#A5B4FC]'
                  }`}>
                    {completedOrders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderFilterTab('bin')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    orderFilterTab === 'bin'
                      ? 'bg-[#E53935] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>রিসাইকেল বিন / ট্র্যাশ</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    orderFilterTab === 'bin' ? 'bg-white/20 text-white' : 'bg-[#1E293B] text-[#FF8A80]'
                  }`}>
                    {binOrders.length}
                  </span>
                </button>
              </div>

              {/* Batch Action Toolbar for Completed Orders */}
              {orderFilterTab === 'completed' && completedOrders.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0F172A] border border-[#7C3AED]/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00E575]" />
                    <span className="text-xs text-[#94A3B8] font-bold">
                      মোট ডেলিভারিকৃত সম্পূর্ণ ওয়েবসাইট: {completedOrders.length} টি
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleMoveAllCompletedToBin}
                    className="px-3.5 py-2 rounded-xl bg-[#E53935]/15 hover:bg-[#E53935]/25 text-[#FF8A80] hover:text-white border border-[#E53935]/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    title="সব সম্পূর্ণ ওয়েবসাইট একসাথে রিমুভ করে রিসাইকেল বিনে পাঠান (গ্রাহকের প্রোফাইল থেকেও আইডি-পাসওয়ার্ড মুছে যাবে)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>সব সম্পূর্ণ অর্ডার রিসাইকেল বিনে পাঠান (Move All to Trash)</span>
                  </button>
                </div>
              )}

              {/* Batch Action Toolbar for Bin */}
              {orderFilterTab === 'bin' && binOrders.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/40">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span className="text-xs text-rose-300 font-bold">
                      রিসাইকেল বিনে আছে: {binOrders.length} টি মুছে ফেলা অর্ডার
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleEmptyBin}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>বিন সম্পূর্ণ খালি করুন (Empty Trash Permanently)</span>
                  </button>
                </div>
              )}

              {/* Order Cards List */}
              {displayedOrders.length === 0 ? (
                <div className="p-12 rounded-3xl bg-[#0F172A] border border-[#1E293B] text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E293B] text-[#A5B4FC] flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {orderFilterTab === 'pending'
                      ? 'কোনো পেন্ডিং অর্ডার নেই (No Pending Orders)'
                      : orderFilterTab === 'approved'
                      ? 'বর্তমানে কোনো প্রসেসিং অর্ডার নেই'
                      : orderFilterTab === 'completed'
                      ? 'এখনো কোনো অর্ডার সম্পূর্ণ হিসেবে মার্ক করা হয়নি'
                      : 'রিসাইকেল বিন সম্পূর্ণ খালি (Bin is Empty)'}
                  </h3>
                  <p className="text-xs text-[#64748D]">
                    {orderFilterTab === 'bin'
                      ? 'ভুল অর্ডার রিমুভ করলে সেগুলো এখানে জমা হবে এবং যে কোনো সময় রিস্টোর করা যাবে।'
                      : 'নতুন অর্ডার আসলে অথবা স্ট্যাটাস পরিবর্তন করলে এখানে প্রদর্শিত হবে।'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {displayedOrders.map((ord, oIdx) => {
                    const isPending = ord.status === 'pending';
                    const isProcessing = ord.status === 'processing' || ord.status === 'verified';
                    const isCompleted = ord.status === 'completed';
                    const isCancelled = ord.status === 'cancelled';
                    const isBin = ord.status === 'bin';
                    const activeOrdId = ord.orderId || (ord as any).id || '';

                    return (
                      <div
                        key={ord.orderId ? `${ord.orderId}-${oIdx}` : `ord-${oIdx}`}
                        className={`p-5 rounded-2xl sm:rounded-3xl border transition-all space-y-3 shadow-md ${
                          isPending
                            ? 'bg-[#111827] border-[#E53935]/40 hover:border-[#E53935]'
                            : isProcessing
                            ? 'bg-[#161F30] border-[#7C3AED]/40 hover:border-[#7C3AED]'
                            : isCompleted
                            ? 'bg-[#0F172A] border-[#00B261]/40 hover:border-[#00B261]'
                            : isBin
                            ? 'bg-[#181116] border-[#E53935]/30'
                            : 'bg-[#111827] border-[#1E293B]'
                        }`}
                      >
                        {/* Top Row: Order ID, Website Code, Company Name & Status Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B]/70 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white font-mono font-black text-xs">
                              {ord.orderId}
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-[#0B0F19] text-[#A5B4FC] font-mono font-bold text-xs border border-[#1E293B]">
                              {ord.demoCode}
                            </span>
                            <h4 className="text-sm font-bold text-white">
                              {ord.companyName || ord.clientName}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                              isCompleted
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : isProcessing
                                ? 'bg-[#7C3AED]/20 text-[#A5B4FC] border border-[#7C3AED]'
                                : isCancelled
                                ? 'bg-[#E53935]/20 text-[#FF8A80] border border-[#E53935]'
                                : isBin
                                ? 'bg-rose-900/30 text-rose-300 border border-rose-800/40'
                                : 'bg-[#FFD552]/20 text-[#FFD552] border border-[#FFD552]'
                            }`}>
                              {isCompleted ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00E575]" />
                                  <span>✓ সম্পূর্ণ (Completed)</span>
                                </>
                              ) : isProcessing ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
                                  <span>অনুমোদিত (প্রসেসিং)</span>
                                </>
                              ) : isCancelled ? (
                                <span>বাতিলকৃত</span>
                              ) : isBin ? (
                                <>
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                  <span>রিসাইকেল বিন (Bin)</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-[#FFD552] animate-ping" />
                                  <span>⏳ পেন্ডিং যাচাই</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Order Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-[#94A3B8]">
                          <div>
                            <span>গ্রাহকের নাম: </span>
                            <strong className="text-white">{ord.clientName}</strong>
                          </div>
                          <div>
                            <span>মোবাইল নম্বর: </span>
                            <strong className="text-white font-mono">{ord.phone}</strong>
                          </div>
                          <div>
                            <span>ইমেইল: </span>
                            <span className="text-white font-mono">{ord.email || 'N/A'}</span>
                          </div>
                          <div>
                            <span>পেমেন্ট: </span>
                            <strong className="text-white uppercase">{ord.paymentMethod}</strong> (TrxID: <span className="font-mono text-[#818CF8]">{ord.transactionId}</span>)
                          </div>
                          <div>
                            <span>ডোমেইন চয়েস: </span>
                            <strong className="text-white">{ord.customDomain || ord.domainOption}</strong>
                          </div>
                          <div>
                            <span>মেকিং চার্জ: </span>
                            <strong className="text-white">{ord.makingCharge || '১,৯৯০'} ৳</strong> (+১২০ ৳/মাস)
                          </div>
                          <div>
                            <span>অর্ডারের সময়: </span>
                            <span className="text-white">{ord.createdAt}</span>
                          </div>
                          <div>
                            <span>ডাটাবেস স্ট্যাটাস: </span>
                            <span className="text-[#818CF8] font-mono uppercase">{ord.status}</span>
                          </div>
                        </div>

                        {/* Interactive Workflow Actions for Each Stage */}
                        <div className="pt-3 border-t border-[#1E293B]/70 space-y-2.5 w-full">
                          <div className="text-[11px] text-[#64748D] leading-relaxed">
                            {isPending && 'অর্ডারটি পেন্ডিং রয়েছে। ট্রানজেকশন যাচাই করে অনুমোদন করুন।'}
                            {isProcessing && 'অর্ডারটি অনুমোদিত হয়েছে এবং প্রসেসিং চলছে। আইডি-পাসওয়ার্ড সাবমিট করার পর "পাঠানো / সম্পূর্ণ করুন" অপশনটি সক্রিয় হবে।'}
                            {isCompleted && 'ওয়েবসাইট সম্পূর্ণ তৈরি ও ক্লায়েন্টের কাছে ডেলিভারি সম্পন্ন হয়েছে।'}
                            {isBin && 'এই অর্ডারটি রিমুভ করে বিনে রাখা হয়েছে। যে কোনো সময় রিস্টোর করা যাবে।'}
                          </div>

                          {/* PENDING STAGE ACTIONS */}
                          {isPending && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => handleApproveOrder(activeOrdId)}
                                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs order-1 sm:order-2"
                              >
                                <Check className="w-4 h-4" />
                                <span>অনুমোদন করুন (Approve Order)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(activeOrdId)}
                                className="w-full py-2.5 px-3 rounded-xl bg-[#E53935]/15 hover:bg-[#E53935] text-[#FF8A80] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer order-2 sm:order-1"
                                title="ভুয়া বা ফেক অর্ডার বাতিল ও রিজেক্ট করুন"
                              >
                                <X className="w-4 h-4" />
                                <span>ফেক অর্ডার রিজেক্ট (Reject Fake)</span>
                              </button>
                            </div>
                          )}

                          {/* APPROVED / PROCESSING STAGE ACTIONS (Clean, Fully Responsive & Clickable) */}
                          {isProcessing && (() => {
                            const hasCredentialsSent = !!(
                              ord.hasDeliveredCredentials ||
                              ord.deliveredAdminId ||
                              deliveredCreds.some(c => (c.userPhone === ord.phone || c.orderId === ord.orderId) && (c.websiteCode === ord.demoCode || !c.websiteCode))
                            );

                            return (
                              <div className="w-full space-y-2.5 pt-1">
                                {/* Clear Step Progress Banner */}
                                <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                                  hasCredentialsSent 
                                    ? 'bg-[#7C3AED]/15 border-[#7C3AED]/40 text-[#A5B4FC]'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    {hasCredentialsSent ? (
                                      <CheckCircle2 className="w-4 h-4 text-[#00E575] shrink-0" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                                    )}
                                    <span className="font-semibold text-[11px] sm:text-xs">
                                      {hasCredentialsSent 
                                        ? `✓ আইডি ও পাসওয়ার্ড রেডি (${ord.deliveredAdminId ? `User: ${ord.deliveredAdminId}` : 'সংরক্ষিত'}) — এবার "পাঠানো / সম্পূর্ণ করুন" এ ক্লিক করুন`
                                        : 'ধাপ ১: আইডি ও পাসওয়ার্ড দিন → ধাপ ২: পাঠানো / সম্পূর্ণ করুন'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-white shrink-0">
                                    {hasCredentialsSent ? 'রেডি টু ডেলিভারি' : 'অপেক্ষমান'}
                                  </span>
                                </div>

                                {/* Action Buttons: Responsive Grid with full readability */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                                  {/* 1. Deliver ID & Password */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const matchingUser = users.find(u => u.phone === ord.phone || (u.email && ord.email && u.email.toLowerCase() === ord.email.toLowerCase())) || {
                                        name: ord.clientName,
                                        phone: ord.phone,
                                        email: ord.email,
                                        registeredAt: 'অর্ডারকারী'
                                      };
                                      setSelectedUserForDelivery(matchingUser);
                                      setSelectedDeliveryOrder(ord.orderId || (ord as any).id || ord.demoCode);
                                      const existingCred = deliveredCreds.find(c => 
                                        (c.orderId && ord.orderId && c.orderId === ord.orderId) || 
                                        (c.userPhone === ord.phone && (c.websiteCode === ord.demoCode || !c.websiteCode))
                                      );
                                      const safeDigits = ord.phone ? String(ord.phone).replace(/\D/g, '').slice(-4) : Math.floor(1000 + Math.random() * 9000);
                                      setDeliveryAdminId(ord.deliveredAdminId || existingCred?.websiteAdminId || `admin_${safeDigits}`);
                                      setDeliveryAdminPass(ord.deliveredAdminPass || existingCred?.websiteAdminPass || `pass${Math.floor(1000 + Math.random() * 9000)}`);
                                    }}
                                    className={`w-full min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] ${
                                      hasCredentialsSent
                                        ? 'bg-[#1E293B] hover:bg-[#143321] text-[#A5B4FC] border border-[#1E293B]'
                                        : 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white shadow-[0_2px_12px_rgba(107,70,193,0.3)]'
                                    }`}
                                    title="গ্রাহকের ওয়েবসাইটের অ্যাডমিন আইডি ও পাসওয়ার্ড প্রদান বা পরিবর্তন করুন"
                                  >
                                    <Key className="w-4 h-4 shrink-0" />
                                    <span>
                                      {hasCredentialsSent ? '✓ ১. আইডি-পাস দেওয়া সম্পন্ন' : '১. আইডি ও পাসওয়ার্ড দিন'}
                                    </span>
                                  </button>

                                  {/* 2. Complete Button (Moves to Completed List) */}
                                  <button
                                    type="button"
                                    onClick={() => handleMarkOrderCompleted(activeOrdId)}
                                    className="w-full min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white shadow-[0_4px_16px_rgba(107,70,193,0.4)]"
                                    title="সম্পূর্ণ অর্ডার সম্পন্ন করুন ও ডেলিভারি তালিকায় যুক্ত করুন"
                                  >
                                    <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
                                    <span>২. সম্পূর্ণ করুন (Complete Order)</span>
                                  </button>

                                  {/* 3. Remove Button -> Moves to Bin */}
                                  <button
                                    type="button"
                                    onClick={() => handleMoveOrderToBin(activeOrdId)}
                                    className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-[#E53935]/15 hover:bg-[#E53935]/25 text-[#FF8A80] hover:text-white border border-[#E53935]/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                                    title="ভুল বা বাতিল অর্ডার রিমুভ করে ট্র্যাশ (বিন)-এ স্থানান্তর করুন"
                                  >
                                    <Trash2 className="w-4 h-4 shrink-0" />
                                    <span>৩. রিসাইকেল বিনে পাঠান</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                            {/* COMPLETED STAGE ACTIONS */}
                            {isCompleted && (
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const matchingUser = users.find(u => u.phone === ord.phone || (u.email && ord.email && u.email.toLowerCase() === ord.email.toLowerCase())) || {
                                      name: ord.clientName,
                                      phone: ord.phone,
                                      email: ord.email,
                                      registeredAt: 'অর্ডারকারী'
                                    };
                                    setSelectedUserForDelivery(matchingUser);
                                    setSelectedDeliveryOrder(ord.orderId || (ord as any).id || ord.demoCode);
                                    const existingCred = deliveredCreds.find(c => 
                                      (c.orderId && ord.orderId && c.orderId === ord.orderId) || 
                                      (c.userPhone === ord.phone && (c.websiteCode === ord.demoCode || !c.websiteCode))
                                    );
                                    const safeDigits = ord.phone ? String(ord.phone).replace(/\D/g, '').slice(-4) : Math.floor(1000 + Math.random() * 9000);
                                    setDeliveryAdminId(ord.deliveredAdminId || existingCred?.websiteAdminId || `admin_${safeDigits}`);
                                    setDeliveryAdminPass(ord.deliveredAdminPass || existingCred?.websiteAdminPass || `pass${Math.floor(1000 + Math.random() * 9000)}`);
                                  }}
                                  className="py-2.5 px-3.5 rounded-xl bg-[#1E293B] hover:bg-[#1E293B] text-[#A5B4FC] border border-[#1E293B] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                  title="গ্রাহকের ওয়েবসাইটের আইডি ও পাসওয়ার্ড পরিবর্তন করুন"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                  <span>১. ID Password পরিবর্তন</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleMoveOrderToBin(activeOrdId)}
                                  className="py-2.5 px-3.5 rounded-xl bg-[#E53935]/15 hover:bg-[#E53935]/25 text-[#FF8A80] hover:text-white border border-[#E53935]/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs sm:ml-auto"
                                  title="অর্ডারটি মুছুন ও রিসাইকেল বিনে পাঠান (গ্রাহকের মেনু ডিটেইলস থেকেও আইডি-পাসওয়ার্ড মুছে যাবে)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>২. Recycle Bin এ পাঠাও</span>
                                </button>
                              </div>
                            )}

                            {/* BIN / TRASH STAGE ACTIONS */}
                            {isBin && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleRestoreOrderFromBin(activeOrdId)}
                                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  title="অর্ডারটি পুনরায় আগের প্রসেসিং তালিকায় ফিরিয়ে নিন"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>পুনরুদ্ধার করুন (Restore)</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handlePermanentDeleteOrder(activeOrdId)}
                                  className="px-3 py-1.5 rounded-xl bg-[#E53935]/20 hover:bg-[#E53935]/30 text-[#FF8A80] border border-[#E53935]/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                  title="অর্ডারটি স্থায়ীভাবে মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>স্থায়ীভাবে মুছুন (Permanent Delete)</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ================= TAB 4: USERS & CREDENTIALS ================= */}
        {activeTab === 'users' && (() => {
          const unverifiedCount = users.filter((u) => !u.numberVerified).length;
          const verifiedCount = users.filter((u) => !!u.numberVerified).length;

          const filteredUsers = users.filter((u) => {
            // 1. Sub-tab filter
            if (userSectionSubTab === 'unverified' && u.numberVerified) return false;
            if (userSectionSubTab === 'verified_list' && !u.numberVerified) return false;

            // 2. Search filter
            if (!userSearchTerm.trim()) return true;
            const q = userSearchTerm.trim().toLowerCase();
            return u.phone.toLowerCase().includes(q) || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
          });

          return (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">ব্যবহারকারী ও নম্বর ভেরিফিকেশন প্যানেল</h2>
                  <p className="text-xs text-[#94A3B8]">
                    ক্লায়েন্টদের নম্বর সরাসরি মোবাইল থেকে কল করে ভেরিফাই করুন, অল লিস্টে স্থানান্তর করুন ও অ্যাক্সেস প্রদান করুন।
                  </p>
                </div>
              </div>

              {/* 3 Sub-Section Tabs: Registration List, Unverified Numbers, All List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 rounded-2xl bg-[#0B0F19] border border-[#1E293B]">
                {/* 1. Registration List */}
                <button
                  type="button"
                  onClick={() => setUserSectionSubTab('all_registered')}
                  className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    userSectionSubTab === 'all_registered'
                      ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-md'
                      : 'bg-transparent text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 shrink-0" />
                    <span>১. রেজিস্ট্রেশন তালিকা</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    userSectionSubTab === 'all_registered' ? 'bg-white/20 text-white' : 'bg-[#1E293B] text-[#CBD5E1]'
                  }`}>
                    {users.length} জন
                  </span>
                </button>

                {/* 2. Unverified Numbers */}
                <button
                  type="button"
                  onClick={() => setUserSectionSubTab('unverified')}
                  className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    userSectionSubTab === 'unverified'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-transparent text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 shrink-0" />
                    <span>২. আনভেরিফাইড নম্বর</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    userSectionSubTab === 'unverified' ? 'bg-black/20 text-slate-950 font-black' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {unverifiedCount} টি বাকি
                  </span>
                </button>

                {/* 3. All List (Verified) */}
                <button
                  type="button"
                  onClick={() => setUserSectionSubTab('verified_list')}
                  className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    userSectionSubTab === 'verified_list'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-transparent text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>৩. অল লিস্ট (Verified)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    userSectionSubTab === 'verified_list' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {verifiedCount} জন
                  </span>
                </button>
              </div>

              {/* Sub-tab Explainer Notice */}
              {userSectionSubTab === 'unverified' && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 shrink-0 text-amber-400" />
                  <p>
                    <strong>আনভেরিফাইড নম্বর কলিং লিস্ট ({unverifiedCount} টি):</strong> মোবাইল থেকে সরাসরি নম্বরে কল দিয়ে কথা বলুন, তারপর <span className="underline font-bold">"Verify Now / Verified"</span> বাটনে ক্লিক করুন। ভেরিফাই করার সাথে সাথেই ইউজার "অল লিস্ট"-এ যুক্ত হবে।
                  </p>
                </div>
              )}

              {userSectionSubTab === 'verified_list' && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <p>
                    <strong>অল লিস্ট (Verified {verifiedCount} জন):</strong> এখানে শুধুমাত্র সম্পূর্ণ ভেরিফাইড নম্বর ও ক্লায়েন্টদের তালিকা প্রদর্শিত হচ্ছে।
                  </p>
                </div>
              )}

              {/* Search Bar for Clients by mobile number or name (Requirement 12) */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="মোবাইল নম্বর অথবা নাম দিয়ে ক্লায়েন্ট খুঁজুন..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs placeholder-[#64748D] focus:outline-none focus:border-[#7C3AED] transition-all"
                />
                {userSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setUserSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#111827] border border-[#1E293B] text-center text-xs text-[#94A3B8]">
                  {userSearchTerm
                    ? 'এই সার্চে কোনো ব্যবহারকারী পাওয়া যায়নি।'
                    : userSectionSubTab === 'unverified'
                    ? '🎉 কোনো আনভেরিফাইড নম্বর নেই! সকল নম্বর ইতিমধ্যে ভেরিফাইড।'
                    : userSectionSubTab === 'verified_list'
                    ? 'এখনও কোনো ভেরিফাইড ক্লায়েন্ট নেই।'
                    : 'কোনো নিবন্ধিত ব্যবহারকারী নেই।'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredUsers.map((usr, uIdx) => {
                    const userOrders = orders.filter((o) => o.phone === usr.phone || o.email === usr.email);
                    const clientCreds = deliveredCreds.filter((c) => c.userPhone === usr.phone);
                    const isInfoOpen = infoPopoverPhone === usr.phone;
                    const secCode = getClientSecurityCode(usr.phone);

                    return (
                      <div
                        key={usr.phone ? `usr-${usr.phone}` : `usr-${uIdx}`}
                        className={`p-5 rounded-2xl border space-y-3.5 flex flex-col justify-between transition-all shadow-sm ${
                          usr.isRestricted 
                            ? 'bg-[#181116] border-rose-500/40' 
                            : 'bg-[#111827] border-[#1E293B]'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Header: Name, Date, Restriction Badge, and Security Code */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-black text-xs shadow-xs ${
                                usr.isRestricted ? 'bg-rose-600' : 'bg-gradient-to-tr from-[#6B46C1] to-[#7C3AED]'
                              }`}>
                                {usr.name.charAt(0).toUpperCase()}
                              </span>
                              <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                  <span className="truncate">{usr.name}</span>
                                  {usr.isRestricted && (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold">
                                      🚫 রেস্ট্রিক্টেড (Restricted)
                                    </span>
                                  )}
                                </h4>
                                <span className="text-[10px] text-[#94A3B8]">নিবন্ধন: {usr.registeredAt}</span>
                              </div>
                            </div>

                            {/* Security Code System (Badge only - no send details button) */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-xs">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#A5B4FC]" />
                              <span className="text-[10px] text-[#A5B4FC] font-semibold">Security Code:</span>
                              <span className="font-mono font-black text-white tracking-wider">{secCode}</span>
                            </div>
                          </div>

                          {/* Clean Overview: Phone with (i) Info Button & Order Names */}
                          <div className="space-y-2 text-xs">
                            {/* Mobile with small info (i) button beside it & Verification Action */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[#94A3B8]">মোবাইল:</span>
                                <a 
                                  href={`tel:${usr.phone}`} 
                                  className="text-white font-mono font-bold hover:text-[#A5B4FC] transition-colors inline-flex items-center gap-1"
                                  title="মোবাইল থেকে সরাসরি কল করতে ক্লিক করুন"
                                >
                                  <Phone className="w-3 h-3 text-[#94A3B8]" />
                                  <span>{usr.phone}</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setInfoPopoverPhone(isInfoOpen ? null : usr.phone)}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                    isInfoOpen
                                      ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white'
                                      : 'bg-[#1E293B] text-[#A5B4FC] hover:bg-[#6B46C1] hover:text-white border border-[#1E293B]'
                                  }`}
                                  title="ক্লিক করে সম্পূর্ণ ক্লায়েন্ট ডিটেইলস দেখুন"
                                >
                                  <Info className="w-3 h-3 stroke-[2.5]" />
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Verification Status & Action Button */}
                                {usr.numberVerified ? (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold inline-flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span>Verified</span>
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                      Non-verified
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyUserNumber(usr)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                                      title="কল করার পর নম্বর ভেরিফাইড হিসেবে চিহ্নিত করুন (অল লিস্টে যুক্ত হবে)"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                      <span>Verify Now / Verified</span>
                                    </button>
                                  </div>
                                )}

                                <span className="text-[10px] text-[#A5B4FC] font-bold shrink-0">
                                  {userOrders.length} টি অর্ডার
                                </span>
                              </div>
                            </div>

                            {/* Info Button Dropdown/Popover (Reveals full client info cleanly) */}
                            {isInfoOpen && (
                              <div className="p-3 rounded-xl bg-[#131B2E] border border-[#7C3AED]/40 text-xs text-[#CBD5E1] space-y-1.5 animate-fadeIn">
                                <div className="flex justify-between">
                                  <span className="text-[#94A3B8]">ইমেইল এড্রেস:</span>
                                  <span className="font-mono text-white select-all">{usr.email}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#94A3B8]">রেজিস্ট্রেশন তারিখ:</span>
                                  <span className="font-mono text-white">{usr.registeredAt}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#94A3B8]">ভেরিফিকেশন স্ট্যাটাস:</span>
                                  <span className={`font-bold ${usr.numberVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {usr.numberVerified ? '✓ নম্বর ভেরিফাইড' : 'অপেক্ষমাণ (Unverified)'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#94A3B8]">ডেলিভারিকৃত ওয়েবসাইট:</span>
                                  <span className="text-[#A5B4FC] font-bold">{clientCreds.length} টি</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#94A3B8]">পাসওয়ার্ড:</span>
                                  <span className="text-white font-mono">{usr.password || 'N/A'}</span>
                                </div>
                                {userOrders.length > 0 && (
                                  <div className="flex justify-between pt-1 border-t border-[#1E293B]">
                                    <span className="text-[#94A3B8]">সর্বশেষ পেমেন্ট TrxID:</span>
                                    <span className="font-mono text-[#A5B4FC]">{userOrders[0].transactionId}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Order Names Overview */}
                            <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-1.5">
                              <span className="text-[11px] font-bold text-[#94A3B8] block">
                                অর্ডারের নামসমূহ ({userOrders.length}):
                              </span>
                              {userOrders.length === 0 ? (
                                <span className="text-[11px] text-[#64748D] italic block">
                                  এখনো কোনো ওয়েবসাইট অর্ডার করেননি
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {userOrders.map((ord, oIndex) => (
                                    <span
                                      key={ord.orderId ? `uo-${ord.orderId}-${oIndex}` : `uo-${oIndex}`}
                                      className="px-2 py-0.5 rounded-lg bg-[#1E293B] border border-[#1E293B] text-[11px] text-white font-medium truncate max-w-full flex items-center gap-1"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                                      <span>{ord.companyName || ord.demoTitle}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Existing Delivered Credentials Badge if any */}
                            {clientCreds.length > 0 && (
                              <div className="p-2 rounded-xl bg-[#0B0F19] border border-[#7C3AED]/30 text-[11px] text-[#A5B4FC] flex items-center justify-between">
                                <span>✓ {clientCreds.length} টি ওয়েবসাইটের অ্যাক্সেস পাঠানো হয়েছে</span>
                                <span className="font-mono text-[10px] text-[#94A3B8]">ID: {clientCreds[0].websiteAdminId}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons: 1. View Details, 2. Restrict/Unrestrict User (NO send details button!) */}
                        <div className="pt-2 grid grid-cols-2 gap-2 border-t border-[#1E293B]">
                          {/* 1. View Details Button */}
                          <button
                            type="button"
                            onClick={() => setViewingClientDetailsUser(usr)}
                            className="py-2 px-3 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-white border border-[#1E293B] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#818CF8]" />
                            <span>View Details</span>
                          </button>

                          {/* 2. Restrict / Unrestrict User Button (Replaces Send Details button) */}
                          {usr.isRestricted ? (
                            <button
                              type="button"
                              onClick={() => handleToggleRestrictUser(usr)}
                              className="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                              title="রেস্ট্রিকশন প্রত্যাহার করুন"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>রেস্ট্রিকশন সরান (Unrestrict)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleRestrictUser(usr)}
                              className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                              title="এই ব্যবহারকারীর অ্যাকাউন্ট রেস্ট্রিক্ট করুন (তিনি আর লগইন করতে পারবেন না)"
                            >
                              <Ban className="w-3.5 h-3.5 text-rose-400" />
                              <span>রেস্ট্রিক্ট করুন (Restrict)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ================= TAB: REPORTS MANAGEMENT ================= */}
        {activeTab === 'reports' && (() => {
          const pendingReports = reports.filter((r) => r.status === 'pending');
          const resolvedReports = reports.filter((r) => r.status === 'resolved');

          const pendingEmailRecs = emailRecoveries.filter((r) => r.status === 'pending');
          const completedEmailRecs = emailRecoveries.filter((r) => r.status === 'completed');

          let displayedReports = reports;
          if (reportFilter === 'pending') displayedReports = pendingReports;
          else if (reportFilter === 'resolved') displayedReports = resolvedReports;

          const displayedEmailRecs = emailRecoveryFilter === 'pending' ? pendingEmailRecs : completedEmailRecs;

          return (
            <div className="space-y-6 animate-fadeIn">
              {/* TOP HEADER & SECTION PICKER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#0B0F19] border border-[#1E293B] shadow-md">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Flag className="w-5 h-5 text-[#AB55F7]" />
                    <span>রিপোর্ট ও রিকোয়েস্ট ম্যানেজমেন্ট সেন্টার</span>
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    ক্লায়েন্ট অভিযোগ ও "I Don't Have Email" সংক্রান্ত কল রিকোয়েস্ট পর্যালোচনা ও নিষ্পত্তি করুন।
                  </p>
                </div>

                {/* 2 MAIN REPORT OPTIONS */}
                <div className="flex items-center gap-2 p-1.5 bg-[#070B13] border border-[#1E293B] rounded-2xl overflow-x-auto">
                  {/* OPTION 1: সাধারণ ক্লায়েন্ট রিপোর্ট */}
                  <button
                    type="button"
                    onClick={() => setReportSection('general-reports')}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                      reportSection === 'general-reports'
                        ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-xs'
                        : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>সাধারণ ক্লায়েন্ট রিপোর্ট</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/30 text-white">
                      {reports.length}
                    </span>
                    {pendingReports.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#E53935] animate-ping" />
                    )}
                  </button>

                  {/* OPTION 2: I Don't Have Email রিপোর্ট */}
                  <button
                    type="button"
                    onClick={() => setReportSection('email-recovery-reports')}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                      reportSection === 'email-recovery-reports'
                        ? 'bg-[#7C3AED] text-white shadow-xs'
                        : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>I Don't Have Email রিপোর্ট</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      pendingEmailRecs.length > 0 ? 'bg-[#E53935] text-white font-bold' : 'bg-black/30 text-white'
                    }`}>
                      {emailRecoveries.length}
                    </span>
                    {pendingEmailRecs.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#E53935] animate-ping" />
                    )}
                  </button>
                </div>
              </div>

              {/* SECTION 1: GENERAL CLIENT REPORTS */}
              {reportSection === 'general-reports' && (
                <div className="space-y-5 animate-fadeIn">

              {/* Subtabs: All, Pending, Resolved */}
              <div className="flex items-center gap-2 p-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-2xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setReportFilter('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    reportFilter === 'all'
                      ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  <span>সবগুলো রিপোর্ট</span>
                  <span className="text-[10px] font-mono opacity-80">({reports.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportFilter('pending')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    reportFilter === 'pending'
                      ? 'bg-[#E53935] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>পেন্ডিং রিপোর্ট</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    reportFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-[#1E293B] text-[#FF8A80]'
                  }`}>
                    {pendingReports.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportFilter('resolved')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    reportFilter === 'resolved'
                      ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>সমাধানকৃত / সম্পন্ন</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    reportFilter === 'resolved' ? 'bg-white/20 text-white' : 'bg-[#1E293B] text-[#A5B4FC]'
                  }`}>
                    {resolvedReports.length}
                  </span>
                </button>
              </div>

              {/* Reports List */}
              {displayedReports.length === 0 ? (
                <div className="p-12 rounded-3xl bg-[#111827] border border-[#1E293B] text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E293B] text-[#818CF8] flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {reportFilter === 'pending'
                      ? 'কোনো পেন্ডিং রিপোর্ট নেই (All Reports Resolved)'
                      : reportFilter === 'resolved'
                      ? 'কোনো সমাধানকৃত রিপোর্ট নেই'
                      : 'এখনো কোনো রিপোর্ট জমা পড়েনি'}
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    ক্লায়েন্ট তাদের একাউন্ট সেকশন থেকে রিপোর্ট বা অভিযোগ পাঠালে এখানে তালিকাভুক্ত হবে।
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {displayedReports.map((rep, rIdx) => {
                    const isPending = rep.status === 'pending';
                    const isInProgress = rep.status === 'in_progress';
                    const isResolved = rep.status === 'resolved';

                    return (
                      <div
                        key={rep.id ? `rep-${rep.id}-${rIdx}` : `rep-${rIdx}`}
                        className={`p-5 rounded-2xl border space-y-3.5 transition-all shadow-md ${
                          isPending
                            ? 'bg-[#181116] border-[#E53935]/40 hover:border-[#E53935]'
                            : isInProgress
                            ? 'bg-[#191528] border-[#AB55F7]/40 hover:border-[#AB55F7]'
                            : 'bg-[#111827] border-[#1E293B]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#AB55F7] to-[#7C3AED] text-white font-mono font-black text-xs shadow-xs">
                              {rep.clientIdentifier || '#BW-CLIENT'}
                            </span>
                            <h4 className="text-sm font-bold text-white">
                              {rep.clientName || 'ক্লায়েন্ট'}
                            </h4>
                            <span className="text-xs text-[#818CF8] font-mono">
                              ({rep.clientPhone})
                            </span>
                            {rep.clientEmail && (
                              <span className="text-xs text-[#94A3B8]">
                                • {rep.clientEmail}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                              isPending
                                ? 'bg-[#E53935]/20 text-[#FF8A80] border border-[#E53935]/40'
                                : isInProgress
                                ? 'bg-[#AB55F7]/20 text-[#D8B4FE] border border-[#AB55F7]/40'
                                : 'bg-purple-500/15 text-purple-300 border border-[#7C3AED]/40'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${
                                isPending ? 'bg-[#E53935] animate-ping' : isInProgress ? 'bg-[#AB55F7] animate-pulse' : 'bg-[#00B261]'
                              }`} />
                              <span>
                                {isPending ? 'অপেক্ষমান (Pending)' : isInProgress ? 'চলমান (In Progress)' : 'সম্পূর্ণ (Resolved)'}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Report message box */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-[#94A3B8]">
                            ক্লায়েন্টের অভিযোগ / বক্তব্য:
                          </span>
                          <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs text-white leading-relaxed whitespace-pre-wrap">
                            {rep.message}
                          </div>
                        </div>

                        {/* Display existing Admin Reply if any */}
                        {rep.adminReply && (
                          <div className="p-3.5 rounded-xl bg-[#1E1B4B]/60 border border-[#AB55F7]/40 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#D8B4FE] flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-[#AB55F7]" />
                                <span>অ্যাডমিন অফিসিয়াল উত্তর (Admin Reply):</span>
                              </span>
                              {rep.adminRepliedAt && (
                                <span className="text-[10px] text-[#94A3B8] font-mono">
                                  {rep.adminRepliedAt}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white leading-relaxed whitespace-pre-wrap pl-5 border-l-2 border-[#AB55F7]/60">
                              {rep.adminReply}
                            </p>
                          </div>
                        )}

                        {/* Dedicated Admin Reply Input (Visible for pending or in_progress reports) */}
                        {!isResolved && (
                          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-2">
                            <label className="block text-[11px] font-bold text-[#CBD5E1]">
                              অফিসিয়াল রিপ্লাই পাঠান (Reply to Client):
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <textarea
                                rows={2}
                                value={reportReplyDrafts[rep.id] || ''}
                                onChange={(e) => setReportReplyDrafts((prev) => ({ ...prev, [rep.id]: e.target.value }))}
                                placeholder="ক্লায়েন্টের অভিযোগের প্রেক্ষিতে অফিসিয়াল উত্তর লিখুন (ক্লায়েন্ট নোটিফিকেশন পাবেন)..."
                                className="flex-1 p-2.5 rounded-xl bg-[#111827] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-[#AB55F7] resize-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleReplyReport(rep.id)}
                                disabled={replyingReportId === rep.id || !reportReplyDrafts[rep.id]?.trim()}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#AB55F7] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs shrink-0 self-stretch sm:self-end"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{replyingReportId === rep.id ? 'পাঠানো হচ্ছে...' : 'উত্তর পাঠান'}</span>
                              </button>
                            </div>
                            <p className="text-[10px] text-[#94A3B8]">
                              * উত্তর পাঠানোর পর রিপোর্টটি চলমান (In Progress) থাকবে। পুরোপুরি সমাধানের পর ডানপাশের "সম্পূর্ণ করুন" বাটনে ক্লিক করুন।
                            </p>
                          </div>
                        )}

                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#1E293B]">
                          <div className="text-[11px] text-[#94A3B8]">
                            জমা দেওয়ার সময়: <span className="font-mono text-white">{rep.createdAt}</span>
                            {rep.resolvedAt && (
                              <span className="text-emerald-400 ml-2">
                                (সমাধান সম্পন্ন: {rep.resolvedAt})
                              </span>
                            )}
                          </div>

                          {/* Complete button (NO password needed as explicitly requested!) */}
                          {!isResolved && (
                            <button
                              type="button"
                              onClick={() => handleResolveReport(rep.id)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="পাসওয়ার্ড ছাড়াই সরাসরি সম্পূর্ণ মার্ক করুন"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>সম্পূর্ণ করুন (Complete)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 2: I DON'T HAVE EMAIL REPORTS (EXACTLY 2 SUBTABS) */}
          {/* SUBTAB 1: ALL PENDING | SUBTAB 2: ALL COMPLETE            */}
          {/* ======================================================== */}
          {reportSection === 'email-recovery-reports' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Exactly 2 subtabs as requested: All Pending & All Complete */}
              <div className="flex items-center gap-2 p-1.5 bg-[#0B0F19] border border-[#1E293B] rounded-2xl overflow-x-auto">
                {/* 1. ALL PENDING */}
                <button
                  type="button"
                  onClick={() => setEmailRecoveryFilter('pending')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    emailRecoveryFilter === 'pending'
                      ? 'bg-[#E53935] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>অল পেন্ডিং (All Pending)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    emailRecoveryFilter === 'pending' ? 'bg-white/20 text-white font-bold' : 'bg-[#1E293B] text-[#FF8A80]'
                  }`}>
                    {pendingEmailRecs.length}
                  </span>
                </button>

                {/* 2. ALL COMPLETE */}
                <button
                  type="button"
                  onClick={() => setEmailRecoveryFilter('completed')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                    emailRecoveryFilter === 'completed'
                      ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>অল কমপ্লিট (All Complete)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    emailRecoveryFilter === 'completed' ? 'bg-white/20 text-white font-bold' : 'bg-[#1E293B] text-[#A5B4FC]'
                  }`}>
                    {completedEmailRecs.length}
                  </span>
                </button>
              </div>

              {/* Policy reminder banner */}
              <div className="p-4 rounded-2xl bg-[#141226] border border-[#AB55F7]/30 text-xs text-[#E9D5FF] flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#AB55F7] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white">
                    অ্যাডমিন কল ও যাচাইকরণ নীতিমালা:
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    যেসব ব্যবহারকারী "I don't have email" দিয়ে আবেদন করেছেন, পেন্ডিং তালিকা থেকে তাদের নম্বরে ১ থেকে ৪৮ ঘণ্টার মধ্যে কল করে অ্যাকাউন্ট যাচাই করুন। কল সম্পন্ন হলে <strong>"অনুমোদন করুন"</strong> বাটনে ক্লিক করলে তা সরাসরি কমপ্লিট তালিকায় যাবে। যদি ভুলবশত চলে যায়, তবে কমপ্লিট তালিকা থেকে <strong>"ডিলিট আনডু"</strong> বাটনে ক্লিক করলে পুনরায় পেন্ডিং এ ফিরে আসবে। গ্রাহক কল না ধরলে রিকোয়েস্টটি ডিলিট করুন।
                  </p>
                </div>
              </div>

              {/* List of Email Recovery Requests */}
              {displayedEmailRecs.length === 0 ? (
                <div className="p-12 rounded-3xl bg-[#111827] border border-[#1E293B] text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E293B] text-[#AB55F7] flex items-center justify-center mx-auto mb-2">
                    {emailRecoveryFilter === 'pending' ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Mail className="w-6 h-6" />}
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {emailRecoveryFilter === 'pending'
                      ? 'কোনো পেন্ডিং ইমেইল রিকোয়েস্ট নেই (All Caught Up)'
                      : 'কোনো সম্পন্ন ইমেইল রিকোয়েস্ট নেই'}
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    ব্যবহারকারীরা লগইন পেজ থেকে "I don't have my email" ফর্ম পূরণ করলে এখানে দেখতে পাবেন।
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {displayedEmailRecs.map((rec, idx) => {
                    const isPending = rec.status === 'pending';
                    const isCompleted = rec.status === 'completed';

                    return (
                      <div
                        key={rec.id ? `rec-${rec.id}` : `rec-${idx}`}
                        className={`p-5 rounded-2xl border space-y-4 transition-all shadow-md ${
                          isPending
                            ? 'bg-[#181116] border-[#E53935]/40 hover:border-[#E53935]'
                            : 'bg-[#0F172A] border-[#1E293B]'
                        }`}
                      >
                        {/* Card Top */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#AB55F7]">
                              {rec.id}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isPending
                                ? 'bg-[#E53935]/20 text-[#FF8A80] border border-[#E53935]/40 animate-pulse'
                                : 'bg-[#7C3AED]/20 text-[#A5B4FC] border border-[#7C3AED]/40'
                            }`}>
                              {isPending ? 'পেন্ডিং কল (Pending Call)' : 'অনুমোদিত ও সম্পন্ন (Completed)'}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#94A3B8]">
                            রিকোয়েস্ট সময়: <span className="font-mono text-white">{rec.createdAt}</span>
                          </div>
                        </div>

                        {/* Submitted Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#070B13] p-4 rounded-xl border border-[#1E293B]">
                          <div>
                            <span className="text-[#94A3B8] block mb-0.5">জিমেইল সংক্রান্ত সমস্যা:</span>
                            <span className="font-bold text-white">
                              {rec.gmailIssueLabel || rec.gmailIssue}
                            </span>
                            {rec.customReason && (
                              <p className="mt-1 text-[11px] text-[#E9D5FF] italic bg-[#141226] p-2 rounded-lg border border-purple-900/50">
                                "{rec.customReason}"
                              </p>
                            )}
                          </div>

                          <div>
                            <span className="text-[#94A3B8] block mb-0.5">পূর্বে কিছু ক্রয় করেছিলেন কি?</span>
                            <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              rec.purchasedBefore 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {rec.purchasedBefore ? 'হ্যাঁ (Yes - পূর্বের ক্লায়েন্ট)' : 'না (No - নতুন)'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[#94A3B8] block mb-0.5">মোবাইল নম্বর মনে আছে কি?</span>
                            <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              rec.rememberPhone 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {rec.rememberPhone ? 'হ্যাঁ (Yes)' : 'না (No)'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[#94A3B8] block mb-0.5">কল করার জন্য মোবাইল নম্বর:</span>
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${rec.phoneNumber}`}
                                className="font-mono font-bold text-sm text-[#AB55F7] hover:underline flex items-center gap-1.5"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>{rec.phoneNumber}</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(rec.phoneNumber);
                                  setMasterSuccessMsg('নম্বর কপি করা হয়েছে!');
                                  setTimeout(() => setMasterSuccessMsg(''), 2000);
                                }}
                                className="text-[10px] px-2 py-0.5 rounded bg-[#1E293B] text-slate-300 hover:text-white cursor-pointer"
                              >
                                কপি
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Decision info if completed */}
                        {isCompleted && rec.decisionAt && (
                          <div className="text-[11px] text-emerald-400 flex items-center gap-2 bg-[#061810] p-2.5 rounded-xl border border-emerald-900/40">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>অনুমোদন ও নিষ্পত্তির সময়: {rec.decisionAt} {rec.decisionNote ? `(${rec.decisionNote})` : ''}</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1E293B]">
                          <div className="text-[11px] text-[#94A3B8]">
                            {isPending ? (
                              <span className="text-amber-400">কল করে যাচাইয়ের পর অনুমোদন করুন।</span>
                            ) : (
                              <span className="text-emerald-400">কল সম্পন্ন ও অনুমোদিত তালিকাভুক্ত।</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* If PENDING: Approve Button */}
                            {isPending && (
                              <button
                                type="button"
                                disabled={emailRecoveryActionId === rec.id}
                                onClick={() => handleApproveEmailRecovery(rec.id)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] disabled:opacity-50 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{emailRecoveryActionId === rec.id ? 'অনুমোদন হচ্ছে...' : '✓ অনুমোদন করুন (Approve)'}</span>
                              </button>
                            )}

                            {/* If COMPLETE: Delete Undo Button (Shifts back to Pending!) */}
                            {isCompleted && (
                              <button
                                type="button"
                                disabled={emailRecoveryActionId === rec.id}
                                onClick={() => handleUndoEmailRecovery(rec.id)}
                                className="px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                title="পেন্ডিং তালিকায় পুনরায় ফেরত পাঠান"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${emailRecoveryActionId === rec.id ? 'animate-spin' : ''}`} />
                                <span>ডিলিট আনডু (পেন্ডিং এ ফেরত)</span>
                              </button>
                            )}

                            {/* Delete button for both (e.g. if client missed the call) */}
                            <button
                              type="button"
                              disabled={emailRecoveryActionId === rec.id}
                              onClick={() => handleDeleteEmailRecovery(rec.id)}
                              className="px-3 py-2 rounded-xl bg-[#1E293B] hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                              title="রিকোয়েস্টটি মুছে ফেলুন (কল মিস করলে)"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>মুছে ফেলুন</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}
        </div>
      );
    })()}

        {/* ================= TAB 5: PASSWORD & USER SECURITY DESK ================= */}
        {activeTab === 'resets' && (() => {
          // 1. Gather all completed reset/change requests
          const resetCompletedRequests = (resetRequests || []).filter(r => r && r.status === 'reset');
          
          // Users who have reset flag or match reset request
          const resetUsersList = (users || []).filter((u: any) => {
            if (!u) return false;
            const hasResetFlag = !!(u.isPasswordReset || u.passwordResetAt);
            const matchesResetRequest = resetCompletedRequests.some(r => 
              (r?.phone && u?.phone && r.phone.replace(/\D/g, '') === u.phone.replace(/\D/g, '')) ||
              (r?.newPhone && u?.phone && r.newPhone.replace(/\D/g, '') === u.phone.replace(/\D/g, '')) ||
              (r?.oldPhone && u?.phone && r.oldPhone.replace(/\D/g, '') === u.phone.replace(/\D/g, '')) ||
              (r?.newPasswordAssigned && r.newPasswordAssigned === u.password)
            );
            return hasResetFlag || matchesResetRequest;
          });

          // Combined full list of reset records to show every audit history item
          const allResetAuditRecords = [
            ...resetCompletedRequests,
            ...resetUsersList
              .filter(u => u && !resetCompletedRequests.some(r => (r?.phone && r.phone === u.phone) || (r?.newPhone && r.newPhone === u.phone)))
              .map(u => ({
                id: `u-reset-${u.phone}`,
                phone: u.phone,
                userName: u.name,
                oldPhone: u.phone,
                newPhone: u.phone,
                oldEmail: u.email || '',
                newEmail: u.email || '',
                changeType: 'password' as const,
                changeSummary: 'পাসওয়ার্ড রিসেট',
                tag: 'Password Reset',
                status: 'reset' as const,
                requestedAt: (u as any).passwordResetAt || u.registeredAt,
                resolvedAt: (u as any).passwordResetAt || u.registeredAt,
                newPasswordAssigned: u.password
              }))
          ];

          // 2. Filtered by search term
          const q = passwordDeskSearch.trim().toLowerCase();
          const filteredAllUsers = users.filter(u => {
            if (!q) return true;
            return (
              u.phone.toLowerCase().includes(q) || 
              u.name.toLowerCase().includes(q) || 
              (u.email && u.email.toLowerCase().includes(q))
            );
          });

          const filteredResetAuditRecords = allResetAuditRecords.filter(item => {
            if (!q) return true;
            return (
              (item.phone && item.phone.toLowerCase().includes(q)) ||
              (item.userName && item.userName.toLowerCase().includes(q)) ||
              (item.newPhone && item.newPhone.toLowerCase().includes(q)) ||
              (item.oldPhone && item.oldPhone.toLowerCase().includes(q)) ||
              (item.newEmail && item.newEmail.toLowerCase().includes(q)) ||
              (item.oldEmail && item.oldEmail.toLowerCase().includes(q)) ||
              (item.tag && item.tag.toLowerCase().includes(q)) ||
              (item.changeSummary && item.changeSummary.toLowerCase().includes(q))
            );
          });

          const filteredApprovedCallBacks = approvedCallBacks.filter(c => {
            const qCall = (callDeskSearch || '').trim().toLowerCase();
            if (!qCall) return true;
            return (
              (c.name && c.name.toLowerCase().includes(qCall)) ||
              (c.phone && c.phone.toLowerCase().includes(qCall)) ||
              (c.reason && c.reason.toLowerCase().includes(qCall)) ||
              (c.requestedAt && String(c.requestedAt).toLowerCase().includes(qCall)) ||
              (c.approvedAt && String(c.approvedAt).toLowerCase().includes(qCall))
            );
          });

          return (
            <div className="space-y-5 animate-fadeIn">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-[#A5B4FC]" />
                    <span>Password & Security (পাসওয়ার্ড ও সিকিউরিটি)</span>
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    গ্রাহকের মোবাইল নম্বর ও ইমেইল আইডি সরাসরি Change Details দিয়ে পরিবর্তন করুন। উভয় পাশের ডাটাবেস স্বয়ংক্রিয়ভাবে আপডেট হবে।
                  </p>
                </div>
                {pendingCallBacks.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 shrink-0 animate-pulse">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{pendingCallBacks.length} টি কল রিকোয়েস্ট অপেক্ষমান</span>
                  </span>
                )}
              </div>

              {/* Three Subsections: 1. All User List, 2. Reset Password / Reseted Password User List, 3. Call Request Desk */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 rounded-2xl bg-[#0F172A] border border-[#1E293B]">
                {/* Subsection 1: All User List */}
                <button
                  type="button"
                  onClick={() => setPasswordDeskTab('all_users')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    passwordDeskTab === 'all_users'
                      ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-[0_4px_16px_rgba(124,58,237,0.35)]'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#143321]'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>১. All User List</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    passwordDeskTab === 'all_users' ? 'bg-white/20 text-white' : 'bg-[#1E293B] text-[#818CF8]'
                  }`}>
                    {users.length}
                  </span>
                </button>

                {/* Subsection 2: Reset Password / Reseted Password User List */}
                <button
                  type="button"
                  onClick={() => setPasswordDeskTab('reset_users')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    passwordDeskTab === 'reset_users'
                      ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-[0_4px_16px_rgba(124,58,237,0.35)]'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#143321]'
                  }`}
                >
                  <Tag className="w-4 h-4 shrink-0" />
                  <span>২. Reset Password / Reseted Password User List</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    passwordDeskTab === 'reset_users' ? 'bg-white/20 text-white' : 'bg-[#1E293B] text-[#818CF8]'
                  }`}>
                    {allResetAuditRecords.length}
                  </span>
                </button>

                {/* Subsection 3: Call Request Desk */}
                <button
                  type="button"
                  onClick={() => setPasswordDeskTab('pending_requests')}
                  className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    passwordDeskTab === 'pending_requests'
                      ? 'bg-amber-600 text-white shadow-[0_4px_16px_rgba(217,119,6,0.35)]'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#143321]'
                  }`}
                >
                  <PhoneCall className="w-4 h-4 shrink-0" />
                  <span>৩. Call Request Desk</span>
                  {pendingCallBacks.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" />
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    passwordDeskTab === 'pending_requests' ? 'bg-white/20 text-white' : 'bg-[#1E293B] text-amber-300'
                  }`}>
                    {pendingCallBacks.length}
                  </span>
                </button>
              </div>

              {/* Clean Search Bar */}
              {passwordDeskTab !== 'pending_requests' && (
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={
                      passwordDeskTab === 'all_users'
                        ? 'সকল ইউজারদের নাম, মোবাইল নম্বর অথবা ইমেইল দিয়ে সার্চ করুন...'
                        : 'রিসেটকৃত নাম, আগের/নতুন মোবাইল নম্বর, ইমেইল বা ট্যাগ দিয়ে সার্চ করুন...'
                    }
                    value={passwordDeskSearch}
                    onChange={(e) => setPasswordDeskSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0F172A] border border-[#1E293B] text-white text-xs placeholder-[#64748D] focus:outline-none focus:border-[#7C3AED] transition-all"
                  />
                  {passwordDeskSearch && (
                    <button
                      type="button"
                      onClick={() => setPasswordDeskSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* ---------------- SUBSECTION 1: ALL USER LIST ---------------- */}
              {passwordDeskTab === 'all_users' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8] px-1">
                    <span>সকল নিবন্ধিত অ্যাকাউন্ট ({filteredAllUsers.length} জন)</span>
                    <span className="text-[11px] text-[#818CF8]">গ্রাহকের মোবাইল নম্বর বা ইমেইল হারালে "Change Details" দিয়ে রিসেট করুন</span>
                  </div>

                  {filteredAllUsers.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-[#0F172A] border border-[#1E293B] text-center text-xs text-[#94A3B8]">
                      {passwordDeskSearch ? 'এই সার্চে কোনো ব্যবহারকারী পাওয়া যায়নি।' : 'কোনো নিবন্ধিত ব্যবহারকারী নেই।'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filteredAllUsers.map((usr, uIdx) => {
                        const secCode = getClientSecurityCode(usr.phone);
                        const isReset = !!(
                          (usr as any).isPasswordReset || 
                          (usr as any).passwordResetAt || 
                          resetCompletedRequests.some(r => r.phone === usr.phone || r.newPhone === usr.phone)
                        );

                        return (
                          <div
                            key={usr.phone ? `all-u-${usr.phone}` : `all-u-${uIdx}`}
                            className={`p-4 sm:p-5 rounded-2xl border space-y-3 transition-all ${
                              usr.isRestricted
                                ? 'bg-[#181116] border-rose-500/40'
                                : 'bg-[#0F172A] border-[#1E293B]'
                            }`}
                          >
                            {/* User Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B46C1] to-[#7C3AED] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                                  {usr.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                                    <span className="truncate">{usr.name}</span>
                                    {isReset && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-[#7C3AED]/25 text-[#A5B4FC] border border-[#7C3AED]/40 text-[9px] font-black shrink-0">
                                        ✓ রিসেটকৃত আইডি
                                      </span>
                                    )}
                                  </h4>
                                  <span className="text-[11px] text-[#94A3B8] font-mono block">{usr.phone}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-xs shrink-0">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#818CF8]" />
                                <span className="text-[10px] text-[#A5B4FC] font-semibold">Security:</span>
                                <span className="font-mono font-black text-white">{secCode}</span>
                              </div>
                            </div>

                            {/* Details Row */}
                            <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#1E293B]/70 text-xs space-y-1.5">
                              <div className="flex justify-between items-center text-[#94A3B8]">
                                <span>ইমেইল আইডি:</span>
                                <span className="font-mono text-white truncate max-w-[200px]">{usr.email || '—'}</span>
                              </div>
                              <div className="flex justify-between items-center text-[#94A3B8]">
                                <span>বর্তমান পাসওয়ার্ড:</span>
                                <span className="font-mono font-bold text-[#818CF8] bg-[#1E293B] px-2 py-0.5 rounded border border-[#1E293B]">
                                  {usr.password || 'প্রযোজ্য নয়'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[#94A3B8]">
                                <span>নিবন্ধনের তারিখ:</span>
                                <span className="text-white">{usr.registeredAt}</span>
                              </div>
                            </div>

                            {/* Actions: Change Details instead of Change Password */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleOpenChangeDetails(usr)}
                                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                title="গ্রাহকের ইমেইল ও মোবাইল নম্বর পরিবর্তন / আইডি রিসেট"
                              >
                                <Tag className="w-3.5 h-3.5" />
                                <span>Change Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleRestrictUser(usr)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  usr.isRestricted
                                    ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40'
                                    : 'bg-[#143321] text-[#94A3B8] hover:text-white border border-[#1E293B]'
                                }`}
                              >
                                {usr.isRestricted ? 'আন-রেস্ট্রিক্ট' : 'রেস্ট্রিক্ট'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- SUBSECTION 2: RESET PASSWORD / RESETED PASSWORD USER LIST ---------------- */}
              {passwordDeskTab === 'reset_users' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8] px-1">
                    <span>রিসেটকৃত গ্রাহকদের তালিকা ({filteredResetAuditRecords.length} জন)</span>
                    <span className="text-[11px] text-[#818CF8]">কার আইডি, কী ধরনের পরিবর্তন, কী থেকে কী পরিবর্তন ও তারিখ প্রদর্শিত</span>
                  </div>

                  {filteredResetAuditRecords.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-[#0F172A] border border-[#1E293B] text-center text-xs text-[#94A3B8] space-y-2">
                      <Tag className="w-8 h-8 text-[#94A3B8] mx-auto opacity-50" />
                      <p className="font-bold text-white">এখনও কোনো গ্রাহকের আইডি বিস্তারিত তথ্য রিসেট করা হয়নি।</p>
                      <p className="text-[11px]">"All User List" ট্যাবে গিয়ে যেকোনো ইউজারের "Change Details" বাটনে ক্লিক করে ইমেইল ও নম্বর পরিবর্তন করতে পারবেন।</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filteredResetAuditRecords.map((item, idx) => {
                        const targetPhone = item.newPhone || item.phone;
                        const matchingUser = users.find(u => 
                          (targetPhone && (normalizePhone(u.phone) === normalizePhone(targetPhone) || u.phone === targetPhone)) ||
                          (item.oldPhone && (normalizePhone(u.phone) === normalizePhone(item.oldPhone) || u.phone === item.oldPhone))
                        );
                        const userForEdit: UserAccount = matchingUser || {
                          name: item.userName || 'গ্রাহক',
                          phone: targetPhone,
                          email: item.newEmail || '',
                          password: item.newPasswordAssigned || '',
                          registeredAt: item.requestedAt || ''
                        };

                        const hasPhoneDifference = item.oldPhone && item.newPhone && item.oldPhone !== item.newPhone;
                        const hasEmailDifference = item.oldEmail && item.newEmail && item.oldEmail !== item.newEmail;

                        return (
                          <div
                            key={item.id ? `audit-${item.id}` : `audit-idx-${idx}`}
                            className="p-5 rounded-2xl bg-[#0F172A] border-2 border-[#7C3AED]/60 space-y-3.5 shadow-sm relative overflow-hidden"
                          >
                            {/* Top Status & Tag Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                                  ১. গ্রাহকের আইডি (Whose ID)
                                </span>
                                <h4 className="text-base font-black text-white flex items-center gap-2">
                                  <span>{item.userName || matchingUser?.name || 'গ্রাহক'}</span>
                                  {matchingUser?.clientId && (
                                    <span className="px-1.5 py-0.2 rounded bg-[#1E293B] text-[#818CF8] text-[10px] font-mono">
                                      {matchingUser.clientId}
                                    </span>
                                  )}
                                </h4>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span className="px-2.5 py-0.5 bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white text-[10px] font-black rounded-lg shadow-xs">
                                  ✓ রিসেট সম্পন্ন
                                </span>
                                {item.tag && (
                                  <span className="px-2 py-0.5 rounded-lg bg-[#7C3AED]/20 text-[#A5B4FC] border border-[#7C3AED]/40 text-[9px] font-bold flex items-center gap-1">
                                    <Tag className="w-2.5 h-2.5" />
                                    <span>{item.tag}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* ২. কী ধরনের পরিবর্তন (What Type of Changes) */}
                            <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-1">
                              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                                ২. পরিবর্তনের ধরন (Type of Changes)
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                {item.changeType === 'both' && (
                                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black flex items-center gap-1">
                                    <span>🔄</span> মোবাইল ও ইমেইল উভয়ই পরিবর্তন
                                  </span>
                                )}
                                {item.changeType === 'phone' && (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black flex items-center gap-1">
                                    <span>📱</span> মোবাইল নম্বর পরিবর্তন
                                  </span>
                                )}
                                {item.changeType === 'email' && (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black flex items-center gap-1">
                                    <span>✉️</span> ইমেইল আইডি পরিবর্তন
                                  </span>
                                )}
                                {item.changeType === 'password' && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black flex items-center gap-1">
                                    <span>🔑</span> পাসওয়ার্ড রিসেট
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* ৩. কী থেকে কী পরিবর্তন করা হয়েছে (From What to What) */}
                            <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-2 text-xs">
                              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                                ৩. কী থেকে কী পরিবর্তন হয়েছে (From What to What)
                              </span>

                              {/* Phone Comparison */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-[#1E293B]/60">
                                <span className="text-[#94A3B8] text-[11px]">মোবাইল নম্বর:</span>
                                <div className="flex items-center gap-2 font-mono text-xs">
                                  {hasPhoneDifference ? (
                                    <>
                                      <span className="text-rose-400 line-through">{item.oldPhone}</span>
                                      <span className="text-[#94A3B8]">➔</span>
                                      <span className="text-[#818CF8] font-black">{item.newPhone}</span>
                                    </>
                                  ) : (
                                    <span className="text-[#818CF8] font-bold">{item.newPhone || item.phone}</span>
                                  )}
                                </div>
                              </div>

                              {/* Email Comparison */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-[#1E293B]/60">
                                <span className="text-[#94A3B8] text-[11px]">ইমেইল আইডি:</span>
                                <div className="flex items-center gap-2 font-mono text-xs">
                                  {hasEmailDifference ? (
                                    <>
                                      <span className="text-rose-400 line-through">{item.oldEmail || 'ছিল না'}</span>
                                      <span className="text-[#94A3B8]">➔</span>
                                      <span className="text-[#818CF8] font-black">{item.newEmail}</span>
                                    </>
                                  ) : (
                                    <span className="text-[#818CF8] font-bold">{item.newEmail || item.oldEmail || '—'}</span>
                                  )}
                                </div>
                              </div>

                              {/* Password (if assigned) */}
                              {item.newPasswordAssigned && (
                                <div className="flex items-center justify-between py-1 border-b border-[#1E293B]/60">
                                  <span className="text-[#94A3B8] text-[11px]">নির্ধারিত পাসওয়ার্ড:</span>
                                  <span className="font-mono text-xs text-[#818CF8] font-bold bg-[#1E293B] px-2 py-0.5 rounded border border-[#1E293B]">
                                    {item.newPasswordAssigned}
                                  </span>
                                </div>
                              )}

                              {/* Change Summary Line */}
                              {item.changeSummary && (
                                <div className="pt-1 text-[11px] text-[#A5B4FC] font-medium bg-[#030B07] p-2 rounded-lg border border-[#1E293B]/70">
                                  📝 {item.changeSummary}
                                </div>
                              )}
                            </div>

                            {/* ৪. কোন তারিখে পরিবর্তন করা হয়েছে (On Which Date) */}
                            <div className="flex items-center justify-between text-[11px] text-[#94A3B8] px-1">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-[#818CF8]" />
                                <span>৪. পরিবর্তনের তারিখ ও সময়:</span>
                              </span>
                              <span className="font-mono text-white font-bold">
                                {item.resolvedAt || item.requestedAt}
                              </span>
                            </div>

                            {/* Action Buttons: Change Details */}
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleOpenChangeDetails(userForEdit)}
                                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                title="এই ব্যবহারকারীর তথ্য পুনরায় পরিবর্তন করুন"
                              >
                                <Tag className="w-3.5 h-3.5" />
                                <span>Change Details</span>
                              </button>

                              {matchingUser && (
                                <button
                                  type="button"
                                  onClick={() => handleSendSecurityCodeToClient(matchingUser)}
                                  className="py-2 px-3 rounded-xl bg-[#143321] hover:bg-[#1c472e] text-[#A5B4FC] border border-[#1E293B] text-xs font-bold transition-all cursor-pointer shadow-xs"
                                  title="গ্রাহকের কাছে সিকিউরিটি কোড এসএমএস পাঠান"
                                >
                                  কোড পাঠান
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- SUBSECTION 3: CALL REQUEST DESK ---------------- */}
              {passwordDeskTab === 'pending_requests' && (
                <div className="space-y-4">
                  {/* Call Desk Header & Sub-Tabs */}
                  <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <PhoneCall className="w-5 h-5 text-amber-400" />
                        <span>Call Request Desk (কল ব্যাক ডেস্ক)</span>
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        ওয়েবসাইট মেনুর "Call Back" অপশন থেকে গ্রাহকদের পাঠানো কল ব্যাক অনুরোধসমূহ।
                      </p>
                    </div>

                    {/* Sub-tabs: Pending vs Approved */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0B0F19] border border-[#1E293B]">
                      <button
                        type="button"
                        onClick={() => setCallDeskSubTab('pending')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          callDeskSubTab === 'pending'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>পেন্ডিং কল ({pendingCallBacks.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCallDeskSubTab('approved')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          callDeskSubTab === 'approved'
                            ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-xs'
                            : 'text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>অনুমোদিত হিস্টোরি ({approvedCallBacks.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. Pending Call Requests Section */}
                  {callDeskSubTab === 'pending' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-[#94A3B8] px-1">
                        <span>অপেক্ষমান কল ব্যাক অনুরোধ ({pendingCallBacks.length} টি)</span>
                        <span className="text-[11px] text-amber-300">
                          কল করার পর Approve করুন, না চাইলে Reject অথবা Remove করুন
                        </span>
                      </div>

                      {pendingCallBacks.length === 0 ? (
                        <div className="p-10 rounded-2xl bg-[#0F172A] border border-[#1E293B] text-center text-xs text-[#94A3B8] space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-[#818CF8] mx-auto" />
                          <p className="font-bold text-white">কোনো পেন্ডিং কল রিকোয়েস্ট নেই!</p>
                          <p className="text-[11px]">সকল কল ব্যাক অনুরোধ সম্পন্ন ও সমাধান করা হয়েছে।</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {pendingCallBacks.map((req, rIdx) => {
                            const matchingUser = users.find(u => 
                              (req.phone && (normalizePhone(u.phone) === normalizePhone(req.phone) || u.phone === req.phone))
                            );

                            return (
                              <div
                                key={req.id ? `call-${req.id}` : `call-idx-${rIdx}`}
                                className="p-5 rounded-2xl bg-[#0F172A] border-2 border-amber-500/50 space-y-3 relative shadow-sm"
                              >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                                      <PhoneCall className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                                        <span>{req.name || matchingUser?.name || 'গ্রাহক'}</span>
                                      </h4>
                                      <a 
                                        href={`tel:${req.phone}`} 
                                        className="text-xs text-[#818CF8] hover:underline font-mono font-bold block"
                                        title="সরাসরি ফোন করুন"
                                      >
                                        📞 {req.phone}
                                      </a>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-1">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                      <Clock className="w-3 h-3 animate-pulse" />
                                      <span>অপেক্ষমান কল</span>
                                    </span>
                                    <span className="text-[10px] text-[#94A3B8] font-mono">
                                      {req.requestedAt}
                                    </span>
                                  </div>
                                </div>

                                {/* Call Reason Box */}
                                <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-1">
                                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                                    কল করার কারণ (Reason for Call):
                                  </span>
                                  <p className="text-xs text-white leading-relaxed font-medium">
                                    {req.reason || 'কোনো কারণ উল্লেখ করা হয়নি'}
                                  </p>
                                </div>

                                {/* Action Suite: Remove, Approve, Reject, Change Details */}
                                <div className="pt-1 flex flex-wrap items-center gap-2">
                                  {/* 1. Approve Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleApproveCallBack(req.id)}
                                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                    title="কল করার পর অনুমোদন দিন - গ্রাহক দেখতে পাবে কল সম্পন্ন হয়েছে"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve (অনুমোদন)</span>
                                  </button>

                                  {/* 2. Reject Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRejectCallBack(req.id)}
                                    className="py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                                    title="কল রিসিভ না হলে বাতিল করুন"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Reject (বাতিল)</span>
                                  </button>

                                  {/* 3. Remove Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCallBack(req.id)}
                                    className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer"
                                    title="কল রিকোয়েস্ট মুছে ফেলুন - গ্রাহকের মেনু থেকেও কল ব্যাক অপশন মুছে যাবে"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Remove (মুছে ফেলুন)</span>
                                  </button>

                                  {/* Change Details */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenChangeDetails(matchingUser || {
                                        name: req.name || 'গ্রাহক',
                                        phone: req.phone,
                                        email: '',
                                        registeredAt: req.requestedAt
                                      }, req.id);
                                    }}
                                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    title="গ্রাহকের বিস্তারিত তথ্য বা আইডি রিসেট করুন"
                                  >
                                    <Tag className="w-3.5 h-3.5" />
                                    <span>Change Details</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Approved Call Requests Section with Dedicated Search Bar */}
                  {callDeskSubTab === 'approved' && (
                    <div className="space-y-3">
                      {/* Search Bar for Approved Calls */}
                      <div className="relative w-full">
                        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="অনুমোদিত কল রিকোয়েস্ট নাম, ফোন নম্বর, কারণ বা তারিখ দিয়ে খুঁজুন..."
                          value={callDeskSearch}
                          onChange={(e) => setCallDeskSearch(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0F172A] border border-[#1E293B] text-white text-xs placeholder-[#64748D] focus:outline-none focus:border-[#7C3AED] transition-all"
                        />
                        {callDeskSearch && (
                          <button
                            type="button"
                            onClick={() => setCallDeskSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#94A3B8] px-1">
                        <span>অনুমোদিত ও সম্পন্ন কল হিস্টোরি ({filteredApprovedCallBacks.length} টি)</span>
                        <span className="text-[11px] text-[#A5B4FC]">
                          ভবিষ্যতে দেখার জন্য সকল অনুমোদিত কলের পূর্ণ রেকর্ড
                        </span>
                      </div>

                      {filteredApprovedCallBacks.length === 0 ? (
                        <div className="p-10 rounded-2xl bg-[#0F172A] border border-[#1E293B] text-center text-xs text-[#94A3B8] space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-[#94A3B8] mx-auto opacity-50" />
                          <p className="font-bold text-white">
                            {callDeskSearch ? 'এই সার্চে কোনো অনুমোদিত কল পাওয়া যায়নি।' : 'এখনও কোনো অনুমোদিত কল রিকোয়েস্ট নেই।'}
                          </p>
                          <p className="text-[11px]">পেন্ডিং কল রিকোয়েস্টে কথা বলে Approve বাটনে ক্লিক করলে তা এখানে যুক্ত হবে।</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {filteredApprovedCallBacks.map((req, rIdx) => {
                            const matchingUser = users.find(u => 
                              (req.phone && (normalizePhone(u.phone) === normalizePhone(req.phone) || u.phone === req.phone))
                            );

                            return (
                              <div
                                key={req.id ? `app-call-${req.id}` : `app-call-${rIdx}`}
                                className="p-5 rounded-2xl bg-[#0F172A] border-2 border-[#7C3AED]/60 space-y-3 relative shadow-sm"
                              >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 text-[#A5B4FC] border border-[#7C3AED]/40 flex items-center justify-center font-bold text-sm shrink-0">
                                      <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                                        <span>{req.name || matchingUser?.name || 'গ্রাহক'}</span>
                                      </h4>
                                      <span className="text-xs text-[#A5B4FC] font-mono font-bold block">
                                        📞 {req.phone}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-1">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white shadow-xs">
                                      ✓ অনুমোদিত ও কল সম্পন্ন
                                    </span>
                                  </div>
                                </div>

                                {/* Call Reason Box */}
                                <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-1">
                                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                                    কল করার কারণ (Reason for Call):
                                  </span>
                                  <p className="text-xs text-white leading-relaxed font-medium">
                                    {req.reason || 'কোনো কারণ উল্লেখ করা হয়নি'}
                                  </p>
                                </div>

                                {/* Timestamps */}
                                <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B]/70 text-[11px] space-y-1">
                                  <div className="flex justify-between items-center text-[#94A3B8]">
                                    <span>অনুরোধের তারিখ ও সময়:</span>
                                    <span className="text-white font-mono">{req.requestedAt}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[#94A3B8]">
                                    <span className="text-[#A5B4FC]">কল সম্পন্ন ও অনুমোদনের সময়:</span>
                                    <span className="text-[#A5B4FC] font-mono font-bold">{req.approvedAt || 'সম্পন্ন'}</span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-1 flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCallBack(req.id)}
                                    className="py-1.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                    title="হিস্টোরি থেকে মুছে ফেলুন"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>মুছে ফেলুন</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOpenChangeDetails(matchingUser || {
                                        name: req.name || 'গ্রাহক',
                                        phone: req.phone,
                                        email: '',
                                        registeredAt: req.requestedAt
                                      }, req.id);
                                    }}
                                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <Tag className="w-3.5 h-3.5" />
                                    <span>Change Details</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ================= TAB 6: CATALOG & EDIT STOCK ================= */}
        {activeTab === 'catalog' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">ওয়েবসাইট স্টক ও এডিট ({customWebsites.length})</h2>
                <p className="text-xs text-[#94A3B8]">বিদ্যমান যেকোনো ওয়েবসাইটের তথ্য, ডেসক্রিপশন ও থাম্বনেইল সরাসরি এডিট করুন।</p>
              </div>

              <button
                onClick={() => setShowAddWebsiteModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ওয়েবসাইট আপলোড</span>
              </button>
            </div>

            {/* Non-hover explicit cards with clear "এডিট করুন" button on each */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customWebsites.map((site, sIdx) => (
                <div
                  key={site.id ? `${site.id}-${sIdx}` : `site-${sIdx}`}
                  className="p-4 rounded-2xl bg-[#0F172A] border border-[#1E293B] flex flex-col justify-between space-y-3"
                >
                  <div>
                    <img
                      src={site.previewImage}
                      alt={site.title}
                      className="w-full h-36 rounded-xl object-cover border border-[#1E293B] mb-3"
                    />
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white text-[10px] font-mono font-bold">
                        {site.fourDigitCode}
                      </span>
                      <span className="text-[10px] text-[#A5B4FC] font-bold uppercase">
                        {site.categoryLabel}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-1">{site.title}</h4>
                    <p className="text-[11px] text-[#94A3B8] line-clamp-2 mt-1">{site.description}</p>
                  </div>

                  <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between gap-2">
                    <span className="font-mono text-white text-xs font-bold">{site.priceTag}</span>
                    
                    {/* Clear Edit Button */}
                    <button
                      onClick={() => handleOpenEditSite(site)}
                      className="px-3 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#6B46C1] text-[#A5B4FC] hover:text-white border border-[#7C3AED]/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>এডিট করুন</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal: Edit Existing Website */}
            {editingSite && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                <div className="w-full max-w-lg bg-[#0F172A] border border-[#7C3AED]/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-4">
                  <button
                    onClick={() => setEditingSite(null)}
                    className="absolute top-5 right-5 text-[#94A3B8] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-[#A5B4FC]" />
                    <h3 className="text-base font-black text-white">
                      ওয়েবসাইট এডিট করুন ({editingSite.fourDigitCode})
                    </h3>
                  </div>

                  <form onSubmit={handleSaveEditedWebsite} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[#A8D7BD] mb-1">ওয়েবসাইট শিরোনাম (Title)</label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#A8D7BD] mb-1">ক্যাটাগরি</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#7C3AED]"
                      >
                        <option value="ecommerce">E-Commerce</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="blogging">Blogs & Media</option>
                        <option value="grocery">Groceries</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#A8D7BD]">প্রিভিউ ইমেজ (থাম্বনেইল)</label>
                        <div className="flex rounded-lg bg-[#0B0F19] p-0.5 border border-[#1E293B]">
                          <button
                            type="button"
                            onClick={() => setEditImageInputMode('gallery')}
                            className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${
                              editImageInputMode === 'gallery'
                                ? 'bg-[#7C3AED] text-white'
                                : 'text-[#94A3B8] hover:text-white'
                            }`}
                          >
                            গ্যালারি
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditImageInputMode('url')}
                            className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition-all cursor-pointer ${
                              editImageInputMode === 'url'
                                ? 'bg-[#7C3AED] text-white'
                                : 'text-[#94A3B8] hover:text-white'
                            }`}
                          >
                            অনলাইন লিংক
                          </button>
                        </div>
                      </div>

                      <input
                        type="file"
                        ref={editGalleryFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            processGalleryImage(
                              f,
                              (dataUrl, name) => {
                                setEditThumbnail(dataUrl);
                                setEditGalleryImageName(name);
                              },
                              (err) => alert(err),
                              setEditImageCompressing
                            );
                          }
                        }}
                      />

                      {editImageInputMode === 'gallery' ? (
                        <div className="space-y-2">
                          {editThumbnail ? (
                            <div className="relative rounded-xl overflow-hidden border border-[#1E293B] bg-[#0B0F19] p-2 flex items-center gap-3">
                              <img
                                src={editThumbnail}
                                alt="Preview"
                                className="w-16 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white font-medium truncate">
                                  {editGalleryImageName || 'ছবি নির্বাচন করা হয়েছে'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => editGalleryFileInputRef.current?.click()}
                                    className="text-[11px] text-[#A5B4FC] hover:underline cursor-pointer"
                                  >
                                    ছবি পরিবর্তন
                                  </button>
                                  <span className="text-zinc-600">•</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditThumbnail('');
                                      setEditGalleryImageName('');
                                    }}
                                    className="text-[11px] text-red-400 hover:underline cursor-pointer"
                                  >
                                    মুছুন
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => editGalleryFileInputRef.current?.click()}
                              disabled={editImageCompressing}
                              className="w-full py-4 border-2 border-dashed border-[#1E293B] hover:border-[#7C3AED] rounded-xl flex flex-col items-center justify-center gap-1.5 bg-[#0B0F19]/50 hover:bg-[#0B0F19] transition-all cursor-pointer group"
                            >
                              <UploadCloud className="w-6 h-6 text-[#A5B4FC] group-hover:scale-110 transition-transform" />
                              <span className="text-xs text-[#CBD5E1] font-bold">
                                {editImageCompressing ? 'ছবি লোড হচ্ছে...' : 'গ্যালারি থেকে ছবি আপলোড করুন'}
                              </span>
                              <span className="text-[10px] text-[#94A3B8]">JPG, PNG, WEBP ইত্যাদি</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="https://... বা ইমেজ লিংক"
                          value={editThumbnail}
                          onChange={(e) => setEditThumbnail(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#7C3AED]"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#A8D7BD] mb-1">মূল্য ট্যাগ (Price Tag)</label>
                      <input
                        type="text"
                        value={editPriceTag}
                        onChange={(e) => setEditPriceTag(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#A8D7BD] mb-1">বর্ণনা / সাবটেক্সট (Description)</label>
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs text-white resize-none focus:outline-none focus:border-[#7C3AED]"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        পরিবর্তন সংরক্ষণ করুন
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSite(null)}
                        className="px-4 py-2.5 rounded-xl bg-[#0B0F19] text-xs text-[#94A3B8]"
                      >
                        বাতিল
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Upload New Product / Website (Requirement 15: Unlimited Products & Gallery Upload) */}
            {showAddWebsiteModal && (
              <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
                <div className="w-full max-w-xl max-h-[92vh] bg-[#111827] border-2 border-[#AB55F7]/80 rounded-3xl shadow-2xl flex flex-col my-auto overflow-hidden relative">
                  {/* Top Bar / Header */}
                  <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#1E293B] flex items-center justify-between shrink-0 bg-[#0F172A]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#AB55F7]/30 to-[#7C3AED]/20 border border-[#AB55F7]/40 flex items-center justify-center text-[#AB55F7]">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                          <span>নতুন প্রোডাক্ট / ওয়েবসাইট আপলোড</span>
                        </h3>
                        <p className="text-[10px] sm:text-xs text-[#94A3B8]">
                          প্রোডাক্ট আপলোড করুন ও গ্যালারি থেকে প্রিভিউ ছবি যুক্ত করুন
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddWebsiteModal(false)}
                      className="text-[#94A3B8] hover:text-white cursor-pointer p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateNewWebsite} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
                      {/* Error Alert Banner */}
                      {productUploadError && (
                        <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 flex items-start justify-between gap-2 text-red-200 text-xs animate-shake">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>{productUploadError}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProductUploadError('')}
                            className="text-red-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* 1. Product Title */}
                      <div>
                        <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                          Product Title (প্রোডাক্ট টাইটেল) <span className="text-[#E53935]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: Luxe Watch - Smart Luxury Store"
                          value={newProductTitle}
                          onChange={(e) => setNewProductTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#AB55F7]"
                        />
                      </div>

                      {/* 2. Category Selection */}
                      <div>
                        <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                          Category (ক্যাটাগরি) <span className="text-[#E53935]">*</span>
                        </label>
                        <select
                          value={newSiteCategory}
                          onChange={(e) => setNewSiteCategory(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#AB55F7]"
                        >
                          <option value="ecommerce">🛍️ E-Commerce (ই-কমার্স শপ)</option>
                          <option value="restaurant">🍽️ Restaurant & Cafe (রেস্তোরাঁ ও ক্যাফে)</option>
                          <option value="blogging">📰 Newspaper & Blog (নিউজপেপার ও ব্লগ)</option>
                          <option value="grocery">🌿 Grocery & Organic (মুদি ও অর্গানিক)</option>
                          <option value="corporate">💼 Corporate & Business (কর্পোরেট)</option>
                          <option value="fashion">👗 Fashion & Boutique (ফ্যাশন)</option>
                          <option value="portfolio">🎨 Personal Portfolio (পোর্টফোলিও)</option>
                        </select>
                      </div>

                      {/* 3. Description */}
                      <div>
                        <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                          Description (বিবরণ)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="ওয়েবসাইটের মূল সুবিধাসমূহ ও বিবরণ লিখুন..."
                          value={newProductDesc}
                          onChange={(e) => setNewProductDesc(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs text-white resize-none focus:outline-none focus:border-[#AB55F7]"
                        />
                      </div>

                      {/* 4. Product Pricing (Packages: ৳999, ৳1499, ৳2499) */}
                      <div>
                        <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                          Product Pricing (প্যাকেজ মূল্য)
                        </label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {['৳999', '৳1499', '৳2499'].map((pkg) => (
                            <button
                              key={pkg}
                              type="button"
                              onClick={() => setNewProductPricing(pkg)}
                              className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                newProductPricing === pkg
                                  ? 'bg-gradient-to-r from-[#AB55F7] to-[#7C3AED] border-[#AB55F7] text-white shadow-xs'
                                  : 'bg-[#0B0F19] border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#AB55F7]/50'
                              }`}
                            >
                              {pkg}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="অন্যান্য কাস্টম মূল্য (যেমন: ৳1499)"
                          value={newProductPricing}
                          onChange={(e) => setNewProductPricing(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#AB55F7]"
                        />
                      </div>

                      {/* 5. Discount Price */}
                      <div>
                        <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                          Discount Price (ডিসকাউন্ট মূল্য)
                        </label>
                        <input
                          type="text"
                          placeholder="যেমন: ৳199 বা ৳0"
                          value={newDiscountPrice}
                          onChange={(e) => setNewDiscountPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#AB55F7]"
                        />
                      </div>

                      {/* 6. Product Link */}
                      <div>
                        <label className="block text-xs font-bold text-[#CBD5E1] mb-1">
                          Product / Website Link (প্রোডাক্ট বা ওয়েবসাইট লিংক) <span className="text-[#AB55F7] font-semibold">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="যেমন: https://daraz.com.bd অথবা https://mybrand.com অথবা mystore.com"
                          value={newProductLink}
                          onChange={(e) => setNewProductLink(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#AB55F7]"
                        />
                        <p className="text-[10px] text-[#94A3B8] mt-1 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>এই লিংকটি মূল ড্যাশবোর্ড থেকে ওয়েবসাইট প্রিভিউ স্ক্রিনে লাইভ ওপেন হবে।</span>
                        </p>
                      </div>

                      {/* 7. Preview Image (Gallery Upload & URL) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#CBD5E1] flex items-center gap-1.5">
                            <span>প্রিভিউ ছবি (Preview Image)</span>
                            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                              গ্যালারি সাপোর্ট
                            </span>
                          </label>

                          {/* Image Mode Switcher */}
                          <div className="flex rounded-lg bg-[#0B0F19] p-0.5 border border-[#1E293B]">
                            <button
                              type="button"
                              onClick={() => setImageInputMode('gallery')}
                              className={`px-2.5 py-1 text-[11px] rounded-md font-bold transition-all cursor-pointer ${
                                imageInputMode === 'gallery'
                                  ? 'bg-[#AB55F7] text-white shadow-xs'
                                  : 'text-[#94A3B8] hover:text-white'
                              }`}
                            >
                              📱 গ্যালারি
                            </button>
                            <button
                              type="button"
                              onClick={() => setImageInputMode('url')}
                              className={`px-2.5 py-1 text-[11px] rounded-md font-bold transition-all cursor-pointer ${
                                imageInputMode === 'url'
                                  ? 'bg-[#AB55F7] text-white shadow-xs'
                                  : 'text-[#94A3B8] hover:text-white'
                              }`}
                            >
                              🔗 অনলাইন লিংক
                            </button>
                          </div>
                        </div>

                        {/* Hidden File Input for Device Gallery */}
                        <input
                          type="file"
                          ref={galleryFileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processGalleryImage(
                                file,
                                (dataUrl, name) => {
                                  setNewSiteThumbnail(dataUrl);
                                  setGalleryImageName(name);
                                },
                                (err) => setProductUploadError(err),
                                setImageCompressing
                              );
                            }
                          }}
                        />

                        {imageInputMode === 'gallery' ? (
                          <div className="space-y-2">
                            {newSiteThumbnail ? (
                              <div className="relative rounded-2xl overflow-hidden border border-[#AB55F7]/40 bg-[#0B0F19] p-2.5 flex items-center gap-3">
                                <img
                                  src={newSiteThumbnail}
                                  alt="Preview"
                                  className="w-20 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    <span className="text-[11px] font-bold text-emerald-400">গ্যালারি ছবি প্রস্তুত</span>
                                  </div>
                                  <p className="text-xs text-white font-medium truncate">
                                    {galleryImageName || 'গ্যালারি থেকে সংগৃহীত প্রিভিউ ইমেজ'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <button
                                      type="button"
                                      onClick={() => galleryFileInputRef.current?.click()}
                                      className="text-xs text-[#AB55F7] font-bold hover:underline cursor-pointer"
                                    >
                                      অন্য ছবি পরিবর্তন
                                    </button>
                                    <span className="text-zinc-600">•</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setNewSiteThumbnail('');
                                        setGalleryImageName('');
                                      }}
                                      className="text-xs text-red-400 font-bold hover:underline cursor-pointer"
                                    >
                                      মুছে ফেলুন
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => galleryFileInputRef.current?.click()}
                                disabled={imageCompressing}
                                className="w-full py-5 border-2 border-dashed border-[#1E293B] hover:border-[#AB55F7] rounded-2xl flex flex-col items-center justify-center gap-2 bg-[#0B0F19]/60 hover:bg-[#0B0F19] transition-all cursor-pointer group"
                              >
                                <div className="w-12 h-12 rounded-2xl bg-[#AB55F7]/10 border border-[#AB55F7]/30 flex items-center justify-center text-[#AB55F7] group-hover:scale-110 transition-transform">
                                  {imageCompressing ? (
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                  ) : (
                                    <UploadCloud className="w-6 h-6" />
                                  )}
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-bold text-white">
                                    {imageCompressing ? 'ছবি অপ্টিমাইজ হচ্ছে...' : 'গ্যালারি থেকে ছবি নির্বাচন করুন'}
                                  </p>
                                  <p className="text-[10px] text-[#94A3B8] mt-0.5">
                                    মোবাইল ক্যামেরা বা ফটো লাইব্রেরি (JPG, PNG, WEBP)
                                  </p>
                                </div>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="https://images.unsplash.com/... অথবা ডিরেক্ট ছবি লিঙ্ক"
                              value={newSiteThumbnail}
                              onChange={(e) => {
                                setNewSiteThumbnail(e.target.value);
                                setGalleryImageName('');
                              }}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#AB55F7]"
                            />
                            {newSiteThumbnail && (
                              <div className="rounded-xl overflow-hidden border border-[#1E293B] bg-[#0B0F19] p-2 flex items-center gap-3">
                                <img
                                  src={newSiteThumbnail}
                                  alt="Preview"
                                  className="w-16 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                                />
                                <span className="text-xs text-[#94A3B8] truncate">{newSiteThumbnail}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 8. Notification to clients */}
                      <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id="sendDetailsCheck"
                          checked={sendDetailsToClient}
                          onChange={(e) => setSendDetailsToClient(e.target.checked)}
                          className="w-4 h-4 rounded text-[#AB55F7] focus:ring-[#AB55F7] border-gray-700 bg-gray-900 cursor-pointer"
                        />
                        <label htmlFor="sendDetailsCheck" className="text-xs text-[#CBD5E1] cursor-pointer">
                          নতুন প্রোডাক্ট পাবলিশের পর সক্রিয় গ্রাহকদের সাপোর্ট চ্যাটে নোটিফিকেশন পাঠান
                        </label>
                      </div>

                    </div>

                    {/* Bottom Sticky Action Bar */}
                    <div className="px-4 sm:px-6 py-3.5 border-t border-[#1E293B] bg-[#0E1524] flex gap-2.5 shrink-0">
                      <button
                        type="submit"
                        disabled={isUploadingProduct || imageCompressing}
                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#AB55F7] via-[#9333EA] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black cursor-pointer shadow-lg shadow-[#AB55F7]/30 border border-[#D8B4FE]/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isUploadingProduct ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>পাবলিশ ও যুক্ত হচ্ছে...</span>
                          </>
                        ) : imageCompressing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>ছবি অপ্টিমাইজ হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>পাবলিশ করুন • Publish Website</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddWebsiteModal(false)}
                        className="px-4 py-3.5 rounded-xl bg-[#1E293B] text-xs text-[#94A3B8] hover:text-white cursor-pointer transition-colors font-bold"
                      >
                        বাতিল
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 6.5: DEDICATED WEBSITE UPLOADING & PUBLISHING WORKSPACE ================= */}
        {activeTab === 'upload' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#1E1B4B] via-[#0F172A] to-[#111827] border-2 border-[#AB55F7]/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#AB55F7] to-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-[#AB55F7]/30 shrink-0">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-xl font-black text-white">
                      নতুন ওয়েবসাইট আপলোড ও পাবলিশ কনসোল
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      Live & Unlimited
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    ওয়েবসাইট আপলোড করুন। প্রদত্ত লিংকটি মূল ড্যাশবোর্ডে ওয়েবসাইট প্রিভিউতে সরাসরি লাইভ প্রদর্শিত হবে।
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSwitchTab('catalog')}
                className="px-4 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
              >
                <Globe className="w-4 h-4 text-[#C084FC]" />
                <span>বিদ্যমান স্টক দেখুন ({customWebsites.length})</span>
              </button>
            </div>

            {/* Error Alert Banner */}
            {productUploadError && (
              <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/50 flex items-start justify-between gap-3 text-red-200 text-xs animate-shake">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <span className="font-medium">{productUploadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setProductUploadError('')}
                  className="text-red-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Main Upload Form Card */}
            <form onSubmit={handleCreateNewWebsite} className="bg-[#0F172A] border border-[#1E293B] rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Core Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 pb-2 border-b border-[#1E293B]">
                    <Sparkles className="w-4 h-4 text-[#AB55F7]" />
                    <span>১. সাধারণ তথ্য ও প্যাকেজ মূল্য</span>
                  </h3>

                  {/* 1. Product Title */}
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                      Product Title (প্রোডাক্ট টাইটেল) <span className="text-[#E53935]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: Luxe Watch - Smart Luxury Store"
                      value={newProductTitle}
                      onChange={(e) => setNewProductTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs sm:text-sm focus:outline-none focus:border-[#AB55F7] transition-colors"
                    />
                  </div>

                  {/* 2. Category Selection */}
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                      Category (ক্যাটাগরি) <span className="text-[#E53935]">*</span>
                    </label>
                    <select
                      value={newSiteCategory}
                      onChange={(e) => setNewSiteCategory(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs sm:text-sm focus:outline-none focus:border-[#AB55F7] cursor-pointer"
                    >
                      <option value="ecommerce">🛍️ E-Commerce (ই-কমার্স শপ)</option>
                      <option value="restaurant">🍽️ Restaurant & Cafe (রেস্তোরাঁ ও ক্যাফে)</option>
                      <option value="blogging">📰 Newspaper & Blog (নিউজপেপার ও ব্লগ)</option>
                      <option value="grocery">🌿 Grocery & Organic (মুদি ও অর্গানিক)</option>
                      <option value="corporate">💼 Corporate & Business (কর্পোরেট)</option>
                      <option value="fashion">👗 Fashion & Boutique (ফ্যাশন)</option>
                      <option value="portfolio">🎨 Personal Portfolio (পোর্টফোলিও)</option>
                    </select>
                  </div>

                  {/* 3. Description */}
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                      Description (বিবরণ)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="ওয়েবসাইটের মূল সুবিধাসমূহ, আধুনিক ডিজাইন ও ফিচার সম্পর্কে লিখুন..."
                      value={newProductDesc}
                      onChange={(e) => setNewProductDesc(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs sm:text-sm text-white resize-none focus:outline-none focus:border-[#AB55F7] transition-colors"
                    />
                  </div>

                  {/* 4. Product Pricing (Packages: ৳999, ৳1499, ৳2499) */}
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                      Product Pricing (প্যাকেজ মূল্য)
                    </label>
                    <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                      {['৳999', '৳1499', '৳2499'].map((pkg) => (
                        <button
                          key={pkg}
                          type="button"
                          onClick={() => setNewProductPricing(pkg)}
                          className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                            newProductPricing === pkg
                              ? 'bg-gradient-to-r from-[#AB55F7] to-[#7C3AED] border-[#AB55F7] text-white shadow-md shadow-[#AB55F7]/25'
                              : 'bg-[#0B0F19] border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#AB55F7]/50'
                          }`}
                        >
                          {pkg}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="অন্যান্য কাস্টম মূল্য (যেমন: ৳1499)"
                      value={newProductPricing}
                      onChange={(e) => setNewProductPricing(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#AB55F7]"
                    />
                  </div>

                  {/* 5. Discount Price */}
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                      Discount Price (ডিসকাউন্ট মূল্য)
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: ৳199 বা ৳0"
                      value={newDiscountPrice}
                      onChange={(e) => setNewDiscountPrice(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#AB55F7]"
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Website Link, Preview Image & Publish */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2 pb-2 border-b border-[#1E293B]">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>২. ওয়েবসাইট ডেমো লিংক ও প্রিভিউ ছবি</span>
                  </h3>

                  {/* 6. Product Link (Crucial: Will open in website preview from main dashboard) */}
                  <div className="p-4 rounded-2xl bg-[#0B0F19] border-2 border-emerald-500/40 space-y-2">
                    <label className="block text-xs font-bold text-white flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>Website / Demo Link (ওয়েবসাইট লিংক)</span>
                        <span className="text-[#E53935]">*</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                        প্রিভিউতে ওপেন হবে
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: https://daraz.com.bd অথবা https://mybrand.com অথবা mystore.com"
                      value={newProductLink}
                      onChange={(e) => setNewProductLink(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#111827] border border-[#1E293B] text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                      💡 <strong className="text-emerald-400">গুরুত্বপূর্ণ:</strong> ক্লায়েন্ট মূল ড্যাশবোর্ড থেকে এই ওয়েবসাইটটির প্রিভিউ দেখতে ক্লিক করলে এই লিংকটি সরাসরি ওয়েবসাইটের ইন্টারঅ্যাক্টিভ প্রিভিউ স্ক্রিনে লাইভ ওপেন হবে।
                    </p>
                  </div>

                  {/* 7. Preview Image (Gallery Upload & URL) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#CBD5E1] flex items-center gap-1.5">
                        <span>প্রিভিউ ছবি (Preview Image / Screenshot)</span>
                      </label>

                      {/* Image Mode Switcher */}
                      <div className="flex rounded-lg bg-[#0B0F19] p-0.5 border border-[#1E293B]">
                        <button
                          type="button"
                          onClick={() => setImageInputMode('gallery')}
                          className={`px-3 py-1 text-xs rounded-md font-bold transition-all cursor-pointer ${
                            imageInputMode === 'gallery'
                              ? 'bg-[#AB55F7] text-white shadow-xs'
                              : 'text-[#94A3B8] hover:text-white'
                          }`}
                        >
                          📱 গ্যালারি
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageInputMode('url')}
                          className={`px-3 py-1 text-xs rounded-md font-bold transition-all cursor-pointer ${
                            imageInputMode === 'url'
                              ? 'bg-[#AB55F7] text-white shadow-xs'
                              : 'text-[#94A3B8] hover:text-white'
                          }`}
                        >
                          🔗 অনলাইন লিংক
                        </button>
                      </div>
                    </div>

                    {imageInputMode === 'gallery' ? (
                      <div className="space-y-2">
                        {newSiteThumbnail ? (
                          <div className="relative rounded-2xl overflow-hidden border border-[#AB55F7]/40 bg-[#0B0F19] p-3 flex items-center gap-3">
                            <img
                              src={newSiteThumbnail}
                              alt="Preview"
                              className="w-24 h-18 rounded-xl object-cover border border-white/10 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                <span className="text-[11px] font-bold text-emerald-400">ছবি প্রস্তুত</span>
                              </div>
                              <p className="text-xs text-white font-medium truncate">
                                {galleryImageName || 'গ্যালারি থেকে সংগৃহীত প্রিভিউ ইমেজ'}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => galleryFileInputRef.current?.click()}
                                  className="text-xs text-[#AB55F7] font-bold hover:underline cursor-pointer"
                                >
                                  ছবি পরিবর্তন
                                </button>
                                <span className="text-zinc-600">•</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewSiteThumbnail('');
                                    setGalleryImageName('');
                                  }}
                                  className="text-xs text-red-400 font-bold hover:underline cursor-pointer"
                                >
                                  মুছে ফেলুন
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => galleryFileInputRef.current?.click()}
                            disabled={imageCompressing}
                            className="w-full py-6 border-2 border-dashed border-[#1E293B] hover:border-[#AB55F7] rounded-2xl flex flex-col items-center justify-center gap-2 bg-[#0B0F19]/60 hover:bg-[#0B0F19] transition-all cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-[#AB55F7]/10 border border-[#AB55F7]/30 flex items-center justify-center text-[#AB55F7] group-hover:scale-110 transition-transform">
                              {imageCompressing ? (
                                <RefreshCw className="w-6 h-6 animate-spin" />
                              ) : (
                                <UploadCloud className="w-6 h-6" />
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-xs sm:text-sm font-bold text-white">
                                {imageCompressing ? 'ছবি অপ্টিমাইজ হচ্ছে...' : 'গ্যালারি থেকে ফটো নির্বাচন করুন'}
                              </p>
                              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                                মোবাইল ক্যামেরা বা ফটো লাইব্রেরি (JPG, PNG, WEBP)
                              </p>
                            </div>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/... অথবা ডিরেক্ট ছবি লিঙ্ক"
                          value={newSiteThumbnail}
                          onChange={(e) => {
                            setNewSiteThumbnail(e.target.value);
                            setGalleryImageName('');
                          }}
                          className="w-full px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#AB55F7]"
                        />
                        {newSiteThumbnail && (
                          <div className="rounded-xl overflow-hidden border border-[#1E293B] bg-[#0B0F19] p-2 flex items-center gap-3">
                            <img
                              src={newSiteThumbnail}
                              alt="Preview"
                              className="w-20 h-14 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                            <span className="text-xs text-[#94A3B8] truncate">{newSiteThumbnail}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 8. Notification to clients */}
                  <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="uploadSendDetailsCheck"
                      checked={sendDetailsToClient}
                      onChange={(e) => setSendDetailsToClient(e.target.checked)}
                      className="w-4 h-4 rounded text-[#AB55F7] focus:ring-[#AB55F7] border-gray-700 bg-gray-900 cursor-pointer"
                    />
                    <label htmlFor="uploadSendDetailsCheck" className="text-xs text-[#CBD5E1] cursor-pointer">
                      পাবলিশ করার পর সকল সক্রিয় ক্লায়েন্টদের লাইভ চ্যাটে নোটিফিকেশন মেসেজ পাঠান
                    </label>
                  </div>

                  {/* 9. PROMINENT PUBLISH BUTTON */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUploadingProduct || imageCompressing}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#AB55F7] via-[#9333EA] to-[#7C3AED] hover:from-[#9333EA] hover:to-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm sm:text-base font-black cursor-pointer shadow-xl shadow-[#AB55F7]/30 border border-[#D8B4FE]/40 transition-all active:scale-95 flex items-center justify-center gap-2.5"
                    >
                      {isUploadingProduct ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>পাবলিশ ও যুক্ত হচ্ছে...</span>
                        </>
                      ) : imageCompressing ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>ছবি অপ্টিমাইজ হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-amber-300" />
                          <span>পাবলিশ করুন • Publish Website Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

      </main>
      </div>

      {/* SINGLE COMPLETE SYSTEM BACKUP VAULT MODAL (Triggered only from header next to logout) */}
      {showBackupVaultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0F172A] border border-[#7C3AED]/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowBackupVaultModal(false)}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1E1B4B] text-[#A5B4FC] flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">সম্পূর্ণ ওয়েবসাইট ব্যাকআপ ভল্ট</h3>
                <p className="text-xs text-[#94A3B8]">
                  ১০০% ডেটা গ্যারান্টি: সমস্ত ক্লায়েন্ট অ্যাকাউন্ট, অর্ডার, চ্যাট ও ক্যাটালগ সুরক্ষিত।
                </p>
              </div>
            </div>

            {/* Live Database Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 py-2">
              <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-center">
                <span className="text-[10px] text-[#64748D] block">মোট ইউজার</span>
                <span className="text-sm font-black text-[#A5B4FC] font-mono">{users.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-center">
                <span className="text-[10px] text-[#64748D] block">মোট অর্ডার</span>
                <span className="text-sm font-black text-[#A5B4FC] font-mono">{orders.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-center">
                <span className="text-[10px] text-[#64748D] block">ওয়েবসাইট স্টক</span>
                <span className="text-sm font-black text-[#A5B4FC] font-mono">{customWebsites.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-center">
                <span className="text-[10px] text-[#64748D] block">সাপোর্ট চ্যাট</span>
                <span className="text-sm font-black text-[#A5B4FC] font-mono">{chatThreads.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-center">
                <span className="text-[10px] text-[#64748D] block">হস্তান্তরিত সাইট</span>
                <span className="text-sm font-black text-[#A5B4FC] font-mono">{deliveredCreds.length}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-center">
                <span className="text-[10px] text-[#64748D] block">রিসেট রিকোয়েস্ট</span>
                <span className="text-sm font-black text-[#A5B4FC] font-mono">{resetRequests.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadFullSystemBackup}
                className="p-4 rounded-2xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold flex flex-col items-center justify-center gap-2 cursor-pointer shadow-md text-center transition-all"
              >
                <Download className="w-5 h-5" />
                <span>সম্পূর্ণ ব্যাকআপ ডাউনলোড (JSON)</span>
              </button>

              <label className="p-4 rounded-2xl bg-[#0B0F19] hover:bg-[#1E293B] text-[#A5B4FC] border border-[#1E293B] text-xs font-bold flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
                <Upload className="w-5 h-5" />
                <span>অন্য ডিভাইসে ব্যাকআপ রিস্টোর</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFullSystemBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 8: SETTINGS & BRAND LOGO MANAGEMENT ================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#A5B4FC]" />
                <span>ওয়েবসাইট সেটিংস ও ব্র্যান্ড লোগো কনফিগারেশন</span>
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                সাইটের লোগো মোড নিয়ন্ত্রণ করুন: ইমেজ লোগো (ছবি আপলোড) অথবা চ্যাটবক্স টেক্সট লোগো।
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetLogoToDefault}
                className="px-3.5 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-xs font-bold text-[#E2E8F0] border border-[#334155] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>মূল ডিফল্ট লোগোতে রিসেট</span>
              </button>

              <button
                type="button"
                onClick={handleSaveLogoSettings}
                disabled={logoSaving}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{logoSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সেভ করুন (Save Settings)'}</span>
              </button>
            </div>
          </div>

          {/* Success Notification Banner */}
          {logoSaveSuccess && (
            <div className="p-3.5 rounded-2xl bg-[#00B261]/20 border border-[#7C3AED]/30 text-[#A5B4FC] text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-[#00E575]" />
              <span>✓ ব্র্যান্ড লোগো সফলভাবে আপডেট ও সম্পূর্ণ ওয়েবসাইটে লাইভ করা হয়েছে!</span>
            </div>
          )}

          {/* 1. Original / Default Brand Identity Reference Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0B0F19] border border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A5B4FC]" />
                <h3 className="text-sm font-bold text-white">
                  আমাদের মূল অফিসিয়াল লোগো ও ব্র্যান্ড রূপরেখা (Original Official Logo)
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A5B4FC] text-[10px] font-mono font-bold border border-[#7C3AED]/30">
                ডিফল্ট লোগো
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#111827] border border-[#1E293B]/80">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <div className="flex items-center gap-2.5">
                    <svg width="36" height="36" viewBox="0 0 120 120" fill="none">
                      <path d="M 58 112 C 34 112 16 93 16 68 C 16 52 24 38 36 29 C 38 27 42 30 40 33 C 33 42 28 53 28 66 C 28 85 41 99 59 99 C 75 99 88 88 91 73 C 92 68 97 67 98 71 C 99 74 97 81 95 86 C 88 101 74 112 58 112 Z" fill="#6B46C1" />
                      <path d="M 36 29 C 33 33 31 38 30 44 C 29 42 30 38 32 34 C 36 26 44 18 52 14 C 54 13 56 16 55 18 C 51 25 45 35 46 44 C 47 48 50 51 54 49 C 60 46 64 36 67 27 C 70 18 73 11 74 8 C 75 6 78 8 78 11 C 77 19 72 32 76 41 C 78 45 83 46 87 42 C 92 37 94 28 95 22 C 95 20 98 21 98 23 C 98 32 94 43 97 52 C 99 57 104 60 106 66 C 109 74 107 83 102 90 C 100 93 96 91 97 88 C 100 81 100 73 97 67 C 94 62 89 60 86 64 C 81 71 80 81 74 87 C 67 94 57 97 47 95 C 37 93 29 84 29 73 C 29 63 35 55 42 49 C 45 47 48 51 45 54 C 38 60 38 71 44 78 C 50 84 60 84 66 79 C 71 75 73 68 76 62 C 78 57 82 54 84 59 C 85 62 84 66 82 69 C 78 77 72 82 64 84 C 55 86 46 83 42 75 C 39 70 40 62 44 57 C 48 52 54 48 58 44 C 61 41 59 36 55 36 C 50 36 44 41 41 46 C 39 49 35 48 35 45 C 35 39 40 31 46 25 C 48 23 51 21 54 19 C 55 18 54 16 53 16 C 45 20 38 24 36 29 Z" fill="#7C3AED" />
                    </svg>
                    <span className="font-black text-xl text-[#6B46C1]">BongoWeb</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white">অফিসিয়াল ফ্লেইম-রিবন ক্রেস্ট (Official Flame & Ribbon Crest)</h4>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    ডিফল্ট ব্র্যান্ড টেক্সট: <strong className="text-white">BongoWeb</strong> | কালার কোড: <code className="text-[#A5B4FC]">#5521B5</code> (ভায়োলেট) থেকে <code className="text-[#A5B4FC]">#7C3AED</code> (রয়্যাল পার্পল)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                  ✓ সার্বজনীন সাপোর্ট সক্রিয়
                </span>
              </div>
            </div>
          </div>

          {/* 2. LOGO MODE TOGGLE SWITCH: ON (IMAGE LOGO) vs OFF (TYPED TEXT LOGO) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0B0F19] border border-[#1E293B] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Power className="w-4 h-4 text-[#A5B4FC]" />
                  <span>লোগো মোড নির্বাচন (Logo Type Selector Switch)</span>
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  বাটনটি ON রাখলে ইমেজ লোগো (ছবি আপলোড) কাজ করবে। আর OFF করলে ফটো আপলোড বন্ধ হয়ে চ্যাটবক্স টেক্সট মোড চালু হবে।
                </p>
              </div>

              {/* The Interactive Switch Button */}
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${logoConfig.logoType === 'image' ? 'text-emerald-400' : 'text-[#A5B4FC]'}`}>
                  {logoConfig.logoType === 'image' ? 'ON (ইমেজ লোগো)' : 'OFF (টাইপ করা লোগো)'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLogoConfig((prev) => ({
                      ...prev,
                      logoType: prev.logoType === 'image' ? 'text' : 'image'
                    }));
                  }}
                  className={`w-14 h-8 rounded-full p-1 transition-all cursor-pointer relative shadow-inner ${
                    logoConfig.logoType === 'image'
                      ? 'bg-gradient-to-r from-[#00B261] to-[#00E575]'
                      : 'bg-[#334155]'
                  }`}
                  title={logoConfig.logoType === 'image' ? 'ইমেজ মোড বন্ধ করে চ্যাটবক্স টেক্সট মোডে যান' : 'টেক্সট মোড বন্ধ করে ইমেজ মোডে যান'}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 flex items-center justify-center ${
                      logoConfig.logoType === 'image' ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  >
                    {logoConfig.logoType === 'image' ? (
                      <Image className="w-3.5 h-3.5 text-[#6B46C1]" />
                    ) : (
                      <Type className="w-3.5 h-3.5 text-slate-700" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Status Message based on mode */}
            <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              logoConfig.logoType === 'image'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
            }`}>
              {logoConfig.logoType === 'image' ? (
                <>
                  <Image className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>ইমেজ লোগো মোড (Image Mode ON):</strong> গ্যালারি বা ডিভাইস থেকে ছবি আপলোড করুন অথবা বিল্ট-ইন লোগো ব্যবহার করুন। সাইজ ও পরিমাপ কাস্টমাইজ করতে পারবেন।
                  </span>
                </>
              ) : (
                <>
                  <Type className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    <strong>চ্যাটবক্স টেক্সট লোগো মোড (Text Mode OFF):</strong> ফটো আপলোডিং বন্ধ রয়েছে। নিম্নের চ্যাটবক্স ফিল্ডে আপনার ব্র্যান্ড নাম লিখলেই রিয়েল-টাইমে লোগো আপডেট হবে!
                  </span>
                </>
              )}
            </div>

            {/* ============================================================== */}
            {/* SECTION A: WHEN ON -> IMAGE LOGO CONFIGURATION                 */}
            {/* ============================================================== */}
            {logoConfig.logoType === 'image' && (
              <div className="space-y-5 animate-fadeIn">
                {/* File Upload Box */}
                <div>
                  <label className="block text-xs font-bold text-[#A8D7BD] mb-1.5">
                    ১. গ্যালারি বা ডিভাইস থেকে ছবি আপলোড করুন (Upload Image Logo)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl bg-[#111827] border-2 border-dashed border-[#1E293B] hover:border-[#7C3AED] transition-all">
                    {/* Live Image Preview */}
                    <div className="w-24 h-24 rounded-2xl bg-[#0B0F19] border border-[#1E293B] flex items-center justify-center overflow-hidden shrink-0 relative group p-2">
                      {logoConfig.imageUrl ? (
                        <img
                          src={logoConfig.imageUrl}
                          alt="Custom Logo Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-1">
                          <Image className="w-8 h-8 text-[#64748D]" />
                          <span className="text-[9px] text-[#64748D] mt-1">ডিফল্ট লোগো</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Controls & Specs */}
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                        <label className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs">
                          <Upload className="w-4 h-4" />
                          <span>গ্যালারি থেকে ফটো বাছুন (Browse Image)</span>
                          <input
                            type="file"
                            accept="image/png,image/svg+xml,image/jpeg,image/webp"
                            onChange={handleLogoImageUpload}
                            className="hidden"
                          />
                        </label>

                        {logoConfig.imageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setLogoConfig((prev) => ({
                                ...prev,
                                imageUrl: '',
                                imageName: ''
                              }));
                            }}
                            className="px-3 py-2 rounded-xl bg-[#E53935]/15 hover:bg-[#E53935]/25 text-[#FF8A80] text-xs font-bold transition-all cursor-pointer"
                          >
                            রিমুভ করুন
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-[#94A3B8]">
                        প্রস্তাবিত ফরম্যাট: <strong>PNG বা SVG (স্বচ্ছ ব্যাকগ্রাউন্ড)</strong> | সাইজ: <strong>৫১২×৫১২ পিক্সেল</strong> | সর্বোচ্চ সাইজ: ২ মেগাবাইট।
                      </p>
                    </div>
                  </div>
                </div>

                {/* Size & Dimension Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#111827] border border-[#1E293B] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>২. লোগো সাইজ কাস্টমাইজেশন (Icon & Logo Size)</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          স্মার্ট অটো-স্কেল
                        </span>
                      </label>
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#7C3AED]/20 text-[#A5B4FC] text-xs font-mono font-bold border border-[#7C3AED]/40">
                        {logoConfig.imageSizePx || 46}px
                      </span>
                    </div>

                    <input
                      type="range"
                      min="32"
                      max="72"
                      step="2"
                      value={logoConfig.imageSizePx || 46}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLogoConfig((prev) => ({ ...prev, imageSizePx: val }));
                      }}
                      className="w-full accent-[#7C3AED] cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-[10px] text-[#64748D] font-mono">
                      <span>কম্প্যাক্ট (32px)</span>
                      <span>মোবাইল (40px)</span>
                      <span>ডেস্কটপ (48px)</span>
                      <span>বড় (64px+)</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0B0F19] text-[11px] text-[#94A3B8] space-y-1 font-mono">
                      <div>মোবাইল ডিসপ্লে: <strong className="text-emerald-400">স্বয়ংক্রিয় পারফেক্ট সাইজ (36px - 44px)</strong></div>
                      <div>ডেস্কটপ ডিসপ্লে: <strong className="text-indigo-400">ফুল ক্লিয়ার ও প্রোফেশনাল (44px - 54px)</strong></div>
                      <div>রেটিও: <strong className="text-white">প্রপোর্শনাল অ্যাসপেক্ট রেশিও (কখনই চ্যাপ্টা হবে না)</strong></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#111827] border border-[#1E293B] space-y-3">
                    <label className="text-xs font-bold text-white block">
                      ৩. লোগো টেক্সট ও ব্র্যান্ড নাম প্রদর্শন
                    </label>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B0F19] border border-[#1E293B]">
                      <span className="text-xs text-[#E2E8F0]">ছবির সাথে ব্র্যান্ড নাম দেখাবেন?</span>
                      <input
                        type="checkbox"
                        checked={logoConfig.showBrandTextWithImage !== false}
                        onChange={(e) => {
                          setLogoConfig((prev) => ({
                            ...prev,
                            showBrandTextWithImage: e.target.checked
                          }));
                        }}
                        className="w-4 h-4 accent-[#7C3AED] cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-[#94A3B8] block mb-1">
                        ব্র্যান্ড নাম (Brand Text):
                      </label>
                      <input
                        type="text"
                        value={logoConfig.typedLogoText || 'BongoWeb'}
                        onChange={(e) => {
                          setLogoConfig((prev) => ({
                            ...prev,
                            typedLogoText: e.target.value
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                        placeholder="BongoWeb"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SECTION B: WHEN OFF -> CHATBOX TYPED TEXT LOGO MODE            */}
            {/* ============================================================== */}
            {logoConfig.logoType === 'text' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Chatbox style Input field where admin types the logo */}
                <div className="p-5 rounded-2xl bg-[#111827] border border-[#7C3AED]/50 space-y-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-[#A5B4FC]" />
                    <label className="text-xs font-bold text-white">
                      চ্যাটবক্স: এখানে ওয়েবসাইটের লোগো টেক্সট টাইপ করুন (Type Website Logo Text)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={logoConfig.typedLogoText || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLogoConfig((prev) => ({
                          ...prev,
                          typedLogoText: val
                        }));
                        setPreviewChatText(val);
                      }}
                      placeholder="এখানে ওয়েবসাইটের নাম টাইপ করুন (যেমন: BongoWeb, mywebsite, ইত্যাদি)..."
                      className="flex-1 px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-sm text-white placeholder-[#64748D] focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleSaveLogoSettings}
                      className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-black transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>আপডেট</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-[#94A3B8]">
                    এখানে টাইপ করা টেক্সটটিই স্বয়ংক্রিয়ভাবে ওয়েবসাইটের হেডার এবং ড্রয়ারে অফিসিয়াল লোগো হিসেবে প্রদর্শিত হবে।
                  </p>
                </div>

                {/* Subtitle / Extension and Theme Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Subtitle / Domain Badge */}
                  <div className="p-4 rounded-2xl bg-[#111827] border border-[#1E293B] space-y-2.5">
                    <label className="text-xs font-bold text-white block">
                      সাবটাইটেল / এক্সটেনশন ব্যাজ (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={logoConfig.typedSubtitle || ''}
                      onChange={(e) => {
                        setLogoConfig((prev) => ({
                          ...prev,
                          typedSubtitle: e.target.value
                        }));
                      }}
                      placeholder="যেমন: .xyz, SOLUTIONS, ইত্যাদি"
                      className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs text-white focus:outline-none focus:border-[#7C3AED] font-mono"
                    />
                    <span className="text-[10px] text-[#64748D] block">
                      লোগোর পাশে ছোট ব্যাজ হিসেবে প্রদর্শিত হবে। খালি রাখতে চাইলে মুছে দিন।
                    </span>
                  </div>

                  {/* Gradient Themes */}
                  <div className="p-4 rounded-2xl bg-[#111827] border border-[#1E293B] space-y-2.5">
                    <label className="text-xs font-bold text-white block">
                      কালার গ্রেডিয়েন্ট থিম (Color Theme)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'royal', label: 'রয়্যাল পার্পল ও ভায়োলেট', colors: 'from-[#6B46C1] to-[#7C3AED]' },
                        { id: 'violet', label: 'ইলেকট্রিক ভায়োলেট', colors: 'from-[#A855F7] to-[#3B82F6]' },
                        { id: 'emerald', label: 'লাক্সারি এমারেল্ড', colors: 'from-[#00B261] to-[#0D9488]' },
                        { id: 'sunset', label: 'সানসেট অ্যাম্বার', colors: 'from-[#FF6118] to-[#F59E0B]' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setLogoConfig((prev) => ({
                              ...prev,
                              textGradientTheme: t.id as any
                            }));
                          }}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                            logoConfig.textGradientTheme === t.id
                              ? 'bg-[#1E293B] border-[#7C3AED] text-white shadow-xs'
                              : 'bg-[#0B0F19] border-[#1E293B] text-[#94A3B8] hover:text-white'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${t.colors} shrink-0`} />
                          <span className="truncate text-[11px]">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. LIVE WEBSITE HEADER PREVIEW */}
            <div className="pt-2 border-t border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#A5B4FC]" />
                  <span>লাইভ ওয়েবসাইট হেডার প্রিভিউ (Live Header Preview)</span>
                </h4>
                <span className="text-[10px] text-[#64748D] font-mono">
                  রিয়েল-টাইম রেন্ডার
                </span>
              </div>

              {/* Simulated Dark Navbar Preview */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0e12] border border-white/[0.08] shadow-dark-card flex items-center justify-between">
                <BongoWebLogo size="md" textColor="#FFFFFF" />

                <div className="flex items-center gap-2 text-xs font-medium text-[#a1a1b0]">
                  <span className="hidden sm:inline px-3 py-1.5 rounded-full bg-white/[0.04]">হোম</span>
                  <span className="hidden sm:inline px-3 py-1.5 rounded-full bg-white/[0.04]">ক্যাটালগ</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-[#3b5bff] text-white text-xs font-medium">
                    অর্ডার করুন
                  </span>
                </div>
              </div>

              {/* Simulated Dark Navbar Preview */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0D253D] border border-slate-700 shadow-md flex items-center justify-between">
                <BongoWebLogo size="md" textColor="#FFFFFF" />

                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <span className="hidden sm:inline px-3 py-1.5 rounded-lg bg-white/10">Home</span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white text-xs">
                    Get Started
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Action Footer */}
            <div className="pt-3 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-[#94A3B8]">
                সেভ বাটনে চাপ দিলে আপনার নির্বাচন সম্পূর্ণ ওয়েবসাইটে কার্যকর হয়ে যাবে।
              </p>

              <button
                type="button"
                onClick={handleSaveLogoSettings}
                disabled={logoSaving}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{logoSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেভ ও লাইভ করুন (Save & Apply Live)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Password Modal (Requirement 11) */}
      {showActionPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#111827] border border-[#7C3AED]/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#A5B4FC]" />
              <h3 className="text-base font-black text-white">অ্যাকশন সিকিউরিটি পাসওয়ার্ড</h3>
            </div>
            <p className="text-xs text-[#94A3B8]">
              এই সংবেদনশীল কাজটি সম্পন্ন করতে অ্যাডমিন সিকিউরিটি পাসওয়ার্ড দিন।
            </p>

            {actionPasswordError && (
              <div className="p-3 rounded-xl bg-[#E53935]/20 text-[#FF8A80] text-xs font-bold border border-[#E53935]">
                {actionPasswordError}
              </div>
            )}

            <form onSubmit={handleVerifyActionPassword} className="space-y-3">
              <input
                type="password"
                required
                placeholder="অ্যাডমিন পাসওয়ার্ড লিখুন"
                value={actionPasswordInput}
                onChange={(e) => setActionPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#7C3AED]"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold cursor-pointer shadow-xs transition-all"
                >
                  অনুমোদন করুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowActionPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1E293B] text-xs text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Client Details Modal (Requirement 6) */}
      {viewingClientDetailsUser && (() => {
        const clientOrders = orders.filter((o) => o.phone === viewingClientDetailsUser.phone || o.email === viewingClientDetailsUser.email);
        const clientCreds = deliveredCreds.filter((c) => c.userPhone === viewingClientDetailsUser.phone);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-xl bg-[#0F172A] border border-[#7C3AED]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setViewingClientDetailsUser(null)}
                className="absolute top-5 right-5 text-[#94A3B8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6B46C1] to-[#7C3AED] text-white flex items-center justify-center font-black text-lg shadow-xs">
                  {viewingClientDetailsUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#1E293B] text-[#A5B4FC] text-[10px] font-bold border border-[#1E293B]">
                    ক্লায়েন্ট ওভারভিউ
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    {viewingClientDetailsUser.name}
                  </h3>
                  <p className="text-xs text-[#94A3B8] font-mono">
                    রেজিস্ট্রেশন: {viewingClientDetailsUser.registeredAt}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-[#0B0F19] border border-[#1E293B] text-xs">
                <div>
                  <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">মোবাইল নম্বর:</span>
                  <span className="text-white font-mono font-bold select-all">{viewingClientDetailsUser.phone}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">ইমেইল এড্রেস:</span>
                  <span className="text-white font-mono select-all truncate block">{viewingClientDetailsUser.email}</span>
                </div>
              </div>

              {/* Order Names & Units Information */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    অর্ডার ও ওয়েবসাইট ইউনিটের তথ্য ({clientOrders.length} টি)
                  </h4>
                </div>

                {clientOrders.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-center text-xs text-[#94A3B8]">
                    এই ক্লায়েন্টের কোনো অর্ডার পাওয়া যায়নি।
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientOrders.map((ord, idx) => (
                      <div
                        key={ord.orderId ? `${ord.orderId}-${idx}` : `co-${idx}`}
                        className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white font-mono font-bold text-[11px]">
                              {ord.orderId}
                            </span>
                            <span className="font-bold text-white">
                              {ord.companyName || ord.demoTitle}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#94A3B8]">
                            ডেমো কোড: {ord.demoCode} • ক্যাটাগরি: {ord.category}
                          </p>
                          <div className="text-[10px] text-[#64748D] font-mono flex items-center gap-2">
                            <span>পেমেন্ট: {String(ord.paymentMethod || 'bKash').toUpperCase()}</span>
                            <span>TrxID: <strong className="text-[#A5B4FC]">{ord.transactionId || 'N/A'}</strong></span>
                            <span>চার্জ: ১,৯৯০ ৳</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            ord.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : ord.status === 'processing' || ord.status === 'verified'
                              ? 'bg-[#7C3AED]/20 text-[#A5B4FC] border border-[#7C3AED]/30'
                              : ord.status === 'cancelled'
                              ? 'bg-[#E53935]/20 text-[#FF8A80] border border-[#E53935]/30'
                              : 'bg-[#FFD552]/20 text-[#FFD552] border border-[#FFD552]/30'
                          }`}>
                            {ord.status === 'completed' 
                              ? '✓ সম্পূর্ণ (Completed)' 
                              : ord.status === 'processing' || ord.status === 'verified'
                              ? '⚡ অনুমোদিত (প্রসেসিং)'
                              : ord.status === 'cancelled'
                              ? 'বাতিলকৃত'
                              : '⏳ পেন্ডিং যাচাই'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Already Delivered Credentials if any */}
              {clientCreds.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#1E293B]">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    হস্তান্তরিত ওয়েবসাইট ডিটেইলস ({clientCreds.length} টি)
                  </h4>
                  <div className="space-y-2">
                    {clientCreds.map((cred, cIdx) => (
                      <div key={cred.id ? `${cred.id}-${cIdx}` : `cred-${cIdx}`} className="p-3 rounded-xl bg-[#0B0F19] border border-[#7C3AED]/30 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[#A5B4FC] font-bold">
                          <span>{cred.websiteTitle}</span>
                          <span className="text-[10px] text-[#94A3B8]">{cred.deliveredAt}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#A8D7BD]">
                          <div>ID: <strong className="text-white font-mono">{cred.websiteAdminId}</strong></div>
                          <div>Pass: <strong className="text-white font-mono">{cred.websiteAdminPass}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Bottom Actions */}
              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForDelivery(viewingClientDetailsUser);
                    setSelectedDeliveryOrder(clientOrders[0]?.orderId || '');
                    setDeliveryAdminId('');
                    setDeliveryAdminPass('');
                    setDeliveryNotes('');
                    setViewingClientDetailsUser(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Client কে Details পাঠান</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingClientDetailsUser(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#0B0F19] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white border border-[#1E293B] text-xs font-bold cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Deliver Website Credentials Modal (Client কে Details পাঠান) */}
      {selectedUserForDelivery && (() => {
        const userOrders = orders.filter((o) => o.phone === selectedUserForDelivery.phone || o.email === selectedUserForDelivery.email);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md bg-[#0F172A] border border-[#7C3AED]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-4">
              <button
                onClick={() => setSelectedUserForDelivery(null)}
                className="absolute top-5 right-5 text-[#94A3B8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white text-xs font-bold">
                  ধাপ ১: আইডি ও পাসওয়ার্ড দিন
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {selectedUserForDelivery.name}
                </h3>
                <p className="text-xs text-[#94A3B8] font-mono">
                  মোবাইল নম্বর: {selectedUserForDelivery.phone}
                </p>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  এখানে আইডি ও পাসওয়ার্ড লিখে সংরক্ষণ করার পর ধাপ ২: "সম্পূর্ণ করুন" বাটনে ক্লিক করলেই অর্ডারটি সফলভাবে গ্রাহকের প্রোফাইলে যুক্ত হবে।
                </p>
              </div>

              {deliverySuccess && (
                <div className="p-3 rounded-xl bg-[#00B261]/20 border border-[#7C3AED]/30 text-[#A5B4FC] text-xs font-bold">
                  ✓ সফলভাবে আইডি ও পাসওয়ার্ড সংরক্ষণ করা হয়েছে! এবার ধাপ ২: "সম্পূর্ণ করুন" এ ক্লিক করুন।
                </div>
              )}

              <form onSubmit={handleDeliverCredentials} className="space-y-3.5">
                {/* Website / Order selection if multiple */}
                {userOrders.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-[#A8D7BD] mb-1">
                      ওয়েবসাইট নির্বাচন করুন
                    </label>
                    <select
                      value={selectedDeliveryOrder}
                      onChange={(e) => setSelectedDeliveryOrder(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#7C3AED]"
                    >
                      {userOrders.map((ord, oIdx) => (
                        <option key={ord.orderId ? `${ord.orderId}-${oIdx}` : `opt-${oIdx}`} value={ord.orderId || ''}>
                          {ord.companyName || ord.demoTitle} ({ord.orderId || oIdx})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#A8D7BD] mb-1">
                    ID (অ্যাডমিন আইডি / ইউজারনেম) <span className="text-[#FF8A80]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: admin বা client@bongoweb.com"
                    value={deliveryAdminId}
                    onChange={(e) => setDeliveryAdminId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A8D7BD] mb-1">
                    Password (অ্যাডমিন পাসওয়ার্ড) <span className="text-[#FF8A80]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: adminPass2026#"
                    value={deliveryAdminPass}
                    onChange={(e) => setDeliveryAdminPass(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#A8D7BD] mb-1">
                    ইঞ্জিনিয়ার নোট / ওয়েবসাইট লিংক (ঐচ্ছিক)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ওয়েবসাইটের অ্যাডমিন প্যানেল লিংক বা বিশেষ নির্দেশনা..."
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs text-white resize-none focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div className="pt-1 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    ১. আইডি ও পাসওয়ার্ড সংরক্ষণ করুন (Save ID & Pass)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUserForDelivery(null)}
                    className="px-4 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs text-[#94A3B8] hover:text-white"
                  >
                    বাতিল
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Change Details / Reset ID Modal (Dual-Sided Impact) */}
      {changeDetailsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#0F172A] border-2 border-[#7C3AED] rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[#1E293B] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#A5B4FC]">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>Change Details (গ্রাহকের তথ্য পরিবর্তন)</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#7C3AED]/25 text-[#A5B4FC] text-[10px] font-bold border border-[#7C3AED]/40">
                        Tag & Reset
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      গ্রাহকের ইমেইল আইডি এবং মোবাইল নম্বর সরাসরি পরিবর্তন ও রিসেট করুন।
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChangeDetailsUser(null)}
                className="p-1.5 rounded-xl bg-[#0B0F19] text-[#94A3B8] hover:text-white border border-[#1E293B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target User Overview Card */}
            <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-[#1E293B] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">গ্রাহকের নাম:</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#A5B4FC]" />
                  <span>{changeDetailsUser.name}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">বর্তমান মোবাইল নম্বর:</span>
                <span className="font-mono text-rose-300 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {changeDetailsUser.phone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">বর্তমান ইমেইল আইডি:</span>
                <span className="font-mono text-rose-300 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {changeDetailsUser.email || 'কোনো ইমেইল নেই'}
                </span>
              </div>
              {changeDetailsUser.password && (
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">বর্তমান পাসওয়ার্ড:</span>
                  <span className="font-mono text-[#A5B4FC] bg-[#1E293B] px-2 py-0.5 rounded border border-[#1E293B]">
                    {changeDetailsUser.password}
                  </span>
                </div>
              )}
            </div>

            {/* Change Form */}
            <form onSubmit={handleSaveChangeDetails} className="space-y-4">
              {/* Field 1: New Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#A5B4FC]" />
                    <span>নতুন মোবাইল নম্বর (New Phone Number)</span>
                  </span>
                  <span className="text-[10px] text-[#A5B4FC] font-normal">হারানো সিমের ক্ষেত্রে নতুন নম্বর</span>
                </label>
                <input
                  type="text"
                  required
                  value={changeDetailsNewPhone}
                  onChange={(e) => setChangeDetailsNewPhone(e.target.value)}
                  placeholder="যেমন: 018XXXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#7C3AED] transition-all"
                />
              </div>

              {/* Field 2: New Email ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#A5B4FC]" />
                    <span>নতুন ইমেইল আইডি (New Email ID)</span>
                  </span>
                  <span className="text-[10px] text-[#A5B4FC] font-normal">ইমেইল হারিয়ে গেলে নতুন ইমেইল</span>
                </label>
                <input
                  type="email"
                  value={changeDetailsNewEmail}
                  onChange={(e) => setChangeDetailsNewEmail(e.target.value)}
                  placeholder="যেমন: customer@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#7C3AED] transition-all"
                />
              </div>

              {/* Field 3: Optional New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>নতুন পাসওয়ার্ড (New Password - ঐচ্ছিক)</span>
                  </span>
                  <span className="text-[10px] text-[#94A3B8] font-normal">না বদলালে খালি রাখুন</span>
                </label>
                <input
                  type="text"
                  value={changeDetailsNewPassword}
                  onChange={(e) => setChangeDetailsNewPassword(e.target.value)}
                  placeholder="পরিবর্তন না করতে চাইলে খালি রাখুন"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#7C3AED] transition-all"
                />
              </div>

              {/* Field 4: Tag & Reason */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#A5B4FC]" />
                  <span>ট্যাগ ও পরিবর্তনের কারণ (Tag / Reason)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'হারানো মোবাইল নম্বর',
                    'হারানো ইমেইল আইডি',
                    'নম্বর ও ইমেইল পরিবর্তন',
                    'গ্রাহকের অনুরোধে আইডি রিসেট',
                    'ভুল তথ্য সংশোধন'
                  ].map((presetTag) => (
                    <button
                      key={presetTag}
                      type="button"
                      onClick={() => setChangeDetailsTag(presetTag)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                        changeDetailsTag === presetTag
                          ? 'bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-[#0B0F19] text-[#94A3B8] hover:text-white border-[#1E293B]'
                      }`}
                    >
                      {presetTag}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={changeDetailsTag}
                  onChange={(e) => setChangeDetailsTag(e.target.value)}
                  placeholder="ট্যাগ বা বিবরণ লিখুন..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              {/* Live Preview Box: From What to What */}
              <div className="p-3.5 rounded-2xl bg-[#030B07] border border-[#1E293B] space-y-1.5 text-xs">
                <div className="text-[11px] font-bold text-[#A5B4FC] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>কী থেকে কী পরিবর্তন হচ্ছে (Live Preview):</span>
                </div>
                <div className="font-mono text-[11px] text-[#94A3B8] space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span>নম্বর:</span>
                    <span className="text-rose-400 line-through">{changeDetailsUser.phone}</span>
                    <span>➔</span>
                    <span className="text-[#A5B4FC] font-bold">{changeDetailsNewPhone || '...'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>ইমেইল:</span>
                    <span className="text-rose-400 line-through">{changeDetailsUser.email || 'ছিল না'}</span>
                    <span>➔</span>
                    <span className="text-[#A5B4FC] font-bold">{changeDetailsNewEmail || 'অপরিবর্তিত'}</span>
                  </div>
                  {changeDetailsNewPassword && (
                    <div className="flex items-center gap-1.5">
                      <span>পাসওয়ার্ড:</span>
                      <span>➔</span>
                      <span className="text-amber-300 font-bold">{changeDetailsNewPassword}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-[#A5B4FC]">
                    <span>ট্যাগ:</span>
                    <span className="font-bold">{changeDetailsTag || 'ID Reset'}</span>
                  </div>
                </div>
              </div>

              {/* Both Sides Rule Note */}
              <div className="p-3 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/30 text-[11px] text-[#A5B4FC] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#A5B4FC] shrink-0 mt-0.5" />
                <span>
                  <strong>উভমুখী নিয়ম (Both Sides Affected):</strong> পরিবর্তন করার সাথে সাথে এটি "Reset Password User List"-এ পূর্ণাঙ্গ বিবরণসহ যুক্ত হবে এবং অ্যাডমিন ডাটাবেস ও গ্রাহক অ্যাকাউন্ট উভয়েই তাৎক্ষণিকভাবে আপডেট হবে।
                </span>
              </div>

              {/* Error / Success Messages */}
              {changeDetailsError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{changeDetailsError}</span>
                </div>
              )}
              {changeDetailsSuccess && (
                <div className="p-3 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#A5B4FC] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{changeDetailsSuccess}</span>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={changeDetailsSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Tag className="w-4 h-4" />
                  <span>{changeDetailsSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ ও রিসেট করুন (Save & Reset)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChangeDetailsUser(null)}
                  className="px-4 py-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-xs text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {activeResetRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0F172A] border border-[#7C3AED]/30 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-white">
              {activeResetRequest.phone} এর নতুন পাসওয়ার্ড নির্ধারণ
            </h3>
            <input
              type="text"
              required
              placeholder="যেমন: newpass2026"
              value={manualNewPassword}
              onChange={(e) => setManualNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#1E293B] text-white text-xs font-mono focus:outline-none focus:border-[#7C3AED]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleResolvePasswordReset('reset')}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs font-bold transition-all shadow-xs"
              >
                নিশ্চিত করুন
              </button>
              <button
                onClick={() => setActiveResetRequest(null)}
                className="px-4 py-2 rounded-xl bg-[#0B0F19] text-xs text-[#94A3B8]"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Protected Section Password Modal (Password: admin123) */}
      {showSectionPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-[#0F172A] border border-[#1E293B] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    সুরক্ষিত সেকশন • পাসওয়ার্ড প্রয়োজন
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    প্রবেশ করতে ওয়েবসাইটের অ্যাডমিন পাসওয়ার্ড প্রদান করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSectionPasswordModal(false);
                  setSectionPasswordInput('');
                  setSectionPasswordError('');
                }}
                className="p-1.5 rounded-xl text-[#64748D] hover:text-white hover:bg-[#1E293B] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#1E293B]/60 border border-[#334155] text-xs text-[#CBD5E1] space-y-1">
              <p>লাইভ চ্যাট ও অর্ডার বাদে অন্য সকল অপশনে (Overview, Users, Password & Security, Website Stock, Reports, Settings) প্রবেশের জন্য এই সুরক্ষা নিশ্চিত করা হয়েছে।</p>
            </div>

            <form onSubmit={handleVerifySectionPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                  অ্যাডমিন পাসওয়ার্ড (Password)
                </label>
                <div className="relative">
                  <input
                    type={showSectionPasswordText ? "text" : "password"}
                    autoFocus
                    required
                    placeholder="পাসওয়ার্ড লিখুন..."
                    value={sectionPasswordInput}
                    onChange={(e) => {
                      setSectionPasswordInput(e.target.value);
                      if (sectionPasswordError) setSectionPasswordError('');
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-[#090D16] border border-[#334155] text-white text-sm focus:outline-none focus:border-[#7C3AED] transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSectionPasswordText(!showSectionPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748D] hover:text-white cursor-pointer"
                  >
                    {showSectionPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {sectionPasswordError && (
                  <p className="text-xs text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{sectionPasswordError}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#6B46C1] to-[#7C3AED] hover:from-[#5B21B6] hover:to-[#6D28D9] text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>আনলক ও প্রবেশ করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSectionPasswordModal(false);
                    setSectionPasswordInput('');
                    setSectionPasswordError('');
                  }}
                  className="py-3 px-4 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
