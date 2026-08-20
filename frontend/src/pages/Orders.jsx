import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';
import { price } from '@/data/products';
import { MaskedLine, Reveal } from '@/components/Reveal';
import { AuthModal } from '@/components/AuthModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatusChip = ({ status }) => (
  <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${status === 'paid' ? 'bg-ink text-white' : 'border border-line text-neutral-500'}`}>
    {status === 'paid' ? 'Paid' : 'Awaiting Payment'}
  </span>
);

export default function Orders() {
  const { user, apiFetch } = useStore();
  const [orders, setOrders] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiFetch('/orders/mine')
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [user, apiFetch]);

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-[104px]">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 pt-[104px] text-center" data-testid="orders-signin-prompt">
        <p className="font-display text-4xl italic text-neutral-400 md:text-5xl">Sign in to see your orders.</p>
        <button data-testid="orders-signin-button" onClick={() => setAuthOpen(true)}
          className="bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
          Sign In
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[104px]" data-testid="orders-page">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1200px] px-4 pb-10 pt-14 md:px-8 md:pt-20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400">{user.email}</p>
          <h1 className="mt-3 font-display text-6xl font-medium uppercase tracking-tight md:text-8xl">
            <MaskedLine>My <span className="italic font-normal normal-case">orders</span></MaskedLine>
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-14 md:px-8">
        {orders === null ? (
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Loading your orders…</p>
        ) : orders.length === 0 ? (
          <div data-testid="orders-empty" className="flex flex-col items-center py-16 text-center">
            <p className="font-display text-4xl italic text-neutral-400">No orders yet — your future favorites await.</p>
            <Link to="/shop/all" data-testid="orders-shop-button"
              className="mt-10 bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((o, i) => (
              <Reveal key={o.order_number} delay={i * 0.05}>
                <div data-testid={`order-card-${o.order_number}`} className="border border-line">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-6 py-4">
                    <div>
                      <p className="text-sm font-bold tracking-widest">{o.order_number}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusChip status={o.status} />
                      <p className="text-sm font-bold">{price(o.total)}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-line">
                    {o.items.map((it) => (
                      <div key={`${o.order_number}-${it.product_id}-${it.size}`} className="flex items-center gap-4 px-6 py-4">
                        <div className="h-16 w-12 shrink-0 overflow-hidden bg-paper">
                          <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{it.name}</p>
                          <p className="text-xs text-neutral-400">Size {it.size} — Qty {it.qty}</p>
                        </div>
                        <p className="text-sm font-semibold">{price(it.price * it.qty)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
