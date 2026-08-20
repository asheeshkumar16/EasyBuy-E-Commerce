import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, User, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { SearchOverlay } from '@/components/SearchOverlay';
import { AuthModal } from '@/components/AuthModal';

const links = [
  { to: '/shop/women', label: 'Women', testid: 'nav-link-women' },
  { to: '/shop/men', label: 'Men', testid: 'nav-link-men' },
  { to: '/shop/all', label: 'New In', testid: 'nav-link-new' },
];

const CountBadge = ({ n, testid }) =>
  n > 0 ? (
    <span data-testid={testid} className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center bg-ink px-1 text-[9px] font-bold text-white">
      {n}
    </span>
  ) : null;

export const Navbar = () => {
  const { cartCount, wishlist } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50">
        <div className="bg-ink py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-white" data-testid="promo-strip">
          Complimentary shipping on orders over $150
        </div>
        <header className="border-b border-line bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 md:px-8 lg:px-12">
            <div className="flex flex-1 items-center gap-6">
              <button data-testid="nav-mobile-menu-button" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                <Menu size={20} strokeWidth={1.5} />
              </button>
              <nav className="hidden items-center gap-8 lg:flex">
                {links.map((l) => (
                  <NavLink key={l.to} to={l.to} data-testid={l.testid}
                    className={({ isActive }) => `group relative text-xs font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${isActive ? 'text-ink' : 'text-neutral-500 hover:text-ink'}`}>
                    {l.label}
                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-ink transition-all duration-500 ease-editorial group-hover:w-full" />
                  </NavLink>
                ))}
              </nav>
            </div>
            <Link to="/" data-testid="nav-logo" className="text-lg font-extrabold uppercase tracking-[0.45em] md:text-xl">
              EasyBuy
            </Link>
            <div className="flex flex-1 items-center justify-end gap-4 md:gap-6">
              <button data-testid="nav-search-button" onClick={() => setSearchOpen(true)} aria-label="Search" className="transition-transform duration-300 hover:scale-110">
                <Search size={19} strokeWidth={1.5} />
              </button>
              <button data-testid="nav-account-button" onClick={() => setAuthOpen(true)} aria-label="Account" className="hidden transition-transform duration-300 hover:scale-110 sm:block">
                <User size={19} strokeWidth={1.5} />
              </button>
              <Link to="/wishlist" data-testid="nav-wishlist-button" aria-label="Wishlist" className="relative hidden transition-transform duration-300 hover:scale-110 sm:block">
                <Heart size={19} strokeWidth={1.5} />
                <CountBadge n={wishlist.length} testid="wishlist-count" />
              </Link>
              <Link to="/cart" data-testid="nav-cart-button" aria-label="Shopping bag" className="relative transition-transform duration-300 hover:scale-110">
                <ShoppingBag size={19} strokeWidth={1.5} />
                <CountBadge n={cartCount} testid="cart-count" />
              </Link>
            </div>
          </div>
        </header>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div data-testid="mobile-nav-panel" className="fixed inset-0 z-[70] bg-white"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <span className="text-lg font-extrabold uppercase tracking-[0.45em]">EasyBuy</span>
              <button data-testid="mobile-nav-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>
            <nav className="flex flex-col gap-2 p-8">
              {links.map((l, i) => (
                <motion.div key={l.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}>
                  <NavLink to={l.to} data-testid={`mobile-${l.testid}`} onClick={() => setMenuOpen(false)}
                    className="block border-b border-line py-5 font-display text-4xl italic">
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-8 flex gap-4">
                <button data-testid="mobile-account-button" onClick={() => { setMenuOpen(false); setAuthOpen(true); }}
                  className="flex-1 border border-ink py-3 text-xs font-semibold uppercase tracking-[0.2em]">
                  Sign In
                </button>
                <Link to="/wishlist" data-testid="mobile-wishlist-link" onClick={() => setMenuOpen(false)}
                  className="flex-1 border border-ink py-3 text-center text-xs font-semibold uppercase tracking-[0.2em]">
                  Wishlist
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};
