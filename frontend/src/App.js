import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import Cart from "./components/Cart";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import AIChatWidget from "./components/AIChatWidget";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import ShopPage from "./pages/ShopPage";
import ShopDashboard from "./pages/ShopDashboard";
import NotFound from "./pages/NotFound";
import "./styles/global.css";
import "./styles/responsive.css";

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <CartProvider>
        <ToastProvider>
          <Navbar
            user={user}
            onLoginClick={() => setLoginOpen(true)}
            onLogout={() => setUser(null)}
          />
          <Cart />
          <LoginModal
            isOpen={loginOpen}
            onClose={() => setLoginOpen(false)}
            onLogin={(u) => {
              setUser(u);
              setLoginOpen(false);
            }}
          />
          <AIChatWidget />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/about" element={<About />} />
            <Route path="/shop/:shopId" element={<ShopPage />} />
            <Route
              path="/my-shop"
              element={user ? <ShopDashboard user={user} /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </ToastProvider>
      </CartProvider>
    </BrowserRouter>
  );
}