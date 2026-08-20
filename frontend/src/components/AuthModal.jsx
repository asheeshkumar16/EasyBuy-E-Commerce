import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/context/StoreContext';

export const AuthModal = ({ open, onClose }) => {
  const { login, register, apiFetch } = useStore();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = tab === 'login'
      ? await login(form.email, form.password)
      : await register(form.name, form.email, form.password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.success(tab === 'login' ? `Welcome back, ${res.user.name}` : `Welcome to EasyBuy, ${res.user.name}`);
    onClose();
    setForm({ name: '', email: '', password: '' });
  };

  const submitForgot = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: form.email }) });
      setForgotSent(true);
    } catch {
      setError('Network error — please try again');
    }
    setBusy(false);
  };

  const switchTab = (t) => { setTab(t); setError(''); setForgotSent(false); };

  const inputCls = 'w-full border border-line bg-white px-4 py-3 text-sm outline-none transition-colors duration-300 focus:border-ink';

  return (
    <AnimatePresence>
      {open && (
        <motion.div data-testid="auth-modal" className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div className="relative w-full max-w-md bg-white p-8 md:p-10"
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <button data-testid="auth-close-button" onClick={onClose} aria-label="Close" className="absolute right-6 top-6 transition-transform duration-300 hover:rotate-90">
              <X size={20} strokeWidth={1.5} />
            </button>

            {tab === 'forgot' ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">Password Reset</p>
                <h2 className="mt-2 font-display text-4xl italic">Forgot your <span className="not-italic font-medium">password?</span></h2>
                {forgotSent ? (
                  <div className="mt-8" data-testid="forgot-success">
                    <p className="border border-line bg-paper p-5 text-sm leading-relaxed text-neutral-600">
                      If an account exists for <span className="font-semibold text-ink">{form.email}</span>, a reset link is on its way. It expires in one hour.
                    </p>
                    <button data-testid="back-to-login-link" onClick={() => switchTab('login')}
                      className="mt-6 w-full bg-ink py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={submitForgot} className="mt-8 space-y-4">
                    <p className="text-sm text-neutral-500">Enter your account email and we'll send you a secure reset link.</p>
                    <input data-testid="forgot-email-input" required type="email" placeholder="Email address" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
                    {error && <p data-testid="auth-error" className="text-xs font-semibold text-red-800">{error}</p>}
                    <button data-testid="forgot-submit-button" type="submit" disabled={busy}
                      className="w-full bg-ink py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800 disabled:opacity-60">
                      {busy ? 'Sending…' : 'Send Reset Link'}
                    </button>
                    <button type="button" data-testid="back-to-login-link" onClick={() => switchTab('login')}
                      className="w-full text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 transition-colors duration-300 hover:text-ink">
                      Back to Sign In
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">EasyBuy Account</p>
                <h2 className="mt-2 font-display text-4xl italic">{tab === 'login' ? 'Welcome back' : 'Join EasyBuy'}</h2>
                <div className="mt-8 grid grid-cols-2 border border-line">
                  {['login', 'signup'].map((t) => (
                    <button key={t} data-testid={`auth-tab-${t}`} onClick={() => switchTab(t)}
                      className={`py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${tab === t ? 'bg-ink text-white' : 'bg-white text-neutral-500 hover:text-ink'}`}>
                      {t === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>
                <form onSubmit={submit} className="mt-6 space-y-4">
                  {tab === 'signup' && (
                    <input data-testid="auth-name-input" required placeholder="Full name" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                  )}
                  <input data-testid="auth-email-input" required type="email" placeholder="Email address" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
                  <input data-testid="auth-password-input" required type="password" minLength={6} placeholder="Password (6+ characters)" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
                  {tab === 'login' && (
                    <button type="button" data-testid="forgot-password-link" onClick={() => switchTab('forgot')}
                      className="text-xs font-semibold text-neutral-400 underline underline-offset-4 transition-colors duration-300 hover:text-ink">
                      Forgot your password?
                    </button>
                  )}
                  {error && <p data-testid="auth-error" className="text-xs font-semibold text-red-800">{error}</p>}
                  <button data-testid="auth-submit-button" type="submit" disabled={busy}
                    className="w-full bg-ink py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800 disabled:opacity-60">
                    {busy ? 'One moment…' : tab === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>
                <p className="mt-6 text-center text-xs text-neutral-400">Your bag and wishlist follow your account across devices.</p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
