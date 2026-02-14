import { useState, useEffect } from 'react';
import { ordersApi } from '../services/api';
import { Order, ORDER_STATUS_LABELS, OrderStatus } from '../types';

interface OrderDetailProps {
  orderId: string;
  onBack?: () => void;
  onUpdateStatus?: (order: Order) => void;
}

export default function OrderDetail({ orderId, onBack, onUpdateStatus }: OrderDetailProps) {
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
      setError(err instanceof Error ? err.message : '获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus, extraData?: any) => {
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
      alert(err instanceof Error ? err.message : '更新失败');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      CREATED: 'bg-blue-500',
      PENDING_SHIPMENT: 'bg-yellow-500',
      SHIPPED: 'bg-purple-500',
      DELIVERED: 'bg-green-500',
      COMPLETED: 'bg-gray-500',
      CANCELED: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{error || '订单不存在'}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* 头部 */}
      <div className="bg-white sticky top-0 z-10 border-b">
        <div className="flex items-center p-4">
          {onBack && (
            <button onClick={onBack} className="mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-medium">订单详情</h1>
        </div>
      </div>

      {/* 订单状态 */}
      <div className={`${getStatusColor(order.status)} text-white p-6`}>
        <p className="text-xl font-medium">{ORDER_STATUS_LABELS[order.status]}</p>
        <p className="text-sm opacity-80 mt-1">订单号: {order.orderNo}</p>
      </div>

      {/* 收货信息 */}
      <div className="bg-white mt-3 p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-primary-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{order.receiverName}</span>
              <span className="text-gray-600">{order.receiverPhone}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {order.province} {order.city} {order.district} {order.detailAddress}
            </p>
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="bg-white mt-3 p-4">
        <h3 className="font-medium mb-3">商品信息</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              {item.goodsImage ? (
                <img
                  src={item.goodsImage}
                  alt={item.goodsName}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xs">无图</span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium">{item.goodsName}</p>
                {item.specification && (
                  <p className="text-sm text-gray-500">{item.specification}</p>
                )}
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">¥{item.price}</span>
                  <span className="text-gray-600">x{item.quantity}</span>
                </div>
                <p className="text-right text-primary-500 font-medium">
                  小计: {formatAmount(item.subtotal)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 订单信息 */}
      <div className="bg-white mt-3 p-4">
        <h3 className="font-medium mb-3">订单信息</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">订单编号</span>
            <span>{order.orderNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">创建时间</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
          {order.shippedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">发货时间</span>
              <span>{formatDate(order.shippedAt)}</span>
            </div>
          )}
          {order.shippingCompany && (
            <div className="flex justify-between">
              <span className="text-gray-500">物流公司</span>
              <span>{order.shippingCompany}</span>
            </div>
          )}
          {order.shippingNo && (
            <div className="flex justify-between">
              <span className="text-gray-500">物流单号</span>
              <span>{order.shippingNo}</span>
            </div>
          )}
          {order.buyerRemark && (
            <div className="flex justify-between">
              <span className="text-gray-500">买家备注</span>
              <span className="text-right">{order.buyerRemark}</span>
            </div>
          )}
        </div>
      </div>

      {/* 金额明细 */}
      <div className="bg-white mt-3 p-4">
        <h3 className="font-medium mb-3">金额明细</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">商品金额</span>
            <span>{formatAmount(order.totalAmount - order.freightAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">运费</span>
            <span>{formatAmount(order.freightAmount)}</span>
          </div>
          <div className="flex justify-between font-medium text-lg pt-2 border-t">
            <span>实付金额</span>
            <span className="text-primary-500">{formatAmount(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-inset-bottom">
        <div className="flex gap-3">
          {order.status === 'CREATED' && (
            <button
              onClick={() => handleStatusUpdate('CANCELED', { cancelReason: '用户取消' })}
              disabled={updating}
              className="flex-1 py-3 border border-red-500 text-red-500 rounded-lg"
            >
              取消订单
            </button>
          )}
          {order.status === 'DELIVERED' && (
            <button
              onClick={() => handleStatusUpdate('COMPLETED')}
              disabled={updating}
              className="flex-1 py-3 bg-primary-500 text-white rounded-lg"
            >
              确认收货
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
