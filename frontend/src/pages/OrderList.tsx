import { useState, useEffect } from 'react';
import { ordersApi } from '../services/api';
import { Order, ORDER_STATUS_LABELS, OrderStatus } from '../types';

interface OrderListProps {
  userId?: string;
  martId?: string;
  onSelectOrder?: (order: Order) => void;
}

export default function OrderList({ userId, martId, onSelectOrder }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');

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
      setError(err instanceof Error ? err.message : '获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      CREATED: 'bg-blue-100 text-blue-800',
      PENDING_SHIPMENT: 'bg-yellow-100 text-yellow-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
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

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{error}</p>
        <button
          onClick={fetchOrders}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* 状态筛选 */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 z-10">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
              statusFilter === ''
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            全部
          </button>
          {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as OrderStatus)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 订单列表 */}
      <div className="divide-y">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>暂无订单</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder?.(order)}
              className="p-4 active:bg-gray-50 cursor-pointer"
            >
              {/* 订单头部 */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500">{order.orderNo}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                    order.status
                  )}`}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>

              {/* 商品列表 */}
              <div className="space-y-2">
                {order.items.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {item.goodsImage ? (
                      <img
                        src={item.goodsImage}
                        alt={item.goodsName}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">无图</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.goodsName}</p>
                      {item.specification && (
                        <p className="text-xs text-gray-500">{item.specification}</p>
                      )}
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-gray-600">
                          ¥{item.price} x {item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <p className="text-xs text-gray-500 text-center">
                    还有 {order.items.length - 2} 件商品
                  </p>
                )}
              </div>

              {/* 订单底部 */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                <span className="text-xs text-gray-500">
                  {formatDate(order.createdAt)}
                </span>
                <div className="text-right">
                  <span className="text-xs text-gray-500">共{order.items.length}件</span>
                  <span className="ml-2 text-base font-medium text-gray-900">
                    {formatAmount(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 py-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
