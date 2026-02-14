import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import OrderCreate from './pages/OrderCreate';
import MessageCenter from './pages/MessageCenter';
import MartCreate from './pages/MartCreate';
import Login from './pages/Login';
import Register from './pages/Register';
import LanguageToggle from './components/LanguageToggle';
import { getAuthToken, getCurrentUser, setAuthToken, setCurrentUser, usersApi } from './services/api';

// Fallback for local seeded database.
const FALLBACK_USER_ID = 'demo-user-001';

// 订单列表页面包装器
function OrderListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const martId = searchParams.get('martId') || undefined;
  const { t } = useTranslation();
  const userId = getCurrentUser()?.id || FALLBACK_USER_ID;

  return (
    <div>
      <div className="bg-white border-b p-4 sticky top-0 z-20">
        <div className="grid grid-cols-3 items-center">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Home"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h5V15h4v6h5a1 1 0 001-1V10" />
              </svg>
            </button>
          </div>
          <h1 className="text-lg font-semibold text-center">{t('orders.myOrdersTitle')}</h1>
          <div className="flex justify-end items-center">
            <LanguageToggle />
          </div>
        </div>
      </div>
      <OrderList
        userId={userId}
        martId={martId}
        onSelectOrder={(order) => navigate(`/orders/${order.id}`)}
      />
    </div>
  );
}

// 订单详情页面包装器
function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  if (!id) return <div className="p-4 text-center text-gray-600">{t('orders.orderIdMissing')}</div>;

  return (
    <OrderDetail
      orderId={id}
      onBack={() => navigate('/orders')}
    />
  );
}

// 创建订单页面包装器
function OrderCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const martId = searchParams.get('martId') || 'demo-mart-001';
  const userId = getCurrentUser()?.id || FALLBACK_USER_ID;

  return (
    <OrderCreate
      martId={martId}
      userId={userId}
      onSuccess={(orderId) => {
        navigate(`/orders/${orderId}`);
      }}
      onCancel={() => navigate('/orders')}
    />
  );
}

// 消息中心页面包装器
function MessageCenterPage() {
  const userId = getCurrentUser()?.id || FALLBACK_USER_ID;
  return <MessageCenter userId={userId} />;
}

// 首页
function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-400 text-white p-8 pb-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight">{t('app.name')}</h1>
              <p className="text-lg opacity-90 mt-2 font-medium">{t('app.tagline')}</p>
              {user && (
                <p className="text-sm opacity-75 mt-3">
                  {t('auth.signedInAs', { name: user.nickname || user.phone || user.id })}
                </p>
              )}
            </div>
            <LanguageToggle />
          </div>
        </div>
      </div>

      {/* Main Menu Cards */}
      <div className="p-4 -mt-6 space-y-3">
        <button
          onClick={() => navigate('/marts/create')}
          className="w-full p-5 bg-white rounded-2xl shadow-lg shadow-emerald-100 text-left interactive group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{t('home.startMart')}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{t('home.startMartDesc')}</p>
              </div>
            </div>
            <svg className="w-6 h-6 text-emerald-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <button
          onClick={() => navigate('/orders/create?martId=demo-mart-001')}
          className="w-full p-5 bg-white rounded-2xl shadow-md text-left interactive group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{t('home.createOrder')}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{t('home.createOrderDesc')}</p>
              </div>
            </div>
            <svg className="w-6 h-6 text-orange-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <button
          onClick={() => navigate('/orders')}
          className="w-full p-5 bg-white rounded-2xl shadow-md text-left interactive group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{t('home.myOrders')}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{t('home.myOrdersDesc')}</p>
              </div>
            </div>
            <svg className="w-6 h-6 text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        <button
          onClick={() => navigate('/messages')}
          className="w-full p-5 bg-white rounded-2xl shadow-md text-left interactive group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-400 rounded-2xl flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{t('home.messageCenter')}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{t('home.messageCenterDesc')}</p>
              </div>
            </div>
            <svg className="w-6 h-6 text-purple-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* MVP Features */}
      <div className="p-4 mt-2">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3 text-lg">{t('home.mvpTitle')}</h3>
          <ul className="text-sm text-slate-600 space-y-2.5">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              {t('home.mvp1')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              {t('home.mvp2')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              {t('home.mvp3')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              {t('home.mvp4')}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const existing = getAuthToken();
        if (existing) {
          if (!cancelled) setAuthReady(true);
          return;
        }

        const enableDemoAutoLogin = import.meta.env.VITE_AUTO_LOGIN_DEMO === '1';
        if (enableDemoAutoLogin) {
          // Local MVP convenience: auto-login with seeded demo user.
          const phone = import.meta.env.VITE_DEMO_PHONE || '13800138000';
          const password = import.meta.env.VITE_DEMO_PASSWORD || 'demo123456';
          const { token, user } = await usersApi.login({ phone, password });
          setAuthToken(token);
          setCurrentUser(user);
        }
      } catch (e) {
        setAuthError(e instanceof Error ? e.message : 'Auth failed');
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  function RequireAuth({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const token = getAuthToken();
    if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    return <>{children}</>;
  }

  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        {!authReady ? (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm">Loading…</p>
            </div>
          </div>
        ) : (
          <>
            {authError && (
              <div className="bg-amber-50 text-amber-700 text-xs px-3 py-2 border-b border-amber-100">
                {authError}
              </div>
            )}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
              <Route path="/orders" element={<RequireAuth><OrderListPage /></RequireAuth>} />
              <Route path="/orders/create" element={<RequireAuth><OrderCreatePage /></RequireAuth>} />
              <Route path="/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
              <Route path="/marts/create" element={<RequireAuth><MartCreate /></RequireAuth>} />
              <Route path="/messages" element={<RequireAuth><MessageCenterPage /></RequireAuth>} />
            </Routes>
          </>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
