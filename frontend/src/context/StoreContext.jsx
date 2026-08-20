import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { findProduct } from '../data/products';

const StoreContext = createContext(null);

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const StoreProvider = ({ children }) => {
  const [cart, setCart] = useState(() => load('easybuy_cart', []));
  const [wishlist, setWishlist] = useState(() => load('easybuy_wishlist', []));

  useEffect(() => { localStorage.setItem('easybuy_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('easybuy_wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  const addToCart = (id, size, qty = 1) => {
    setCart((prev) => {
      const i = prev.findIndex((it) => it.id === id && it.size === size);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      }
      return [...prev, { id, size, qty }];
    });
    const p = findProduct(id);
    toast.success(`Added to bag — ${p?.name} (${size})`);
  };

  const updateQty = (id, size, delta) => {
    setCart((prev) =>
      prev
        .map((it) => (it.id === id && it.size === size ? { ...it, qty: it.qty + delta } : it))
        .filter((it) => it.qty > 0)
    );
  };

  const removeFromCart = (id, size) => setCart((prev) => prev.filter((it) => !(it.id === id && it.size === size)));

  const toggleWishlist = (id) => {
    setWishlist((prev) => {
      const has = prev.includes(id);
      const p = findProduct(id);
      toast.success(has ? `Removed ${p?.name} from wishlist` : `Saved ${p?.name} to wishlist`);
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const clearCart = () => setCart([]);

  const value = useMemo(() => {
    const cartCount = cart.reduce((s, it) => s + it.qty, 0);
    const subtotal = cart.reduce((s, it) => s + (findProduct(it.id)?.price || 0) * it.qty, 0);
    return { cart, wishlist, addToCart, updateQty, removeFromCart, toggleWishlist, clearCart, cartCount, subtotal };
  }, [cart, wishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => useContext(StoreContext);
