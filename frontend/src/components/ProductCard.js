import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { getShopByProductId } from "../data/shops";
import "./ProductCard.css";

function fmt(n) {
  return n.toLocaleString("vi-VN") + "₫";
}

function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="stars" title={`${rating} / 5 sao`}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(5 - full - (half ? 1 : 0))}
    </span>
  );
}

export default function ProductCard({ product }) {
  const { dispatch } = useCart();
  const { addToast } = useToast();
  const shop = getShopByProductId(product.id);

  function handleAdd(e) {
    e.preventDefault();
    if (!product.inStock) return;
    dispatch({ type: "ADD", product, qty: product.minOrder || 1 });
    addToast(`Đã thêm ${product.name} vào giỏ hàng!`);
  }

  return (
    <Link to={`/product/${product.id}`} className="product-card" tabIndex={0}>
      <div className="product-card__img-wrap">
        <img
          src={product.image}
          alt={product.name}
          className="product-card__img"
          loading="lazy"
        />
        {product.badge && (
          <span
            className={`product-card__badge badge badge-${product.badgeType}`}
          >
            {product.badge}
          </span>
        )}
        {!product.inStock && (
          <div className="product-card__soldout">Hết Hàng</div>
        )}
      </div>
      <div className="product-card__body">
        <p className="product-card__origin">📍 {product.origin}</p>
        <h3 className="product-card__name">{product.name}</h3>
        {shop && (
          <span
            className="product-card__shop"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/shop/${shop.id}`;
            }}
            title={`Xem gian hàng: ${shop.name}`}
          >
            🏪 {shop.name}
            {shop.verified && (
              <span className="product-card__shop-check">✓</span>
            )}
          </span>
        )}
        <div className="product-card__rating">
          <Stars rating={product.rating} />
          <span className="product-card__reviews">
            ({product.reviews} đánh giá)
          </span>
        </div>
        <div className="product-card__footer">
          <div>
            <span className="product-card__price">{fmt(product.price)}</span>
            <span className="product-card__unit"> / {product.unit}</span>
          </div>
          <button
            className={`product-card__add ${!product.inStock ? "disabled" : ""}`}
            onClick={handleAdd}
            disabled={!product.inStock}
            aria-label={`Thêm ${product.name} vào giỏ`}
          >
            {product.inStock ? "＋ Thêm" : "✗"}
          </button>
        </div>
      </div>
    </Link>
  );
}
