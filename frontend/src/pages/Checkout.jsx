import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { findProduct, price } from '@/data/products';
import { Reveal, MaskedLine } from '@/components/Reveal';

const inputCls = 'w-full border border-line bg-white px-4 py-3.5 text-sm outline-none transition-colors duration-300 focus:border-ink';

export default function Checkout() {
  const { cart, subtotal, clearCart } = useStore();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState(null);
  const [form, setForm] = useState({ email: '', first: '', last: '', address: '', city: '', zip: '', country: 'United States' });

  const shipping = subtotal >= 150 || subtotal === 0 ? 0 : 9;
  const total = subtotal + shipping;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setOrderId(`EB-${Math.floor(100000 + Math.random() * 900000)}`);
    clearCart();
  };

  if (orderId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 pt-[104px] text-center" data-testid="order-success">
        <Reveal>
          <span className="mx-auto flex h-16 w-16 items-center justify-center border border-ink">
            <Check size={26} strokeWidth={1.5} />
          </span>
          <h1 className="mt-8 font-display text-5xl font-medium tracking-tight md:text-7xl">Order <span className="italic font-normal">confirmed</span></h1>
          <p className="mt-6 text-sm text-neutral-500">Thank you — your order <span data-testid="order-number" className="font-semibold text-ink">{orderId}</span> is being prepared.</p>
          <p className="mt-2 text-xs text-neutral-400">A confirmation has been sent to {form.email} (demo).</p>
          <Link to="/" data-testid="order-success-home-button"
            className="mt-10 inline-block bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
            Back to EasyBuy
          </Link>
        </Reveal>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 pt-[104px] text-center" data-testid="checkout-empty">
        <p className="font-display text-4xl italic text-neutral-400">Nothing to check out yet.</p>
        <Link to="/shop/all" className="bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
          Shop New Arrivals
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-[104px]" data-testid="checkout-page">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1800px] px-4 pb-10 pt-14 md:px-8 md:pt-20 lg:px-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400">Secure Checkout</p>
          <h1 className="mt-3 font-display text-6xl font-medium uppercase tracking-tight md:text-8xl">
            <MaskedLine>Check<span className="italic font-normal">out</span></MaskedLine>
          </h1>
        </div>
      </section>

      <form onSubmit={submit} data-testid="checkout-form" className="mx-auto grid max-w-[1800px] grid-cols-1 gap-12 px-4 py-14 md:px-8 lg:grid-cols-12 lg:px-12">
        <div className="space-y-10 lg:col-span-7">
          <Reveal>
            <h2 className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.3em]"><span className="font-display text-xl italic text-neutral-300">01</span> Contact</h2>
            <div className="mt-5">
              <input data-testid="checkout-email" type="email" required placeholder="Email address" value={form.email} onChange={set('email')} className={inputCls} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.3em]"><span className="font-display text-xl italic text-neutral-300">02</span> Shipping Address</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input data-testid="checkout-first-name" required placeholder="First name" value={form.first} onChange={set('first')} className={inputCls} />
              <input data-testid="checkout-last-name" required placeholder="Last name" value={form.last} onChange={set('last')} className={inputCls} />
              <input data-testid="checkout-address" required placeholder="Street address" value={form.address} onChange={set('address')} className={`${inputCls} sm:col-span-2`} />
              <input data-testid="checkout-city" required placeholder="City" value={form.city} onChange={set('city')} className={inputCls} />
              <input data-testid="checkout-zip" required placeholder="ZIP / Postal code" value={form.zip} onChange={set('zip')} className={inputCls} />
              <select data-testid="checkout-country" value={form.country} onChange={set('country')} className={`${inputCls} sm:col-span-2`}>
                {['United States', 'United Kingdom', 'India', 'Canada', 'Australia', 'Germany', 'France', 'UAE'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.3em]"><span className="font-display text-xl italic text-neutral-300">03</span> Payment</h2>
            <div className="mt-5 border border-dashed border-line p-6 text-sm text-neutral-400" data-testid="payment-placeholder">
              <p className="flex items-center gap-2"><Lock size={14} strokeWidth={1.5} /> Payment integration arrives with the backend — this demo completes the order without charge.</p>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal className="border border-line p-8 lg:sticky lg:top-32">
            <h2 className="text-xs font-semibold uppercase tracking-[0.3em]">Your Order</h2>
            <div className="mt-6 space-y-4">
              {cart.map((it) => {
                const p = findProduct(it.id);
                if (!p) return null;
                return (
                  <div key={`${it.id}-${it.size}`} className="flex items-center gap-4" data-testid={`checkout-item-${it.id}-${it.size}`}>
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-paper">
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      <span className="absolute right-0 top-0 bg-ink px-1.5 py-0.5 text-[9px] font-bold text-white">{it.qty}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-neutral-400">Size {it.size}</p>
                    </div>
                    <p className="text-sm font-semibold">{price(p.price * it.qty)}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-semibold">{price(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span className="font-semibold">{shipping === 0 ? 'Free' : price(shipping)}</span></div>
              <div className="flex justify-between border-t border-line pt-4 text-base"><span>Total</span><span data-testid="checkout-total" className="font-bold">{price(total)}</span></div>
            </div>
            <button type="submit" data-testid="place-order-button"
              className="mt-8 w-full bg-ink py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
              Place Order — {price(total)}
            </button>
          </Reveal>
        </div>
      </form>
    </div>
  );
}
