import React, { useState, useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";
import "./AIChatWidget.css";

/* ── Static demo messages ── */
const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "ai",
    text: "Xin chào! Cháu là trợ lý AI của AgriSmart\nBạn muốn đăng bán nông sản? Hãy gửi ảnh sản phẩm để Cháu phân tích và gợi ý giá nhé!",
    time: "08:30",
  },
];

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
  const [previewAudio, setPreviewAudio] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileRef = useRef();
  const bottomRef = useRef();
  const inputRef = useRef();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const streamRef = useRef(null);

  // Get current time in Vietnamese format
  const now = () => {
    return new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Start recording voice
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setPreviewAudio(audioUrl);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      // Update timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      alert("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.");
      console.error("Recording error:", error);
    }
  };

  // Stop recording voice
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, analyzing]);

  // Update initial message time when chatbot opens
  useEffect(() => {
    if (open && messages[0]?.time === "08:30") {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[0].time = now();
        return updatedMessages;
      });
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Fake AI response generator
  function generateAIResponse(userText, hasImage) {
    const lowerText = userText.toLowerCase();

    // Nếu input từ ghi âm (voice recording) -> giá cam response
    if (userText === "Tin nhắn thoại") {
      return {
        text: "Hiện tại, giá cam Cao Phong (Hòa Bình) bán lẻ tại vườn thường dao động từ 25.000đ đến 35.000đ/kg tùy vào chất lượng và kích cỡ trái. Với số lượng 100kg, chú có thể cân nhắc mức giá sỉ khoảng 18.000đ - 22.000đ/kg nếu bán cho các đầu mối nhỏ hoặc cửa hàng thực phẩm sạch. Chú nên dựa vào độ ngọt và độ mọng nước thực tế của vườn mình để điều chỉnh mức giá sao cho cạnh tranh nhất nhé. \nCho cháu xin ảnh xác nhận mặt hàng cam của chú ạ!",
        hasConfirmBtn: false,
      };
    }

    // Nếu input chứa "cam" và có ảnh -> trả lời xác nhận đăng ký
    if (lowerText.includes("cam") && hasImage) {
      return {
        text: "Cháu đã nhận được hình ảnh xác minh mặt hàng cam của chú. Bây giờ, dựa vào thông tin chú đã cho, Cháu sẽ tạo dựng trang sản phẩm và hình ảnh quảng cáo mặt hàng hợp lí",
        hasConfirmBtn: true,
      };
    }

    // Default response
    return {
      text: "Cảm ơn bạn! Để định giá chính xác hơn, vui lòng gửi ảnh sản phẩm bằng nút bên dưới nhé.",
      hasConfirmBtn: false,
    };
  }

  function sendText(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text && !previewImg && !previewAudio) return;

    // Build message object
    const msg = {
      id: Date.now(),
      role: "user",
      text: text || (previewAudio ? "Tin nhắn thoại" : "Đã gửi ảnh sản phẩm"),
      time: now(),
    };

    // Add image if exists
    if (previewImg) {
      msg.image = previewImg;
    }

    // Add audio if exists
    if (previewAudio) {
      msg.audio = previewAudio;
    }

    setMessages((m) => [...m, msg]);
    setInput("");
    setPreviewImg(null); // Clear preview after sending
    setPreviewAudio(null); // Clear audio preview after sending

    // Fake AI reply
    setTimeout(() => {
      const aiResponse = generateAIResponse(
        text || "Tin nhắn thoại",
        !!previewImg,
      );
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "ai",
          text: aiResponse.text,
          time: now(),
          hasConfirmBtn: aiResponse.hasConfirmBtn,
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
    e.target.value = "";
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
                {msg.audio && (
                  <audio
                    controls
                    className="ai-bubble__audio"
                    controlsList="nodownload"
                  >
                    <source src={msg.audio} type="audio/wav" />
                    Trình duyệt của bạn không hỗ trợ phát âm thanh.
                  </audio>
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
                {msg.hasConfirmBtn && (
                  <button
                    className="ai-bubble__confirm-btn"
                    onClick={() => {
                      setMessages((m) => [
                        ...m,
                        {
                          id: Date.now(),
                          role: "ai",
                          text: "Tuyệt vời! Cháu sẽ tiến hành tạo trang sản phẩm và các hình ảnh quảng cáo cho chú. Vui lòng chờ Cháu xử lý...",
                          time: now(),
                          hasProductLink: true,
                        },
                      ]);
                    }}
                  >
                    Đồng ý
                  </button>
                )}
                {msg.hasProductLink && (
                  <button className="ai-bubble__product-link-btn">
                    Xem trang sản phẩm
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
          {/* Image preview */}
          {previewImg && (
            <div className="ai-chat__preview-area">
              <img
                src={previewImg}
                alt="Preview"
                className="ai-chat__preview-img"
              />
              <button
                className="ai-chat__preview-close"
                onClick={() => setPreviewImg(null)}
                title="Xóa ảnh"
              >
                ✕
              </button>
            </div>
          )}

          {/* Audio preview */}
          {previewAudio && (
            <div className="ai-chat__preview-area ai-chat__preview-area--audio">
              <audio
                controls
                className="ai-chat__preview-audio"
                controlsList="nodownload"
              >
                <source src={previewAudio} type="audio/wav" />
                Trình duyệt của bạn không hỗ trợ phát âm thanh.
              </audio>
              <button
                className="ai-chat__preview-close"
                onClick={() => setPreviewAudio(null)}
                title="Xóa ghi âm"
              >
                ✕
              </button>
            </div>
          )}

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

            {isRecording ? (
              <button
                className="ai-chat__record-btn ai-chat__record-btn--active"
                onClick={stopRecording}
                title="Dừng ghi âm"
              >
                <span className="ai-chat__record-pulse"></span>
                <span className="ai-chat__record-time">
                  {formatTime(recordingTime)}
                </span>
              </button>
            ) : (
              <button
                className="ai-chat__record-btn"
                onClick={startRecording}
                title="Ghi âm giọng nói"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 1a3 3 0 0 0-3 3v12a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span>Ghi âm</span>
              </button>
            )}

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
              disabled={!input.trim() && !previewImg && !previewAudio}
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

      {/* ── Success toast ── */}
      {successToast && (
        <div className="ai-success-toast">Đã đăng lên chợ thành công!</div>
      )}
    </>
  );
}
