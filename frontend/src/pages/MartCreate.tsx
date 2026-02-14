import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';
import { martsApi } from '../services/api';

type GoodsDraft = {
  name: string;
  description: string;
  specification: string;
  price: string;
  originalPrice: string;
  repertory: string;
  purchaseLimit: string;
  cost: string;
  laborCost: string;
  packagingCost: string;
  imageUrls: string[];
};

function toNumberOrUndefined(value: string) {
  const v = value.trim();
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function MartCreate() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [setFinishTime, setSetFinishTime] = useState(true);
  const [finishTimeLocal, setFinishTimeLocal] = useState(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  });
  const [deliveryDescription, setDeliveryDescription] = useState('');
  const [expectedShipDays, setExpectedShipDays] = useState('3');
  const [autoConfirmDays, setAutoConfirmDays] = useState('7');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [goods, setGoods] = useState<GoodsDraft[]>([
    {
      name: '',
      description: '',
      specification: '',
      price: '',
      originalPrice: '',
      repertory: '0',
      purchaseLimit: '',
      cost: '',
      laborCost: '',
      packagingCost: '',
      imageUrls: [''],
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedImages = useMemo(
    () => imageUrls.map((u) => u.trim()).filter(Boolean),
    [imageUrls]
  );

  const normalizedGoods = useMemo(() => {
    return goods
      .map((g) => ({
        ...g,
        name: g.name.trim(),
        description: g.description.trim(),
        specification: g.specification.trim(),
        imageUrls: g.imageUrls.map((u) => u.trim()).filter(Boolean),
      }))
      .filter((g) => g.name);
  }, [goods]);

  const updateGoods = (idx: number, patch: Partial<GoodsDraft>) => {
    setGoods((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  };

  const updateGoodsImageUrl = (idx: number, imgIdx: number, value: string) => {
    setGoods((prev) =>
      prev.map((g, i) => {
        if (i !== idx) return g;
        const next = [...g.imageUrls];
        next[imgIdx] = value;
        return { ...g, imageUrls: next };
      })
    );
  };

  const addGoods = () => {
    setGoods((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        specification: '',
        price: '',
        originalPrice: '',
        repertory: '0',
        purchaseLimit: '',
        cost: '',
        laborCost: '',
        packagingCost: '',
        imageUrls: [''],
      },
    ]);
  };

  const removeGoods = (idx: number) => {
    setGoods((prev) => prev.filter((_, i) => i !== idx));
  };

  const addImageUrl = () => setImageUrls((prev) => [...prev, '']);
  const removeImageUrl = (idx: number) => setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  const updateImageUrl = (idx: number, value: string) =>
    setImageUrls((prev) => prev.map((u, i) => (i === idx ? value : u)));

  const addGoodsImage = (idx: number) => updateGoods(idx, { imageUrls: [...goods[idx].imageUrls, ''] });
  const removeGoodsImage = (idx: number, imgIdx: number) =>
    updateGoods(idx, { imageUrls: goods[idx].imageUrls.filter((_, i) => i !== imgIdx) });

  const submit = async () => {
    try {
      setError(null);

      const cleanTopic = topic.trim();
      if (!cleanTopic) {
        setError(t('marts.create.errors.topicRequired'));
        return;
      }

      if (normalizedGoods.length === 0) {
        setError(t('marts.create.errors.goodsRequired'));
        return;
      }

      const expectedShipDaysNum = toNumberOrUndefined(expectedShipDays) ?? 3;
      const autoConfirmDaysNum = toNumberOrUndefined(autoConfirmDays) ?? 7;

      const finishTimeIso =
        setFinishTime && finishTimeLocal
          ? new Date(finishTimeLocal).toISOString()
          : undefined;

      // Validate each goods draft
      for (const g of normalizedGoods) {
        const priceNum = toNumberOrUndefined(g.price);
        const repertoryNum = toNumberOrUndefined(g.repertory);
        if (priceNum === undefined) {
          setError(t('marts.create.errors.goodsPriceRequired', { name: g.name }));
          return;
        }
        if (repertoryNum === undefined) {
          setError(t('marts.create.errors.goodsStockRequired', { name: g.name }));
          return;
        }
      }

      setSubmitting(true);

      const payload = {
        topic: cleanTopic,
        description: description.trim() || undefined,
        setFinishTime,
        finishTime: finishTimeIso,
        deliveryDescription: deliveryDescription.trim() || undefined,
        expectedShipDays: expectedShipDaysNum,
        autoConfirmDays: autoConfirmDaysNum,
        images: normalizedImages.length ? normalizedImages.map((u) => ({ imageUrl: u })) : undefined,
        goods: normalizedGoods.map((g, idx) => ({
          name: g.name,
          description: g.description || undefined,
          specification: g.specification || undefined,
          price: toNumberOrUndefined(g.price),
          originalPrice: toNumberOrUndefined(g.originalPrice),
          repertory: toNumberOrUndefined(g.repertory) ?? 0,
          purchaseLimit: toNumberOrUndefined(g.purchaseLimit),
          lowStockThreshold: undefined,
          cost: toNumberOrUndefined(g.cost),
          laborCost: toNumberOrUndefined(g.laborCost),
          packagingCost: toNumberOrUndefined(g.packagingCost),
          sortOrder: idx,
          images: g.imageUrls.length ? g.imageUrls.map((u) => ({ imageUrl: u })) : undefined,
        })),
      };

      const mart = await martsApi.create(payload);

      // 先去下单页做“可见”的闭环；后续可再补 Mart 详情页/管理页。
      navigate(`/orders/create?martId=${mart.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.operationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="sticky top-0 z-20 border-b bg-white">
        <div className="grid grid-cols-3 items-center p-4">
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <h1 className="text-lg font-medium text-center">{t('marts.create.title')}</h1>
          <div className="flex justify-end">
            <LanguageToggle />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">{t('marts.create.basic')}</h2>

          <label className="block text-sm text-slate-600 mb-1">{t('marts.create.topic')}</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('marts.create.topicPlaceholder')}
            className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

          <label className="block text-sm text-slate-600 mb-1 mt-3">{t('marts.create.description')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('marts.create.descriptionPlaceholder')}
            rows={4}
            className="w-full p-3 border border-slate-200 rounded-xl resize-none text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">{t('marts.create.schedule')}</h2>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={setFinishTime}
              onChange={(e) => setSetFinishTime(e.target.checked)}
            />
            {t('marts.create.setFinishTime')}
          </label>

          {setFinishTime && (
            <div className="mt-3">
              <label className="block text-sm text-slate-600 mb-1">{t('marts.create.finishTime')}</label>
              <input
                type="datetime-local"
                value={finishTimeLocal}
                onChange={(e) => setFinishTimeLocal(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm text-slate-600 mb-1">{t('marts.create.expectedShipDays')}</label>
              <input
                inputMode="numeric"
                value={expectedShipDays}
                onChange={(e) => setExpectedShipDays(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">{t('marts.create.autoConfirmDays')}</label>
              <input
                inputMode="numeric"
                value={autoConfirmDays}
                onChange={(e) => setAutoConfirmDays(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <label className="block text-sm text-slate-600 mb-1 mt-3">{t('marts.create.deliveryDescription')}</label>
          <input
            value={deliveryDescription}
            onChange={(e) => setDeliveryDescription(e.target.value)}
            placeholder={t('marts.create.deliveryDescriptionPlaceholder')}
            className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">{t('marts.create.images')}</h2>
            <button onClick={addImageUrl} className="text-sm text-emerald-600">
              {t('marts.create.addImage')}
            </button>
          </div>

          <div className="space-y-2">
            {imageUrls.map((u, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  value={u}
                  onChange={(e) => updateImageUrl(idx, e.target.value)}
                  placeholder={t('marts.create.imageUrlPlaceholder')}
                  className="flex-1 p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                <button
                  type="button"
                  onClick={() => removeImageUrl(idx)}
                  disabled={imageUrls.length === 1}
                  className="px-3 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40"
                >
                  {t('marts.create.remove')}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">{t('marts.create.goods')}</h2>
            <button onClick={addGoods} className="text-sm text-emerald-600">
              {t('marts.create.addGoods')}
            </button>
          </div>

          <div className="space-y-4">
            {goods.map((g, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl p-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-800">
                    {t('marts.create.goodsItem', { index: idx + 1 })}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGoods(idx)}
                    disabled={goods.length === 1}
                    className="text-sm text-red-600 disabled:opacity-40"
                  >
                    {t('marts.create.remove')}
                  </button>
                </div>

                <label className="block text-sm text-slate-600 mb-1 mt-3">{t('marts.create.goodsName')}</label>
                <input
                  value={g.name}
                  onChange={(e) => updateGoods(idx, { name: e.target.value })}
                  placeholder={t('marts.create.goodsNamePlaceholder')}
                  className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">{t('marts.create.goodsPrice')}</label>
                    <input
                      inputMode="decimal"
                      value={g.price}
                      onChange={(e) => updateGoods(idx, { price: e.target.value })}
                      placeholder="29.9"
                      className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">{t('marts.create.goodsOriginalPrice')}</label>
                    <input
                      inputMode="decimal"
                      value={g.originalPrice}
                      onChange={(e) => updateGoods(idx, { originalPrice: e.target.value })}
                      placeholder="39.9"
                      className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">{t('marts.create.goodsStock')}</label>
                    <input
                      inputMode="numeric"
                      value={g.repertory}
                      onChange={(e) => updateGoods(idx, { repertory: e.target.value })}
                      placeholder="20"
                      className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">{t('marts.create.goodsLimit')}</label>
                    <input
                      inputMode="numeric"
                      value={g.purchaseLimit}
                      onChange={(e) => updateGoods(idx, { purchaseLimit: e.target.value })}
                      placeholder="3"
                      className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                <label className="block text-sm text-slate-600 mb-1 mt-3">{t('marts.create.goodsSpec')}</label>
                <input
                  value={g.specification}
                  onChange={(e) => updateGoods(idx, { specification: e.target.value })}
                  placeholder={t('marts.create.goodsSpecPlaceholder')}
                  className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <label className="block text-sm text-slate-600 mb-1 mt-3">{t('marts.create.goodsDesc')}</label>
                <textarea
                  value={g.description}
                  onChange={(e) => updateGoods(idx, { description: e.target.value })}
                  placeholder={t('marts.create.goodsDescPlaceholder')}
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl resize-none text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-slate-700">{t('marts.create.goodsImages')}</div>
                    <button onClick={() => addGoodsImage(idx)} className="text-sm text-emerald-600">
                      {t('marts.create.addImage')}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {g.imageUrls.map((u, imgIdx) => (
                      <div key={imgIdx} className="flex gap-2">
                        <input
                          value={u}
                          onChange={(e) => updateGoodsImageUrl(idx, imgIdx, e.target.value)}
                          placeholder={t('marts.create.imageUrlPlaceholder')}
                          className="flex-1 p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        />
                        <button
                          type="button"
                          onClick={() => removeGoodsImage(idx, imgIdx)}
                          disabled={g.imageUrls.length === 1}
                          className="px-3 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-40"
                        >
                          {t('marts.create.remove')}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-medium text-slate-700 mb-2">{t('marts.create.goodsCosts')}</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">{t('marts.create.goodsCost')}</label>
                      <input
                        inputMode="decimal"
                        value={g.cost}
                        onChange={(e) => updateGoods(idx, { cost: e.target.value })}
                        placeholder="15"
                        className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">{t('marts.create.goodsLaborCost')}</label>
                      <input
                        inputMode="decimal"
                        value={g.laborCost}
                        onChange={(e) => updateGoods(idx, { laborCost: e.target.value })}
                        placeholder="2"
                        className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">{t('marts.create.goodsPackagingCost')}</label>
                      <input
                        inputMode="decimal"
                        value={g.packagingCost}
                        onChange={(e) => updateGoods(idx, { packagingCost: e.target.value })}
                        placeholder="3"
                        className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-1 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 safe-area-inset-bottom">
        <button
          onClick={submit}
          disabled={submitting}
          className="w-full py-3.5 bg-gradient-primary text-white rounded-xl font-semibold min-h-[48px] btn shadow-lg shadow-emerald-200 disabled:opacity-50"
        >
          {submitting ? t('marts.create.submitting') : t('marts.create.submit')}
        </button>
        <p className="text-xs text-slate-500 mt-2">
          {t('marts.create.notice')}
        </p>
      </div>
    </div>
  );
}
