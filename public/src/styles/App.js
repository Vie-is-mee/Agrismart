import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import "./styles/global.css";

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
            onLogin={(u) => setUser(u)}
          />
          <AIChatWidget />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/about" element={<About />} />
            <Route path="/shop/:shopId" element={<ShopPage />} />
            <Route path="/my-shop" element={<ShopDashboard />} />
            <Route
              path="*"
              element={
                <div style={{ textAlign: "center", padding: "100px 20px" }}>
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "2rem",
                      color: "var(--green-dark)",
                    }}
                  >
                    Page Not Found
                  </h2>
                  <p
                    style={{ color: "var(--text-mid)", margin: "12px 0 24px" }}
                  >
                    This page doesn't exist yet.
                  </p>
                  <a href="/" className="btn btn-primary">
                    Go Home
                  </a>
                </div>
              }
            />
          </Routes>
          <Footer />
        </ToastProvider>
      </CartProvider>
    </BrowserRouter>
  );
}
