import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { Toaster } from 'sonner';
import { StoreProvider } from '@/context/StoreContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Wishlist from '@/pages/Wishlist';
import InfoPage from '@/pages/InfoPage';
import Orders from '@/pages/Orders';
import { PaymentSuccess, PaymentCancel } from '@/pages/PaymentResult';
import '@/App.css';

const ScrollManager = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const LenisRoot = () => {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    window.__lenis = lenis;
    let raf;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); window.__lenis = null; };
  }, []);
  return null;
};

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <LenisRoot />
        <ScrollManager />
        <div className="min-h-screen bg-white text-ink">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop/:gender" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
              <Route path="/info/:page" element={<InfoPage />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: 0, border: '1px solid #0A0A0A', background: '#0A0A0A', color: '#fff' } }} />
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
