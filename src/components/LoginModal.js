import React, { useState } from "react";
import "./LoginModal.css";

const STEPS = {
  TYPE: "type",
  FORM: "form",
  TAX: "tax",
};

export default function LoginModal({ isOpen, onClose, onLogin }) {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(STEPS.TYPE);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    confirm: "",
    bizName: "",
    bizLicense: null,
    qualityCert: null,
  });

  if (!isOpen) return null;

  function handleChange(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }
  function handleFile(field, file) {
    setForm((f) => ({ ...f, [field]: file }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại";
    else if (!/^0\d{9}$/.test(form.phone.trim()))
      e.phone = "Số điện thoại không hợp lệ";
    if (!form.password) e.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 6)
      e.password = "Mật khẩu tối thiểu 6 ký tự";
    if (form.password !== form.confirm) e.confirm = "Mật khẩu không khớp";
    if (role === "seller") {
      if (!form.bizName.trim()) e.bizName = "Vui lòng nhập tên hộ kinh doanh";
      if (!form.bizLicense)
        e.bizLicense = "Vui lòng tải lên giấy phép kinh doanh";
      if (!form.qualityCert)
        e.qualityCert = "Vui lòng tải lên chứng nhận chất lượng cây trồng";
    }
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (mode === "login") {
      const errs = {};
      if (!form.phone.trim()) errs.phone = "Vui lòng nhập số điện thoại";
      if (!form.password) errs.password = "Vui lòng nhập mật khẩu";
      if (Object.keys(errs).length) {
        setErrors(errs);
        return;
      }
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1200));
      setLoading(false);
      onLogin?.({ name: "Người dùng", phone: form.phone, role: "buyer" });
      onClose?.();
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (role === "seller") {
      setStep(STEPS.TAX);
    } else {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 1200));
      setLoading(false);
      onLogin?.({ name: form.name, phone: form.phone, role });
      onClose?.();
    }
  }

  async function handleTaxContinue() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    onLogin?.({ name: form.name, phone: form.phone, role: "seller" });
    onClose?.();
  }

  function switchMode(m) {
    setMode(m);
    setStep(m === "register" ? STEPS.TYPE : STEPS.FORM);
    setRole(null);
    setErrors({});
  }

  return (
    <div
      className="lm-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="lm-card">
        <div className="lm-card__top">
          <div className="lm-card__leaf lm-card__leaf--1"></div>
          <div className="lm-card__leaf lm-card__leaf--2"></div>
          <div className="lm-card__leaf lm-card__leaf--3"></div>
          <div className="lm-card__brand">
            <span className="lm-card__brand-icon">
              <img src="/icons/logo-nong-san-nha-que.png" alt="logo" />
            </span>
            <span className="lm-card__brand-text">
              Rễ<strong>Tươi</strong>
            </span>
          </div>
          <p className="lm-card__tagline">
            Chợ nông sản sạch, trực tiếp từ nông dân
          </p>
        </div>

        <div className="lm-tabs">
          <button
            className={`lm-tab ${mode === "login" ? "lm-tab--active" : ""}`}
            onClick={() => switchMode("login")}
          >
            Đăng Nhập
          </button>
          <button
            className={`lm-tab ${mode === "register" ? "lm-tab--active" : ""}`}
            onClick={() => switchMode("register")}
          >
            Đăng Ký
          </button>
        </div>

        {/* STEP 1: CHỌN LOẠI TÀI KHOẢN */}
        {mode === "register" && step === STEPS.TYPE && (
          <div className="lm-type-screen">
            <p className="lm-type-title">Bạn muốn đăng ký với tư cách?</p>
            <div className="lm-type-cards">
              <button
                className={`lm-type-card ${role === "buyer" ? "lm-type-card--active" : ""}`}
                onClick={() => setRole("buyer")}
              >
                <span className="lm-type-card__name">Người Mua Hàng</span>
                <span className="lm-type-card__desc">
                  Mua sắm nông sản sạch từ các gian hàng uy tín
                </span>
                {role === "buyer" && (
                  <span className="lm-type-card__check">✓</span>
                )}
              </button>
              <button
                className={`lm-type-card lm-type-card--seller ${role === "seller" ? "lm-type-card--active" : ""}`}
                onClick={() => setRole("seller")}
              >
                <span className="lm-type-card__name">Người Bán Hàng</span>
                <span className="lm-type-card__desc">
                  Mở gian hàng, kinh doanh nông sản trực tiếp tới người tiêu
                  dùng
                </span>
                <span className="lm-type-card__badge">Cần xét duyệt</span>
                {role === "seller" && (
                  <span className="lm-type-card__check">✓</span>
                )}
              </button>
            </div>
            <button
              className="lm-submit"
              disabled={!role}
              onClick={() => setStep(STEPS.FORM)}
            >
              Tiếp Tục →
            </button>
          </div>
        )}

        {/* STEP 2: FORM */}
        {(mode === "login" || (mode === "register" && step === STEPS.FORM)) && (
          <form className="lm-form" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="lm-back-row">
                <button
                  type="button"
                  className="lm-back-btn"
                  onClick={() => setStep(STEPS.TYPE)}
                >
                  ← Quay lại
                </button>
                <span className="lm-role-badge">
                  {role === "buyer" ? "Người mua" : "Người bán"}
                </span>
              </div>
            )}

            {mode === "register" && (
              <div className="lm-field">
                <label className="lm-label">Họ và tên</label>
                <div className="lm-input-wrap">
                  <input
                    className={`lm-input ${errors.name ? "lm-input--error" : ""}`}
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
                {errors.name && <p className="lm-error">{errors.name}</p>}
              </div>
            )}

            <div className="lm-field">
              <label className="lm-label">Số điện thoại</label>
              <div className="lm-input-wrap">
                <input
                  className={`lm-input ${errors.phone ? "lm-input--error" : ""}`}
                  type="tel"
                  placeholder="0912 345 678"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
              {errors.phone && <p className="lm-error">{errors.phone}</p>}
            </div>

            <div className="lm-field">
              <label className="lm-label">Mật khẩu</label>
              <div className="lm-input-wrap">
                <input
                  className={`lm-input ${errors.password ? "lm-input--error" : ""}`}
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </div>
              {errors.password && <p className="lm-error">{errors.password}</p>}
            </div>

            {mode === "register" && (
              <div className="lm-field">
                <label className="lm-label">Xác nhận mật khẩu</label>
                <div className="lm-input-wrap">
                  <input
                    className={`lm-input ${errors.confirm ? "lm-input--error" : ""}`}
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={form.confirm}
                    onChange={(e) => handleChange("confirm", e.target.value)}
                  />
                </div>
                {errors.confirm && <p className="lm-error">{errors.confirm}</p>}
              </div>
            )}

            {/* SELLER EXTRA FIELDS */}
            {mode === "register" && role === "seller" && (
              <div className="lm-seller-section">
                <div className="lm-seller-section__header">
                  <span></span> Thông tin Hộ Kinh Doanh
                </div>

                <div className="lm-field">
                  <label className="lm-label">
                    Tên Hộ Kinh Doanh <span className="lm-required">*</span>
                  </label>
                  <div className="lm-input-wrap">
                    <input
                      className={`lm-input ${errors.bizName ? "lm-input--error" : ""}`}
                      type="text"
                      placeholder="VD: Vườn Rau Sạch Bà Ba"
                      value={form.bizName}
                      onChange={(e) => handleChange("bizName", e.target.value)}
                    />
                  </div>
                  {errors.bizName && (
                    <p className="lm-error">{errors.bizName}</p>
                  )}
                </div>

                <div className="lm-field">
                  <label className="lm-label">
                    Giấy Phép Kinh Doanh / Buôn Bán{" "}
                    <span className="lm-required">*</span>
                  </label>
                  <p className="lm-field-hint">
                    Giấy chứng nhận đăng ký hộ kinh doanh hoặc Giấy phép buôn
                    bán do UBND cấp huyện/xã cấp (ảnh chụp hoặc PDF).
                  </p>
                  <label
                    className={`lm-file-upload ${errors.bizLicense ? "lm-file-upload--error" : ""}`}
                  >
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) =>
                        handleFile("bizLicense", e.target.files[0])
                      }
                    />
                    {form.bizLicense ? (
                      <span className="lm-file-name">
                        {form.bizLicense.name}
                      </span>
                    ) : (
                      <span className="lm-file-placeholder">
                        Chọn file (JPG, PNG, PDF)
                      </span>
                    )}
                  </label>
                  {errors.bizLicense && (
                    <p className="lm-error">{errors.bizLicense}</p>
                  )}
                </div>

                <div className="lm-field">
                  <label className="lm-label">
                    Chứng Nhận Chất Lượng Cây Trồng{" "}
                    <span className="lm-required">*</span>
                  </label>
                  <p className="lm-field-hint">
                    Chứng nhận VietGAP, GlobalGAP, hữu cơ USDA/EU, hoặc xác nhận
                    của cơ quan nông nghiệp địa phương.
                  </p>
                  <label
                    className={`lm-file-upload ${errors.qualityCert ? "lm-file-upload--error" : ""}`}
                  >
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) =>
                        handleFile("qualityCert", e.target.files[0])
                      }
                    />
                    {form.qualityCert ? (
                      <span className="lm-file-name">
                        {form.qualityCert.name}
                      </span>
                    ) : (
                      <span className="lm-file-placeholder">
                        Chọn file (JPG, PNG, PDF)
                      </span>
                    )}
                  </label>
                  {errors.qualityCert && (
                    <p className="lm-error">{errors.qualityCert}</p>
                  )}
                </div>

                <p className="lm-seller-note">
                  ⏳ Hồ sơ sẽ được xét duyệt trong vòng{" "}
                  <strong>1–3 ngày làm việc</strong>. Bạn sẽ nhận thông báo qua
                  SMS khi tài khoản được kích hoạt.
                </p>
              </div>
            )}

            {mode === "login" && (
              <div className="lm-forgot">
                <a href="#forgot">Quên mật khẩu?</a>
              </div>
            )}

            <button className="lm-submit" type="submit" disabled={loading}>
              {loading ? (
                <span className="lm-spinner" />
              ) : mode === "login" ? (
                "Đăng Nhập"
              ) : role === "seller" ? (
                "Tiếp Theo: Hướng dẫn thuế/phí →"
              ) : (
                "Tạo Tài Khoản"
              )}
            </button>

            <div className="lm-divider">
              <span>hoặc tiếp tục với</span>
            </div>
            <div className="lm-socials">
              <button
                type="button"
                className="lm-social-btn lm-social-btn--google"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="lm-social-btn lm-social-btn--zalo"
              >
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: "14px",
                    color: "#0068ff",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Z
                </span>
                Zalo
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: HƯỚNG DẪN THUẾ PHÍ */}
        {mode === "register" && step === STEPS.TAX && (
          <div className="lm-tax-screen">
            <div className="lm-tax-header">
              <h3>Hướng dẫn Thuế & Phí Duy Trì Cửa Hàng</h3>
              <p>Vui lòng đọc kỹ trước khi hoàn tất đăng ký</p>
            </div>

            <div className="lm-tax-body">
              <div className="lm-tax-card">
                <div className="lm-tax-card__title">📋 Nghĩa vụ Thuế</div>
                <ul className="lm-tax-list">
                  <li>
                    <strong>Doanh thu dưới 100 triệu đồng/năm:</strong> Được
                    miễn thuế VAT và thuế TNCN theo Thông tư 40/2021/TT-BTC.
                  </li>
                  <li>
                    <strong>Hộ kinh doanh thông thường:</strong> Nộp thuế khoán
                    tại Chi cục Thuế địa phương theo Tờ khai mẫu 01/CNKD. Thuế
                    suất VAT 5% và TNCN 0.5% áp dụng cho buôn bán nông sản.
                  </li>
                  <li>
                    <strong>Thời hạn:</strong> Nộp thuế hàng quý hoặc theo thông
                    báo của cơ quan thuế.
                  </li>
                </ul>
              </div>

              <div className="lm-tax-card lm-tax-card--platform">
                <div className="lm-tax-card__title">
                  Phí Duy Trì Cửa Hàng trên RễTươi
                </div>
                <div className="lm-fee-table">
                  <div className="lm-fee-row lm-fee-row--header">
                    <span>Gói</span>
                    <span>Phí / tháng</span>
                    <span>Hoa hồng / đơn</span>
                  </div>
                  <div className="lm-fee-row">
                    <span>Cơ bản</span>
                    <span>Miễn phí</span>
                    <span>5%</span>
                  </div>
                  <div className="lm-fee-row lm-fee-row--highlight">
                    <span>Tiêu chuẩn</span>
                    <span>99.000 đ</span>
                    <span>3%</span>
                  </div>
                  <div className="lm-fee-row">
                    <span>Cao cấp</span>
                    <span>299.000 đ</span>
                    <span>1.5%</span>
                  </div>
                </div>
                <p className="lm-tax-note">
                  Phí nền tảng được trừ trực tiếp vào doanh thu mỗi đơn hàng.
                  Bạn có thể thay đổi gói bất cứ lúc nào trong Bảng điều khiển.
                </p>
              </div>

              <div className="lm-tax-card">
                <div className="lm-tax-card__title">Hình thức Nộp Thuế</div>
                <ul className="lm-tax-list">
                  <li>
                    <strong>Online:</strong> Cổng thuế điện tử{" "}
                    <a
                      href="https://thuedientu.gdt.gov.vn"
                      target="_blank"
                      rel="noreferrer"
                    >
                      thuedientu.gdt.gov.vn
                    </a>{" "}
                    hoặc ứng dụng eTax Mobile.
                  </li>
                  <li>
                    <strong>Tại ngân hàng:</strong> Vietcombank, Agribank, BIDV,
                    VietinBank — dùng mã số thuế làm mã giao dịch.
                  </li>
                  <li>
                    <strong>Tại kho bạc / Chi cục Thuế:</strong> Nộp trực tiếp
                    kèm Giấy nộp tiền vào NSNN (mẫu C1-02/NS).
                  </li>
                </ul>
              </div>

              <div className="lm-tax-disclaimer">
                Thông tin trên mang tính chất tham khảo. Vui lòng liên hệ Chi
                cục Thuế địa phương để được tư vấn cụ thể.
              </div>
            </div>

            <div className="lm-tax-actions">
              <button
                type="button"
                className="lm-btn-secondary"
                onClick={() => setStep(STEPS.FORM)}
              >
                ← Quay lại
              </button>
              <button
                className="lm-submit lm-submit--inline"
                onClick={handleTaxContinue}
                disabled={loading}
              >
                {loading ? (
                  <span className="lm-spinner" />
                ) : (
                  "Tôi đã hiểu, Hoàn tất đăng ký"
                )}
              </button>
            </div>
          </div>
        )}

        <button className="lm-close" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      </div>
    </div>
  );
}
