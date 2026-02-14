import { useState, useEffect } from 'react';
import { ordersApi, martsApi, usersApi } from '../services/api';
import { Goods, ShippingAddress, Mart } from '../types';

interface OrderCreateProps {
  martId: string;
  userId?: string;
  onSuccess?: (orderId: string) => void;
  onCancel?: () => void;
}

interface CartItem {
  goods: Goods;
  quantity: number;
}

export default function OrderCreate({ martId, userId, onSuccess, onCancel }: OrderCreateProps) {
  const [mart, setMart] = useState<Mart | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<ShippingAddress | null>(null);
  const [buyerRemark, setBuyerRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // 新地址表单
  const [newAddress, setNewAddress] = useState({
    receiverName: '',
    receiverPhone: '',
    province: '',
    city: '',
    district: '',
    detailAddress: '',
  });

  useEffect(() => {
    fetchData();
  }, [martId, userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [martData, addressesData] = await Promise.all([
        martsApi.getById(martId),
        userId ? usersApi.getAddresses(userId) : Promise.resolve([]),
      ]);

      setMart(martData);
      setAddresses(addressesData);

      // 设置默认地址
      const defaultAddress = addressesData.find((a: ShippingAddress) => a.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      }

      // 初始化购物车
      if (martData.goods) {
        setCart(
          martData.goods
            .filter((g: Goods) => g.repertory > 0)
            .map((g: Goods) => ({ goods: g, quantity: 0 }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (goodsId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.goods.id === goodsId) {
          const newQty = Math.max(0, Math.min(item.goods.repertory, item.quantity + delta));
          // 检查限购
          if (item.goods.purchaseLimit && newQty > item.goods.purchaseLimit) {
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.goods.price * item.quantity, 0);
  };

  const getTotalQuantity = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSubmit = async () => {
    if (!selectedAddress) {
      setError('请选择收货地址');
      return;
    }

    const items = cart.filter((item) => item.quantity > 0);
    if (items.length === 0) {
      setError('请至少选择一件商品');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const order = await ordersApi.create({
        martId,
        userId,
        receiverName: selectedAddress.receiverName,
        receiverPhone: selectedAddress.receiverPhone,
        province: selectedAddress.province,
        city: selectedAddress.city,
        district: selectedAddress.district,
        detailAddress: selectedAddress.detailAddress,
        buyerRemark: buyerRemark || undefined,
        items: items.map((item) => ({
          goodsId: item.goods.id,
          quantity: item.quantity,
        })),
      });

      onSuccess?.(order.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建订单失败');
    } finally {
      setSubmitting(false);
    }
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

  if (!mart) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>接龙活动不存在</p>
        <button onClick={onCancel} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      {/* 头部 */}
      <div className="bg-white sticky top-0 z-10 border-b">
        <div className="flex items-center p-4">
          {onCancel && (
            <button onClick={onCancel} className="mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-medium">{mart.topic}</h1>
        </div>
      </div>

      {/* 收货地址 */}
      <div className="bg-white mt-3 p-4" onClick={() => setShowAddressPicker(true)}>
        {selectedAddress ? (
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedAddress.receiverName}</span>
                <span className="text-gray-600">{selectedAddress.receiverPhone}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {selectedAddress.province} {selectedAddress.city} {selectedAddress.district}{' '}
                {selectedAddress.detailAddress}
              </p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-between text-gray-500">
            <span>请选择收货地址</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>

      {/* 商品列表 */}
      <div className="bg-white mt-3 p-4">
        <h3 className="font-medium mb-3">选择商品</h3>
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.goods.id} className="flex gap-3">
              {item.goods.images && item.goods.images[0] ? (
                <img
                  src={item.goods.images[0].imageUrl}
                  alt={item.goods.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-xs">无图</span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium">{item.goods.name}</p>
                {item.goods.specification && (
                  <p className="text-sm text-gray-500">{item.goods.specification}</p>
                )}
                <div className="flex justify-between items-center mt-2">
                  <div>
                    <span className="text-primary-500 font-medium">
                      {formatAmount(item.goods.price)}
                    </span>
                    {item.goods.originalPrice && (
                      <span className="text-sm text-gray-400 line-through ml-2">
                        {formatAmount(item.goods.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.goods.id, -1)}
                      disabled={item.quantity === 0}
                      className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.goods.id, 1)}
                      disabled={item.quantity >= item.goods.repertory}
                      className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  库存: {item.goods.repertory}
                  {item.goods.purchaseLimit && ` | 限购: ${item.goods.purchaseLimit}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 买家备注 */}
      <div className="bg-white mt-3 p-4">
        <h3 className="font-medium mb-3">备注</h3>
        <textarea
          value={buyerRemark}
          onChange={(e) => setBuyerRemark(e.target.value)}
          placeholder="请输入备注信息（选填）"
          className="w-full p-3 border rounded-lg resize-none"
          rows={3}
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-50 text-red-500 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 底部结算栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-inset-bottom">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-gray-500">共 {getTotalQuantity()} 件</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-gray-500">合计:</span>
              <span className="text-xl font-medium text-primary-500">
                {formatAmount(calculateTotal())}
              </span>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || getTotalQuantity() === 0}
            className="px-8 py-3 bg-primary-500 text-white rounded-lg disabled:opacity-50"
          >
            {submitting ? '提交中...' : '提交订单'}
          </button>
        </div>
      </div>

      {/* 地址选择弹窗 */}
      {showAddressPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[70vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="font-medium">选择收货地址</h3>
              <button onClick={() => setShowAddressPicker(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  onClick={() => {
                    setSelectedAddress(address);
                    setShowAddressPicker(false);
                  }}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedAddress?.id === address.id
                      ? 'border-primary-500 bg-primary-50'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{address.receiverName}</span>
                    <span className="text-gray-600">{address.receiverPhone}</span>
                    {address.isDefault && (
                      <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded">
                        默认
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {address.province} {address.city} {address.district} {address.detailAddress}
                  </p>
                </div>
              ))}
              {addresses.length === 0 && (
                <p className="text-center text-gray-500 py-8">暂无收货地址</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
