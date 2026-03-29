import React, { useState, useEffect, useCallback } from "react";
import "./Carousels.css";

const SLIDES = [
  {
    src: "/images/Slide1.jpg",
    alt: "Rau củ quả tươi từ nông trại",
    title: "Tươi Ngon Từ Nông Trại",
    subtitle: "Giao hàng trong ngày – đặt trước 10 giờ sáng",
    cta: "Mua Ngay",
    link: "/products",
  },
  {
    src: "/images/Slide2.jpg",
    alt: "Trái cây tươi ngon",
    title: "Trái Cây Theo Mùa",
    subtitle: "100% tự nhiên, không chất bảo quản nhân tạo",
    cta: "Khám Phá",
    link: "/products?category=trai-cay",
  },
  {
    src: "/images/Slide3.jpg",
    alt: "Đặc sản vùng miền",
    title: "Đặc Sản Khắp Việt Nam",
    subtitle: "150+ nông trại đối tác trên 63 tỉnh thành",
    cta: "Xem Thêm",
    link: "/products?category=dac-san",
  },
];

export default function Carousels() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback(
    (index) => {
      if (transitioning || index === current) return;
      setTransitioning(true);
      setCurrent(index);
      setTimeout(() => setTransitioning(false), 700);
    },
    [current, transitioning],
  );

  const next = useCallback(
    () => goTo((current + 1) % SLIDES.length),
    [current, goTo],
  );
  const prev = useCallback(
    () => goTo((current - 1 + SLIDES.length) % SLIDES.length),
    [current, goTo],
  );

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  return (
    <section className="carousel" aria-label="Banner hình ảnh">
      <div className="carousel__track">
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`carousel__slide ${i === current ? "carousel__slide--active" : ""}`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="carousel__img"
              draggable={false}
            />
            <div className="carousel__overlay" />
            <div className="carousel__caption">
              <span className="carousel__eyebrow">
                {" "}
                Giao hàng tận nhà từ nông trại
              </span>
              <h1 className="carousel__title">{slide.title}</h1>
              <p className="carousel__subtitle">{slide.subtitle}</p>
              <div className="carousel__ctas">
                <a
                  href={slide.link}
                  className="carousel__btn carousel__btn--primary"
                >
                  {slide.cta} →
                </a>
                <a
                  href="/about"
                  className="carousel__btn carousel__btn--outline"
                >
                  Câu Chuyện Của Chúng Tôi
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="carousel__arrow carousel__arrow--prev"
        onClick={prev}
        aria-label="Trước"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        className="carousel__arrow carousel__arrow--next"
        onClick={next}
        aria-label="Tiếp"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div className="carousel__dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`carousel__dot ${i === current ? "carousel__dot--active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Chuyển đến banner ${i + 1}`}
          />
        ))}
      </div>

      <div className="carousel__progress">
        <div key={current} className="carousel__progress-fill" />
      </div>
    </section>
  );
}
