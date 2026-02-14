import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/LanguageToggle';
import { setAuthToken, setCurrentUser, usersApi } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    try {
      setError(null);

      if (!phone.trim()) {
        setError(t('auth.register.errors.phoneRequired'));
        return;
      }
      if (password.length < 6) {
        setError(t('auth.register.errors.passwordTooShort'));
        return;
      }
      if (password !== password2) {
        setError(t('auth.register.errors.passwordMismatch'));
        return;
      }

      setSubmitting(true);
      const resp = await usersApi.register({
        phone: phone.trim(),
        password,
        nickname: nickname.trim() || undefined,
      });
      setAuthToken(resp.token);
      setCurrentUser(resp.user);
      navigate('/', { replace: true });
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
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-slate-600"
          >
            {t('common.back')}
          </button>
          <h1 className="text-lg font-medium text-center">{t('auth.register.title')}</h1>
          <div className="flex justify-end">
            <LanguageToggle />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="card p-4">
          <label className="block text-sm text-slate-600 mb-1">{t('auth.register.phone')}</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="13800138000"
            inputMode="numeric"
            className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

          <label className="block text-sm text-slate-600 mb-1 mt-3">{t('auth.register.nickname')}</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t('auth.register.nicknamePlaceholder')}
            className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

          <label className="block text-sm text-slate-600 mb-1 mt-3">{t('auth.register.password')}</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
            className="w-full p-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

          <label className="block text-sm text-slate-600 mb-1 mt-3">{t('auth.register.password2')}</label>
          <input
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
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
            {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
          </button>

          <p className="text-xs text-slate-500 mt-3">
            {t('auth.register.tip')}
          </p>
        </div>
      </div>
    </div>
  );
}

