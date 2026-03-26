import React, { useState, useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";
import "./AIChatWidget.css";

/* ── Static demo messages ── */
const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "ai",
    text: "Xin chào! Tôi là trợ lý AI của AgriSmart\nBạn muốn đăng bán nông sản? Hãy gửi ảnh sản phẩm để tôi phân tích và gợi ý giá nhé!",
    time: "08:30",
  },
];

/* ── Popup component ── */
function ListingPopup({ onClose, onConfirm }) {
  return (
    <div
      className="ai-popup-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ai-popup">
        <div className="ai-popup__header">
          <div className="ai-popup__icon"></div>
          <h3 className="ai-popup__title">Phân Tích Hoàn Tất!</h3>
          <p className="ai-popup__subtitle">
            AI đã nhận diện sản phẩm và gợi ý giá thị trường
          </p>
        </div>

        <div className="ai-popup__body">
          <div className="ai-popup__field">
            <div className="ai-popup__field-label">
              <span className="ai-popup__field-icon"></span>
              Tên sản phẩm
            </div>
            <div className="ai-popup__field-value">
              Khoai lang tím sấy hữu cơ
            </div>
          </div>

          <div className="ai-popup__field">
            <div className="ai-popup__field-label">
              <span className="ai-popup__field-icon"></span>
              Đơn vị
            </div>
            <div className="ai-popup__field-value">Gói 300g</div>
          </div>

          <div className="ai-popup__field ai-popup__field--highlight">
            <div className="ai-popup__field-label">
              <span className="ai-popup__field-icon"></span>
              Mức giá AI gợi ý
            </div>
            <div className="ai-popup__field-value ai-popup__price">
              50.000₫<span className="ai-popup__unit">/gói</span>
            </div>
          </div>

          <div className="ai-popup__insight">
            <span className="ai-popup__insight-icon"></span>
            <span>
              Giá thị trường hiện tại: <strong>45.000 – 55.000₫/kg</strong> —
              Mức gợi ý đang ở phân khúc cạnh tranh tốt.
            </span>
          </div>
        </div>

        <div className="ai-popup__actions">
          <button className="ai-popup__confirm" onClick={onConfirm}>
            Xác nhận đăng lên chợ
          </button>
          <button className="ai-popup__edit" onClick={onClose}>
            Chỉnh sửa thông tin
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main widget ── */
export default function AIChatWidget() {
  const { isOpen: isCartOpen } = useCart();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const fileRef = useRef();
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, analyzing]);

  function now() {
    return new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function sendText(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const msg = { id: Date.now(), role: "user", text, time: now() };
    setMessages((m) => [...m, msg]);
    setInput("");

    // Fake AI reply
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "ai",
          text: "Cảm ơn bạn! Để định giá chính xác hơn, vui lòng gửi ảnh sản phẩm bằng nút bên dưới nhé.",
          time: now(),
        },
      ]);
    }, 1000);
    inputRef.current?.focus();
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewImg(url);

    // User sends image
    const userMsg = {
      id: Date.now(),
      role: "user",
      image: url,
      text: "Đã gửi ảnh sản phẩm",
      time: now(),
    };
    setMessages((m) => [...m, userMsg]);
    e.target.value = "";

    // Trigger analysis
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      const aiMsg = {
        id: Date.now() + 2,
        role: "ai",
        text: "Tôi đã phân tích xong ảnh của bạn!\nNhận diện: **Khoai lang tím**\n Đơn vị: Gói 300g \nGiá gợi ý: 50.000₫/kg\n\nBấm bên dưới để xem chi tiết và đăng bán!",
        time: now(),
        hasAction: true,
      };
      setMessages((m) => [...m, aiMsg]);
    }, 3000);
  }

  function handleConfirm() {
    setShowPopup(false);
    setSuccessToast(true);
    setMessages((m) => [
      ...m,
      {
        id: Date.now(),
        role: "ai",
        text: " Tuyệt vời! Sản phẩm **Khoai lang tím** của bạn đã được đăng lên chợ thành công!\nMã đơn: #FR-2024-8847\nChúc bạn bán hàng thuận lợi! ",
        time: now(),
      },
    ]);
    setTimeout(() => setSuccessToast(false), 4000);
  }

  return (
    <>
      {/* ── Floating button ── */}
      {!open && !isCartOpen && (
        <button
          className="ai-fab"
          onClick={() => setOpen(true)}
          aria-label="Mở chat AI"
        >
          <span className="ai-fab__icon">
            <img
              src="/icons/logo-nong-san-nha-que.png"
              alt="AgriSmart AI"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </span>
          <span className="ai-fab__ping" />
        </button>
      )}

      {/* ── Chat panel ── */}
      <div className={`ai-chat ${open ? "ai-chat--open" : ""}`}>
        {/* Header */}
        <div className="ai-chat__header">
          <div className="ai-chat__avatar">
            <img
              src="/icons/logo-nong-san-nha-que.png"
              alt="AgriSmart AI"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
            <span className="ai-chat__online-dot" />
          </div>
          <div className="ai-chat__header-info">
            <span className="ai-chat__name">AI Trợ Lý Nông Sản</span>
            <span className="ai-chat__status">● Đang hoạt động</span>
          </div>
          <div className="ai-chat__header-actions">
            <button className="ai-chat__icon-btn" title="Gọi điện">
              📞
            </button>
            <button
              className="ai-chat__close-btn"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-chat__messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`ai-bubble-row ai-bubble-row--${msg.role}`}
            >
              {msg.role === "ai" && (
                <div className="ai-bubble-avatar">
                  <img
                    src="/icons/logo-nong-san-nha-que.png"
                    alt="AgriSmart AI"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
              <div className={`ai-bubble ai-bubble--${msg.role}`}>
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="Ảnh sản phẩm"
                    className="ai-bubble__image"
                  />
                )}
                <p className="ai-bubble__text">
                  {msg.text.split("\n").map((line, i) => (
                    <span key={i}>
                      {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                      <br />
                    </span>
                  ))}
                </p>
                {msg.hasAction && (
                  <button
                    className="ai-bubble__action-btn"
                    onClick={() => setShowPopup(true)}
                  >
                    Xem chi tiết & Đăng bán
                  </button>
                )}
                <span className="ai-bubble__time">{msg.time}</span>
              </div>
            </div>
          ))}

          {/* Analyzing bubble */}
          {analyzing && (
            <div className="ai-bubble-row ai-bubble-row--ai">
              <div className="ai-bubble-avatar">
                <img
                  src="/icons/logo-nong-san-nha-que.png"
                  alt="AgriSmart AI"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <div className="ai-bubble ai-bubble--ai ai-bubble--analyzing">
                <div className="ai-analyzing">
                  <span className="ai-analyzing__icon"></span>
                  <span className="ai-analyzing__text">
                    Đang phân tích hình ảnh...
                  </span>
                  <div className="ai-analyzing__dots">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="ai-analyzing__bar">
                  <div className="ai-analyzing__progress" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="ai-chat__footer">
          {/* Camera / Image attach button — prominent */}
          <div className="ai-chat__attach-area">
            <button
              className="ai-chat__camera-btn"
              onClick={() => fileRef.current?.click()}
              title="Đính kèm hình ảnh sản phẩm"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Đính kèm ảnh</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </div>

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
              disabled={!input.trim()}
              aria-label="Gửi"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* ── Listing popup ── */}
      {showPopup && (
        <ListingPopup
          onClose={() => setShowPopup(false)}
          onConfirm={handleConfirm}
        />
      )}

      {/* ── Success toast ── */}
      {successToast && (
        <div className="ai-success-toast">Đã đăng lên chợ thành công!</div>
      )}
    </>
  );
}
