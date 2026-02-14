import { useState, useEffect } from 'react';
import { ordersApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import type { Order, OrderStatus } from '../types';

interface OrderDetailProps {
  orderId: string;
  onBack?: () => void;
  onUpdateStatus?: (order: Order) => void;
}

export default function OrderDetail({ orderId, onBack, onUpdateStatus }: OrderDetailProps) {
  const { t, i18n } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getById(orderId);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orders.detail.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    newStatus: OrderStatus,
    extraData?: Record<string, unknown>
  ) => {
    if (!order) return;

    try {
      setUpdating(true);
      const updated = await ordersApi.updateStatus(order.id, {
        status: newStatus,
        ...extraData,
      });
      setOrder(updated);
      onUpdateStatus?.(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('orders.detail.updateFailed'));
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, { bg: string; gradient: string; icon: string }> = {
      CREATED: { bg: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      PENDING_SHIPMENT: { bg: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      SHIPPED: { bg: 'bg-purple-500', gradient: 'from-purple-500 to-purple-600', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      DELIVERED: { bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600', icon: 'M5 13l4 4L19 7' },
      COMPLETED: { bg: 'bg-slate-400', gradient: 'from-slate-500 to-slate-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      CANCELED: { bg: 'bg-red-400', gradient: 'from-red-400 to-red-500', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
    };
    return colors[status] || { bg: 'bg-gray-500', gradient: 'from-gray-500 to-gray-600', icon: 'M12 8v4m0 4h.01' };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const locale = i18n.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
    return new Date(dateString).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-500 mb-4">{error || t('orders.detail.orderNotFound')}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium min-h-[44px] btn"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor(order.status);

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 navbar-floating border-b border-slate-200/80">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center min-h-[44px]">
            {onBack && (
              <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
          <h1 className="text-lg font-semibold text-slate-800">{t('orders.detail.title')}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Order Status Banner */}
      <div className={`bg-gradient-to-r ${statusColor.gradient} text-white p-6`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusColor.icon} />
            </svg>
          </div>
          <div>
            <p className="text-xl font-semibold">{t(`orders.status.${order.status}`)}</p>
            <p className="text-sm opacity-80 mt-0.5">
              {t('orders.detail.orderNo')}: <span className="font-mono">{order.orderNo}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="card mx-4 -mt-4 p-4 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{order.receiverName}</span>
              <span className="text-slate-500">{order.receiverPhone}</span>
            </div>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {order.province} {order.city} {order.district} {order.detailAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="card mx-4 mt-3 p-4">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {t('orders.detail.goodsInfo')}
        </h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              {item.goodsImage ? (
                <img
                  src={item.goodsImage}
                  alt={item.goodsName}
                  className="w-20 h-20 object-cover rounded-xl"
                />
              ) : (
                <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-slate-800">{item.goodsName}</p>
                {item.specification && (
                  <p className="text-sm text-slate-500 mt-0.5">{item.specification}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-600">¥{item.price}</span>
                  <span className="text-slate-500">×{item.quantity}</span>
                </div>
                <p className="text-right text-emerald-600 font-semibold mt-1">
                  {formatAmount(item.subtotal)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Info */}
      <div className="card mx-4 mt-3 p-4">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('orders.detail.orderInfo')}
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">{t('orders.detail.orderNumber')}</span>
            <span className="font-mono text-slate-700">{order.orderNo}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">{t('orders.detail.createdAt')}</span>
            <span className="text-slate-700">{formatDate(order.createdAt)}</span>
          </div>
          {order.shippedAt && (
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">{t('orders.detail.shippedAt')}</span>
              <span className="text-slate-700">{formatDate(order.shippedAt)}</span>
            </div>
          )}
          {order.shippingCompany && (
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">{t('orders.detail.shippingCompany')}</span>
              <span className="text-slate-700">{order.shippingCompany}</span>
            </div>
          )}
          {order.shippingNo && (
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">{t('orders.detail.shippingNo')}</span>
              <span className="font-mono text-slate-700">{order.shippingNo}</span>
            </div>
          )}
          {order.buyerRemark && (
            <div className="py-2">
              <span className="text-slate-500 block mb-1">{t('orders.detail.buyerRemark')}</span>
              <span className="text-slate-700 bg-slate-50 p-2 rounded-lg block">{order.buyerRemark}</span>
            </div>
          )}
        </div>
      </div>

      {/* Amount Summary */}
      <div className="card mx-4 mt-3 p-4">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {t('orders.detail.amountDetail')}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-slate-500">{t('orders.detail.goodsAmount')}</span>
            <span className="text-slate-700">{formatAmount(order.totalAmount - order.freightAmount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">{t('orders.detail.freight')}</span>
            <span className="text-slate-700">{formatAmount(order.freightAmount)}</span>
          </div>
          <div className="flex justify-between pt-3 mt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-800">{t('orders.detail.paid')}</span>
            <span className="text-xl font-bold text-emerald-600">{formatAmount(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 safe-area-inset-bottom">
        <div className="flex gap-3 max-w-md mx-auto">
          {order.status === 'CREATED' && (
            <button
              onClick={() =>
                handleStatusUpdate('CANCELED', {
                  cancelReason: t('orders.detail.cancelReasonUser'),
                })
              }
              disabled={updating}
              className="flex-1 py-3.5 border-2 border-red-200 text-red-500 rounded-xl font-semibold min-h-[48px] btn hover:bg-red-50 transition-colors"
            >
              {updating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('common.processing')}
                </span>
              ) : (
                t('orders.detail.cancelOrder')
              )}
            </button>
          )}
          {order.status === 'DELIVERED' && (
            <button
              onClick={() => handleStatusUpdate('COMPLETED')}
              disabled={updating}
              className="flex-1 py-3.5 bg-gradient-primary text-white rounded-xl font-semibold min-h-[48px] btn shadow-lg shadow-emerald-200"
            >
              {updating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('common.processing')}
                </span>
              ) : (
                t('orders.detail.confirmReceipt')
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
