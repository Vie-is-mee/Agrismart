import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getShopById } from "../data/shops";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";
import "./ShopPage.css";

function StarRating({ rating }) {
  return (
    <span className="stars" style={{ color: "var(--amber)" }}>
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
      {"☆".repeat(5 - Math.ceil(rating))}
    </span>
  );
}

export default function ShopPage() {
  const { shopId } = useParams();
  const shop = getShopById(shopId);
  const [activeTab, setActiveTab] = useState("products");

  if (!shop) {
    return (
      <div className="shop-not-found">
        <h2> Không tìm thấy gian hàng</h2>
        <p>Gian hàng này có thể đã ngừng hoạt động.</p>
        <Link to="/products" className="btn btn-primary">
          Khám Phá Sản Phẩm
        </Link>
      </div>
    );
  }

  const shopProducts = products.filter((p) => shop.productIds.includes(p.id));
  const inStockCount = shopProducts.filter((p) => p.inStock).length;

  return (
    <main className="shop-page">
      {/* Cover */}
      <div
        className="shop-cover"
        style={{ backgroundImage: `url(${shop.coverImage})` }}
      >
        <div className="shop-cover__overlay" />
      </div>

      <div className="container">
        {/* Shop Header */}
        <div className="shop-header">
          <div className="shop-avatar-wrap">
            <img src={shop.avatar} alt={shop.owner} className="shop-avatar" />
            {shop.verified && (
              <span
                className="shop-verified-badge"
                title="Gian hàng đã xác minh"
              >
                ✓
              </span>
            )}
          </div>

          <div className="shop-header__info">
            <div className="shop-name-row">
              <h1 className="shop-name">{shop.name}</h1>
              {shop.verified && (
                <span className="shop-verified-tag">✓ Đã xác minh</span>
              )}
            </div>
            <p className="shop-owner">
              {" "}
              Chủ hàng: <strong>{shop.owner}</strong>
            </p>
            <p className="shop-location">📍 {shop.location}</p>

            <div className="shop-stats-row">
              <div className="shop-stat">
                <span className="shop-stat__val">{shop.rating}</span>
                <span className="shop-stat__label"> Đánh giá</span>
              </div>
              <div className="shop-stat-divider" />
              <div className="shop-stat">
                <span className="shop-stat__val">
                  {shop.totalReviews.toLocaleString("vi-VN")}
                </span>
                <span className="shop-stat__label">Lượt đánh giá</span>
              </div>
              <div className="shop-stat-divider" />
              <div className="shop-stat">
                <span className="shop-stat__val">
                  {shop.totalSales.toLocaleString("vi-VN")}
                </span>
                <span className="shop-stat__label">Đơn hàng</span>
              </div>
              <div className="shop-stat-divider" />
              <div className="shop-stat">
                <span className="shop-stat__val">{shop.responseRate}%</span>
                <span className="shop-stat__label">Phản hồi</span>
              </div>
            </div>
          </div>

          <div className="shop-header__actions">
            <a
              href={shop.socialLinks.zalo}
              className="btn btn-primary shop-contact-btn"
            >
              Nhắn tin
            </a>
            <a
              href={shop.socialLinks.facebook}
              className="btn btn-outline shop-follow-btn"
            >
              Theo dõi
            </a>
          </div>
        </div>

        {/* Certifications */}
        {shop.certifications.length > 0 && (
          <div className="shop-certs">
            {shop.certifications.map((cert) => (
              <span key={cert} className="shop-cert-badge">
                {" "}
                {cert}
              </span>
            ))}
            <span className="shop-cert-badge">
              Hoạt động từ {shop.established}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="shop-tabs">
          <div className="shop-tabs__nav">
            <button
              className={
                "shop-tab-btn" + (activeTab === "products" ? " active" : "")
              }
              onClick={() => setActiveTab("products")}
            >
              Sản Phẩm ({shopProducts.length})
            </button>
            <button
              className={
                "shop-tab-btn" + (activeTab === "about" ? " active" : "")
              }
              onClick={() => setActiveTab("about")}
            >
              Về Gian Hàng
            </button>
          </div>

          <div className="shop-tabs__content">
            {activeTab === "products" && (
              <div className="shop-products-section">
                <div className="shop-products-header">
                  <p className="shop-products-meta">
                    <span className="shop-products-meta__count">
                      {shopProducts.length} sản phẩm
                    </span>
                    &nbsp;·&nbsp;
                    <span className="shop-products-meta__stock">
                      {inStockCount} còn hàng
                    </span>
                  </p>
                </div>
                {shopProducts.length > 0 ? (
                  <div className="products-grid shop-products-grid">
                    {shopProducts.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                ) : (
                  <div className="shop-empty">
                    <p> Gian hàng chưa có sản phẩm nào.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "about" && (
              <div className="shop-about-section">
                <div className="shop-about-card">
                  <h3 className="shop-about-title"> Câu chuyện gian hàng</h3>
                  <p className="shop-about-desc">{shop.description}</p>
                </div>
                <div className="shop-about-tags">
                  {shop.tags.map((tag) => (
                    <span key={tag} className="shop-tag">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="shop-about-grid">
                  <div className="shop-info-item">
                    <span className="shop-info-icon"></span>
                    <div>
                      <b>Năm thành lập</b>
                      <p>{shop.established}</p>
                    </div>
                  </div>
                  <div className="shop-info-item">
                    <span className="shop-info-icon">📍</span>
                    <div>
                      <b>Địa chỉ</b>
                      <p>{shop.location}</p>
                    </div>
                  </div>
                  <div className="shop-info-item">
                    <span className="shop-info-icon"></span>
                    <div>
                      <b>Tỷ lệ phản hồi</b>
                      <p>{shop.responseRate}%</p>
                    </div>
                  </div>
                  <div className="shop-info-item">
                    <span className="shop-info-icon"></span>
                    <div>
                      <b>Tổng đơn hàng</b>
                      <p>{shop.totalSales.toLocaleString("vi-VN")} đơn</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
