import { useState, useEffect } from 'react';
import { ordersApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import type { Order, OrderStatus } from '../types';

interface OrderListProps {
  userId?: string;
  martId?: string;
  onSelectOrder?: (order: Order) => void;
}

export default function OrderList({ userId, martId, onSelectOrder }: OrderListProps) {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

  const STATUSES: OrderStatus[] = [
    'CREATED',
    'PENDING_SHIPMENT',
    'SHIPPED',
    'DELIVERED',
    'COMPLETED',
    'CANCELED',
  ];

  useEffect(() => {
    fetchOrders();
  }, [userId, martId, page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.list({
        page,
        pageSize: 10,
        userId,
        martId,
        status: statusFilter || undefined,
      });
      setOrders(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orders.list.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, { bg: string; text: string; icon: string }> = {
      CREATED: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-500' },
      PENDING_SHIPMENT: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-500' },
      SHIPPED: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-500' },
      DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'bg-emerald-500' },
      COMPLETED: { bg: 'bg-slate-50', text: 'text-slate-600', icon: 'bg-slate-400' },
      CANCELED: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-400' },
    };
    return colors[status] || { bg: 'bg-gray-50', text: 'text-gray-600', icon: 'bg-gray-400' };
  };

  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<OrderStatus, string> = {
      CREATED: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      PENDING_SHIPMENT: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      SHIPPED: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      DELIVERED: 'M5 13l4 4L19 7',
      COMPLETED: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      CANCELED: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    };
    return icons[status] || 'M12 8v4m0 4h.01';
  };

  const formatDate = (dateString: string) => {
    const locale = i18n.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
    return new Date(dateString).toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium min-h-[44px] btn"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 navbar-floating border-b border-slate-200/80">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-slate-800">{t('orders.title')}</h1>
        </div>

        {/* Status Filter */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
            <button
              onClick={() => setStatusFilter('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 min-h-[36px] ${
                statusFilter === ''
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
              }`}
            >
              {t('common.all')}
            </button>
            {STATUSES.map((status) => {
              const color = getStatusColor(status);
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as OrderStatus)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 min-h-[36px] ${
                    statusFilter === status
                      ? `${color.bg} ${color.text} shadow-md`
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {t(`orders.status.${status}`)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Order List */}
      <div className="p-4 space-y-3">
        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-slate-500">{t('orders.noOrders')}</p>
          </div>
        ) : (
          orders.map((order) => {
            const statusColor = getStatusColor(order.status);
            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder?.(order)}
                className="card p-4 interactive hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400 font-mono">{order.orderNo}</span>
                  </div>
                  <span className={`status-badge ${statusColor.bg} ${statusColor.text}`}>
                    <svg className={`w-3 h-3 mr-1 ${statusColor.icon}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d={getStatusIcon(order.status)} clipRule="evenodd" />
                    </svg>
                    {t(`orders.status.${order.status}`)}
                  </span>
                </div>

                {/* Product Preview */}
                <div className="space-y-2 mb-3">
                  {order.items.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex gap-3">
                      {item.goodsImage ? (
                        <img
                          src={item.goodsImage}
                          alt={item.goodsName}
                          className="w-16 h-16 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.goodsName}</p>
                        {item.specification && (
                          <p className="text-xs text-slate-500 mt-0.5">{item.specification}</p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-500">
                            <span className="text-slate-600 font-medium">¥{item.price}</span> × {item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-center text-slate-400 py-1">
                      +{t('orders.moreItems', { count: order.items.length - 2 })}
                    </p>
                  )}
                </div>

                {/* Order Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    {formatDate(order.createdAt)}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500">
                      {t('orders.itemsCount', { count: order.items.length })}
                    </span>
                    <span className="ml-2 text-lg font-semibold text-slate-800">
                      {formatAmount(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 safe-area-inset-bottom">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('orders.prevPage')}
            </button>
            <span className="text-sm text-slate-600 px-4">
              <span className="font-semibold text-slate-800">{page}</span>
              <span className="text-slate-400"> / {totalPages}</span>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] btn"
            >
              {t('orders.nextPage')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
