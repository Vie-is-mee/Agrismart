import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Cart.css";

function fmt(n) {
  return n.toLocaleString("vi-VN") + "₫";
}

export default function Cart() {
  const { items, isOpen, dispatch, totalItems, totalPrice } = useCart();

  return (
    <>
      {isOpen && (
        <div className="cart-overlay" onClick={() => dispatch({ type: "CLOSE" })} />
      )}

      <aside className={`cart-drawer ${isOpen ? "cart-drawer--open" : ""}`}>
        <div className="cart-header">
          <h2 className="cart-title">🛒 Giỏ Hàng</h2>
          <span className="cart-count">{totalItems} sản phẩm</span>
          <button
            className="cart-close"
            onClick={() => dispatch({ type: "CLOSE" })}
            aria-label="Đóng giỏ hàng"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🧺</div>
            <p>Giỏ hàng của bạn đang trống</p>
            <Link
              to="/products"
              className="btn btn-primary"
              onClick={() => dispatch({ type: "CLOSE" })}
            >
              Mua Sắm Ngay
            </Link>
          </div>
        ) : (
          <>
            <ul className="cart-items">
              {items.map(item => (
                <li key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item__img" />
                  <div className="cart-item__info">
                    <p className="cart-item__name">{item.name}</p>
                    <p className="cart-item__origin">📍 {item.origin}</p>
                    <p className="cart-item__price">{fmt(item.price)}/{item.unit}</p>
                  </div>
                  <div className="cart-item__controls">
                    <div className="qty-control">
                      <button
                        onClick={() =>
                          dispatch({ type: "UPDATE_QTY", id: item.id, qty: item.qty - 1 })
                        }
                      >−</button>
                      <span>{item.qty}</span>
                      <button
                        onClick={() =>
                          dispatch({ type: "UPDATE_QTY", id: item.id, qty: item.qty + 1 })
                        }
                      >+</button>
                    </div>
                    <p className="cart-item__subtotal">{fmt(item.price * item.qty)}</p>
                    <button
                      className="cart-item__remove"
                      onClick={() => dispatch({ type: "REMOVE", id: item.id })}
                      aria-label="Xóa sản phẩm"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-footer">
              {totalPrice < 500000 && (
                <div className="cart-delivery-hint">
                  🚚 Mua thêm {fmt(500000 - totalPrice)} để được <strong>miễn phí giao hàng</strong>!
                  <div className="delivery-bar">
                    <div
                      className="delivery-bar__fill"
                      style={{ width: `${Math.min((totalPrice / 500000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {totalPrice >= 500000 && (
                <div className="cart-delivery-hint cart-delivery-hint--achieved">
                  🎉 Bạn được <strong>miễn phí giao hàng</strong>!
                </div>
              )}
              <div className="cart-total">
                <span>Tổng cộng</span>
                <span className="cart-total__amount">{fmt(totalPrice)}</span>
              </div>
              <Link
                to="/checkout"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", fontSize: "1.05rem", padding: "16px" }}
                onClick={() => dispatch({ type: "CLOSE" })}
              >
                Tiến Hành Thanh Toán →
              </Link>
              <button
                className="cart-clear"
                onClick={() => dispatch({ type: "CLEAR" })}
              >
                Xóa toàn bộ giỏ hàng
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
