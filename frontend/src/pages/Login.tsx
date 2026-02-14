import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';
import { setAuthToken, setCurrentUser, usersApi } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const from = (location.state as { from?: string } | null)?.from || '/';

  const [phone, setPhone] = useState(import.meta.env.VITE_DEMO_PHONE || '13800138000');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    try {
      setError(null);
      setSubmitting(true);
      const resp = await usersApi.login({ phone, password });
      setAuthToken(resp.token);
      setCurrentUser(resp.user);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.operationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 border-b bg-white">
        <div className="grid grid-cols-3 items-center p-4">
          <div />
          <h1 className="text-lg font-medium text-center">{t('auth.login.title')}</h1>
          <div className="flex justify-end">
            <LanguageToggle />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="card p-4">
          <label className="block text-sm text-slate-600 mb-1">{t('auth.login.phone')}</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="13800138000"
            inputMode="numeric"
            className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

          <label className="block text-sm text-slate-600 mb-1 mt-3">{t('auth.login.password')}</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
          />

          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full mt-4 py-3.5 bg-gradient-primary text-white rounded-xl font-semibold min-h-[48px] btn shadow-lg shadow-emerald-200 disabled:opacity-50"
          >
            {submitting ? t('auth.login.loggingIn') : t('auth.login.submit')}
          </button>

          <p className="text-xs text-slate-500 mt-3">
            {t('auth.login.tip')}
          </p>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/register" className="text-emerald-700 font-medium">
              {t('auth.login.toRegister')}
            </Link>
            <button
              type="button"
              className="text-slate-500"
              onClick={() => {
                // quick fill for local demo
                setPassword(import.meta.env.VITE_DEMO_PASSWORD || 'demo123456');
              }}
            >
              {t('auth.login.fillDemo')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
