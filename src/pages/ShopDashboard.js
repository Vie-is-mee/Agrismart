import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { shops } from "../data/shops";
import { products } from "../data/products";
import "./ShopDashboard.css";

// Mock: logged-in shop owner sees their own shop (shop-1 for demo)
const DEMO_SHOP_ID = "shop-1";

function fmt(n) {
  return n.toLocaleString("vi-VN") + "₫";
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="dash-stat-card" style={{ "--accent": color }}>
      <div className="dash-stat-icon">{icon}</div>
      <div className="dash-stat-body">
        <span className="dash-stat-val">{value}</span>
        <span className="dash-stat-label">{label}</span>
        {sub && <span className="dash-stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

// ── Edit Product Modal ──────────────────────────────────────────────
function EditProductModal({ product, onClose, onSave }) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(String(product.price));
  const [stockQty, setStockQty] = useState(String(product.stockQty ?? ""));
  const [inStock, setInStock] = useState(product.inStock);
  const [imagePreview, setImagePreview] = useState(product.image);
  const [imageFile, setImageFile] = useState(null);
  const fileRef = useRef(null);

  const priceNum = parseInt(price.replace(/\D/g, ""), 10);
  const stockNum = parseInt(stockQty, 10);
  const canSave =
    name.trim() &&
    description.trim() &&
    !isNaN(priceNum) &&
    priceNum > 0 &&
    (inStock ? !isNaN(stockNum) && stockNum >= 0 : true);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function handleStockToggle(val) {
    setInStock(val);
    if (!val) setStockQty("0");
  }

  function handleSave() {
    onSave(product.id, {
      name: name.trim(),
      description,
      price: priceNum,
      stockQty: inStock ? stockNum : 0,
      inStock,
      image: imagePreview,
    });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box modal-box--wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title"> Chỉnh sửa sản phẩm</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {/* Image upload */}
          <div className="edit-field">
            <label className="edit-label"> Hình ảnh sản phẩm</label>
            <div className="edit-image-row">
              <div className="edit-image-preview-wrap">
                <img
                  src={imagePreview}
                  alt={product.name}
                  className="edit-image-preview"
                />
                <div
                  className="edit-image-overlay"
                  onClick={() => fileRef.current && fileRef.current.click()}
                >
                  <span> Đổi ảnh</span>
                </div>
              </div>
              <div className="edit-image-actions">
                <button
                  className="btn btn-outline edit-upload-btn"
                  onClick={() => fileRef.current && fileRef.current.click()}
                >
                  Chọn ảnh từ máy
                </button>
                <p className="edit-image-hint">
                  Hỗ trợ JPG, PNG, WEBP. Tối đa 5MB.
                </p>
                {imageFile && (
                  <p className="edit-image-chosen">
                    {" "}
                    Đã chọn: <b>{imageFile.name}</b>
                  </p>
                )}
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </div>

          <div className="edit-grid-2">
            {/* Product name */}
            <div className="edit-field edit-field--span2">
              <label className="edit-label"> Tên sản phẩm</label>
              <input
                className="dash-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên sản phẩm..."
              />
            </div>

            {/* Price */}
            <div className="edit-field">
              <label className="edit-label">
                {" "}
                Giá bán (₫ / {product.unit})
              </label>
              <div className="edit-price-wrap">
                <input
                  className={
                    "dash-input edit-price-input" +
                    (price && isNaN(priceNum) ? " input-error" : "")
                  }
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="Ví dụ: 85000"
                  inputMode="numeric"
                />
                {price && !isNaN(priceNum) && priceNum > 0 && (
                  <span className="edit-price-preview">
                    {priceNum.toLocaleString("vi-VN")}₫
                  </span>
                )}
              </div>
            </div>

            {/* Stock status */}
            <div className="edit-field">
              <label className="edit-label"> Tình trạng hàng</label>
              <div className="edit-stock-toggle">
                <button
                  className={
                    "edit-toggle-btn" + (inStock ? " active-green" : "")
                  }
                  onClick={() => handleStockToggle(true)}
                >
                  Còn hàng
                </button>
                <button
                  className={
                    "edit-toggle-btn" + (!inStock ? " active-red" : "")
                  }
                  onClick={() => handleStockToggle(false)}
                >
                  ❌ Hết hàng
                </button>
              </div>
            </div>

            {/* Stock quantity */}
            <div className="edit-field">
              <label className="edit-label">
                {" "}
                Số lượng tồn kho ({product.unit})
              </label>
              <input
                className="dash-input"
                value={stockQty}
                onChange={(e) =>
                  setStockQty(e.target.value.replace(/[^\d]/g, ""))
                }
                placeholder="Ví dụ: 50"
                inputMode="numeric"
                disabled={!inStock}
                style={!inStock ? { opacity: 0.45 } : {}}
              />
              {inStock &&
                stockQty &&
                !isNaN(stockNum) &&
                stockNum <= 10 &&
                stockNum > 0 && (
                  <span className="edit-stock-warn"> Sắp hết hàng</span>
                )}
            </div>
          </div>

          {/* Description */}
          <div className="edit-field">
            <label className="edit-label"> Mô tả sản phẩm</label>
            <textarea
              className="dash-textarea edit-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả sản phẩm..."
            />
            <span className="edit-char-count">{description.length} ký tự</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Huỷ
          </button>
          <button
            className={"btn btn-primary" + (!canSave ? " disabled" : "")}
            onClick={canSave ? handleSave : undefined}
            disabled={!canSave}
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Shop Confirm Modal ───────────────────────────────────────
function DeleteShopModal({ shopName, onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState("");
  const required = "XÓA GIAN HÀNG";
  const canDelete = confirmText === required;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box modal-box--danger"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header modal-header--danger">
          <h3 className="modal-title"> Xóa gian hàng</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="delete-warning-icon"></div>
          <p className="delete-warning-title">
            Bạn có thực sự muốn xóa gian hàng?
          </p>
          <p className="delete-warning-desc">
            Hành động này <strong>không thể hoàn tác</strong>. Tất cả sản phẩm,
            đánh giá và dữ liệu gian hàng <strong>{shopName}</strong> sẽ bị xóa
            vĩnh viễn.
          </p>
          <div className="delete-consequences">
            <div className="delete-consequence-item">
              ❌ Tất cả sản phẩm sẽ bị xóa
            </div>
            <div className="delete-consequence-item">
              ❌ Lịch sử đơn hàng sẽ bị mất
            </div>
            <div className="delete-consequence-item">
              ❌ Đánh giá và xếp hạng sẽ biến mất
            </div>
            <div className="delete-consequence-item">
              ❌ Không thể khôi phục gian hàng
            </div>
          </div>
          <div className="delete-confirm-field">
            <label className="edit-label">
              Để xác nhận, hãy gõ <strong>{required}</strong> vào ô bên dưới:
            </label>
            <input
              className="dash-input delete-confirm-input"
              placeholder={required}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Huỷ bỏ
          </button>
          <button
            className={"btn btn-danger" + (!canDelete ? " disabled" : "")}
            onClick={canDelete ? onConfirm : undefined}
            disabled={!canDelete}
          >
            Xóa vĩnh viễn
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────
export default function ShopDashboard() {
  const navigate = useNavigate();
  const shop = shops.find((s) => s.id === DEMO_SHOP_ID);
  const [localProducts, setLocalProducts] = useState(
    products.filter((p) => shop.productIds.includes(p.id)),
  );

  const [activeTab, setActiveTab] = useState("overview");
  const [editingShop, setEditingShop] = useState(false);
  const [shopDraft, setShopDraft] = useState({
    name: shop.name,
    description: shop.description,
    location: shop.location,
  });

  // Edit product modal
  const [editingProduct, setEditingProduct] = useState(null);

  // Delete shop modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [shopDeleted, setShopDeleted] = useState(false);

  const totalRevenue = localProducts
    .filter((p) => p.inStock)
    .reduce((sum, p) => sum + p.price * Math.floor(Math.random() * 40 + 10), 0);

  const tabs = [
    { id: "overview", label: "📊 Tổng Quan" },
    { id: "products", label: "🛒 Sản Phẩm" },
    { id: "profile", label: "🏪 Hồ Sơ Shop" },
  ];

  function handleSaveProduct(productId, changes) {
    setLocalProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const updated = { ...p, ...changes };
        // auto-sync inStock based on stockQty
        if (changes.stockQty !== undefined && changes.stockQty === 0)
          updated.inStock = false;
        if (changes.inStock === true && changes.stockQty > 0)
          updated.inStock = true;
        return updated;
      }),
    );
  }

  function handleDeleteShop() {
    setShowDeleteModal(false);
    setShopDeleted(true);
    setTimeout(() => navigate("/"), 3000);
  }

  if (shopDeleted) {
    return (
      <main className="shop-dashboard">
        <div className="container">
          <div className="shop-deleted-notice">
            <div className="shop-deleted-icon">🗑️</div>
            <h2>Gian hàng đã được xóa</h2>
            <p>
              Gian hàng <strong>{shop.name}</strong> đã bị xóa vĩnh viễn.
            </p>
            <p className="shop-deleted-redirect">
              Đang chuyển về trang chủ trong 3 giây...
            </p>
            <Link to="/" className="btn btn-primary">
              Về Trang Chủ Ngay
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="shop-dashboard">
      <div className="container">
        {/* Dashboard Header */}
        <div className="dash-header">
          <div className="dash-header__left">
            <img src={shop.avatar} alt={shop.owner} className="dash-avatar" />
            <div>
              <h1 className="dash-title">Xin chào, {shop.owner}! 👋</h1>
              <p className="dash-subtitle">
                Quản lý gian hàng <strong>{shop.name}</strong>
                {shop.verified && (
                  <span className="dash-verified">✓ Đã xác minh</span>
                )}
              </p>
            </div>
          </div>
          <div className="dash-header-btns">
            <Link
              to={`/shop/${shop.id}`}
              className="btn btn-primary dash-view-btn"
              target="_blank"
            >
              👁 Xem Gian Hàng
            </Link>
            <button
              className="btn btn-danger-outline dash-delete-btn"
              onClick={() => setShowDeleteModal(true)}
            >
              🗑️ Xóa Gian Hàng
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="dash-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={"dash-tab-btn" + (activeTab === t.id ? " active" : "")}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="dash-content">
            <div className="dash-stats-grid">
              <StatCard
                icon="📦"
                label="Sản phẩm"
                value={localProducts.length}
                sub={`${localProducts.filter((p) => p.inStock).length} còn hàng`}
                color="var(--green-main)"
              />
              <StatCard
                icon="⭐"
                label="Đánh giá"
                value={shop.rating}
                sub={`${shop.totalReviews} lượt`}
                color="var(--amber)"
              />
              <StatCard
                icon="🚚"
                label="Đơn hàng"
                value={shop.totalSales.toLocaleString("vi-VN")}
                sub="tổng đơn"
                color="var(--orange)"
              />
              <StatCard
                icon="💬"
                label="Phản hồi"
                value={`${shop.responseRate}%`}
                sub="tỷ lệ trả lời"
                color="var(--green-mid)"
              />
            </div>

            {/* Quick product table */}
            <div className="dash-section">
              <div className="dash-section__header">
                <h2 className="dash-section__title">Sản phẩm đang bán</h2>
                <button
                  className="btn btn-primary dash-add-btn"
                  onClick={() => setActiveTab("products")}
                >
                  + Quản lý
                </button>
              </div>
              <div className="dash-product-list">
                {localProducts.map((p) => (
                  <div key={p.id} className="dash-product-row">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="dash-product-img"
                    />
                    <div className="dash-product-info">
                      <span className="dash-product-name">{p.name}</span>
                      <span className="dash-product-origin">📍 {p.origin}</span>
                    </div>
                    <div className="dash-product-meta">
                      <span className="dash-product-price">
                        {fmt(p.price)}/{p.unit}
                      </span>
                      <span
                        className={
                          "dash-stock-badge " + (p.inStock ? "in" : "out")
                        }
                      >
                        {p.inStock ? "✅ Còn hàng" : "❌ Hết hàng"}
                      </span>
                    </div>
                    <Link to={`/product/${p.id}`} className="dash-product-link">
                      Xem →
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips
            <div className="dash-tips">
              <h3 className="dash-tips__title">💡 Gợi ý để tăng doanh số</h3>
              <ul className="dash-tips__list">
                <li>📸 Thêm hình ảnh chất lượng cao cho từng sản phẩm</li>
                <li>
                  ✍️ Cập nhật mô tả sản phẩm hấp dẫn để tăng niềm tin khách hàng
                </li>
                <li>💬 Trả lời đánh giá nhanh để cải thiện tỷ lệ phản hồi</li>
                <li>🏷️ Cập nhật trạng thái hàng hóa theo mùa vụ</li>
              </ul>
            </div> */}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="dash-content">
            <div className="dash-section">
              <div className="dash-section__header">
                <h2 className="dash-section__title">Danh sách sản phẩm</h2>
                <div className="dash-header-actions">
                  <span className="dash-product-count">
                    {localProducts.length} sản phẩm
                  </span>
                  <button
                    className="btn btn-primary dash-add-btn"
                    disabled
                    title="Tính năng sẽ sớm ra mắt"
                  >
                    + Thêm Sản Phẩm
                  </button>
                </div>
              </div>

              <div className="dash-products-table">
                <div className="dash-table-header">
                  <span>Sản phẩm</span>
                  <span>Giá</span>
                  <span>Tồn kho</span>
                  <span>Trạng thái</span>
                  <span>Hành động</span>
                </div>
                {localProducts.map((p) => (
                  <div key={p.id} className="dash-table-row">
                    <div className="dash-tbl-product">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="dash-tbl-img"
                      />
                      <div>
                        <span className="dash-tbl-name">{p.name}</span>
                        <span className="dash-tbl-cat">📂 {p.category}</span>
                      </div>
                    </div>
                    <span className="dash-tbl-price">
                      {fmt(p.price)}/{p.unit}
                    </span>
                    <span
                      className={
                        "dash-tbl-stock-qty" +
                        (p.stockQty !== undefined &&
                        p.stockQty <= 10 &&
                        p.inStock
                          ? " dash-tbl-stock-qty--low"
                          : "")
                      }
                    >
                      {p.inStock
                        ? p.stockQty !== undefined
                          ? p.stockQty <= 10
                            ? `⚠️ ${p.stockQty} ${p.unit}`
                            : `${p.stockQty} ${p.unit}`
                          : "—"
                        : "Hết hàng"}
                    </span>
                    <span
                      className={
                        "dash-stock-badge " + (p.inStock ? "in" : "out")
                      }
                    >
                      {p.inStock ? "✅ Còn hàng" : "❌ Hết hàng"}
                    </span>
                    <div className="dash-tbl-actions">
                      <Link
                        to={`/product/${p.id}`}
                        className="dash-action-btn view"
                      >
                        Xem
                      </Link>
                      <button
                        className="dash-action-btn edit"
                        onClick={() => setEditingProduct(p)}
                      >
                        ✏️ Sửa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="dash-content">
            <div className="dash-section">
              <div className="dash-section__header">
                <h2 className="dash-section__title">Hồ sơ gian hàng</h2>
                <button
                  className={
                    "btn " +
                    (editingShop ? "btn-outline-danger" : "btn-primary")
                  }
                  onClick={() => setEditingShop((e) => !e)}
                >
                  {editingShop ? "✕ Huỷ" : "✏️ Chỉnh sửa"}
                </button>
              </div>

              <div className="dash-profile-form">
                <div className="dash-profile-cover">
                  <img
                    src={shop.coverImage}
                    alt="cover"
                    className="dash-cover-preview"
                  />
                  {editingShop && (
                    <button
                      className="dash-cover-change-btn"
                      disabled
                      title="Sắp ra mắt"
                    >
                      📷 Đổi ảnh bìa
                    </button>
                  )}
                </div>

                <div className="dash-profile-row">
                  <img
                    src={shop.avatar}
                    alt={shop.owner}
                    className="dash-profile-avatar"
                  />
                  {editingShop && (
                    <button
                      className="dash-avatar-change-btn"
                      disabled
                      title="Sắp ra mắt"
                    >
                      📷
                    </button>
                  )}
                </div>

                <div className="dash-form-grid">
                  <div className="dash-form-group">
                    <label>Tên gian hàng</label>
                    {editingShop ? (
                      <input
                        className="dash-input"
                        value={shopDraft.name}
                        onChange={(e) =>
                          setShopDraft((d) => ({ ...d, name: e.target.value }))
                        }
                      />
                    ) : (
                      <p className="dash-form-value">{shop.name}</p>
                    )}
                  </div>
                  <div className="dash-form-group">
                    <label>Địa chỉ</label>
                    {editingShop ? (
                      <input
                        className="dash-input"
                        value={shopDraft.location}
                        onChange={(e) =>
                          setShopDraft((d) => ({
                            ...d,
                            location: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <p className="dash-form-value">📍 {shop.location}</p>
                    )}
                  </div>
                  <div className="dash-form-group full-width">
                    <label>Mô tả gian hàng</label>
                    {editingShop ? (
                      <textarea
                        className="dash-textarea"
                        value={shopDraft.description}
                        onChange={(e) =>
                          setShopDraft((d) => ({
                            ...d,
                            description: e.target.value,
                          }))
                        }
                        rows={5}
                      />
                    ) : (
                      <p className="dash-form-value">{shop.description}</p>
                    )}
                  </div>
                </div>

                {editingShop && (
                  <div className="dash-form-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        alert(
                          "✅ Thông tin đã được lưu! (Demo mode — không lưu vào backend)",
                        );
                        setEditingShop(false);
                      }}
                    >
                      💾 Lưu thay đổi
                    </button>
                  </div>
                )}

                {/* Certifications */}
                <div className="dash-certs-section">
                  <h3 className="dash-certs-title">🏅 Chứng nhận</h3>
                  <div className="dash-certs-list">
                    {shop.certifications.length > 0 ? (
                      shop.certifications.map((c) => (
                        <span key={c} className="dash-cert-tag">
                          {c}
                        </span>
                      ))
                    ) : (
                      <p className="dash-no-cert">
                        Chưa có chứng nhận. Liên hệ chúng tôi để đăng ký xác
                        minh.
                      </p>
                    )}
                    <button
                      className="dash-cert-add-btn"
                      disabled
                      title="Sắp ra mắt"
                    >
                      + Thêm chứng nhận
                    </button>
                  </div>
                </div>

                {/* Danger zone */}
                <div className="dash-danger-zone">
                  <h3 className="dash-danger-zone__title">⚠️ Vùng nguy hiểm</h3>
                  <p className="dash-danger-zone__desc">
                    Xóa gian hàng sẽ xóa vĩnh viễn tất cả sản phẩm, đơn hàng và
                    dữ liệu liên quan. Hành động này không thể hoàn tác.
                  </p>
                  <button
                    className="btn btn-danger"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    🗑️ Xóa Gian Hàng Vĩnh Viễn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
        />
      )}

      {/* Delete Shop Modal */}
      {showDeleteModal && (
        <DeleteShopModal
          shopName={shop.name}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteShop}
        />
      )}
    </main>
  );
}
