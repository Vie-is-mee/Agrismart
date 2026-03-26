import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

// LoginModal & user state are lifted to App; accept props

export default function Navbar({ user, onLoginClick, onLogout }) {
  const { totalItems, dispatch } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  }

  return (
    <>
      <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        <div className="navbar__inner">
          <Link to="/" className="navbar__logo">
            <img
              src="/icons/logo-nong-san-nha-que.png"
              alt="AgriSmart logo"
              className="navbar__logo-icon"
            />
            <span className="navbar__logo-text">
              Agri<strong>Smart</strong>
            </span>
          </Link>

          <ul className="navbar__links">
            <li>
              <Link to="/">Trang Chủ</Link>
            </li>
            <li>
              <Link to="/products">Tất Cả Sản Phẩm</Link>
            </li>
            <li>
              <Link to="/products?category=fruits">Trái Cây</Link>
            </li>
            <li>
              <Link to="/products?category=vegetables">Rau Củ</Link>
            </li>
            <li>
              <Link to="/products?category=grains">Gạo & Ngũ Cốc</Link>
            </li>
            <li>
              <Link to="/about">Về Chúng Tôi</Link>
            </li>
            <li>
              <Link to="/my-shop" className="navbar__shop-link">
                Gian Hàng
              </Link>
            </li>
          </ul>

          <div className="navbar__actions">
            <button
              className="navbar__icon-btn"
              onClick={() => setSearchOpen((s) => !s)}
              aria-label="Tìm kiếm"
              title="Tìm kiếm sản phẩm"
            >
              <img
                src="/icons/SearchIcon.ico"
                alt="Tìm kiếm"
                style={{ width: "22px", height: "22px", objectFit: "contain" }}
              />
            </button>
            <button
              className="navbar__icon-btn navbar__cart-btn"
              onClick={() => dispatch({ type: "TOGGLE_OPEN" })}
              aria-label="Mở giỏ hàng"
              title="Xem giỏ hàng"
            >
              <img
                src="/icons/ShoppingCartIcon.ico"
                alt="Giỏ hàng"
                style={{ width: "40px", height: "40px", objectFit: "contain" }}
              />
              {totalItems > 0 && (
                <span className="navbar__cart-badge">{totalItems}</span>
              )}
            </button>

            {user ? (
              <div className="navbar__user-menu">
                <button className="navbar__user-btn" title={user.name}>
                  <span className="navbar__user-avatar">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                  <span className="navbar__user-name">{user.name}</span>
                </button>
                <div className="navbar__user-dropdown">
                  <div className="navbar__user-info">
                    <p className="navbar__user-info-name">{user.name}</p>
                    <p className="navbar__user-info-phone">{user.phone}</p>
                  </div>
                  <hr className="navbar__user-divider" />
                  <button className="navbar__dropdown-item"> Hồ sơ</button>
                  <button className="navbar__dropdown-item"> Đơn hàng</button>
                  <Link
                    to="/my-shop"
                    className="navbar__dropdown-item navbar__dropdown-link"
                  >
                    🏪 Gian Hàng Của Tôi
                  </Link>
                  <hr className="navbar__user-divider" />
                  <button
                    className="navbar__dropdown-item navbar__dropdown-item--logout"
                    onClick={onLogout}
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <button className="navbar__login-btn" onClick={onLoginClick}>
                Đăng Nhập
              </button>
            )}

            <button
              className="navbar__hamburger"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="navbar__search-bar">
            <form onSubmit={handleSearch} className="navbar__search-form">
              <input
                autoFocus
                type="text"
                placeholder="Tìm cam, gạo, mật ong…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="navbar__search-input"
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "10px 20px" }}
              >
                Tìm Kiếm
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "10px 16px" }}
                onClick={() => setSearchOpen(false)}
              >
                Hủy
              </button>
            </form>
          </div>
        )}
      </nav>

      <div className={`mobile-menu ${menuOpen ? "mobile-menu--open" : ""}`}>
        <ul>
          <li>
            <Link to="/">🏠 Trang Chủ</Link>
          </li>
          <li>
            <Link to="/products">🛍️ Tất Cả Sản Phẩm</Link>
          </li>
          <li>
            <Link to="/products?category=fruits">🍊 Trái Cây</Link>
          </li>
          <li>
            <Link to="/products?category=vegetables">🥦 Rau Củ Quả</Link>
          </li>
          <li>
            <Link to="/products?category=grains">🌾 Gạo & Ngũ Cốc</Link>
          </li>
          <li>
            <Link to="/products?category=herbs">🌿 Gia Vị & Thảo Mộc</Link>
          </li>
          <li>
            <Link to="/about">ℹ️ Về Chúng Tôi</Link>
          </li>
          <li>
            <Link to="/my-shop" className="mobile-shop-link">
              🏪 Gian Hàng Của Tôi
            </Link>
          </li>
        </ul>
      </div>
      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />
      )}
    </>
  );
}
