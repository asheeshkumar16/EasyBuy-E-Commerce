import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useStore } from '@/context/StoreContext';
import { price } from '@/data/products';
import { MaskedLine, Reveal } from '@/components/Reveal';

const STATUS_LABELS = { awaiting_payment: 'Awaiting Payment', paid: 'Paid', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };

const nextAction = (status) => {
  if (status === 'paid') return { label: 'Mark Shipped', to: 'shipped', testid: 'mark-shipped' };
  if (status === 'shipped') return { label: 'Mark Delivered', to: 'delivered', testid: 'mark-delivered' };
  return null;
};

export default function Admin() {
  const { user, apiFetch } = useStore();
  const [orders, setOrders] = useState(null);

  const load = () => {
    apiFetch('/admin/orders')
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]));
  };

  useEffect(() => {
    if (user && user.role === 'admin') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const setStatus = async (orderNumber, status) => {
    const res = await apiFetch(`/orders/${orderNumber}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (res.ok) {
      toast.success(`${orderNumber} → ${STATUS_LABELS[status]}`);
      load();
    } else {
      toast.error('Could not update order');
    }
  };

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-[104px]">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 pt-[104px] text-center" data-testid="admin-unauthorized">
        <p className="font-display text-4xl italic text-neutral-400">Admins only beyond this point.</p>
        <Link to="/" className="bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
          Back to EasyBuy
        </Link>
      </div>
    );
  }

  const counts = (orders || []).reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] || 0) + 1 }), {});

  return (
    <div className="min-h-screen pt-[104px]" data-testid="admin-page">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-14 md:px-8 md:pt-20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400">EasyBuy Studio — Admin</p>
          <h1 className="mt-3 font-display text-6xl font-medium uppercase tracking-tight md:text-8xl">
            <MaskedLine>Order <span className="italic font-normal normal-case">desk</span></MaskedLine>
          </h1>
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-neutral-400" data-testid="admin-stats">
            {orders ? `${orders.length} orders — ${counts.paid || 0} to ship, ${counts.shipped || 0} in transit, ${counts.delivered || 0} delivered` : '…'}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-14 md:px-8" data-testid="admin-orders-table">
        {orders === null ? (
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="font-display text-3xl italic text-neutral-400" data-testid="admin-orders-empty">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((o, i) => {
              const action = nextAction(o.status);
              return (
                <Reveal key={o.order_number} delay={i * 0.03}>
                  <div data-testid={`admin-order-${o.order_number}`} className="flex flex-wrap items-center gap-4 border border-line px-6 py-5">
                    <div className="min-w-[140px]">
                      <p className="text-sm font-bold tracking-widest">{o.order_number}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="min-w-[200px] flex-1">
                      <p className="text-sm">{o.customer.email}</p>
                      <p className="text-xs text-neutral-400">{o.items.reduce((s, it) => s + it.qty, 0)} items — {o.customer.city}, {o.customer.country}</p>
                    </div>
                    <span className={`px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${o.status === 'awaiting_payment' || o.status === 'cancelled' ? 'border border-line text-neutral-500' : 'bg-ink text-white'}`} data-testid={`admin-status-${o.order_number}`}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                    <p className="w-20 text-right text-sm font-bold">{price(o.total)}</p>
                    {action ? (
                      <button data-testid={`${action.testid}-${o.order_number}`} onClick={() => setStatus(o.order_number, action.to)}
                        className="bg-ink px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition-colors duration-300 hover:bg-neutral-800">
                        {action.label}
                      </button>
                    ) : (
                      <span className="w-[150px] text-right text-[10px] uppercase tracking-[0.2em] text-neutral-300">
                        {o.status === 'delivered' ? 'Complete' : o.status === 'awaiting_payment' ? 'Unpaid' : ''}
                      </span>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
