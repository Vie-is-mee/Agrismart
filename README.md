# AgriSmart — Sàn nông sản + Trợ lý AI

Dự án gồm 3 phần đã được **kết nối hoàn chỉnh**:

| Thư mục      | Vai trò                                                                 |
|--------------|-------------------------------------------------------------------------|
| `frontend/`  | Giao diện React (cửa hàng, giỏ hàng, đăng nhập/đăng ký, widget chat AI) |
| `backend/`   | API Flask + chatbot Gemini (`google-genai`)                             |
| `db/`        | Cơ sở dữ liệu **SQLite** (tự tạo khi chạy lần đầu)                       |

Phần đã nối với nhau:
- **Widget Chat AI** (frontend) → `POST /api/chat` → Gemini + truy vấn SQLite (tìm sản phẩm, giá thị trường, kiến thức cây trồng, đăng tin bán).
- **Đăng nhập / Đăng ký** (frontend) → `POST /api/auth/*` → bảng `Users` (mật khẩu băm PBKDF2).
- Duyệt cửa hàng/sản phẩm vẫn dùng dữ liệu tĩnh trong `frontend/src/data` nên **chạy được kể cả khi không có khóa Gemini**. DB đã seed 13 sản phẩm trùng id với frontend, nên kết quả chatbot bấm vào ra đúng trang `/product/{id}`.

---

## Yêu cầu môi trường
- **Python** ≥ 3.10
- **Node.js** ≥ 16 (kèm npm)
- Không cần cài SQL Server / ODBC — đã chuyển sang SQLite.

---

## 1. Chạy Backend

```bash
cd backend
pip install -r requirements.txt

# Tạo file .env từ mẫu rồi điền khóa Gemini
cp .env.example .env
#   → mở .env, dán GEMINI_API_KEY (lấy tại https://aistudio.google.com/apikey)

python app.py
```

Backend chạy ở `http://localhost:5000`.
- Lần đầu chạy sẽ **tự tạo** `db/agrieco.db` và nạp dữ liệu mẫu.
- Kiểm tra nhanh: mở `http://localhost:5000/api/health` → thấy `{"status":"ok", ...}`.

> **Không có khóa Gemini vẫn chạy được:** server vẫn lên, các API sản phẩm/đăng nhập hoạt động bình thường; chỉ riêng chat AI sẽ trả thông báo "AI đang tắt". Điền `GEMINI_API_KEY` vào `.env` để bật chat.

---

## 2. Chạy Frontend

Mở **một cửa sổ terminal khác**:

```bash
cd frontend
npm install
npm start
```

Trình duyệt tự mở `http://localhost:3000`.
File `frontend/.env` đã trỏ sẵn `REACT_APP_API_URL=http://localhost:5000`. Nếu đổi cổng backend thì sửa lại file này.

---

## 3. Tài khoản demo (mật khẩu chung: `123456`)

| Số điện thoại | Vai trò   | Ghi chú                          |
|---------------|-----------|----------------------------------|
| `0900000001`  | Người bán | HTX Vườn Trái Cây Cao Phong      |
| `0900000002`  | Người bán | (khớp với các gian hàng frontend)|
| `0900000003`  | Người bán |                                  |
| `0900000004`  | Người bán |                                  |
| `0900000005`  | Người bán |                                  |
| `0911111111`  | Người mua |                                  |
| `0999999999`  | Admin     |                                  |

Hoặc bấm **Đăng Ký** để tạo tài khoản mới (người mua / người bán).

---

## 4. Thử nhanh trợ lý AI (cần khóa Gemini)

Mở widget chat ở góc phải, thử:
- *"Tôi muốn mua xoài ở Tiền Giang"* → trả về sản phẩm + link sang trang chi tiết.
- *"Giá thanh long hiện nay bao nhiêu?"* → tra bảng `Market_Prices`.
- *"Cách trồng sầu riêng?"* → tra `Crop_Knowledge` (RAG).
- Gửi kèm ảnh nông sản để AI nhận diện.

---

## Cấu trúc thư mục

```
AgriSmart/
├── backend/
│   ├── app.py              # Flask API
│   ├── chatbot.py          # Logic chatbot Gemini
│   ├── database.py         # SQLite: tạo bảng, seed, băm mật khẩu
│   ├── requirements.txt
│   └── .env.example
├── db/
│   ├── schema.sql          # Cấu trúc bảng (SQLite)
│   ├── seed.sql            # Dữ liệu mẫu
│   ├── final_sqlserver.sql # Bản gốc SQL Server (chỉ để tham khảo)
│   └── agrieco.db          # (tự sinh khi chạy backend)
└── frontend/
    ├── .env
    └── src/
        ├── services/api.js          # Lớp gọi API
        ├── components/AIChatWidget.js
        └── components/LoginModal.js
```

---

## Khắc phục sự cố

- **Chat báo "AI đang tắt":** chưa điền `GEMINI_API_KEY` trong `backend/.env`.
- **Frontend không gọi được API / lỗi CORS:** kiểm tra backend đã chạy ở cổng 5000 và `frontend/.env` trỏ đúng URL.
- **Muốn tạo lại DB từ đầu:** xóa `db/agrieco.db` rồi chạy lại `python app.py` (hoặc `python backend/database.py`).
- **Đổi giới hạn chat / model:** sửa `MAX_CHATS_PER_DAY`, `COOLDOWN_SECONDS`, `GEMINI_MODEL` trong `backend/.env`.
