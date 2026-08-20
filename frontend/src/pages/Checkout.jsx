import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/context/StoreContext';
import { price } from '@/data/products';
import { Reveal, MaskedLine } from '@/components/Reveal';

const inputCls = 'w-full border border-line bg-white px-4 py-3.5 text-sm outline-none transition-colors duration-300 focus:border-ink';

export default function Checkout() {
  const { cartItems, subtotal, shipping, total, placeOrder, startPayment } = useStore();
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({ email: '', first: '', last: '', address: '', city: '', zip: '', country: 'United States' });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const placed = await placeOrder({
        email: form.email,
        first_name: form.first,
        last_name: form.last,
        address: form.address,
        city: form.city,
        zip: form.zip,
        country: form.country,
      });
      const payment = await startPayment(placed.order_number);
      window.location.href = payment.checkout_url;
    } catch (err) {
      toast.error(err.message || 'Could not start payment');
      setPlacing(false);
    }
  };

  if (cartItems.length === 0) {
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
            <div className="mt-5 flex items-center gap-3 border border-line bg-paper p-6 text-sm text-neutral-500" data-testid="payment-placeholder">
              <Lock size={14} strokeWidth={1.5} />
              <p>You will be redirected to Stripe's secure checkout to pay by card. Your order is saved before you pay.</p>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal className="border border-line p-8 lg:sticky lg:top-32">
            <h2 className="text-xs font-semibold uppercase tracking-[0.3em]">Your Order</h2>
            <div className="mt-6 space-y-4">
              {cartItems.map((it) => (
                <div key={`${it.product_id}-${it.size}`} className="flex items-center gap-4" data-testid={`checkout-item-${it.product_id}-${it.size}`}>
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-paper">
                    <img src={it.product.image} alt={it.product.name} className="h-full w-full object-cover" />
                    <span className="absolute right-0 top-0 bg-ink px-1.5 py-0.5 text-[9px] font-bold text-white">{it.qty}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{it.product.name}</p>
                    <p className="text-xs text-neutral-400">Size {it.size}</p>
                  </div>
                  <p className="text-sm font-semibold">{price(it.product.price * it.qty)}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-semibold">{price(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span className="font-semibold">{shipping === 0 ? 'Free' : price(shipping)}</span></div>
              <div className="flex justify-between border-t border-line pt-4 text-base"><span>Total</span><span data-testid="checkout-total" className="font-bold">{price(total)}</span></div>
            </div>
            <button type="submit" data-testid="place-order-button" disabled={placing}
              className="mt-8 w-full bg-ink py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800 disabled:opacity-60">
              {placing ? 'Redirecting to Payment…' : `Pay Securely — ${price(total)}`}
            </button>
          </Reveal>
        </div>
      </form>
    </div>
  );
}
