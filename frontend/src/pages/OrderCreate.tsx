import { useState, useEffect } from 'react';
import { ordersApi, martsApi, usersApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import type { Goods, ShippingAddress, Mart } from '../types';

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
  const { t } = useTranslation();
  const [mart, setMart] = useState<Mart | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<ShippingAddress | null>(null);
  const [buyerRemark, setBuyerRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

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

      const defaultAddress = addressesData.find((a: ShippingAddress) => a.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      }

      if (martData.goods) {
        setCart(
          martData.goods
            .filter((g: Goods) => g.repertory > 0)
            .map((g: Goods) => ({ goods: g, quantity: 0 }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orders.create.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (goodsId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.goods.id === goodsId) {
          const newQty = Math.max(0, Math.min(item.goods.repertory, item.quantity + delta));
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
      setError(t('orders.create.selectAddress'));
      return;
    }

    const items = cart.filter((item) => item.quantity > 0);
    if (items.length === 0) {
      setError(t('orders.create.selectAtLeastOne'));
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
      setError(err instanceof Error ? err.message : t('orders.create.createFailed'));
    } finally {
      setSubmitting(false);
    }
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

  if (!mart) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-500 mb-4">{t('orders.create.martNotFound')}</p>
          <button onClick={onCancel} className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium min-h-[44px] btn">
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const totalQuantity = getTotalQuantity();
  const totalAmount = calculateTotal();

  return (
    <div className="bg-slate-50 min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 navbar-floating border-b border-slate-200/80">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center min-h-[44px]">
            {onCancel && (
              <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
          <h1 className="text-lg font-semibold text-slate-800 truncate max-w-[200px]">{mart.topic}</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Mart Banner */}
      {mart.images && mart.images.length > 0 && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={mart.images[0].imageUrl}
            alt={mart.topic}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="font-semibold text-lg">{mart.topic}</h2>
            {mart.description && (
              <p className="text-sm opacity-80 mt-1 line-clamp-2">{mart.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Delivery Address */}
      <div
        className="card mx-4 mt-3 p-4 cursor-pointer interactive hover:shadow-md transition-shadow"
        onClick={() => setShowAddressPicker(true)}
      >
        {selectedAddress ? (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{selectedAddress.receiverName}</span>
                <span className="text-slate-500">{selectedAddress.receiverPhone}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {selectedAddress.province} {selectedAddress.city} {selectedAddress.district}{' '}
                {selectedAddress.detailAddress}
              </p>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span>{t('orders.create.selectAddress')}</span>
            </div>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Products */}
      <div className="card mx-4 mt-3 p-4">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          {t('orders.create.chooseGoods')}
        </h3>
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item.goods.id} className="flex gap-3">
              {item.goods.images && item.goods.images[0] ? (
                <img
                  src={item.goods.images[0].imageUrl}
                  alt={item.goods.name}
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
                <p className="font-medium text-slate-800">{item.goods.name}</p>
                {item.goods.specification && (
                  <p className="text-sm text-slate-500 mt-0.5">{item.goods.specification}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <span className="text-emerald-600 font-bold text-lg">
                      {formatAmount(item.goods.price)}
                    </span>
                    {item.goods.originalPrice && (
                      <span className="text-sm text-slate-400 line-through ml-2">
                        {formatAmount(item.goods.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.goods.id, -1)}
                      disabled={item.quantity === 0}
                      className="w-9 h-9 rounded-full border-2 border-slate-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed btn hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center font-semibold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.goods.id, 1)}
                      disabled={item.quantity >= item.goods.repertory}
                      className="w-9 h-9 rounded-full border-2 border-slate-200 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed btn hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  {t('orders.create.stock', { count: item.goods.repertory })}
                  {item.goods.purchaseLimit &&
                    ` | ${t('orders.create.limit', { count: item.goods.purchaseLimit })}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buyer Remark */}
      <div className="card mx-4 mt-3 p-4">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {t('orders.create.remarkTitle')}
        </h3>
        <textarea
          value={buyerRemark}
          onChange={(e) => setBuyerRemark(e.target.value)}
          placeholder={t('orders.create.remarkPlaceholder')}
          className="w-full p-3 border border-slate-200 rounded-xl resize-none text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
          rows={3}
        />
      </div>

      {/* Error Toast */}
      {error && (
        <div className="mx-4 mt-3 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 safe-area-inset-bottom">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <span className="text-sm text-slate-500">{t('orders.create.totalItems', { count: totalQuantity })}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs text-slate-500">{t('orders.create.total')}</span>
              <span className="text-2xl font-bold text-emerald-600">
                {formatAmount(totalAmount)}
              </span>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || totalQuantity === 0}
            className="px-8 py-3.5 bg-gradient-cta text-white rounded-xl font-semibold min-h-[48px] btn shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('orders.create.submitting')}
              </>
            ) : (
              t('orders.create.submitOrder')
            )}
          </button>
        </div>
      </div>

      {/* Address Picker Modal */}
      {showAddressPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[75vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-lg">{t('orders.create.chooseAddressTitle')}</h3>
              <button
                onClick={() => setShowAddressPicker(false)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  onClick={() => {
                    setSelectedAddress(address);
                    setShowAddressPicker(false);
                  }}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedAddress?.id === address.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{address.receiverName}</span>
                    <span className="text-slate-500">{address.receiverPhone}</span>
                    {address.isDefault && (
                      <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                        {t('orders.create.defaultTag')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    {address.province} {address.city} {address.district} {address.detailAddress}
                  </p>
                </div>
              ))}
              {addresses.length === 0 && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500">{t('orders.create.noAddresses')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
