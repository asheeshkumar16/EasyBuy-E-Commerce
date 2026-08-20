import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export const AuthModal = ({ open, onClose }) => {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const submit = (e) => {
    e.preventDefault();
    toast.success(tab === 'login' ? 'Signed in — welcome back to EasyBuy (demo)' : 'Account created — welcome to EasyBuy (demo)');
    onClose();
    setForm({ name: '', email: '', password: '' });
  };

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
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">EasyBuy Account</p>
            <h2 className="mt-2 font-display text-4xl italic">{tab === 'login' ? 'Welcome back' : 'Join EasyBuy'}</h2>
            <div className="mt-8 grid grid-cols-2 border border-line">
              {['login', 'signup'].map((t) => (
                <button key={t} data-testid={`auth-tab-${t}`} onClick={() => setTab(t)}
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
              <input data-testid="auth-password-input" required type="password" minLength={6} placeholder="Password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
              <button data-testid="auth-submit-button" type="submit"
                className="w-full bg-ink py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
            <p className="mt-6 text-center text-xs text-neutral-400">Demo interface — accounts connect to the backend later.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
