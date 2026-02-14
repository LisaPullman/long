import { useState, useEffect } from 'react';
import { messagesApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import type { Message } from '../types';

interface MessageCenterProps {
  userId: string;
}

export default function MessageCenter({ userId }: MessageCenterProps) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [userId, typeFilter]);

  const fetchMessages = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await messagesApi.list({
        userId,
        type: typeFilter || undefined,
        page: pageNum,
        pageSize: 20,
      });

      if (pageNum === 1) {
        setMessages(response.data);
      } else {
        setMessages((prev) => [...prev, ...response.data]);
      }

      setUnreadCount(response.unreadCount);
      setHasMore(response.pagination.page < response.pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('messages.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchMessages(page + 1);
    }
  };

  const handleSelectMessage = async (message: Message) => {
    setSelectedMessage(message);

    if (!message.isRead) {
      try {
        await messagesApi.markRead(message.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('markRead failed:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await messagesApi.markAllRead(userId);
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.operationFailed'));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? t('messages.justNow') : t('messages.minutesAgo', { count: minutes });
      }
      return t('messages.hoursAgo', { count: hours });
    } else if (days === 1) {
      return t('messages.yesterday');
    } else if (days < 7) {
      return t('messages.daysAgo', { count: days });
    } else {
      const locale = i18n.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
      return date.toLocaleDateString(locale);
    }
  };

  const getMessageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      system: t('messages.type.system'),
      order: t('messages.type.order'),
      inventory_alert: t('messages.type.inventory_alert'),
      promotion: t('messages.type.promotion'),
    };
    return labels[type] || t('messages.type.notification');
  };

  const getMessageTypeColor = (type: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      system: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-500' },
      order: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-500' },
      inventory_alert: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-500' },
      promotion: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-500' },
    };
    return colors[type] || { bg: 'bg-slate-50', text: 'text-slate-600', icon: 'bg-slate-400' };
  };

  const getMessageTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      system: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      order: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      inventory_alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      promotion: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    };
    return icons[type] || 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9';
  };

  if (selectedMessage) {
    const typeColor = getMessageTypeColor(selectedMessage.type);
    return (
      <div className="bg-slate-50 min-h-screen">
        {/* Message Detail Header */}
        <div className="sticky top-0 z-20 navbar-floating border-b border-slate-200/80">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center min-h-[44px]">
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
            <h1 className="text-lg font-semibold text-slate-800">{t('messages.detailTitle')}</h1>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="p-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeColor.bg}`}>
                <svg className={`w-5 h-5 ${typeColor.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getMessageTypeIcon(selectedMessage.type)} />
                </svg>
              </div>
              <div className="flex-1">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeColor.bg} ${typeColor.text}`}>
                  {getMessageTypeLabel(selectedMessage.type)}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {formatDate(selectedMessage.createdAt)}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">{selectedMessage.title}</h2>
            {selectedMessage.content && (
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {selectedMessage.content}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 navbar-floating border-b border-slate-200/80">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-800">{t('messages.title')}</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-emerald-600 font-medium px-3 py-1.5 rounded-full hover:bg-emerald-50 transition-colors"
              >
                {t('messages.markAllRead')}
              </button>
            )}
          </div>
        </div>

        {/* Type Filter */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
            <button
              onClick={() => setTypeFilter('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 min-h-[36px] ${
                typeFilter === ''
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
              }`}
            >
              {t('common.all')}
            </button>
            {['system', 'order', 'inventory_alert', 'promotion'].map((type) => {
              const color = getMessageTypeColor(type);
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 min-h-[36px] ${
                    typeFilter === type
                      ? `${color.bg} ${color.text} shadow-md`
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {getMessageTypeLabel(type)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Message List */}
      {loading && messages.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">{t('common.loading')}</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16 px-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => fetchMessages()}
              className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium min-h-[44px] btn"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="py-16 text-center px-4">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-slate-500">{t('messages.noMessages')}</p>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {messages.map((message) => {
            const typeColor = getMessageTypeColor(message.type);
            return (
              <div
                key={message.id}
                onClick={() => handleSelectMessage(message)}
                className={`card p-4 cursor-pointer interactive transition-all ${
                  !message.isRead ? 'ring-2 ring-emerald-500/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${typeColor.bg}`}>
                    <svg className={`w-6 h-6 ${typeColor.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getMessageTypeIcon(message.type)} />
                    </svg>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor.bg} ${typeColor.text}`}>
                        {getMessageTypeLabel(message.type)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <h3 className={`font-semibold truncate ${!message.isRead ? 'text-slate-800' : 'text-slate-600'}`}>
                      {message.title}
                    </h3>
                    {message.content && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {message.content}
                      </p>
                    )}
                  </div>

                  {/* Unread Indicator */}
                  {!message.isRead && (
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Load More */}
          {hasMore && (
            <div className="py-4 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="text-emerald-600 text-sm font-medium px-6 py-2 rounded-full hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                {loading ? t('messages.loadingMore') : t('messages.loadMore')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
