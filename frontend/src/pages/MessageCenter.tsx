import { useState, useEffect } from 'react';
import { messagesApi } from '../services/api';
import { Message } from '../types';

interface MessageCenterProps {
  userId: string;
}

export default function MessageCenter({ userId }: MessageCenterProps) {
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
      setError(err instanceof Error ? err.message : '获取消息列表失败');
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

    // 标记为已读
    if (!message.isRead) {
      try {
        await messagesApi.markRead(message.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('标记已读失败:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await messagesApi.markAllRead(userId);
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
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
        return minutes <= 1 ? '刚刚' : `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const getMessageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      system: '系统通知',
      order: '订单消息',
      inventory_alert: '库存预警',
      promotion: '活动优惠',
    };
    return labels[type] || '通知';
  };

  const getMessageTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      system: 'bg-blue-100 text-blue-600',
      order: 'bg-green-100 text-green-600',
      inventory_alert: 'bg-red-100 text-red-600',
      promotion: 'bg-purple-100 text-purple-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  if (selectedMessage) {
    return (
      <div className="bg-white min-h-screen">
        {/* 消息详情 */}
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="flex items-center p-4">
            <button onClick={() => setSelectedMessage(null)} className="mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-medium">消息详情</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-xs px-2 py-0.5 rounded ${getMessageTypeColor(
                selectedMessage.type
              )}`}
            >
              {getMessageTypeLabel(selectedMessage.type)}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(selectedMessage.createdAt)}
            </span>
          </div>
          <h2 className="text-lg font-medium mb-4">{selectedMessage.title}</h2>
          {selectedMessage.content && (
            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {selectedMessage.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* 头部 */}
      <div className="sticky top-0 bg-white border-b z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <h1 className="text-lg font-medium">消息中心</h1>
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-primary-500"
            >
              全部已读
            </button>
          )}
        </div>

        {/* 类型筛选 */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          <button
            onClick={() => setTypeFilter('')}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
              typeFilter === ''
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            全部
          </button>
          {['system', 'order', 'inventory_alert', 'promotion'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                typeFilter === type
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {getMessageTypeLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* 消息列表 */}
      {loading && messages.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <p>{error}</p>
          <button
            onClick={() => fetchMessages()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg"
          >
            重试
          </button>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>暂无消息</p>
        </div>
      ) : (
        <div className="divide-y">
          {messages.map((message) => (
            <div
              key={message.id}
              onClick={() => handleSelectMessage(message)}
              className={`p-4 active:bg-gray-50 cursor-pointer ${
                !message.isRead ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {!message.isRead && (
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                )}
                <div className={`flex-1 ${message.isRead ? 'ml-5' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${getMessageTypeColor(
                        message.type
                      )}`}
                    >
                      {getMessageTypeLabel(message.type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">
                    {message.title}
                  </h3>
                  {message.content && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 加载更多 */}
          {hasMore && (
            <div className="p-4 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="text-primary-500 text-sm"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
