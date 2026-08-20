import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Plus } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { price } from '@/data/products';

export const ProductCard = ({ product: p, index = 0 }) => {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [sizesOpen, setSizesOpen] = useState(false);
  const saved = wishlist.includes(p.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="group relative" data-testid={`product-card-${p.id}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-paper">
          <Link to={`/product/${p.id}`} data-testid={`product-link-${p.id}`} className="block h-full w-full">
            <img src={p.image} alt={p.name} loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-editorial group-hover:scale-[1.06]" />
          </Link>
          {p.tags.includes('new') && (
            <span className="absolute left-3 top-3 bg-ink px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white">New</span>
          )}
          {p.compareAt && (
            <span className="absolute left-3 top-10 bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink">-{Math.round((1 - p.price / p.compareAt) * 100)}%</span>
          )}
          <button
            data-testid={`wishlist-toggle-${p.id}`}
            aria-label="Toggle wishlist"
            onClick={() => toggleWishlist(p.id)}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center bg-white/90 backdrop-blur transition-all duration-300 hover:scale-110 ${saved ? 'text-ink' : 'text-neutral-400'}`}>
            <Heart size={16} strokeWidth={1.5} fill={saved ? '#0A0A0A' : 'none'} />
          </button>
          <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-500 ease-editorial group-hover:translate-y-0">
            {sizesOpen ? (
              <div className="flex items-stretch bg-ink/95 backdrop-blur" data-testid={`quick-add-sizes-${p.id}`}>
                {p.sizes.map((s) => (
                  <button key={s} data-testid={`quick-add-${p.id}-${s}`}
                    onClick={() => { addToCart(p.id, s); setSizesOpen(false); }}
                    className="flex-1 py-3 text-[10px] font-semibold uppercase tracking-widest text-white transition-colors duration-200 hover:bg-white hover:text-ink">
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <button data-testid={`quick-add-${p.id}`} onClick={() => setSizesOpen(true)}
                className="flex w-full items-center justify-center gap-2 bg-ink/95 py-3.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-white backdrop-blur transition-colors duration-300 hover:bg-ink">
                <Plus size={14} strokeWidth={1.5} /> Quick Add
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <Link to={`/product/${p.id}`} className="text-sm font-medium leading-snug transition-colors duration-300 hover:text-neutral-500">
              {p.name}
            </Link>
            <p className="mt-0.5 text-xs text-neutral-400">{p.category}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{price(p.price)}</p>
            {p.compareAt && <p className="text-xs text-neutral-400 line-through">{price(p.compareAt)}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
