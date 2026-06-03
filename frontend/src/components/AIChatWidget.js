import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { sendChat } from "../services/api";
import "./AIChatWidget.css";

/* Tin nhắn chào mừng */
const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "ai",
    text:
      "Xin chào! Cháu là trợ lý AI của AgriSmart.\n" +
      "Cô/chú có thể: 🛒 tìm mua nông sản, 📢 đăng bán nông sản, " +
      "hoặc 🌱 hỏi kỹ thuật trồng trọt nhé!",
    time: "08:30",
  },
];

export default function AIChatWidget() {
  const { isOpen: isCartOpen } = useCart();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [postPreview, setPostPreview] = useState(null);   // { title, description, price, quantity, payload }
  const [posting, setPosting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const hasUpdatedTimeRef = useRef(false);
  const sessionIdRef = useRef("sess-" + Math.random().toString(36).slice(2));
  const bottomRef = useRef();
  const inputRef = useRef();

  const now = () =>
    new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, analyzing, postPreview]);

  useEffect(() => {
    if (open && !hasUpdatedTimeRef.current) {
      hasUpdatedTimeRef.current = true;
      setMessages((prev) => {
        const u = [...prev];
        if (u[0]) u[0] = { ...u[0], time: now() };
        return u;
      });
    }
  }, [open]);

  // ── Gửi tin nhắn tới backend ──
  async function sendText(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (analyzing) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text,
      time: now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setAnalyzing(true);

    try {
      const res = await sendChat({
        text,
        sessionId: sessionIdRef.current,
        sellerId: 1,
      });

      // Nếu backend báo đã thu thập đủ thông tin → hiển thị preview bài đăng
      if (res.type === "seller_ready_to_post" && res.payload) {
        setMessages((m) => [
          ...m,
          {
            id: Date.now() + 1,
            role: "ai",
            text: res.message || "Cháu đã chuẩn bị xong bài đăng cho cô/chú rồi ạ! Cô/chú xem và xác nhận đăng nhé 👇",
            time: now(),
          },
        ]);
        setPostPreview(res.payload);
      } else {
        setMessages((m) => [
          ...m,
          {
            id: Date.now() + 1,
            role: "ai",
            text: res.message || "Dạ cháu chưa rõ ý cô/chú ạ.",
            time: now(),
            products: res.products || [],
          },
        ]);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 2,
          role: "ai",
          text:
            "Dạ cháu không kết nối được tới máy chủ. Cô/chú kiểm tra backend đã chạy " +
            "(http://localhost:5000) chưa giúp cháu nhé ạ.\n(" + err.message + ")",
          time: now(),
        },
      ]);
    } finally {
      setAnalyzing(false);
      inputRef.current?.focus();
    }
  }

  // ── Xác nhận đăng bài ──
  async function confirmPost() {
    if (!postPreview || posting) return;
    setPosting(true);
    try {
      const res = await sendChat({
        text: "__CONFIRM_POST__",
        sessionId: sessionIdRef.current,
        sellerId: 1,
      });
      setPostPreview(null);
      setMessages((m) => [
        ...m,
        {
          id: Date.now(),
          role: "ai",
          text: res.message || "✅ Bài đã được đăng lên shop của cô/chú thành công!",
          time: now(),
          isSuccess: true,
        },
      ]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: Date.now(),
          role: "ai",
          text: "Dạ đăng bài thất bại, cô/chú thử lại sau nhé ạ. (" + err.message + ")",
          time: now(),
        },
      ]);
    } finally {
      setPosting(false);
    }
  }

  // ── Huỷ xem trước bài đăng ──
  function cancelPost() {
    setPostPreview(null);
    setMessages((m) => [
      ...m,
      {
        id: Date.now(),
        role: "ai",
        text: "Dạ cháu đã huỷ bài đăng rồi ạ. Cô/chú muốn chỉnh sửa thông tin nào thì nhắn lại cho cháu nhé!",
        time: now(),
      },
    ]);
  }

  function renderText(t) {
    return t.split("\n").map((line, i) => (
      <span key={i}>
        {line.replace(/\*\*(.*?)\*\*/g, "$1")}
        <br />
      </span>
    ));
  }

  return (
    <>
      {!open && !isCartOpen && (
        <button className="ai-fab" onClick={() => setOpen(true)} aria-label="Mở chat AI">
          <span className="ai-fab__icon">
            <img
              src="/icons/logo-nong-san-nha-que.png"
              alt="AgriSmart AI"
              style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
            />
          </span>
          <span className="ai-fab__ping" />
        </button>
      )}

      <div className={`ai-chat ${open ? "ai-chat--open" : ""}`}>
        <div className="ai-chat__header">
          <div className="ai-chat__avatar">
            <img
              src="/icons/logo-nong-san-nha-que.png"
              alt="AgriSmart AI"
              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
            />
            <span className="ai-chat__online-dot" />
          </div>
          <div className="ai-chat__header-info">
            <span className="ai-chat__name">AI Trợ Lý Nông Sản</span>
            <span className="ai-chat__status">● Đang hoạt động</span>
          </div>
          <div className="ai-chat__header-actions">
            <button className="ai-chat__close-btn" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
        </div>

        <div className="ai-chat__messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`ai-bubble-row ai-bubble-row--${msg.role}`}>
              {msg.role === "ai" && (
                <div className="ai-bubble-avatar">
                  <img
                    src="/icons/logo-nong-san-nha-que.png"
                    alt="AgriSmart AI"
                    style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                  />
                </div>
              )}
              <div className={`ai-bubble ai-bubble--${msg.role}${msg.isSuccess ? " ai-bubble--success" : ""}`}>
                <p className="ai-bubble__text">{renderText(msg.text)}</p>

                {/* Danh sách sản phẩm trả về từ buyer-search */}
                {msg.products && msg.products.length > 0 && (
                  <div className="ai-products">
                    {msg.products.map((p) => (
                      <Link
                        to={p.detail_url || `/product/${p.id}`}
                        key={p.id}
                        className="ai-product-card"
                        onClick={() => setOpen(false)}
                      >
                        {p.image_url && <img src={p.image_url} alt={p.name} />}
                        <div className="ai-product-card__info">
                          <span className="ai-product-card__name">{p.name}</span>
                          <span className="ai-product-card__price">
                            {Number(p.price_per_kg).toLocaleString("vi-VN")}đ/kg
                          </span>
                          <span className="ai-product-card__meta">
                            ⭐ {p.rating} · {p.seller_name}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <span className="ai-bubble__time">{msg.time}</span>
              </div>
            </div>
          ))}

          {analyzing && (
            <div className="ai-bubble-row ai-bubble-row--ai">
              <div className="ai-bubble-avatar">
                <img
                  src="/icons/logo-nong-san-nha-que.png"
                  alt="AgriSmart AI"
                  style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                />
              </div>
              <div className="ai-bubble ai-bubble--ai ai-bubble--analyzing">
                <div className="ai-analyzing">
                  <span className="ai-analyzing__text">Cháu đang xử lý...</span>
                  <div className="ai-analyzing__dots">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Preview bài đăng ── */}
          {postPreview && (
            <div className="ai-post-preview">
              <div className="ai-post-preview__badge">📋 Xem trước bài đăng</div>

              <div className="ai-post-preview__card">
                <div className="ai-post-preview__header">
                  <span className="ai-post-preview__tag">🌿 Nông sản tươi</span>
                  <span className="ai-post-preview__shop">🏪 Shop của bạn</span>
                </div>

                <h3 className="ai-post-preview__title">{postPreview.title}</h3>

                <div className="ai-post-preview__meta-row">
                  <div className="ai-post-preview__meta-item">
                    <span className="ai-post-preview__meta-icon">💰</span>
                    <div>
                      <div className="ai-post-preview__meta-label">Giá bán</div>
                      <div className="ai-post-preview__meta-value ai-post-preview__price">
                        {Number(postPreview.final_price || 0).toLocaleString("vi-VN")}đ
                        <span className="ai-post-preview__unit">/kg</span>
                      </div>
                    </div>
                  </div>
                  <div className="ai-post-preview__meta-item">
                    <span className="ai-post-preview__meta-icon">📦</span>
                    <div>
                      <div className="ai-post-preview__meta-label">Số lượng</div>
                      <div className="ai-post-preview__meta-value">
                        {Number(postPreview.quantity || 0).toLocaleString("vi-VN")} kg
                      </div>
                    </div>
                  </div>
                  {postPreview.location && (
                    <div className="ai-post-preview__meta-item">
                      <span className="ai-post-preview__meta-icon">📍</span>
                      <div>
                        <div className="ai-post-preview__meta-label">Nguồn gốc</div>
                        <div className="ai-post-preview__meta-value">{postPreview.location}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ai-post-preview__desc">
                  <div className="ai-post-preview__desc-label">📝 Mô tả sản phẩm</div>
                  <p className="ai-post-preview__desc-text">{postPreview.description}</p>
                </div>

                <div className="ai-post-preview__footer-info">
                  <span>✅ Sẵn sàng đăng lên shop</span>
                  <span>🤖 AI biên soạn</span>
                </div>
              </div>

              <div className="ai-post-preview__actions">
                <button
                  className="ai-post-preview__confirm-btn"
                  onClick={confirmPost}
                  disabled={posting}
                >
                  {posting ? (
                    <>
                      <span className="ai-post-preview__spinner" />
                      Đang đăng bài...
                    </>
                  ) : (
                    <>🚀 Đăng bài lên shop</>
                  )}
                </button>
                <button
                  className="ai-post-preview__cancel-btn"
                  onClick={cancelPost}
                  disabled={posting}
                >
                  ✏️ Chỉnh sửa lại
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="ai-chat__footer">
          <form className="ai-chat__input-row" onSubmit={sendText}>
            <input
              ref={inputRef}
              className="ai-chat__input"
              type="text"
              placeholder="Nhắn tin cho AI trợ lý..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              className="ai-chat__send-btn"
              type="submit"
              disabled={analyzing || !input.trim()}
              aria-label="Gửi"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {showSuccess && (
        <div className="ai-success-toast">
          🎉 Bài đăng đã lên shop thành công!
        </div>
      )}
    </>
  );
}
