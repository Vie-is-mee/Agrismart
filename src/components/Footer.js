import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__logo"><img src="/icons/logo-nong-san-nha-que.png" alt="RễTươi" /> RễTươi</div>
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
                <Link to="/products?category=honey">Mật Ong</Link>
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
                <a href="#!">Thông Tin Giao Hàng</a>
              </li>
              <li>
                <a href="#!">Chính Sách Đổi Trả</a>
              </li>
              <li>
                <a href="#!">Cam Kết Chất Lượng</a>
              </li>
              <li>
                <a href="#!">Liên Hệ</a>
              </li>
            </ul>
          </div>

          <div className="footer__col footer__contact">
            <h4>Liên Hệ</h4>
            <p>📞 1800-RỄ-TƯƠI</p>
            <p>📧 xinchao@retươi.vn</p>
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
    </footer>
  );
}
