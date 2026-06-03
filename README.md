# 🌿 AgriSmart — Chợ Nông Sản Thông Minh

Nền tảng thương mại điện tử nông sản tích hợp AI Gemini, hỗ trợ người nông dân đăng bán sản phẩm và người mua tìm kiếm nông sản chất lượng.

---

## ✨ Tính năng nổi bật

### 🤖 AI Chatbot (AIChatWidget)
- **Tìm mua nông sản**: Chatbot hiểu ngôn ngữ tự nhiên, tìm kiếm sản phẩm theo tên, giá, vùng, số lượng
- **Đăng bán nông sản**: Flow thu thập thông tin thông minh — chatbot tự hỏi từng bước:
  1. Tên nông sản cần bán
  2. Địa điểm (tỉnh/thành)
  3. Số lượng (kg, yến, tạ, tấn)
  4. Giá bán (VND/kg)
  5. Tiêu chuẩn/chất lượng sản phẩm
  - Sau khi đủ thông tin → AI tự động soạn **bài đăng hấp dẫn** (tiêu đề, mô tả)
  - Hiển thị **preview bài đăng** đẹp để người bán xem trước
  - Nhấn **"Đăng bài lên shop"** → bài đăng xuất hiện ngay trên sàn
- **Hỏi kỹ thuật nông nghiệp**: RAG từ cơ sở tri thức cây trồng (VietGAP, chăm sóc, bảo quản)
- **Kiểm tra giá thị trường**: Tham chiếu giá thực tế theo vùng và tiêu chuẩn

### 🛒 Sàn thương mại
- Duyệt, tìm kiếm, lọc nông sản theo danh mục
- Giỏ hàng, thanh toán
- Trang chi tiết sản phẩm với đánh giá
- Shop dashboard cho người bán

---

## 🗂️ Cấu trúc dự án

```
AgriSmart/
├── frontend/          # React 18
│   └── src/
│       ├── components/
│       │   ├── AIChatWidget.js    # Chatbot UI (text-only, có post preview)
│       │   └── AIChatWidget.css
│       ├── pages/
│       ├── services/api.js        # Gọi REST API
│       └── ...
├── backend/           # Python Flask
│   ├── app.py         # REST API endpoints
│   ├── chatbot.py     # Logic AI + flow đăng bài
│   ├── database.py    # SQLite helpers
│   └── requirements.txt
└── db/
    ├── schema.sql
    └── seed.sql
```

---

## 🚀 Khởi động nhanh

### Backend (Python 3.9+)

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Tạo file .env
cp .env.example .env
# Điền GEMINI_API_KEY vào .env

python app.py
# → http://localhost:5000
```

### Frontend (Node.js 16+)

```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

---

## ⚙️ Biến môi trường

**backend/.env**
```
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
MAX_CHATS_PER_DAY=20
COOLDOWN_SECONDS=12
```

**frontend/.env**
```
REACT_APP_API_URL=http://localhost:5000
```

---

## 🔄 Flow đăng bán sản phẩm qua Chatbot

```
Người bán nhắn: "Tôi muốn bán xoài"
        ↓
AI hỏi: "Cô/chú ở tỉnh/thành nào ạ?"
        ↓
AI hỏi: "Có bao nhiêu kg cần bán ạ?"
        ↓
AI hỏi: "Cô/chú bán giá bao nhiêu đ/kg?"
        ↓
AI hỏi: "Tiêu chuẩn sản phẩm thế nào ạ?"
        ↓
AI soạn bài đăng → Hiển thị PREVIEW đẹp
        ↓
Người bán nhấn [🚀 Đăng bài lên shop]
        ↓
Bài đăng lên sàn ✅
```

---

## 📡 API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/health` | Kiểm tra trạng thái server |
| POST | `/api/chat` | Gửi tin nhắn chatbot |
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/products` | Danh sách sản phẩm |
| GET | `/api/products/<id>` | Chi tiết sản phẩm |
| GET | `/api/market-price?name=` | Giá thị trường |

### POST /api/chat
```json
{
  "text": "Tôi muốn bán 100kg xoài cát Tiền Giang",
  "session_id": "user-session-abc",
  "seller_id": 1
}
```

**Các loại response:**
- `seller_collecting` — AI đang hỏi thêm thông tin
- `seller_ready_to_post` — Đủ thông tin, có `payload` để preview
- `seller_posted` — Đã đăng bài thành công
- `buyer_result` — Kết quả tìm sản phẩm
- `rag_answer` — Trả lời kỹ thuật nông nghiệp
