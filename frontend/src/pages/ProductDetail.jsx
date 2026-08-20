import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Minus, Plus, ChevronDown } from 'lucide-react';
import { findProduct, price, PRODUCTS } from '@/data/products';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { MaskedLine, Reveal, SectionHeading } from '@/components/Reveal';

const Accordion = ({ title, children, testid }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-line">
      <button data-testid={testid} onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-xs font-semibold uppercase tracking-[0.25em]">
        {title}
        <ChevronDown size={16} strokeWidth={1.5} className={`transition-transform duration-500 ${open ? 'rotate-180' : ''}`} />
      </button>
      <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
        <div className="pb-6 text-sm leading-relaxed text-neutral-500">{children}</div>
      </motion.div>
    </div>
  );
};

export default function ProductDetail() {
  const { id } = useParams();
  const p = findProduct(id);
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(false);

  useEffect(() => { setSize(null); setQty(1); setError(false); }, [id]);

  if (!p) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 pt-[104px]">
        <p className="font-display text-4xl italic">Piece not found.</p>
        <Link to="/" data-testid="pdp-back-home" className="border border-ink px-8 py-3 text-xs font-semibold uppercase tracking-[0.25em] transition-colors duration-300 hover:bg-ink hover:text-white">Back Home</Link>
      </div>
    );
  }

  const saved = wishlist.includes(p.id);
  const related = PRODUCTS.filter((x) => x.gender === p.gender && x.id !== p.id).slice(0, 4);

  const add = () => {
    if (!size) { setError(true); return; }
    addToCart(p.id, size, qty);
  };

  return (
    <div className="pt-[104px]">
      <section className="mx-auto grid max-w-[1800px] grid-cols-1 gap-8 px-4 py-10 md:grid-cols-2 md:gap-16 md:px-8 md:py-16 lg:px-12" data-testid="product-detail">
        <div>
          <Reveal>
            <div className="relative aspect-[3/4] overflow-hidden bg-paper md:sticky md:top-32">
              <img src={p.image} alt={p.name} className="h-full w-full object-cover" data-testid="pdp-image" />
              {p.tags.includes('new') && (
                <span className="absolute left-4 top-4 bg-ink px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white">New</span>
              )}
            </div>
          </Reveal>
        </div>
        <div className="md:py-6">
          <Reveal>
            <nav className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
              <Link to="/" className="hover:text-ink">Home</Link> /
              <Link to={`/shop/${p.gender}`} className="hover:text-ink">{p.gender === 'women' ? 'Women' : 'Men'}</Link> /
              <span className="text-ink">{p.category}</span>
            </nav>
            <h1 data-testid="pdp-name" className="mt-5 font-display text-4xl font-medium tracking-tight md:text-6xl">
              <MaskedLine>{p.name}</MaskedLine>
            </h1>
            <div className="mt-5 flex items-baseline gap-3">
              <span data-testid="pdp-price" className="text-2xl font-semibold">{price(p.price)}</span>
              {p.compareAt && <span className="text-base text-neutral-400 line-through">{price(p.compareAt)}</span>}
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-neutral-500">{p.description}</p>
          </Reveal>

          <Reveal delay={0.1} className="mt-10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.25em]">Select Size</p>
              {error && !size && <p data-testid="size-error" className="text-xs font-semibold text-red-800">Please choose a size</p>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2" data-testid="size-selector">
              {p.sizes.map((s) => (
                <button key={s} data-testid={`size-option-${s}`} onClick={() => { setSize(s); setError(false); }}
                  className={`min-w-[52px] border px-4 py-3 text-xs font-semibold uppercase tracking-widest transition-all duration-300 ${size === s ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink'}`}>
                  {s}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15} className="mt-8 flex gap-3">
            <div className="flex items-center border border-line">
              <button data-testid="qty-decrease" onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-4 transition-colors duration-200 hover:bg-paper" aria-label="Decrease quantity">
                <Minus size={14} strokeWidth={1.5} />
              </button>
              <span data-testid="qty-value" className="w-10 text-center text-sm font-semibold">{qty}</span>
              <button data-testid="qty-increase" onClick={() => setQty(qty + 1)} className="px-4 py-4 transition-colors duration-200 hover:bg-paper" aria-label="Increase quantity">
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
            <button data-testid="add-to-cart-button" onClick={add}
              className="flex-1 bg-ink py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
              Add to Bag — {price(p.price * qty)}
            </button>
            <button data-testid="pdp-wishlist-button" onClick={() => toggleWishlist(p.id)} aria-label="Toggle wishlist"
              className={`flex w-[52px] items-center justify-center border transition-all duration-300 ${saved ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink'}`}>
              <Heart size={18} strokeWidth={1.5} fill={saved ? '#fff' : 'none'} />
            </button>
          </Reveal>

          <Reveal delay={0.2} className="mt-12 border-b border-line">
            <Accordion title="Details" testid="accordion-details">
              {p.description} Colour: {p.colors.join(', ')}. Designed in the EasyBuy studio.
            </Accordion>
            <Accordion title="Shipping & Returns" testid="accordion-shipping">
              Complimentary shipping on orders over $150. Standard delivery 3–5 business days. Free returns within 30 days, no questions asked.
            </Accordion>
            <Accordion title="Fabric & Care" testid="accordion-fabric">
              Premium natural fibres sourced from audited mills. Machine wash cold or dry clean depending on the garment. Full care guide on the inner label.
            </Accordion>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1800px] border-t border-line px-4 py-16 md:px-8 md:py-24 lg:px-12" data-testid="related-section">
        <SectionHeading eyebrow="Complete the Look" title={<>You may also <span className="italic font-normal">like</span></>} />
        <div className="grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 md:gap-x-8 lg:grid-cols-4">
          {related.map((r, i) => <ProductCard key={r.id} product={r} index={i} />)}
        </div>
      </section>
    </div>
  );
}
