import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import "./Checkout.css";

function fmt(n) { return n.toLocaleString("vi-VN") + "₫"; }

const STEPS = ["Xem Lại Đơn Hàng", "Thông Tin Giao Hàng", "Thanh Toán", "Xác Nhận"];

export default function Checkout() {
  const { items, totalPrice, totalItems, dispatch } = useCart();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", phone: "", address: "", city: "", note: "",
    payment: "cod",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const delivery = totalPrice >= 500000 ? 0 : 30000;
  const grandTotal = totalPrice + delivery;

  function updateForm(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim())    errs.name    = "Vui lòng nhập họ và tên";
    if (!form.phone.trim())   errs.phone   = "Vui lòng nhập số điện thoại";
    if (!form.address.trim()) errs.address = "Vui lòng nhập địa chỉ giao hàng";
    if (!form.city.trim())    errs.city    = "Vui lòng nhập tỉnh/thành phố";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (step === 1 && !validate()) return;
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePlaceOrder() {
    dispatch({ type: "CLEAR" });
    setSubmitted(true);
    setStep(3);
    addToast("Đặt hàng thành công! 🎉", "✅");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (items.length === 0 && !submitted) {
    return (
      <div className="checkout-empty">
        <div style={{ fontSize: "4rem" }}>🧺</div>
        <h2>Giỏ hàng của bạn đang trống</h2>
        <p>Hãy thêm nông sản tươi ngon trước khi thanh toán nhé!</p>
        <Link to="/products" className="btn btn-primary">Mua Sắm Ngay →</Link>
      </div>
    );
  }

  return (
    <main className="checkout-page">
      <div className="container">
        <h1 className="section-title" style={{ marginBottom: 8 }}>Thanh Toán</h1>

        {/* Chỉ số bước */}
        <div className="steps">
          {STEPS.map((label, i) => (
            <div key={label} className={"step" + (i === step ? " step--active" : "") + (i < step ? " step--done" : "")}>
              <div className="step__circle">{i < step ? "✓" : i + 1}</div>
              <span className="step__label">{label}</span>
              {i < STEPS.length - 1 && <div className="step__line" />}
            </div>
          ))}
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">

            {/* Bước 0 — Xem lại đơn hàng */}
            {step === 0 && (
              <div className="checkout-card">
                <h2 className="checkout-card__title">Xem Lại Đơn Hàng Của Bạn</h2>
                <ul className="checkout-items">
                  {items.map(item => (
                    <li key={item.id} className="checkout-item">
                      <img src={item.image} alt={item.name} />
                      <div className="checkout-item__info">
                        <b>{item.name}</b>
                        <small>📍 {item.origin}</small>
                        <small>{item.qty} × {fmt(item.price)}</small>
                      </div>
                      <span className="checkout-item__total">{fmt(item.price * item.qty)}</span>
                    </li>
                  ))}
                </ul>
                <button className="btn btn-primary checkout-next-btn" onClick={handleNext}>
                  Tiếp Tục Đến Giao Hàng →
                </button>
              </div>
            )}

            {/* Bước 1 — Thông tin giao hàng */}
            {step === 1 && (
              <div className="checkout-card">
                <h2 className="checkout-card__title">Thông Tin Giao Hàng</h2>
                <div className="checkout-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Họ và Tên *</label>
                      <input
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={form.name}
                        onChange={e => updateForm("name", e.target.value)}
                        className={errors.name ? "error" : ""}
                      />
                      {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>
                    <div className="form-group">
                      <label>Số Điện Thoại *</label>
                      <input
                        type="tel"
                        placeholder="0912 345 678"
                        value={form.phone}
                        onChange={e => updateForm("phone", e.target.value)}
                        className={errors.phone ? "error" : ""}
                      />
                      {errors.phone && <span className="form-error">{errors.phone}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Địa Chỉ Giao Hàng *</label>
                    <input
                      type="text"
                      placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện"
                      value={form.address}
                      onChange={e => updateForm("address", e.target.value)}
                      className={errors.address ? "error" : ""}
                    />
                    {errors.address && <span className="form-error">{errors.address}</span>}
                  </div>
                  <div className="form-group">
                    <label>Tỉnh / Thành Phố *</label>
                    <input
                      type="text"
                      placeholder="TP. Hồ Chí Minh"
                      value={form.city}
                      onChange={e => updateForm("city", e.target.value)}
                      className={errors.city ? "error" : ""}
                    />
                    {errors.city && <span className="form-error">{errors.city}</span>}
                  </div>
                  <div className="form-group">
                    <label>Ghi Chú Đơn Hàng (tùy chọn)</label>
                    <textarea
                      placeholder="Hướng dẫn giao hàng, thời gian nhận hàng, v.v..."
                      value={form.note}
                      onChange={e => updateForm("note", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="checkout-btn-row">
                  <button className="btn btn-outline" onClick={() => setStep(0)}>← Quay Lại</button>
                  <button className="btn btn-primary checkout-next-btn" onClick={handleNext}>
                    Tiếp Tục Thanh Toán →
                  </button>
                </div>
              </div>
            )}

            {/* Bước 2 — Phương thức thanh toán */}
            {step === 2 && (
              <div className="checkout-card">
                <h2 className="checkout-card__title">Phương Thức Thanh Toán</h2>
                <div className="payment-options">
                  {[
                    { value: "cod",   label: "Thanh Toán Khi Nhận Hàng", icon: "💵", desc: "Trả tiền mặt khi nhận hàng" },
                    { value: "bank",  label: "Chuyển Khoản Ngân Hàng",   icon: "🏦", desc: "Chuyển khoản trước khi giao" },
                    { value: "momo",  label: "Ví MoMo",                  icon: "💜", desc: "Thanh toán qua ví MoMo" },
                    { value: "vnpay", label: "VNPay",                    icon: "🔵", desc: "Thanh toán qua cổng VNPay" },
                  ].map(opt => (
                    <label key={opt.value} className={"payment-option" + (form.payment === opt.value ? " selected" : "")}>
                      <input
                        type="radio"
                        name="payment"
                        value={opt.value}
                        checked={form.payment === opt.value}
                        onChange={e => updateForm("payment", e.target.value)}
                      />
                      <span className="payment-option__icon">{opt.icon}</span>
                      <div>
                        <b>{opt.label}</b>
                        <small>{opt.desc}</small>
                      </div>
                    </label>
                  ))}
                </div>
                {form.payment === "bank" && (
                  <div className="bank-info">
                    <p><b>Ngân hàng:</b> Vietcombank</p>
                    <p><b>Số tài khoản:</b> 1234567890</p>
                    <p><b>Chủ tài khoản:</b> CÔNG TY TNHH RỄTƯƠI</p>
                    <p><b>Số tiền:</b> {fmt(grandTotal)}</p>
                    <p><b>Nội dung chuyển khoản:</b> Số điện thoại của bạn</p>
                  </div>
                )}
                <div className="checkout-btn-row">
                  <button className="btn btn-outline" onClick={() => setStep(1)}>← Quay Lại</button>
                  <button className="btn btn-primary checkout-next-btn" onClick={handlePlaceOrder}>
                    🎉 Đặt Hàng — {fmt(grandTotal)}
                  </button>
                </div>
              </div>
            )}

            {/* Bước 3 — Xác nhận */}
            {step === 3 && (
              <div className="checkout-card checkout-success">
                <div className="success-icon">🎉</div>
                <h2>Đặt Hàng Thành Công!</h2>
                <p className="success-msg">
                  Cảm ơn <strong>{form.name || "quý khách"}</strong>! Nông sản tươi của bạn đang trên đường đến.<br />
                  Chúng tôi sẽ gọi cho bạn tại số <strong>{form.phone || "số điện thoại của bạn"}</strong> để xác nhận.
                </p>
                <div className="success-details">
                  <div><span>📦</span><p>Mã đơn #RT-{Date.now().toString().slice(-6)}</p></div>
                  <div><span>📍</span><p>{form.address || "Địa chỉ của bạn"}, {form.city}</p></div>
                  <div><span>⏰</span><p>Dự kiến giao hàng: 2–4 giờ</p></div>
                  <div><span>💳</span><p>
                    {form.payment === "cod"   ? "Thanh toán khi nhận hàng" :
                     form.payment === "bank"  ? "Chuyển khoản ngân hàng"   :
                     form.payment === "momo"  ? "Ví MoMo"                  :
                     "VNPay"}
                  </p></div>
                </div>
                <Link to="/products" className="btn btn-primary" style={{ marginTop: 8 }}>
                  Tiếp Tục Mua Sắm →
                </Link>
              </div>
            )}
          </div>

          {/* Tóm tắt đơn hàng */}
          {step < 3 && (
            <aside className="checkout-summary">
              <h3 className="checkout-summary__title">Tóm Tắt Đơn Hàng</h3>
              <div className="checkout-summary__items">
                {items.map(item => (
                  <div key={item.id} className="summary-item">
                    <span className="summary-item__name">{item.name} × {item.qty}</span>
                    <span className="summary-item__price">{fmt(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="checkout-summary__line">
                <span>Tạm tính ({totalItems} sản phẩm)</span>
                <span>{fmt(totalPrice)}</span>
              </div>
              <div className="checkout-summary__line">
                <span>Phí giao hàng</span>
                <span className={delivery === 0 ? "free-delivery" : ""}>{delivery === 0 ? "MIỄN PHÍ 🎉" : fmt(delivery)}</span>
              </div>
              {delivery > 0 && (
                <p className="summary-delivery-hint">
                  Thêm {fmt(500000 - totalPrice)} để được miễn phí giao hàng
                </p>
              )}
              <div className="checkout-summary__total">
                <span>Tổng Cộng</span>
                <span>{fmt(grandTotal)}</span>
              </div>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
