import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  const [activePolicy, setActivePolicy] = useState(null);

  const policies = {
    shipping: {
      title: "🚚 Chính Sách Giao Hàng AgriSmart",
      points: [
        "**Khu vực phục vụ:** Giao hàng nhanh tại TP. Hồ Chí Minh, Hà Nội, Đà Nẵng, Cần Thơ.",
        "**Hạn mức miễn phí:** Miễn phí giao hàng cho tất cả các đơn hàng từ **500.000₫** trở lên.",
        "**Phí vận chuyển tiêu chuẩn:** 30.000₫ cho các đơn hàng dưới 500.000₫.",
        "**Thời gian nhận hàng:** Đơn đặt trước 10:00 sáng sẽ giao ngay trong chiều. Các đơn hàng khác cam kết giao trong vòng 24h để đảm bảo độ tươi mới tối đa của nông sản."
      ]
    },
    returns: {
      title: "🔄 Chính Sách Đổi Trả 24h",
      points: [
        "**Cam kết đổi trả 100%:** Vì nông sản là thực phẩm tươi sống, AgriSmart sẵn sàng hoàn tiền hoặc đổi mới sản phẩm miễn phí trong vòng 24h nếu sản phẩm bị dập nát, héo úa hoặc không đúng mô tả.",
        "**Quy trình cực kỳ đơn giản:** Khách hàng chỉ cần chụp ảnh tình trạng sản phẩm bị lỗi và gửi về Hotline 1800-6969 hoặc Zalo hỗ trợ. Chúng tôi sẽ xử lý đền bù lập tức!",
        "**Không cần gửi lại hàng hỏng:** Đối với thực phẩm hư hỏng do vận chuyển, quý khách chỉ cần chụp hình mà không cần tốn công trả lại hàng."
      ]
    },
    quality: {
      title: "🌿 Cam Kết Chất Lượng Nông Sản Sạch",
      points: [
        "**Chuẩn canh tác an toàn:** 100% nông sản tại AgriSmart được sản xuất theo quy chuẩn sạch VietGAP, GlobalGAP hoặc hữu cơ (Organic) không có hóa chất độc hại.",
        "**Nguồn gốc rõ ràng:** Từng gói sản phẩm đều dán tem truy xuất nguồn gốc, ghi rõ tên nông trại, ngày thu hoạch, người trồng và phương pháp bảo quan tự nhiên.",
        "**Độ tươi ngon tuyệt đối:** Nông sản được thu hoạch trực tiếp tại nông trại vào sáng sớm và vận chuyển ngay trong ngày đến tay quý khách, giảm tối đa thời gian lưu kho."
      ]
    },
    contact: {
      title: "📞 Thông Tin Liên Hệ AgriSmart",
      points: [
        "**Hotline miễn phí cuộc gọi:** 1800-6969 (Thời gian hỗ trợ: 7:00 – 21:00, hoạt động cả thứ Bảy và Chủ Nhật).",
        "**Email tiếp nhận phản hồi:** xinchao@agrismart.vn",
        "**Địa chỉ văn phòng:** Tòa nhà AgriSmart, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh.",
        "**Hỗ trợ bà con nông dân:** Nếu bạn là hợp tác xã hoặc nông dân đang cần tìm đầu ra ổn định, hãy liên hệ ngay số hotline để kỹ sư nông nghiệp của chúng tôi đến khảo sát chất lượng đất/nước và hỗ trợ tạo gian hàng miễn phí!"
      ]
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo">
              <img src="/icons/logo-nong-san-nha-que.png" alt="AgriSmart" />{" "}
              AgriSmart
            </div>
            <p className="footer__tagline">
              Kết nối nông dân với bàn ăn của bạn — tươi ngon, trung thực và gắn
              kết cộng đồng.
            </p>
          </div>

          <div className="footer__col">
            <h4>Danh Mục</h4>
            <ul>
              <li>
                <Link to="/products?category=fruits">Trái Cây Tươi</Link>
              </li>
              <li>
                <Link to="/products?category=vegetables">Rau Củ Quả</Link>
              </li>
              <li>
                <Link to="/products?category=grains">Gạo & Ngũ Cốc</Link>
              </li>
              <li>
                <Link to="/products?category=herbs">Gia Vị & Thảo Mộc</Link>
              </li>
              <li>
                <Link to="/products?category=dried">Đặc Sản Khô</Link>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <h4>Hỗ Trợ</h4>
            <ul>
              <li>
                <Link to="/about">Về Chúng Tôi</Link>
              </li>
              <li>
                <a href="#!" onClick={(e) => { e.preventDefault(); setActivePolicy("shipping"); }}>Thông Tin Giao Hàng</a>
              </li>
              <li>
                <a href="#!" onClick={(e) => { e.preventDefault(); setActivePolicy("returns"); }}>Chính Sách Đổi Trả</a>
              </li>
              <li>
                <a href="#!" onClick={(e) => { e.preventDefault(); setActivePolicy("quality"); }}>Cam Kết Chất Lượng</a>
              </li>
              <li>
                <a href="#!" onClick={(e) => { e.preventDefault(); setActivePolicy("contact"); }}>Liên Hệ</a>
              </li>
            </ul>
          </div>

          <div className="footer__col footer__contact">
            <h4>Liên Hệ</h4>
            <p>📞 1800-6969</p>
            <p>📧 xinchao@agrismart.vn</p>
            <p>⏰ Thứ 2–7: 7:00 – 21:00</p>
            <div className="footer__trust-badges">
              <span> Đảm Bảo Chất Lượng</span>
              <span> Giao Hàng Nhanh</span>
              <span> Thanh Toán An Toàn</span>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>Làm vì nông dân Việt Nam</p>
        </div>
      </div>

      {/* Policy Modal Overlay */}
      {activePolicy && (
        <div className="modal-overlay" onClick={() => setActivePolicy(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3 className="modal-title footer-modal__title">{policies[activePolicy].title}</h3>
              <button className="modal-close-btn" onClick={() => setActivePolicy(null)}>✕</button>
            </div>
            <div className="modal-body footer-modal__content">
              <ul className="footer-modal__list">
                {policies[activePolicy].points.map((pt, index) => {
                  const parts = pt.split("**");
                  return (
                    <li key={index}>
                      {parts.map((text, idx) => idx % 2 === 1 ? <strong key={idx}>{text}</strong> : text)}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setActivePolicy(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
