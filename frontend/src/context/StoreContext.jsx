import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PRODUCTS } from '../data/products';

const StoreContext = createContext(null);
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMPTY_CART = { cart_id: null, items: [], subtotal: 0, shipping: 0, total: 0 };
const HEADERS = { 'Content-Type': 'application/json' };

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const StoreProvider = ({ children }) => {
  const [products, setProducts] = useState(PRODUCTS);
  const [cart, setCart] = useState(EMPTY_CART);
  const [wishlist, setWishlist] = useState(() => load('easybuy_wishlist', []));

  useEffect(() => { localStorage.setItem('easybuy_wishlist', JSON.stringify(wishlist)); }, [wishlist]);

  useEffect(() => {
    fetch(`${API}/products`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length) setProducts(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = localStorage.getItem('easybuy_cart_id');
    if (!id) return;
    fetch(`${API}/carts/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (c && c.cart_id) setCart(c);
        else localStorage.removeItem('easybuy_cart_id');
      })
      .catch(() => {});
  }, []);

  const findProduct = (id) => products.find((p) => p.id === id);
  const byTag = (tag) => products.filter((p) => p.tags.includes(tag));

  const syncCart = async (res) => {
    if (!res.ok) throw new Error('cart error');
    const c = await res.json();
    setCart(c);
    return c;
  };

  const ensureCartId = async () => {
    if (cart.cart_id) return cart.cart_id;
    const stored = localStorage.getItem('easybuy_cart_id');
    if (stored) return stored;
    const res = await fetch(`${API}/carts`, { method: 'POST' });
    const c = await res.json();
    localStorage.setItem('easybuy_cart_id', c.cart_id);
    setCart(c);
    return c.cart_id;
  };

  const addToCart = async (productId, size, qty = 1) => {
    try {
      const id = await ensureCartId();
      await syncCart(await fetch(`${API}/carts/${id}/items`, {
        method: 'POST', headers: HEADERS, body: JSON.stringify({ product_id: productId, size, qty }),
      }));
      const p = findProduct(productId);
      toast.success(`Added to bag — ${p?.name} (${size})`);
    } catch {
      toast.error('Could not update your bag — please try again');
    }
  };

  const setQty = async (productId, size, qty) => {
    const id = cart.cart_id || localStorage.getItem('easybuy_cart_id');
    if (!id) return;
    try {
      await syncCart(await fetch(`${API}/carts/${id}/items`, {
        method: 'PATCH', headers: HEADERS, body: JSON.stringify({ product_id: productId, size, qty }),
      }));
    } catch {
      toast.error('Could not update your bag');
    }
  };

  const updateQty = (productId, size, delta) => {
    const item = cart.items.find((it) => it.product_id === productId && it.size === size);
    if (item) setQty(productId, size, Math.max(0, item.qty + delta));
  };

  const removeFromCart = (productId, size) => setQty(productId, size, 0);

  const clearCart = async () => {
    const id = cart.cart_id || localStorage.getItem('easybuy_cart_id');
    if (!id) return;
    try {
      await syncCart(await fetch(`${API}/carts/${id}`, { method: 'DELETE' }));
    } catch { /* noop */ }
  };

  const placeOrder = async (customer) => {
    const id = cart.cart_id || localStorage.getItem('easybuy_cart_id');
    const res = await fetch(`${API}/orders`, {
      method: 'POST', headers: HEADERS, body: JSON.stringify({ cart_id: id, customer }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(typeof err.detail === 'string' ? err.detail : 'Could not place your order');
    }
    const order = await res.json();
    setCart((prev) => ({ ...EMPTY_CART, cart_id: prev.cart_id }));
    return order;
  };

  const toggleWishlist = (id) => {
    setWishlist((prev) => {
      const has = prev.includes(id);
      const p = findProduct(id);
      toast.success(has ? `Removed ${p?.name} from wishlist` : `Saved ${p?.name} to wishlist`);
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const value = useMemo(() => ({
    products, findProduct, byTag,
    cart, cartItems: cart.items,
    cartCount: cart.items.reduce((s, it) => s + it.qty, 0),
    subtotal: cart.subtotal, shipping: cart.shipping, total: cart.total,
    wishlist, addToCart, updateQty, removeFromCart, clearCart, placeOrder, toggleWishlist,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [products, cart, wishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => useContext(StoreContext);
