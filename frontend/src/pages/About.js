import React from "react";
import { Link } from "react-router-dom";
import "./About.css";

const TEAM = [
  {
    name: "Nguyễn Minh Tuấn",
    role: "Nhà Sáng Lập & CEO",
    bio: "Cựu cán bộ Bộ Nông nghiệp, rời bỏ chính phủ để kết nối nông dân trực tiếp với người tiêu dùng.",
  },
  {
    name: "Phạm Lan Anh",
    role: "Trưởng Chuỗi Cung Ứng",
    bio: "15 năm xây dựng mạng lưới logistics xuyên suốt các vùng nông nghiệp Việt Nam.",
  },
  {
    name: "Trần Đức Khải",
    role: "Kiểm Soát Chất Lượng",
    bio: "Kỹ sư thực phẩm đảm bảo mọi sản phẩm đều đáp ứng tiêu chuẩn tươi ngon nghiêm ngặt của chúng tôi.",
  },
];

const VALUES = [
  {
    title: "Nông Dân Là Trọng Tâm",
    desc: "Chúng tôi trả cho nông dân cao hơn giá thị trường 20–40%, đảm bảo sinh kế bền vững.",
  },
  {
    title: "Truy Xuất Đầy Đủ",
    desc: "Mỗi sản phẩm ghi rõ nông trại xuất xứ, phương pháp canh tác và ngày thu hoạch.",
  },
  {
    title: "Không Trung Gian",
    desc: "Chúng tôi mua thẳng từ nông dân và bán thẳng cho bạn, giảm chi phí và tăng chất lượng.",
  },
  {
    title: "Đóng Gói Thân Thiện",
    desc: "Tất cả bao bì đều có thể phân hủy sinh học. Chúng tôi hướng đến 100% không nhựa vào năm 2026.",
  },
];

export default function About() {
  return (
    <main className="about-page">
      {/* Hero */}
      <section className="about-hero">
        <div className="container about-hero__inner">
          <div className="about-hero__text">
            <span className="about-hero__eyebrow">
              {" "}
              Câu Chuyện Của Chúng Tôi
            </span>
            <h1 className="about-hero__title">
              Bén Rễ Từ Đất, Vươn Đến Bàn Ăn Của Bạn
            </h1>
            <p className="about-hero__body">
              AgriSmart ra đời năm 2020 khi người sáng lập ghé thăm một nông
              trại ở đồng bằng sông Cửu Long và phát hiện người nông dân chỉ
              nhận được 15% so với giá người tiêu dùng ở thành phố phải trả.
              Chúng tôi xây dựng nền tảng này để thay đổi điều đó — kết nối hàng
              trăm gia đình nông dân trực tiếp với bữa ăn Việt Nam, không qua
              bất kỳ khâu trung gian không cần thiết nào.
            </p>
            <Link to="/products" className="btn btn-primary">
              Mua Sắm Ngay →
            </Link>
          </div>
          <div className="about-hero__visual">
            <div className="about-stat-ring">
              <div className="about-stat-ring__inner">
                <span>150+</span>
                <small>Nông Trại Đối Tác</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Giá trị */}
      <section className="section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: "center" }}>
            Chúng Tôi Đứng Về Phía Ai
          </h2>
          <p className="section-subtitle" style={{ textAlign: "center" }}>
            Những nguyên tắc định hướng mọi quyết định của chúng tôi
          </p>
          <div className="values-grid">
            {VALUES.map((v) => (
              <div key={v.title} className="value-card">
                <div className="value-card__icon">{v.icon}</div>
                <h3 className="value-card__title">{v.title}</h3>
                <p className="value-card__desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hành trình
      <section className="section about-timeline-section">
        <div className="container">
          <h2 className="section-title">Hành Trình Của Chúng Tôi</h2>
          <div className="timeline">
            {[
              {
                year: "2020",
                label: "Thành Lập",
                desc: "Khởi đầu với 5 nông trại ở đồng bằng sông Cửu Long, giao hàng cho 50 hộ gia đình tại TP. Hồ Chí Minh.",
              },
              {
                year: "2021",
                label: "Mở Rộng",
                desc: "Phát triển lên 40 nông trại trên 12 tỉnh thành. Ra mắt ứng dụng di động với hơn 5.000 lượt tải trong tháng đầu.",
              },
              {
                year: "2022",
                label: "Chứng Nhận",
                desc: "Được chứng nhận đối tác VietGAP và hữu cơ cho hơn 30 dòng sản phẩm.",
              },
              {
                year: "2023",
                label: "Cột Mốc",
                desc: "Đạt 50.000 khách hàng. Mở trung tâm kiểm tra chất lượng chuyên biệt tại Hà Nội và TP.HCM.",
              },
              {
                year: "2024",
                label: "Đổi Mới",
                desc: "Ra mắt livestream camera nông trại, cho phép khách hàng xem trực tiếp quá trình thu hoạch nông sản.",
              },
              {
                year: "2025",
                label: "Hôm Nay",
                desc: "150+ nông trại, phủ sóng 63 tỉnh thành và vẫn không ngừng lớn mạnh cùng bạn.",
              },
            ].map((item, i) => (
              <div
                key={item.year}
                className={
                  "timeline-item" +
                  (i % 2 === 0
                    ? " timeline-item--left"
                    : " timeline-item--right")
                }
              >
                <div className="timeline-dot">{item.year}</div>
                <div className="timeline-content">
                  <h4>{item.label}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Đội ngũ */}
      <section className="section" style={{ background: "white" }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: "center" }}>
            Gặp Gỡ Đội Ngũ
          </h2>
          <p className="section-subtitle" style={{ textAlign: "center" }}>
            Những người kết nối nông trại với gia đình bạn
          </p>
          <div className="team-grid">
            {TEAM.map((person) => (
              <div key={person.name} className="team-card">
                <div className="team-card__avatar">{person.emoji}</div>
                <h3 className="team-card__name">{person.name}</h3>
                <p className="team-card__role">{person.role}</p>
                <p className="team-card__bio">{person.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="container about-cta__inner">
          <h2>Sẵn sàng cảm nhận sự khác biệt?</h2>
          <p>
            Tươi thẳng từ nông trại — chất lượng đảm bảo, trực tiếp từ tay người
            trồng.
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <Link to="/products" className="btn btn-secondary">
              Khám Phá Sản Phẩm →
            </Link>
            <a
              href="mailto:xinchao@retươi.vn"
              className="btn btn-outline"
              style={{ borderColor: "rgba(255,255,255,0.5)", color: "white" }}
            >
              Liên Hệ Chúng Tôi
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
