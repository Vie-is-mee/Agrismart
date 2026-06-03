"""
app.py — REST API AgriSmart (Flask).

Endpoints:
  GET  /api/health
  POST /api/chat                (JSON: { text, session_id, seller_id })
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/products            (?category= &q=)
  GET  /api/products/<id>
  GET  /api/market-price        (?name=)

Chạy:  python app.py   →   http://localhost:5000
"""

import os

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS

from database import init_db, db_cursor, row_to_dict, hash_password, verify_password
from chatbot import AgriChatbot, AI_ENABLED

# ── Khởi tạo DB ───────────────────────────────────────────────────────────────
init_db()

app = Flask(__name__)
# Thay dòng CORS(app) hiện tại bằng:
CORS(app, origins=[
    "http://localhost:3000",
    "https://agrismart-azure.vercel.app/"  # URL Vercel của bạn
])

# Mỗi "session" giữ 1 chatbot riêng để nhớ trạng thái thu thập của người bán.
_bots: dict = {}


def get_bot(session_id: str, seller_user_id: int = 1) -> AgriChatbot:
    if session_id not in _bots:
        _bots[session_id] = AgriChatbot(seller_user_id=seller_user_id)
    return _bots[session_id]


# ── HEALTH ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "ai_enabled": AI_ENABLED})


# ── CHAT ──────────────────────────────────────────────────────────────────────
@app.post("/api/chat")
def chat():
    """
    Nhận JSON: { "text": "...", "session_id": "...", "seller_id": 1 }
    Trả về JSON kết quả từ chatbot.
    """
    try:
        data       = request.get_json(silent=True) or {}
        text       = data.get("text", "")
        session_id = data.get("session_id", "default")
        seller_id  = int(data.get("seller_id", 1) or 1)

        bot    = get_bot(session_id, seller_user_id=seller_id)
        result = bot.process(text_input=text or None)
        return jsonify(result)

    except Exception as exc:
        print(f"  [API] /api/chat error: {exc}")
        return jsonify({
            "type":     "error",
            "message":  "Dạ có lỗi xảy ra phía máy chủ, cô/chú thử lại sau nhé ạ.",
            "products": [],
        }), 500


# ── AUTH ──────────────────────────────────────────────────────────────────────
def _user_public(row) -> dict:
    d = row_to_dict(row)
    d.pop("password_hash", None)
    d.pop("is_deleted", None)
    return d


@app.post("/api/auth/register")
def register():
    data     = request.get_json(silent=True) or {}
    name     = (data.get("name") or "").strip()
    phone    = (data.get("phone") or "").strip()
    password = data.get("password") or ""
    role     = data.get("role") or "buyer"
    address  = data.get("address")
    coop     = data.get("cooperative_name")

    if not name or not phone or not password:
        return jsonify({"error": "Thiếu họ tên, số điện thoại hoặc mật khẩu."}), 400
    if role not in ("buyer", "seller"):
        role = "buyer"

    try:
        with db_cursor() as cur:
            cur.execute("SELECT id FROM Users WHERE phone = ?", (phone,))
            if cur.fetchone():
                return jsonify({"error": "Số điện thoại đã được đăng ký."}), 409
            cur.execute("""
                INSERT INTO Users (name, phone, password_hash, address, cooperative_name, role)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (name, phone, hash_password(password), address, coop, role))
            uid = cur.lastrowid
            cur.execute("SELECT * FROM Users WHERE id = ?", (uid,))
            user = _user_public(cur.fetchone())
        return jsonify({"message": "Đăng ký thành công.", "user": user}), 201
    except Exception as exc:
        print(f"  [API] register error: {exc}")
        return jsonify({"error": "Lỗi máy chủ khi đăng ký."}), 500


@app.post("/api/auth/login")
def login():
    data     = request.get_json(silent=True) or {}
    phone    = (data.get("phone") or "").strip()
    password = data.get("password") or ""
    if not phone or not password:
        return jsonify({"error": "Vui lòng nhập số điện thoại và mật khẩu."}), 400

    try:
        with db_cursor() as cur:
            cur.execute("SELECT * FROM Users WHERE phone = ? AND is_deleted = 0", (phone,))
            row = cur.fetchone()
        if not row or not verify_password(password, row["password_hash"] or ""):
            return jsonify({"error": "Số điện thoại hoặc mật khẩu không đúng."}), 401
        return jsonify({"message": "Đăng nhập thành công.", "user": _user_public(row)})
    except Exception as exc:
        print(f"  [API] login error: {exc}")
        return jsonify({"error": "Lỗi máy chủ khi đăng nhập."}), 500


# ── PRODUCTS ──────────────────────────────────────────────────────────────────
@app.get("/api/products")
def list_products():
    category = request.args.get("category")
    q        = request.args.get("q")
    conds, params = [], []
    if category and category != "all":
        conds.append("category = ?"); params.append(category)
    if q:
        conds.append("LOWER(name) LIKE ?"); params.append(f"%{q.lower()}%")
    where = ("WHERE " + " AND ".join(conds)) if conds else ""
    try:
        with db_cursor() as cur:
            cur.execute(f"""
                SELECT id, name, category, standard, quantity, unit, price,
                       rating, image_url, seller_name, seller_address
                FROM vw_Active_Products {where}
                ORDER BY rating DESC, price ASC
            """, params)
            items = [row_to_dict(r) for r in cur.fetchall()]
        return jsonify({"count": len(items), "products": items})
    except Exception as exc:
        print(f"  [API] list_products error: {exc}")
        return jsonify({"error": "Lỗi máy chủ."}), 500


@app.get("/api/products/<int:pid>")
def get_product(pid):
    try:
        with db_cursor() as cur:
            cur.execute("SELECT * FROM vw_Active_Products WHERE id = ?", (pid,))
            row = cur.fetchone()
        if not row:
            return jsonify({"error": "Không tìm thấy sản phẩm."}), 404
        return jsonify(row_to_dict(row))
    except Exception as exc:
        print(f"  [API] get_product error: {exc}")
        return jsonify({"error": "Lỗi máy chủ."}), 500


# ── MARKET PRICE ──────────────────────────────────────────────────────────────
@app.get("/api/market-price")
def market_price():
    name = request.args.get("name", "")
    if not name:
        return jsonify({"error": "Thiếu tham số name."}), 400
    try:
        with db_cursor() as cur:
            cur.execute("""
                SELECT product_name, standard, region, unit, min_price, max_price, update_date
                FROM vw_Market_Price_Summary
                WHERE LOWER(product_name) LIKE ?
                ORDER BY update_date DESC LIMIT 1
            """, (f"%{name.lower()}%",))
            row = cur.fetchone()
        if not row:
            return jsonify({"found": False})
        d = row_to_dict(row)
        d["found"]     = True
        d["avg_price"] = (d["min_price"] + d["max_price"]) / 2.0
        return jsonify(d)
    except Exception as exc:
        print(f"  [API] market_price error: {exc}")
        return jsonify({"error": "Lỗi máy chủ."}), 500


if __name__ == "__main__":
    print("=" * 60)
    print("🚀  AgriSmart API đang chạy tại http://localhost:5000")
    print(f"    AI (Gemini): {'BẬT' if AI_ENABLED else 'TẮT (thiếu GEMINI_API_KEY)'}")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)
