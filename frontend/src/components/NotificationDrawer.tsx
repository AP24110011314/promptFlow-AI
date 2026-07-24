import React, { useState, useEffect } from 'react';
import { 
  Bell, X, CheckCheck, FileText, Cpu, Download, 
  ShieldAlert, CheckCircle, ExternalLink, RefreshCw, Trash2
} from 'lucide-react';
import { notificationService } from '../services/api';
import type { AppNotification } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPaperId?: (paperId: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectPaperId,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterUnread, setFilterUnread] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filterUnread]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const notifs = await notificationService.list(filterUnread);
      setNotifications(notifs);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notif: AppNotification) => {
    if (!notif.is_read) {
      try {
        await notificationService.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }
    if (notif.link_paper_id && onSelectPaperId) {
      onSelectPaperId(notif.link_paper_id);
      onClose();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  if (!isOpen) return null;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'ingestion':
        return <FileText className="w-4 h-4 text-brand-cyan" />;
      case 'ml_retrain':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'export':
        return <Download className="w-4 h-4 text-amber-400" />;
      case 'alert':
        return <ShieldAlert className="w-4 h-4 text-brand-red" />;
      default:
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl bg-brand-card border border-brand-border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden flex flex-col max-h-[80vh]">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-brand-border bg-brand-bg/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="w-4 h-4 text-brand-cyan" />
          <span className="text-xs font-bold text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-brand-cyan/20 text-brand-cyan text-[10px] font-bold">
              {unreadCount} new
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleMarkAllRead}
            title="Mark all as read"
            className="p-1.5 rounded-lg hover:bg-brand-hover text-brand-gray hover:text-white transition-colors text-[11px] flex items-center space-x-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Mark Read</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-brand-hover text-brand-gray hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 py-2 border-b border-brand-border bg-brand-card flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterUnread(false)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              !filterUnread ? 'bg-brand-cyan/15 text-brand-cyan' : 'text-brand-gray hover:text-white'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilterUnread(true)}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filterUnread ? 'bg-brand-cyan/15 text-brand-cyan' : 'text-brand-gray hover:text-white'
            }`}
          >
            Unread Only
          </button>
        </div>

        <button
          onClick={fetchNotifications}
          title="Refresh notifications"
          className="p-1 rounded-md text-brand-gray hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-brand-cyan' : ''}`} />
        </button>
      </div>

      {/* Notification List */}
      <div className="divide-y divide-brand-border overflow-y-auto max-h-[360px] text-xs">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-brand-gray space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-brand-cyan mx-auto" />
            <p className="text-[11px]">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-brand-gray space-y-2">
            <Bell className="w-6 h-6 text-brand-border mx-auto opacity-50" />
            <p className="text-[11px] font-medium">No notifications found.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif)}
              className={`p-3.5 transition-colors cursor-pointer flex items-start space-x-3 group relative ${
                notif.is_read ? 'bg-transparent hover:bg-brand-hover/40' : 'bg-brand-cyan/5 hover:bg-brand-cyan/10'
              }`}
            >
              <div className="mt-0.5 p-2 rounded-xl bg-brand-bg border border-brand-border shrink-0">
                {getNotifIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between gap-1">
                  <p className={`font-bold truncate text-[11px] ${notif.is_read ? 'text-white/80' : 'text-white'}`}>
                    {notif.title}
                  </p>
                  {!notif.is_read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-brand-gray line-clamp-2 mt-0.5 leading-snug">
                  {notif.message}
                </p>

                {notif.link_paper_id && (
                  <span className="inline-flex items-center space-x-1 text-[10px] text-brand-cyan font-semibold mt-1 hover:underline">
                    <span>View Ingested Paper</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              <button
                onClick={(e) => handleDelete(e, notif.id)}
                title="Delete notification"
                className="opacity-0 group-hover:opacity-100 p-1 text-brand-gray hover:text-brand-red transition-all cursor-pointer absolute right-2 top-2"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

