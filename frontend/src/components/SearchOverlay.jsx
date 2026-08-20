import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { price } from '@/data/products';
import { useStore } from '@/context/StoreContext';

export const SearchOverlay = ({ open, onClose }) => {
  const { products } = useStore();
  const [q, setQ] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => { if (!open) setQ(''); }, [open]);

  const results = q.trim()
    ? products.filter((p) => `${p.name} ${p.category} ${p.gender}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : products.filter((p) => p.tags.includes('trending')).slice(0, 4);

  return (
    <AnimatePresence>
      {open && (
        <motion.div data-testid="search-overlay" className="fixed inset-0 z-[80] bg-white"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
          <div className="mx-auto max-w-[1200px] px-4 md:px-8">
            <div className="flex items-center gap-6 border-b border-ink py-8">
              <input
                data-testid="search-input"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search coats, knitwear, tailoring…"
                className="w-full bg-transparent font-display text-3xl italic outline-none placeholder:text-neutral-300 md:text-5xl"
              />
              <button data-testid="search-close-button" onClick={onClose} aria-label="Close search" className="shrink-0 transition-transform duration-300 hover:rotate-90">
                <X size={26} strokeWidth={1.5} />
              </button>
            </div>
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
              {q.trim() ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Trending now'}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {results.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/product/${p.id}`} onClick={onClose} data-testid={`search-result-${p.id}`}
                    className="group flex items-center gap-4 p-3 transition-colors duration-300 hover:bg-paper">
                    <div className="h-20 w-16 shrink-0 overflow-hidden bg-paper">
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-105" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-neutral-500">{p.category} — {p.gender === 'women' ? 'Women' : 'Men'}</p>
                    </div>
                    <span className="text-sm font-semibold">{price(p.price)}</span>
                    <ArrowRight size={16} strokeWidth={1.5} className="-translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
