import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { MaskedLine, Reveal } from '@/components/Reveal';
import { AuthModal } from '@/components/AuthModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const inputCls = 'w-full border border-line bg-white px-4 py-3.5 text-sm outline-none transition-colors duration-300 focus:border-ink';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (pw !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pw }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(typeof err.detail === 'string' ? err.detail : 'Could not reset password');
      } else {
        setDone(true);
      }
    } catch {
      setError('Network error — please try again');
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-[104px]" data-testid="reset-password-page">
      <div className="w-full max-w-md">
        {done ? (
          <Reveal className="text-center" data-testid="reset-success">
            <span className="mx-auto flex h-16 w-16 items-center justify-center border border-ink">
              <Check size={26} strokeWidth={1.5} />
            </span>
            <h1 className="mt-8 font-display text-4xl font-medium tracking-tight md:text-5xl">Password <span className="italic font-normal">updated</span></h1>
            <p className="mt-4 text-sm text-neutral-500">Your new password is set. Sign in to continue shopping.</p>
            <button data-testid="reset-signin-button" onClick={() => setAuthOpen(true)}
              className="mt-8 bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
              Sign In
            </button>
            <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
          </Reveal>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">EasyBuy Account</p>
            <h1 className="mt-2 font-display text-4xl font-medium tracking-tight md:text-5xl">
              <MaskedLine>Choose a new <span className="italic font-normal">password</span></MaskedLine>
            </h1>
            {!token && <p data-testid="reset-error" className="mt-6 border border-line bg-paper p-5 text-sm text-red-800">This reset link is missing its token — please request a new one.</p>}
            <form onSubmit={submit} className="mt-8 space-y-4">
              <input data-testid="reset-password-input" required type="password" minLength={6} placeholder="New password (6+ characters)"
                value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} />
              <input data-testid="reset-confirm-input" required type="password" minLength={6} placeholder="Confirm new password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
              {error && <p data-testid="reset-error" className="text-xs font-semibold text-red-800">{error}</p>}
              <button data-testid="reset-submit-button" type="submit" disabled={busy || !token}
                className="w-full bg-ink py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800 disabled:opacity-60">
                {busy ? 'Updating…' : 'Update Password'}
              </button>
            </form>
            <Link to="/" data-testid="reset-home-link" className="mt-6 block text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 transition-colors duration-300 hover:text-ink">
              Back to EasyBuy
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
