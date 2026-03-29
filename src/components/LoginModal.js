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
              Agri<strong>Smart</strong>
            </span>
          </div>
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
                  Phí Duy Trì Cửa Hàng trên AgriSmart
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
