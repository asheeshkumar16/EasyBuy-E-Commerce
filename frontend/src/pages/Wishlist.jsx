import { Link } from 'react-router-dom';
import { useStore } from '@/context/StoreContext';
import { ProductCard } from '@/components/ProductCard';
import { MaskedLine } from '@/components/Reveal';

export default function Wishlist() {
  const { wishlist, products } = useStore();
  const items = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="pt-[104px]" data-testid="wishlist-page">
      <section className="border-b border-line">
        <div className="mx-auto max-w-[1800px] px-4 pb-10 pt-14 md:px-8 md:pt-20 lg:px-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400">Saved For Later</p>
          <h1 className="mt-3 font-display text-6xl font-medium uppercase tracking-tight md:text-8xl">
            <MaskedLine>Wish<span className="italic font-normal">list</span></MaskedLine>
          </h1>
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-neutral-400">{items.length} saved piece{items.length === 1 ? '' : 's'}</p>
        </div>
      </section>

      {items.length === 0 ? (
        <section data-testid="empty-wishlist" className="mx-auto flex max-w-[1800px] flex-col items-center px-4 py-28 text-center md:px-8 lg:px-12">
          <p className="font-display text-4xl italic text-neutral-400 md:text-5xl">Nothing saved yet — tap the heart on pieces you love.</p>
          <Link to="/shop/all" data-testid="empty-wishlist-shop-button"
            className="mt-10 bg-ink px-10 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-neutral-800">
            Discover Pieces
          </Link>
        </section>
      ) : (
        <section className="mx-auto max-w-[1800px] px-4 py-14 md:px-8 md:py-20 lg:px-12">
          <div className="grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-4">
            {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
