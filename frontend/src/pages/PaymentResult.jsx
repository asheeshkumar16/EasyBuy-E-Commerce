import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { price } from '@/data/products';
import { Reveal } from '@/components/Reveal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [state, setState] = useState('polling');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!sessionId) { setState('timeout'); return; }
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const res = await fetch(`${API}/payments/status/${sessionId}`, { credentials: 'include' });
        const data = await res.json();
        if (data.payment_status === 'paid') {
          clearInterval(timer);
          const ores = await fetch(`${API}/orders/by-session/${sessionId}`, { credentials: 'include' });
          if (ores.ok) setOrder(await ores.json());
          setState('paid');
        } else if (attempts >= 20) {
          clearInterval(timer);
          setState('timeout');
        }
      } catch { /* keep polling */ }
    }, 2000);
    return () => clearInterval(timer);
  }, [sessionId]);

  if (state === 'polling') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 pt-[104px] text-center" data-testid="payment-polling">
        <div className="h-10 w-10 animate-spin border-2 border-line border-t-ink" />
        <p className="font-display text-3xl italic text-neutral-500">Confirming your payment…</p>
      </div>
    );
  }

  if (state === 'timeout') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 pt-[104px] text-center" data-testid="payment-timeout">
        <p className="font-display text-4xl italic text-neutral-400">We're still confirming your payment.</p>
        <p className="max-w-md text-sm text-neutral-500">If your card was charged, your order will appear under My Orders within a few minutes.</p>
        <Link to="/orders" data-testid="payment-timeout-orders-link" className="bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
          Check My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-[104px] text-center" data-testid="payment-success-page">
      <Reveal>
        <span className="mx-auto flex h-16 w-16 items-center justify-center border border-ink">
          <Check size={26} strokeWidth={1.5} />
        </span>
        <h1 className="mt-8 font-display text-5xl font-medium tracking-tight md:text-7xl">Order <span className="italic font-normal">confirmed</span></h1>
        {order && (
          <>
            <p className="mt-6 text-sm text-neutral-500">Thank you — your order <span data-testid="paid-order-number" className="font-semibold text-ink">{order.order_number}</span> is paid and being prepared.</p>
            <p className="mt-2 text-xs text-neutral-400">Total {price(order.total)} — a confirmation email is on its way to {order.customer.email}.</p>
          </>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/orders" data-testid="payment-success-orders-link" className="bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
            View My Orders
          </Link>
          <Link to="/" data-testid="order-success-home-button" className="border border-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] transition-colors duration-300 hover:bg-ink hover:text-white">
            Back to EasyBuy
          </Link>
        </div>
      </Reveal>
    </div>
  );
};

export const PaymentCancel = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 pt-[104px] text-center" data-testid="payment-cancel-page">
    <p className="font-display text-4xl italic text-neutral-400 md:text-5xl">Payment cancelled — your bag is untouched.</p>
    <p className="max-w-md text-sm text-neutral-500">Nothing was charged. Your items are still waiting in your bag whenever you're ready.</p>
    <Link to="/checkout" data-testid="back-to-checkout-button" className="mt-4 bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
      Return to Checkout
    </Link>
  </div>
);
