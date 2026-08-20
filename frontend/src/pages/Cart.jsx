import { Link } from 'react-router-dom';
import { Minus, Plus, X, ArrowRight } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { price } from '@/data/products';
import { Reveal, MaskedLine } from '@/components/Reveal';

export default function Cart() {
  const { cartItems, updateQty, removeFromCart, subtotal, shipping, total } = useStore();

  return (
    <div className="pt-[104px]" data-testid="cart-page">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1800px] px-4 pb-10 pt-14 md:px-8 md:pt-20 lg:px-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400">EasyBuy — Your Selection</p>
          <h1 className="mt-3 font-display text-6xl font-medium uppercase tracking-tight md:text-8xl">
            <MaskedLine>Shopping <span className="italic font-normal normal-case">bag</span></MaskedLine>
          </h1>
        </div>
      </section>

      {cartItems.length === 0 ? (
        <section data-testid="empty-cart" className="mx-auto flex max-w-[1800px] flex-col items-center px-4 py-28 text-center md:px-8 lg:px-12">
          <p className="font-display text-4xl italic text-neutral-400 md:text-5xl">Your bag is beautifully empty.</p>
          <Link to="/shop/all" data-testid="empty-cart-shop-button"
            className="mt-10 bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
            Start Shopping
          </Link>
        </section>
      ) : (
        <section className="mx-auto grid max-w-[1800px] grid-cols-1 gap-12 px-4 py-14 md:px-8 lg:grid-cols-12 lg:px-12">
          <div className="lg:col-span-8">
            {cartItems.map((it, i) => {
              const p = it.product;
              const key = `${it.product_id}-${it.size}`;
              return (
                <Reveal key={key} delay={i * 0.05}>
                  <div data-testid={`cart-item-${key}`} className="flex gap-6 border-b border-line py-6">
                    <Link to={`/product/${it.product_id}`} className="h-36 w-28 shrink-0 overflow-hidden bg-paper">
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 ease-editorial hover:scale-105" />
                    </Link>
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link to={`/product/${it.product_id}`} className="text-sm font-medium hover:text-neutral-500">{p.name}</Link>
                          <p className="mt-1 text-xs text-neutral-400">Size {it.size} — {p.colors[0]}</p>
                        </div>
                        <button data-testid={`remove-item-${key}`} onClick={() => removeFromCart(it.product_id, it.size)} aria-label="Remove item"
                          className="text-neutral-400 transition-colors duration-300 hover:text-ink">
                          <X size={18} strokeWidth={1.5} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-line">
                          <button data-testid={`qty-decrease-${key}`} onClick={() => updateQty(it.product_id, it.size, -1)} className="px-3 py-2 hover:bg-paper" aria-label="Decrease">
                            <Minus size={13} strokeWidth={1.5} />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{it.qty}</span>
                          <button data-testid={`qty-increase-${key}`} onClick={() => updateQty(it.product_id, it.size, 1)} className="px-3 py-2 hover:bg-paper" aria-label="Increase">
                            <Plus size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                        <p className="text-sm font-semibold">{price(p.price * it.qty)}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <div className="lg:col-span-4">
            <Reveal className="border border-line p-8 lg:sticky lg:top-32">
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em]">Order Summary</h2>
              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span data-testid="cart-subtotal" className="font-semibold">{price(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span className="font-semibold">{shipping === 0 ? 'Free' : price(shipping)}</span></div>
                <div className="flex justify-between border-t border-line pt-4 text-base"><span>Total</span><span data-testid="cart-total" className="font-bold">{price(total)}</span></div>
              </div>
              {shipping > 0 && <p className="mt-4 text-xs text-neutral-400">Add {price(150 - subtotal)} more for free shipping.</p>}
              <Link to="/checkout" data-testid="checkout-button"
                className="group mt-8 flex w-full items-center justify-center gap-3 bg-ink py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
                Checkout <ArrowRight size={15} strokeWidth={1.5} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link to="/shop/all" data-testid="continue-shopping-link" className="mt-4 block text-center text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400 transition-colors duration-300 hover:text-ink">
                Continue Shopping
              </Link>
            </Reveal>
          </div>
        </section>
      )}
    </div>
  );
}
