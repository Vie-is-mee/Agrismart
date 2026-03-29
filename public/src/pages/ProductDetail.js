import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductById, products } from "../data/products";
import { getShopByProductId } from "../data/shops";
import { getReviewsByProductId, getRatingDistribution } from "../data/reviews";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import ProductCard from "../components/ProductCard";
import "./ProductDetail.css";

function fmt(n) { return n.toLocaleString("vi-VN") + "₫"; }

function Stars({ rating, size = "1.1rem" }) {
  return (
    <span className="stars" style={{ color: "var(--amber)", fontSize: size }}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
    </span>
  );
}

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rating-bar-row">
      <span className="rating-bar-label">{star}★</span>
      <div className="rating-bar-track">
        <div className="rating-bar-fill" style={{ width: pct + "%" }} />
      </div>
      <span className="rating-bar-count">{count}</span>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-avatar">{review.initials}</div>
        <div className="review-meta">
          <span className="review-author">{review.author}</span>
          <span className="review-date">{new Date(review.date).toLocaleDateString("vi-VN")}</span>
        </div>
        <div className="review-stars">
          <Stars rating={review.rating} size="0.95rem" />
        </div>
      </div>
      <p className="review-content">{review.content}</p>
      {review.images && review.images.length > 0 && (
        <div className="review-images">
          {review.images.map((img, idx) => (
            <img key={idx} src={img.url} alt={"Ảnh đánh giá " + (idx + 1)} className="review-image-thumb" />
          ))}
        </div>
      )}
      <button className="review-helpful-btn">
        👍 Hữu ích ({review.helpful})
      </button>
    </div>
  );
}

function WriteReview({ productId, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [images, setImages] = useState([]);
  const fileInputRef = React.useRef(null);

  function handleImageChange(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setImages(prev => prev.length < 5 ? [...prev, { url: ev.target.result, name: file.name }] : prev);
      };
      reader.readAsDataURL(file);
    });
    // reset input so same file can be re-selected
    e.target.value = "";
  }

  function removeImage(idx) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit() {
    if (!rating || !content.trim() || !name.trim()) return;
    onSubmit({ rating, content, author: name, images });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="review-submitted">
        <span>🎉</span>
        <div>
          <b>Cảm ơn bạn đã đánh giá!</b>
          <p>Đánh giá của bạn sẽ được hiển thị sau khi kiểm duyệt.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="write-review">
      <h4 className="write-review__title">✍️ Viết đánh giá của bạn</h4>
      <div className="write-review__form">
        <div className="wr-field">
          <label>Họ tên</label>
          <input
            className="wr-input"
            placeholder="Nhập tên của bạn"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="wr-field">
          <label>Đánh giá sao</label>
          <div className="wr-stars">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                className={"wr-star" + (s <= (hovered || rating) ? " active" : "")}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(s)}
              >
                ★
              </button>
            ))}
            <span className="wr-star-label">
              {rating === 1 ? "Rất tệ" : rating === 2 ? "Tệ" : rating === 3 ? "Bình thường" : rating === 4 ? "Tốt" : rating === 5 ? "Xuất sắc!" : ""}
            </span>
          </div>
        </div>
        <div className="wr-field full">
          <label>Nhận xét</label>
          <textarea
            className="wr-textarea"
            rows={4}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
        <div className="wr-field full">
          <label>Hình ảnh sản phẩm <span className="wr-optional">(tùy chọn, tối đa 5 ảnh)</span></label>
          <div className="wr-image-upload">
            <button
              type="button"
              className="wr-upload-btn"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={images.length >= 5}
            >
              📷 Thêm ảnh
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
            {images.length > 0 && (
              <div className="wr-image-previews">
                {images.map((img, idx) => (
                  <div key={idx} className="wr-image-preview">
                    <img src={img.url} alt={img.name} />
                    <button
                      type="button"
                      className="wr-image-remove"
                      onClick={() => removeImage(idx)}
                      aria-label="Xóa ảnh"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          className={"btn btn-primary wr-submit" + (!rating || !content.trim() || !name.trim() ? " disabled" : "")}
          onClick={handleSubmit}
          disabled={!rating || !content.trim() || !name.trim()}
        >
          Gửi Đánh Giá
        </button>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const baseProduct = getProductById(id);
  const [localOverrides, setLocalOverrides] = useState({});
  const product = baseProduct ? { ...baseProduct, ...localOverrides } : null;
  const { dispatch } = useCart();
  const { addToast } = useToast();
  const [qty, setQty] = useState(product?.minOrder || 1);

  const shop = product ? getShopByProductId(product.id) : null;
  const reviewsFromData = product ? getReviewsByProductId(product.id) : [];
  const [localReviews, setLocalReviews] = useState([]);
  const allReviews = [...localReviews, ...reviewsFromData];
  const ratingDist = product ? getRatingDistribution(product.id) : {};

  if (!product) {
    return (
      <div className="not-found">
        <h2>🌱 Không tìm thấy sản phẩm</h2>
        <p>Sản phẩm này có thể không còn được bán nữa.</p>
        <Link to="/products" className="btn btn-primary">Quay Lại Cửa Hàng</Link>
      </div>
    );
  }

  const related = products
    .filter(p => p.category === product.category && p.id !== product.id && p.inStock)
    .slice(0, 4);

  function handleAdd() {
    dispatch({ type: "ADD", product, qty });
    dispatch({ type: "TOGGLE_OPEN" });
    addToast(`Đã thêm ${qty} × ${product.name}!`, "🛒");
  }

  function handleSaveProductEdits(changes) {
    setLocalOverrides(prev => ({ ...prev, ...changes }));
    if (changes.qty !== undefined) setQty(Math.max(product.minOrder || 1, changes.qty < qty ? changes.qty : qty));
  }

  function handleNewReview(review) {
    const newReview = {
      id: "local-" + Date.now(),
      productId: product.id,
      author: review.author,
      initials: review.author.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase(),
      rating: review.rating,
      date: new Date().toISOString().split("T")[0],
      content: review.content,
      helpful: 0,
      images: review.images || [],
    };
    setLocalReviews(prev => [newReview, ...prev]);
  }

  return (
    <main className="product-detail">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Trang Chủ</Link>
          <span>›</span>
          <Link to="/products">Sản Phẩm</Link>
          <span>›</span>
          <Link to={"/products?category=" + product.category}>
            {product.category === "fruits"     ? "Trái Cây"          :
             product.category === "vegetables" ? "Rau Củ"            :
             product.category === "grains"     ? "Gạo & Ngũ Cốc"    :
             product.category === "herbs"      ? "Gia Vị & Thảo Mộc" :
             product.category === "honey"      ? "Mật Ong"           :
             product.category === "dried"      ? "Đặc Sản Khô"       :
             product.category}
          </Link>
          <span>›</span>
          <span>{product.name}</span>
        </nav>

        {/* Main layout */}
        <div className="pd-layout">
          {/* Image */}
          <div className="pd-image-col">
            <div className="pd-image-wrap">
              <img src={product.image} alt={product.name} className="pd-image" />
              {product.badge && (
                <span className={"pd-badge badge badge-" + product.badgeType}>
                  {product.badge}
                </span>
              )}
              {!product.inStock && (
                <div className="pd-soldout-overlay">Hết Hàng</div>
              )}
            </div>
            {product.tags && (
              <div className="pd-tags">
                {product.tags.map(tag => (
                  <span key={tag} className="pd-tag">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pd-info">
            <p className="pd-origin">📍 {product.origin}</p>
            <h1 className="pd-name">{product.name}</h1>

            <div className="pd-rating-row">
              <Stars rating={product.rating} />
              <span className="pd-rating-num">{product.rating}</span>
              <span className="pd-rating-count">({product.reviews} đánh giá)</span>
            </div>

            <div className="pd-price-row">
              <span className="pd-price">{fmt(product.price)}</span>
              <span className="pd-unit"> / {product.unit}</span>
            </div>

            {/* Stock info */}
            <div className="pd-stock-info">
              {product.inStock ? (
                <>
                  <span className="pd-stock-badge pd-stock-badge--in">✅ Còn hàng</span>
                  {product.stockQty !== undefined && (
                    <span className={
                      "pd-stock-qty" +
                      (product.stockQty <= 10 ? " pd-stock-qty--low" :
                       product.stockQty <= 30 ? " pd-stock-qty--medium" : "")
                    }>
                      {product.stockQty <= 0 ? null :
                       product.stockQty <= 10 ? `⚠️ Chỉ còn ${product.stockQty} ${product.unit}` :
                       product.stockQty <= 30 ? `📦 Còn ${product.stockQty} ${product.unit}` :
                       `📦 Còn ${product.stockQty} ${product.unit}`}
                    </span>
                  )}
                </>
              ) : (
                <span className="pd-stock-badge pd-stock-badge--out">❌ Hết hàng</span>
              )}
            </div>

            <p className="pd-description">{product.description}</p>

            {/* Shop info card */}
            {shop && (
              <Link to={`/shop/${shop.id}`} className="pd-shop-card">
                <img src={shop.avatar} alt={shop.owner} className="pd-shop-avatar" />
                <div className="pd-shop-info">
                  <span className="pd-shop-label">🏪 Gian hàng</span>
                  <span className="pd-shop-name">{shop.name}</span>
                  <span className="pd-shop-sub">
                    ⭐ {shop.rating} · 📦 {shop.totalSales.toLocaleString("vi-VN")} đơn
                    {shop.verified && <span className="pd-shop-verified">✓ Xác minh</span>}
                  </span>
                </div>
                <span className="pd-shop-arrow">›</span>
              </Link>
            )}

            {/* Add to cart */}
            {product.inStock ? (
              <div className="pd-add-section">
                <div className="pd-qty-control">
                  <button onClick={() => setQty(q => Math.max(product.minOrder || 1, q - 1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => product.stockQty ? Math.min(product.stockQty, q + 1) : q + 1)}>+</button>
                </div>
                {product.stockQty !== undefined && product.stockQty > 0 && (
                  <p className="pd-qty-hint">Tối đa {product.stockQty} {product.unit}</p>
                )}
                <div className="pd-subtotal">
                  Thành tiền: <strong>{fmt(product.price * qty)}</strong>
                </div>
                <button className="btn btn-primary pd-add-btn" onClick={handleAdd}>
                  🛒 Thêm Vào Giỏ Hàng
                </button>
              </div>
            ) : (
              <div className="pd-oos-notice">
                <span>⚠️</span>
                <div>
                  <b>Hiện Đang Hết Hàng</b>
                  <p>Sản phẩm này sẽ có trong mùa thu hoạch tiếp theo.</p>
                </div>
              </div>
            )}

            {/* Guarantees */}
            <div className="pd-guarantees">
              <div className="pd-guarantee"><span>🌿</span><p>100% Tự Nhiên & Tươi</p></div>
              <div className="pd-guarantee"><span>🚚</span><p>Giao trong ngày</p></div>
              <div className="pd-guarantee"><span>🔄</span><p>Đảm bảo độ tươi</p></div>
            </div>
          </div>
        </div>

        {/* Thông Tin Chi Tiết Section */}
        <div className="pd-section">
          <h2 className="pd-section-title">📋 Thông Tin Chi Tiết</h2>
          <div className="pd-section-content">
            <table className="pd-details-table">
              <tbody>
                <tr><td>Sản phẩm</td><td>{product.name}</td></tr>
                <tr><td>Xuất xứ</td><td>{product.origin}</td></tr>
                <tr><td>Danh mục</td><td>{product.category}</td></tr>
                <tr><td>Đơn vị</td><td>{product.unit}</td></tr>
                <tr><td>Đặt hàng tối thiểu</td><td>{product.minOrder} {product.unit}</td></tr>
                <tr><td>Tình trạng</td><td>{product.inStock ? "✅ Còn Hàng" : "❌ Hết Hàng"}</td></tr>
                {shop && (
                  <tr>
                    <td>Gian hàng</td>
                    <td>
                      <Link to={`/shop/${shop.id}`} style={{ color: "var(--green-main)", fontWeight: 700 }}>
                        {shop.name}
                      </Link>
                    </td>
                  </tr>
                )}
                {product.tags && <tr><td>Nhãn</td><td>{product.tags.join(", ")}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Đánh Giá Section */}
        <div className="pd-section">
          <h2 className="pd-section-title">⭐ Đánh Giá ({allReviews.length})</h2>
          <div className="pd-section-content">
            <div className="pd-reviews-section">
              {/* Summary */}
              <div className="reviews-summary">
                <div className="reviews-summary__score">
                  <span className="reviews-big-score">{product.rating}</span>
                  <Stars rating={product.rating} size="1.4rem" />
                  <span className="reviews-total-count">{product.reviews} đánh giá</span>
                </div>
                <div className="reviews-summary__bars">
                  {[5, 4, 3, 2, 1].map(s => (
                    <RatingBar
                      key={s}
                      star={s}
                      count={ratingDist[s] || 0}
                      total={Object.values(ratingDist).reduce((a, b) => a + b, 0)}
                    />
                  ))}
                </div>
              </div>

              {/* Review list */}
              {allReviews.length > 0 ? (
                <div className="reviews-list">
                  {allReviews.map(r => <ReviewCard key={r.id} review={r} />)}
                </div>
              ) : (
                <div className="reviews-empty">
                  <span>💬</span>
                  <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                </div>
              )}

              {/* Write review */}
              <WriteReview productId={product.id} onSubmit={handleNewReview} />
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="pd-related">
            <h2 className="section-title">Sản Phẩm Tương Tự</h2>
            <p className="section-subtitle">Thêm những lựa chọn tươi ngon cùng danh mục</p>
            <div className="products-grid">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
