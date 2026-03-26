import React from "react";
import { Link } from "react-router-dom";
import { products, categories } from "../data/products";
import ProductCard from "../components/ProductCard";
import Carousel from "../components/Carousels";
import "./Home.css";

export default function Home() {
  const featured = products.filter((p) => p.inStock).slice(0, 8);

  return (
    <main className="home">
      {/* ── Image Carousel Hero ─────────────────── */}
      <Carousel />

      {/* ── Thanh Niềm Tin ─────────────────── */}
      <section className="trust-strip">
        <div className="container trust-strip__inner">
          <div className="trust-item">
            <div>
              <b>100% Tự Nhiên</b>
              <small>Không chất bảo quản nhân tạo</small>
            </div>
          </div>
          <div className="trust-item">
            <div>
              <b>Nhanh & Tươi</b>
              <small>Giao trong vòng 24 giờ</small>
            </div>
          </div>
          <div className="trust-item">
            <div>
              <b>Truy Xuất Nguồn Gốc</b>
              <small>Biết rõ thực phẩm từ đâu</small>
            </div>
          </div>
          <div className="trust-item">
            <div>
              <b>Hỗ Trợ Nông Dân</b>
              <small>Giá công bằng, mua thẳng tại vườn</small>
            </div>
          </div>
        </div>
      </section>

      {/* ── Danh Mục ──────────────────── */}
      <section className="section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: "center" }}>
            Mua Theo Danh Mục
          </h2>
          <p className="section-subtitle" style={{ textAlign: "center" }}>
            Tất cả mọi thứ từ nông trại, quy tụ về một nơi
          </p>
          <div className="categories-grid">
            <Link to="/products" className="category-card category-card--all">
              <img
                src="/icons/GianHangRauCuQua.ico"
                alt="Tất Cả Sản Phẩm"
                className="category-card__icon-img"
              />
              <span className="category-card__label">Tất Cả Sản Phẩm</span>
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="category-card"
                style={{ "--cat-bg": cat.color }}
              >
                {cat.icon ? (
                  <img
                    src={cat.icon}
                    alt={cat.label}
                    className="category-card__icon-img"
                  />
                ) : (
                  <span className="category-card__emoji">{cat.emoji}</span>
                )}
                <span className="category-card__label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sản Phẩm Nổi Bật ────────────── */}
      <section
        className="section"
        style={{ background: "white", padding: "60px 0" }}
      >
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Sản Phẩm Nổi Bật</h2>
              <p className="section-subtitle">
                Tuyển chọn tươi ngon nhất vừa về từ nông trại
              </p>
            </div>
            <Link to="/products" className="btn btn-outline">
              Xem Tất Cả →
            </Link>
          </div>
          <div className="products-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Banner Câu Chuyện ─────────────────── */}
      <section className="story-banner">
        <div className="container story-banner__inner">
          <div className="story-banner__text">
            <span className="story-banner__eyebrow">Sứ Mệnh Của Chúng Tôi</span>
            <h2 className="story-banner__title">
              Mỗi sản phẩm đều mang một câu chuyện đáng để biết
            </h2>
            <p className="story-banner__body">
              Chúng tôi hợp tác trực tiếp với các hộ nông dân nhỏ lẻ khắp Việt
              Nam, đảm bảo mức thù lao xứng đáng và nông sản tươi ngon nhất. Mỗi
              sản phẩm đều ghi rõ lịch sử nông trại, phương pháp canh tác và
              vùng trồng — để bạn cảm nhận được sự gắn kết với bàn tay đã vun
              trồng thức ăn cho bạn.
            </p>
            <Link to="/about" className="btn btn-primary">
              Đọc Câu Chuyện Của Chúng Tôi →
            </Link>
          </div>
          <div className="story-banner__stats">
            <div className="stat-card">
              <span className="stat-card__num">150+</span>
              <span className="stat-card__label">Nông Trại Đối Tác</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__num">63</span>
              <span className="stat-card__label">Tỉnh Thành</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__num">50K+</span>
              <span className="stat-card__label">Khách Hàng Hài Lòng</span>
            </div>
            <div className="stat-card">
              <span className="stat-card__num">24h</span>
              <span className="stat-card__label">Tốc Độ Giao Hàng</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Đăng Ký Nhận Tin ───────────────────── */}
      <section className="newsletter">
        <div className="container newsletter__inner">
          <div className="newsletter__text">
            <h3>Cập Nhật Mùa Vụ</h3>
            <p>
              Nhận thông tin hàng tuần về nông sản theo mùa, câu chuyện nông
              trại và ưu đãi đặc biệt.
            </p>
          </div>
          <form
            className="newsletter__form"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="email@cuaban.com"
              className="newsletter__input"
            />
            <button type="submit" className="btn btn-primary">
              Đăng Ký
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
