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
      "Cô/chú có thể: 🛒 tìm mua nông sản, 📢 đăng bán (gửi kèm ảnh sản phẩm), " +
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

  // ảnh: giữ cả URL (để hiển thị) và File (để upload)
  const [previewImg, setPreviewImg] = useState(null);
  const [previewImgFile, setPreviewImgFile] = useState(null);
  // audio: giữ URL + Blob
  const [previewAudio, setPreviewAudio] = useState(null);
  const [previewAudioBlob, setPreviewAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const hasUpdatedTimeRef = useRef(false);
  const sessionIdRef = useRef("sess-" + Math.random().toString(36).slice(2));
  const fileRef = useRef();
  const bottomRef = useRef();
  const inputRef = useRef();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const streamRef = useRef(null);

  const now = () =>
    new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  // ── Ghi âm ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setPreviewAudio(URL.createObjectURL(blob));
        setPreviewAudioBlob(blob);
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    } catch (err) {
      alert("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.");
      console.error(err);
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };
  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, analyzing]);

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

  useEffect(() => () => {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  }, []);

  // ── Gửi tin nhắn tới backend ──
  async function sendText(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text && !previewImgFile && !previewAudioBlob) return;
    if (analyzing) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text: text || (previewAudioBlob ? "Tin nhắn thoại" : "Đã gửi ảnh sản phẩm"),
      time: now(),
    };
    if (previewImg) userMsg.image = previewImg;
    if (previewAudio) userMsg.audio = previewAudio;
    setMessages((m) => [...m, userMsg]);

    const imageFile = previewImgFile;
    const audioFile = previewAudioBlob
      ? new File([previewAudioBlob], "voice.wav", { type: "audio/wav" })
      : null;

    setInput("");
    setPreviewImg(null);
    setPreviewImgFile(null);
    setPreviewAudio(null);
    setPreviewAudioBlob(null);
    setAnalyzing(true);

    try {
      const res = await sendChat({
        text,
        sessionId: sessionIdRef.current,
        sellerId: 1,
        imageFile,
        audioFile,
      });
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

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewImg(URL.createObjectURL(file));
    setPreviewImgFile(file);
    e.target.value = "";
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
              <div className={`ai-bubble ai-bubble--${msg.role}`}>
                {msg.image && <img src={msg.image} alt="Ảnh sản phẩm" className="ai-bubble__image" />}
                {msg.audio && (
                  <audio controls className="ai-bubble__audio" controlsList="nodownload">
                    <source src={msg.audio} type="audio/wav" />
                  </audio>
                )}
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
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="ai-chat__footer">
          {previewImg && (
            <div className="ai-chat__preview-area">
              <img src={previewImg} alt="Preview" className="ai-chat__preview-img" />
              <button
                className="ai-chat__preview-close"
                onClick={() => {
                  setPreviewImg(null);
                  setPreviewImgFile(null);
                }}
                title="Xóa ảnh"
              >
                ✕
              </button>
            </div>
          )}

          {previewAudio && (
            <div className="ai-chat__preview-area ai-chat__preview-area--audio">
              <audio controls className="ai-chat__preview-audio" controlsList="nodownload">
                <source src={previewAudio} type="audio/wav" />
              </audio>
              <button
                className="ai-chat__preview-close"
                onClick={() => {
                  setPreviewAudio(null);
                  setPreviewAudioBlob(null);
                }}
                title="Xóa ghi âm"
              >
                ✕
              </button>
            </div>
          )}

          <div className="ai-chat__attach-area">
            <button
              className="ai-chat__camera-btn"
              onClick={() => fileRef.current?.click()}
              title="Đính kèm hình ảnh sản phẩm"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Đính kèm ảnh</span>
            </button>

            {isRecording ? (
              <button className="ai-chat__record-btn ai-chat__record-btn--active" onClick={stopRecording} title="Dừng ghi âm">
                <span className="ai-chat__record-pulse"></span>
                <span className="ai-chat__record-time">{formatTime(recordingTime)}</span>
              </button>
            ) : (
              <button className="ai-chat__record-btn" onClick={startRecording} title="Ghi âm giọng nói">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span>Ghi âm</span>
              </button>
            )}

            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageChange} />
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
              disabled={analyzing || (!input.trim() && !previewImgFile && !previewAudioBlob)}
              aria-label="Gửi"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
