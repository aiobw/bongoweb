import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCheck, ShieldCheck, ShoppingBag, Key, MessageSquare, AlertCircle, Flag } from 'lucide-react';
import { ClientOrder, WebsiteDeliveryCredentials, UserReport } from '../types';

interface RealNotification {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: 'order' | 'credential' | 'chat' | 'report';
  isUnread: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAll: () => void;
  onNavigateToAccount?: () => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  onClearAll,
  onNavigateToAccount
}: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<RealNotification[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadRealNotifications = async () => {
      const realList: RealNotification[] = [];

      try {
        let orders: ClientOrder[] = [];
        let creds: WebsiteDeliveryCredentials[] = [];
        let reportsList: UserReport[] = [];

        try {
          const res = await fetch('/api/data');
          if (res.ok) {
            const db = await res.json();
            if (Array.isArray(db.orders)) orders = db.orders;
            if (Array.isArray(db.deliveredCredentials)) creds = db.deliveredCredentials;
            if (Array.isArray(db.reports)) reportsList = db.reports;
          }
        } catch (_) {}

        if (orders.length === 0) {
          const storedOrders = localStorage.getItem('bongoweb_orders');
          if (storedOrders) orders = JSON.parse(storedOrders);
        }
        if (creds.length === 0) {
          const storedCreds = localStorage.getItem('bongoweb_delivered_credentials');
          if (storedCreds) creds = JSON.parse(storedCreds);
        }
        if (reportsList.length === 0) {
          try {
            const repRes = await fetch('/api/reports');
            if (repRes.ok) {
              const repData = await repRes.json();
              if (Array.isArray(repData)) reportsList = repData;
            }
          } catch (_) {}
          if (reportsList.length === 0) {
            const storedReps = localStorage.getItem('bongoweb_reports');
            if (storedReps) reportsList = JSON.parse(storedReps);
          }
        }

        const storedUser = localStorage.getItem('bongoweb_user');
        const userObj = storedUser ? JSON.parse(storedUser) : null;
        const userPhone = userObj?.phone || null;
        const userEmail = userObj?.email || null;

        const userOrders = userPhone ? orders.filter(o => o.phone === userPhone) : orders;
        
        // 1. Pending order payments
        userOrders.forEach((o) => {
          if (o.status === 'pending') {
            realList.push({
              id: `ord-pending-${o.orderId}`,
              title: `অর্ডার ${o.orderId} — পেমেন্ট ভেরিফিকেশন চলছে`,
              subtitle: `${o.companyName || o.clientName} (${o.demoTitle}) এর পেমেন্ট যাচাই করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন।`,
              time: String(o.createdAt || 'সম্প্রতি'),
              type: 'order',
              isUnread: true
            });
          }
        });

        // 2. Delivered website credentials
        const myCreds = userPhone ? creds.filter(c => c.userPhone === userPhone) : creds;
        myCreds.forEach((c) => {
          realList.push({
            id: `cred-${c.id}`,
            title: `🔑 ${c.websiteTitle || 'ওয়েবসাইট'} — অ্যাডমিন অ্যাক্সেস ডেলিভারি`,
            subtitle: `আইডি: ${c.websiteAdminId} • পাসওয়ার্ড: ${c.websiteAdminPass}। ক্লিক করে বিস্তারিত দেখুন।`,
            time: String(c.deliveredAt || 'সম্প্রতি'),
            type: 'credential',
            isUnread: true
          });
        });

        // 3. Admin replies to user's reports
        const myReports = reportsList.filter((r) => {
          if (userPhone && r.clientPhone === userPhone) return true;
          if (userEmail && r.clientEmail === userEmail) return true;
          return false;
        });

        myReports.forEach((r) => {
          if (r.adminReply) {
            realList.push({
              id: `rep-reply-${r.id}`,
              title: `📢 আপনার রিপোর্টের উত্তর দেওয়া হয়েছে`,
              subtitle: `অ্যাডমিন উত্তর: "${r.adminReply}"`,
              time: String(r.adminRepliedAt || r.createdAt || 'সম্প্রতি'),
              type: 'report',
              isUnread: true
            });
          }
        });
      } catch (_) {}

      setNotifications(realList);
    };

    loadRealNotifications();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-sm sm:max-w-md bg-[#0e0e12] text-[#f5f5f7] rounded-2xl border border-white/[0.08] shadow-dark-card overflow-hidden animate-slideUpModal mt-12 sm:mt-14"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#14141a]/80 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] text-[#3b5bff] flex items-center justify-center font-bold border border-white/[0.08]">
              <Bell className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#f5f5f7]">
                সিস্টেম নোটিফিকেশন
              </h3>
              <p className="text-[10px] text-[#a1a1b0]">
                Real-Time Updates & Alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  setNotifications([]);
                  onClearAll();
                }}
                className="text-[11px] font-medium text-[#3b5bff] hover:text-[#5d77ff] flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>ক্লিয়ার</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#a1a1b0] hover:text-[#f5f5f7] hover:bg-white/[0.06] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real Notifications List */}
        <div className="p-3 sm:p-4 space-y-2.5 max-h-[380px] overflow-y-auto bg-[#09090b]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-2 text-[#71717a]">
                <Bell className="w-5 h-5 text-[#71717a]" />
              </div>
              <p className="text-xs font-semibold text-[#f5f5f7]">কোনো নতুন নোটিফিকেশন নেই</p>
              <p className="text-[11px] text-[#a1a1b0] mt-1 leading-relaxed">
                আপনার অর্ডার, পেমেন্ট, ডেলিভারি ও অভিযোগের উত্তর সংক্রান্ত সমস্ত রিয়েল-টাইম আপডেট এখানে প্রদর্শিত হবে।
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (onNavigateToAccount) {
                    onNavigateToAccount();
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  item.isUnread
                    ? 'bg-[#14141a] border-[#3b5bff]/30 hover:border-[#3b5bff]/60 shadow-xs'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.isUnread ? 'bg-[#3b5bff]' : 'bg-white/[0.2]'}`} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-[#f5f5f7] leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#a1a1b0] mt-0.5 leading-snug">
                      {item.subtitle}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] font-mono text-[#71717a]">
                        {item.time}
                      </span>
                      <span className="text-[10px] font-medium text-[#3b5bff] hover:underline">
                        বিস্তারিত দেখুন →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#14141a]/60 border-t border-white/[0.08] text-center">
          <p className="text-[11px] text-[#71717a]">
            BongoWeb রিয়েল-টাইম এনক্রিপ্টেড নোটিফিকেশন সিস্টেম
          </p>
        </div>
      </div>
    </div>
  );
}
