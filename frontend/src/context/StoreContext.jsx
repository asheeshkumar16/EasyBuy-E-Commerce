import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

const formatApiError = (detail) => {
  if (detail == null) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e))).join(' ');
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
};

export const StoreProvider = ({ children }) => {
  const [products, setProducts] = useState(PRODUCTS);
  const [cart, setCart] = useState(EMPTY_CART);
  const [wishlist, setWishlist] = useState(() => load('easybuy_wishlist', []));
  const [user, setUser] = useState(undefined); // undefined = checking, null = guest

  const apiFetch = useCallback(
    (path, options = {}) =>
      fetch(`${API}${path}`, { credentials: 'include', ...options, headers: { ...HEADERS, ...(options.headers || {}) } }),
    []
  );

  useEffect(() => {
    fetch(`${API}/products`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data) && data.length) setProducts(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    apiFetch('/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => setUser(u || null))
      .catch(() => setUser(null));
  }, [apiFetch]);

  useEffect(() => {
    if (!user) localStorage.setItem('easybuy_wishlist', JSON.stringify(wishlist));
  }, [wishlist, user]);

  useEffect(() => {
    if (user === undefined) return;
    if (user) {
      apiFetch('/carts/mine')
        .then((r) => (r.ok ? r.json() : null))
        .then((c) => { if (c) { setCart(c); localStorage.setItem('easybuy_cart_id', c.cart_id); } })
        .catch(() => {});
      apiFetch('/wishlist')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setWishlist(d.product_ids); })
        .catch(() => {});
    } else {
      const id = localStorage.getItem('easybuy_cart_id');
      if (id) {
        fetch(`${API}/carts/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((c) => {
            if (c && c.cart_id) setCart(c);
            else localStorage.removeItem('easybuy_cart_id');
          })
          .catch(() => {});
      } else {
        setCart(EMPTY_CART);
      }
    }
  }, [user, apiFetch]);

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
    const res = await apiFetch('/carts', { method: 'POST' });
    const c = await res.json();
    localStorage.setItem('easybuy_cart_id', c.cart_id);
    setCart(c);
    return c.cart_id;
  };

  const addToCart = async (productId, size, qty = 1) => {
    try {
      const id = await ensureCartId();
      await syncCart(await apiFetch(`/carts/${id}/items`, {
        method: 'POST', body: JSON.stringify({ product_id: productId, size, qty }),
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
      await syncCart(await apiFetch(`/carts/${id}/items`, {
        method: 'PATCH', body: JSON.stringify({ product_id: productId, size, qty }),
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
      await syncCart(await apiFetch(`/carts/${id}`, { method: 'DELETE' }));
    } catch { /* noop */ }
  };

  const placeOrder = async (customer) => {
    const id = cart.cart_id || localStorage.getItem('easybuy_cart_id');
    const res = await apiFetch('/orders', { method: 'POST', body: JSON.stringify({ cart_id: id, customer }) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(formatApiError(err.detail));
    }
    return res.json();
  };

  const startPayment = async (orderNumber) => {
    const res = await apiFetch('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ order_number: orderNumber, origin_url: window.location.origin }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(formatApiError(err.detail));
    }
    return res.json();
  };

  const afterAuth = async () => {
    const id = localStorage.getItem('easybuy_cart_id');
    try {
      const res = await apiFetch('/carts/merge', { method: 'POST', body: JSON.stringify({ cart_id: id }) });
      if (res.ok) {
        const c = await res.json();
        setCart(c);
        localStorage.setItem('easybuy_cart_id', c.cart_id);
      }
    } catch { /* noop */ }
    try {
      const local = load('easybuy_wishlist', []);
      const res = await apiFetch('/wishlist/sync', { method: 'PUT', body: JSON.stringify({ product_ids: local }) });
      if (res.ok) {
        const d = await res.json();
        setWishlist(d.product_ids);
      }
    } catch { /* noop */ }
  };

  const login = async (email, password) => {
    try {
      const res = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: formatApiError(err.detail) };
      }
      const u = await res.json();
      setUser(u);
      await afterAuth();
      return { ok: true, user: u };
    } catch {
      return { ok: false, error: 'Network error — please try again' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { ok: false, error: formatApiError(err.detail) };
      }
      const u = await res.json();
      setUser(u);
      await afterAuth();
      return { ok: true, user: u };
    } catch {
      return { ok: false, error: 'Network error — please try again' };
    }
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setCart(EMPTY_CART);
    localStorage.removeItem('easybuy_cart_id');
    toast.success('Signed out — see you soon');
  };

  const toggleWishlist = async (productId) => {
    const p = findProduct(productId);
    if (user) {
      try {
        const res = await apiFetch('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ product_id: productId }) });
        const d = await res.json();
        setWishlist(d.product_ids);
        toast.success(d.product_ids.includes(productId) ? `Saved ${p?.name} to wishlist` : `Removed ${p?.name} from wishlist`);
      } catch {
        toast.error('Could not update wishlist');
      }
      return;
    }
    setWishlist((prev) => {
      const has = prev.includes(productId);
      toast.success(has ? `Removed ${p?.name} from wishlist` : `Saved ${p?.name} to wishlist`);
      return has ? prev.filter((x) => x !== productId) : [...prev, productId];
    });
  };

  const value = useMemo(() => ({
    products, findProduct, byTag,
    cart, cartItems: cart.items,
    cartCount: cart.items.reduce((s, it) => s + it.qty, 0),
    subtotal: cart.subtotal, shipping: cart.shipping, total: cart.total,
    wishlist, addToCart, updateQty, removeFromCart, clearCart, placeOrder, toggleWishlist,
    user, login, register, logout, startPayment, apiFetch,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [products, cart, wishlist, user, apiFetch]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => useContext(StoreContext);
