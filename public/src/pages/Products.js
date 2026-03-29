import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { products, categories, searchProducts, getProductsByCategory } from "../data/products";
import ProductCard from "../components/ProductCard";
import "./Products.css";

const SORT_OPTIONS = [
  { value: "default",    label: "Nổi Bật"             },
  { value: "price-asc",  label: "Giá: Thấp → Cao"     },
  { value: "price-desc", label: "Giá: Cao → Thấp"     },
  { value: "rating",     label: "Đánh Giá Cao Nhất"   },
  { value: "name",       label: "Tên A–Z"              },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort]       = useState("default");
  const [inStock, setInStock] = useState(false);

  const categoryParam = searchParams.get("category") || "all";
  const searchQuery   = searchParams.get("search")   || "";

  function setCategory(cat) {
    const next = new URLSearchParams(searchParams);
    if (cat === "all") next.delete("category");
    else next.set("category", cat);
    next.delete("search");
    setSearchParams(next);
  }

  const filtered = useMemo(() => {
    let list = searchQuery
      ? searchProducts(searchQuery)
      : getProductsByCategory(categoryParam);
    if (inStock) list = list.filter(p => p.inStock);
    switch (sort) {
      case "price-asc":  return [...list].sort((a,b) => a.price - b.price);
      case "price-desc": return [...list].sort((a,b) => b.price - a.price);
      case "rating":     return [...list].sort((a,b) => b.rating - a.rating);
      case "name":       return [...list].sort((a,b) => a.name.localeCompare(b.name));
      default:           return list;
    }
  }, [categoryParam, searchQuery, sort, inStock]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [categoryParam, searchQuery]);

  const pageTitle = searchQuery
    ? `Kết quả cho "${searchQuery}"`
    : categoryParam !== "all"
      ? categories.find(c => c.id === categoryParam)?.label || "Sản Phẩm"
      : "Tất Cả Sản Phẩm";

  return (
    <main className="products-page">
      <div className="container">
        <div className="products-page__header">
          <div>
            <h1 className="section-title">{pageTitle}</h1>
            <p className="section-subtitle">Tìm thấy {filtered.length} sản phẩm</p>
          </div>
        </div>

        <div className="products-page__layout">
          {/* Thanh lọc */}
          <aside className="products-sidebar">
            <div className="sidebar-block">
              <h3 className="sidebar-title">Danh Mục</h3>
              <ul className="sidebar-cats">
                <li>
                  <button
                    className={"sidebar-cat" + (categoryParam === "all" && !searchQuery ? " active" : "")}
                    onClick={() => setCategory("all")}
                  >
                    🛒 Tất Cả Sản Phẩm<span>{products.length}</span>
                  </button>
                </li>
                {categories.map(cat => (
                  <li key={cat.id}>
                    <button
                      className={"sidebar-cat" + (categoryParam === cat.id && !searchQuery ? " active" : "")}
                      onClick={() => setCategory(cat.id)}
                    >
                      {cat.emoji} {cat.label}
                      <span>{products.filter(p => p.category === cat.id).length}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar-block">
              <h3 className="sidebar-title">Tình Trạng</h3>
              <label className="toggle-row">
                <span>Chỉ Còn Hàng</span>
                <div
                  className={"toggle" + (inStock ? " toggle--on" : "")}
                  onClick={() => setInStock(s => !s)}
                  role="switch"
                  aria-checked={inStock}
                  tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && setInStock(s => !s)}
                >
                  <div className="toggle__knob" />
                </div>
              </label>
            </div>

            <div className="sidebar-block">
              <h3 className="sidebar-title">Sắp Xếp Theo</h3>
              <select className="sidebar-select" value={sort} onChange={e => setSort(e.target.value)}>
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="sidebar-tip">
              <span>🚚</span>
              <p>Miễn phí giao hàng cho đơn từ <strong>500.000₫</strong></p>
            </div>
          </aside>

          {/* Lưới sản phẩm */}
          <div className="products-main">
            <div className="mobile-filter-bar">
              <select className="sidebar-select" value={sort} onChange={e => setSort(e.target.value)} style={{ flex: 1 }}>
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <label className="toggle-row" style={{ gap: 8 }}>
                <span style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>Còn Hàng</span>
                <div className={"toggle" + (inStock ? " toggle--on" : "")} onClick={() => setInStock(s => !s)}>
                  <div className="toggle__knob" />
                </div>
              </label>
            </div>

            {filtered.length === 0 ? (
              <div className="products-empty">
                <div style={{ fontSize: "4rem" }}>🌱</div>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
                <button className="btn btn-primary" onClick={() => setCategory("all")}>Xem Tất Cả Sản Phẩm</button>
              </div>
            ) : (
              <div className="products-grid">
                {filtered.map((p, i) => (
                  <div key={p.id} style={{ animationDelay: i * 0.05 + "s" }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
