import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PRODUCTS } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';
import { MaskedLine, Reveal } from '@/components/Reveal';

const sorts = [
  { id: 'featured', label: 'Featured' },
  { id: 'new', label: 'Newest' },
  { id: 'low', label: 'Price: Low to High' },
  { id: 'high', label: 'Price: High to Low' },
];

export default function Shop() {
  const { gender = 'all' } = useParams();
  const [cat, setCat] = useState('All');
  const [sort, setSort] = useState('featured');

  const base = useMemo(() => (gender === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.gender === gender)), [gender]);
  const cats = useMemo(() => ['All', ...new Set(base.map((p) => p.category))], [base]);

  const items = useMemo(() => {
    let list = cat === 'All' ? [...base] : base.filter((p) => p.category === cat);
    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    else if (sort === 'high') list.sort((a, b) => b.price - a.price);
    else if (sort === 'new') list.sort((a, b) => Number(b.tags.includes('new')) - Number(a.tags.includes('new')));
    else list.sort((a, b) => Number(b.tags.includes('featured')) - Number(a.tags.includes('featured')));
    return list;
  }, [base, cat, sort]);

  const title = gender === 'women' ? 'Women' : gender === 'men' ? 'Men' : 'New In';

  return (
    <div className="pt-[104px]">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1800px] px-4 pb-10 pt-14 md:px-8 md:pt-20 lg:px-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400">EasyBuy — SS26</p>
          <h1 data-testid="shop-title" className="mt-3 font-display text-6xl font-medium uppercase tracking-tight md:text-8xl">
            <MaskedLine>{title}</MaskedLine>
          </h1>
          <p data-testid="product-count" className="mt-4 text-xs uppercase tracking-[0.25em] text-neutral-400">{items.length} pieces</p>
        </div>
      </section>

      <div className="sticky top-[104px] z-30 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 overflow-x-auto px-4 py-4 md:px-8 lg:px-12">
          <div className="hide-scrollbar flex gap-2 overflow-x-auto">
            {cats.map((c) => (
              <button key={c} data-testid={`filter-chip-${c.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setCat(c)}
                className={`shrink-0 border px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${cat === c ? 'border-ink bg-ink text-white' : 'border-line text-neutral-500 hover:border-ink hover:text-ink'}`}>
                {c}
              </button>
            ))}
          </div>
          <select data-testid="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}
            className="shrink-0 border border-line bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] outline-none transition-colors duration-300 hover:border-ink">
            {sorts.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <section className="mx-auto max-w-[1800px] px-4 py-14 md:px-8 md:py-20 lg:px-12">
        <AnimatePresence mode="wait">
          <motion.div key={`${gender}-${cat}-${sort}`} data-testid="product-grid"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            className="grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-4">
            {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </motion.div>
        </AnimatePresence>
        {items.length === 0 && (
          <Reveal className="py-24 text-center">
            <p className="font-display text-3xl italic text-neutral-400">Nothing here yet — check back soon.</p>
          </Reveal>
        )}
      </section>
    </div>
  );
}
