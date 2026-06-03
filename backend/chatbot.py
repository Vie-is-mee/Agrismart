# =============================================================================
# AGRI-CHATBOX — LOGIC AI (SQLite + Google GenAI SDK)
#
# Thay đổi so với phiên bản cũ:
#   - Bỏ tính năng nhận ảnh và voice đầu vào
#   - Thêm flow: thu thập thông tin → tạo preview bài đăng → chờ xác nhận → đăng bài
#   - Trạng thái mới: "pending_confirmation" — giữ payload chờ user nhấn đăng
# =============================================================================

import os
import json
import time
from datetime import datetime, date

from database import db_cursor

# ── SDK Gemini ────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MAIN_MODEL     = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

_genai_client = None
_genai_types  = None
try:
    if GEMINI_API_KEY:
        from google import genai
        from google.genai import types as _genai_types
        _genai_client = genai.Client(api_key=GEMINI_API_KEY)
        print(f"  [AI] Google GenAI sẵn sàng (model: {MAIN_MODEL})")
    else:
        print("  [AI] ⚠️  Chưa có GEMINI_API_KEY — chatbot chạy chế độ giới hạn.")
except Exception as exc:
    print(f"  [AI] ⚠️  Không khởi tạo được Google GenAI: {exc}")
    _genai_client = None

AI_ENABLED = _genai_client is not None


def _gen_json(contents):
    """Gọi Gemini, ép trả JSON."""
    resp = _genai_client.models.generate_content(
        model=MAIN_MODEL,
        contents=contents,
        config=_genai_types.GenerateContentConfig(response_mime_type="application/json"),
    )
    return json.loads(resp.text)


# =============================================================================
# SECTION 2: TRUY VẤN DB (SQLite)
# =============================================================================

def db_get_market_price(product_name: str) -> dict:
    if not product_name:
        return {}
    try:
        with db_cursor() as cur:
            cur.execute("""
                SELECT product_name, standard, region, unit,
                       min_price, max_price, update_date,
                       (min_price + max_price) / 2.0 AS avg_price
                FROM vw_Market_Price_Summary
                WHERE LOWER(product_name) LIKE ?
                ORDER BY update_date DESC
                LIMIT 1
            """, (f"%{product_name.lower()}%",))
            row = cur.fetchone()
            if row:
                avg = float(row["avg_price"])
                return {
                    "product_name":        row["product_name"],
                    "standard":            row["standard"],
                    "region":              row["region"],
                    "min_price":           float(row["min_price"]),
                    "max_price":           float(row["max_price"]),
                    "avg_price":           avg,
                    "negotiate_threshold": round(avg * 1.15),
                    "unit":                row["unit"],
                }
    except Exception as exc:
        print(f"  [DB] db_get_market_price error: {exc}")
    return {}


def db_search_crop_knowledge(query: str) -> list:
    KEYWORD_MAP = {
        "lúa": "Lúa", "gạo": "Lúa",
        "cà phê robusta": "Cà phê Robusta", "cà phê arabica": "Cà phê Arabica",
        "cà phê": "Cà phê Robusta", "robusta": "Cà phê Robusta", "arabica": "Cà phê Arabica",
        "cam sành": "Cam sành", "cam": "Cam sành",
        "xoài": "Xoài", "sầu riêng": "Sầu riêng", "monthong": "Sầu riêng", "ri6": "Sầu riêng",
        "thanh long": "Thanh long",
        "hồ tiêu": "Hồ tiêu", "tiêu đen": "Hồ tiêu", "hạt tiêu": "Hồ tiêu",
        "điều": "Điều", "hạt điều": "Điều",
        "vải thiều": "Vải thiều", "vải": "Vải thiều",
        "nhãn": "Nhãn", "nhãn lồng": "Nhãn",
        "dưa hấu": "Dưa hấu",
        "khoai lang": "Khoai lang", "khoai": "Khoai lang",
        "mít thái": "Mít Thái", "mít": "Mít Thái",
        "bơ": "Bơ", "bơ 034": "Bơ",
    }
    query_lower = query.lower()
    matched = {crop for kw, crop in KEYWORD_MAP.items() if kw in query_lower}
    if not matched:
        return []

    docs = []
    try:
        with db_cursor() as cur:
            for crop in matched:
                cur.execute("""
                    SELECT crop_name, description, care_tips, storage_tips,
                           growing_regions, harvest_months, popular_standard
                    FROM Crop_Knowledge WHERE crop_name = ?
                """, (crop,))
                d = cur.fetchone()
                if d:
                    docs.append(
                        f"[Kiến thức về {d['crop_name']}]\n"
                        f"Mô tả: {d['description']}\n"
                        f"Vùng trồng: {d['growing_regions']}\n"
                        f"Mùa vụ: {d['harvest_months']}\n"
                        f"Tiêu chuẩn phổ biến: {d['popular_standard']}\n"
                        f"Kỹ thuật chăm sóc: {d['care_tips']}\n"
                        f"Bảo quản: {d['storage_tips']}"
                    )
    except Exception as exc:
        print(f"  [DB] db_search_crop_knowledge error: {exc}")
    return docs[:5]


def db_buyer_search(criteria: dict) -> list:
    MIEN_TAY = [
        "tiền giang", "đồng tháp", "an giang", "kiên giang", "long an",
        "vĩnh long", "bến tre", "hậu giang", "sóc trăng", "trà vinh",
        "cần thơ", "bạc liêu", "cà mau",
    ]
    conds, params = [], []

    pname = criteria.get("product_name", "")
    if pname:
        conds.append("(LOWER(name) LIKE ? OR LOWER(category) LIKE ?)")
        params += [f"%{pname.lower()}%", f"%{pname.lower()}%"]
    if criteria.get("max_price_per_kg"):
        conds.append("price <= ?"); params.append(criteria["max_price_per_kg"])
    if criteria.get("min_price_per_kg"):
        conds.append("price >= ?"); params.append(criteria["min_price_per_kg"])
    if criteria.get("min_quantity_kg"):
        conds.append("quantity >= ?"); params.append(criteria["min_quantity_kg"])

    q_kws = criteria.get("quality_keywords") or []
    if q_kws:
        conds.append("(" + " OR ".join(["LOWER(standard) LIKE ?" for _ in q_kws]) + ")")
        params += [f"%{kw.lower()}%" for kw in q_kws]

    loc = (criteria.get("location") or "").lower().strip()
    if loc:
        if any(t in loc for t in ["miền tây", "đbscl", "đồng bằng sông cửu"]):
            parts = []
            for prov in MIEN_TAY:
                parts.append("(LOWER(seller_address) LIKE ? OR LOWER(market_region) LIKE ?)")
                params += [f"%{prov}%", f"%{prov}%"]
            conds.append("(" + " OR ".join(parts) + ")")
        else:
            conds.append("(LOWER(seller_address) LIKE ? OR LOWER(market_region) LIKE ?)")
            params += [f"%{loc}%", f"%{loc}%"]

    where = ("WHERE " + " AND ".join(conds)) if conds else ""
    sql = f"""
        SELECT id, name, category, standard, quantity, unit,
               price, rating, image_url,
               seller_name, seller_phone, seller_address
        FROM vw_Active_Products
        {where}
        ORDER BY rating DESC, price ASC
        LIMIT 5
    """
    results = []
    try:
        with db_cursor() as cur:
            cur.execute(sql, params)
            for row in cur.fetchall():
                results.append({
                    "id":           row["id"],
                    "name":         row["name"],
                    "price_per_kg": float(row["price"]),
                    "quantity_kg":  float(row["quantity"] or 0),
                    "location":     row["seller_address"] or "",
                    "seller_name":  row["seller_name"] or "",
                    "seller_phone": row["seller_phone"] or "",
                    "image_url":    row["image_url"] or "",
                    "rating":       float(row["rating"] or 0),
                    "standard":     row["standard"] or "",
                })
    except Exception as exc:
        print(f"  [DB] db_buyer_search error: {exc}")
    return results


def db_insert_product(payload: dict, seller_id: int) -> int:
    """INSERT sản phẩm mới; trả product_id hoặc -1."""
    name        = payload.get("title") or payload.get("name") or "Sản phẩm nông sản"
    description = payload.get("description") or ""
    price       = float(payload.get("final_price") or 0)
    quantity    = float(payload.get("quantity") or 0)

    market_price_id = None
    first_word = name.split()[0] if name.split() else ""
    try:
        with db_cursor() as cur:
            cur.execute("""
                SELECT id FROM Market_Prices
                WHERE LOWER(product_name) LIKE ?
                ORDER BY update_date DESC LIMIT 1
            """, (f"%{first_word.lower()}%",))
            mp = cur.fetchone()
            if mp:
                market_price_id = mp["id"]
    except Exception:
        pass

    try:
        with db_cursor() as cur:
            cur.execute("""
                INSERT INTO Products
                    (seller_id, market_price_id, name, quantity, unit,
                     price, ai_marketing_content, status, rating)
                VALUES (?, ?, ?, ?, 'kg', ?, ?, 'active', 0)
            """, (seller_id, market_price_id, name, quantity, price, description))
            new_id = cur.lastrowid
            print(f"  [DB] INSERT Products id={new_id} | '{name}' | {price:,.0f}đ/kg")
            return new_id
    except Exception as exc:
        print(f"  [DB] db_insert_product error: {exc}")
        return -1


# =============================================================================
# SECTION 3: UNIFIED MAIN HANDLER — 1 API CALL
# =============================================================================

def unified_main_handler(user_text, seller_collected, rag_docs, market_price_hint=""):
    rag_context = "\n\n".join(rag_docs) if rag_docs else "Không có tài liệu kỹ thuật liên quan."

    prompt = f"""
Bạn là trợ lý AI cho chợ nông sản Việt Nam. Xử lý yêu cầu người dùng và trả về JSON.

=== DỮ LIỆU PHIÊN HIỆN TẠI ===
Thông tin người bán đã thu thập được: {json.dumps(seller_collected, ensure_ascii=False)}
{f"Giá thị trường tham chiếu: {market_price_hint}" if market_price_hint else ""}
Tài liệu kỹ thuật nông nghiệp (cho câu hỏi RAG):
{rag_context}

=== BƯỚC 1: PHÂN LOẠI INTENT ===
- SELLER : muốn bán/đăng hàng/chào bán/hỏi giá thị trường để bán
- BUYER  : muốn mua/tìm nông sản/đặt mua
- RAG    : hỏi kỹ thuật canh tác, phân bón, VietGAP, bảo quản
- UNKNOWN: không liên quan nông nghiệp

=== BƯỚC 2: XỬ LÝ THEO NHÁNH ===

[BUYER]
  Trích xuất tiêu chí tìm kiếm. Quy đổi đơn vị bắt buộc:
  - Khối lượng: 1 yến=10kg, 1 tạ=100kg, 1 tấn=1000kg
  - Giá: k/ngàn/nghìn=×1000 (15k → 15000, dưới 20k → max_price=20000)
  Viết buyer_message: 2-3 câu thân thiện, thông báo sẽ tìm sản phẩm.

[SELLER]
  Đọc thông tin đã thu thập + câu nói mới, gom đủ 5 slot:
    name (tên nông sản), location (tỉnh/thành), quantity (quy về kg),
    price (VND/kg), standard (tiêu chuẩn/chất lượng, nếu không có ghi "Thường")
  
  Quy tắc hỏi thêm:
  - Nếu CHƯA ĐỦ: seller_complete=false
    Viết seller_next_question thân thiện, hỏi duy nhất 1 thông tin còn thiếu.
    Ưu tiên hỏi theo thứ tự: name → location → quantity → price → standard
  
  - Nếu ĐỦ RỒI (có đủ cả 5 slot):
    + Nếu price > giá thị trường tham chiếu 15%: seller_action="negotiate"
      viết seller_negotiate_message đề nghị điều chỉnh giá.
    + Nếu giá hợp lý: seller_action="post"
      Tạo bài đăng hấp dẫn:
        title: tên sản phẩm + emoji + điểm nổi bật ngắn gọn
        description: 3-4 câu mô tả hấp dẫn (xuất xứ, chất lượng, lợi ích)
        final_price: giá đã xác nhận (số nguyên)
        quantity: số lượng kg (số)
        location: tỉnh/thành
  Xưng cháu, gọi cô/chú với giọng mộc mạc gần gũi.

[RAG]
  Trả lời DỰA HOÀN TOÀN vào tài liệu kỹ thuật đã cung cấp.
  Nếu tài liệu rỗng → rag_answer = "Dạ hệ thống cháu chưa có tài liệu về vấn đề này. Cô/chú liên hệ Trạm Khuyến nông địa phương nhé ạ."
  Xưng cháu, gọi cô/chú.

[UNKNOWN]
  Giải thích phạm vi hỗ trợ: mua nông sản, bán nông sản, kỹ thuật trồng trọt.

=== OUTPUT (JSON bắt buộc, không giải thích gì thêm) ===
{{
    "intent": "SELLER|BUYER|RAG|UNKNOWN",
    "buyer_criteria": {{
        "product_name": null, "min_quantity_kg": null, "max_price_per_kg": null,
        "min_price_per_kg": null, "location": null, "quality_keywords": [], "search_summary": ""
    }},
    "buyer_message": "",
    "seller_extracted": {{
        "name": null, "location": null, "quantity": null,
        "price": null, "standard": null
    }},
    "seller_complete": false,
    "seller_next_question": "",
    "seller_action": "none",
    "seller_negotiate_message": "",
    "seller_post": {{
        "title": "", "description": "", "final_price": 0,
        "quantity": 0, "location": "", "db_status": "ready_to_insert"
    }},
    "rag_answer": "",
    "unknown_reply": ""
}}

Câu của người dùng: "{user_text}"
"""
    try:
        result = _gen_json([prompt])
        print(f"  [UNIFIED] Intent: {result.get('intent')} | Action: {result.get('seller_action','n/a')}")
        return result
    except Exception as exc:
        print(f"  [GEMINI ERROR] {exc}")
        return {
            "intent": "UNKNOWN",
            "unknown_reply": "Dạ hiện tại đường truyền mạng đang hơi chậm, não cháu xử lý chưa kịp. "
                             "Cô/chú đợi vài phút nữa rồi nhắn lại giúp cháu nhé ạ!",
        }


# =============================================================================
# SECTION 4: AI ORCHESTRATION
# =============================================================================

class AgriChatbot:
    def __init__(self, seller_user_id: int = 1):
        self.seller_collected_data: dict  = {}
        self.seller_user_id:        int   = seller_user_id
        self.pending_post_payload:  dict  = {}   # giữ bài đăng chờ xác nhận
        self.last_chat_time:        float = 0.0
        self.daily_chats_count:     int   = 0
        self.current_date:          date  = datetime.now().date()

    # ── Rate‑limit helpers ──────────────────────────────────────────────────
    def _check_rate_limit(self):
        MAX_CHATS_PER_DAY  = int(os.getenv("MAX_CHATS_PER_DAY",  "20"))
        COOLDOWN_SECONDS   = int(os.getenv("COOLDOWN_SECONDS",   "12"))

        today = datetime.now().date()
        if today > self.current_date:
            self.current_date      = today
            self.daily_chats_count = 0

        if self.daily_chats_count >= MAX_CHATS_PER_DAY:
            return {"type": "rate_limit_day",
                    "message": "Dạ xin lỗi cô/chú, hôm nay cô/chú đã hết lượt nhờ cháu tư vấn rồi ạ! "
                               "Ngày mai cô/chú nhắn lại nhé. Cảm ơn cô/chú ạ!",
                    "products": []}

        passed = time.time() - self.last_chat_time
        if passed < COOLDOWN_SECONDS:
            left = int(COOLDOWN_SECONDS - passed)
            return {"type": "rate_limit_minute",
                    "message": f"Dạ cô/chú thao tác hơi nhanh, hệ thống xử lý chưa kịp ạ. "
                               f"Cô/chú đợi {left} giây nữa rồi nhắn tiếp giúp cháu nhé!",
                    "products": []}
        return None

    # ── Xác nhận đăng bài ──────────────────────────────────────────────────
    def _confirm_post(self) -> dict:
        if not self.pending_post_payload:
            return {"type": "error",
                    "message": "Dạ cháu không tìm thấy bài đăng nào đang chờ xác nhận ạ.",
                    "products": []}

        payload = self.pending_post_payload
        new_id  = db_insert_product(payload, self.seller_user_id)
        self.pending_post_payload  = {}
        self.seller_collected_data = {}

        if new_id > 0:
            return {
                "type":       "seller_posted",
                "message":    f"✅ Bài đăng **{payload.get('title','')}** đã được đăng lên shop thành công! "
                              f"(Mã sản phẩm: #{new_id})\n"
                              f"Khách hàng đã có thể tìm thấy sản phẩm của cô/chú trên AgriSmart rồi ạ 🎉",
                "products":   [],
                "product_id": new_id,
            }
        else:
            return {"type": "error",
                    "message": "Dạ cháu lưu bài đăng vào hệ thống thất bại, "
                               "cô/chú thử lại sau nhé ạ. 🙏",
                    "products": []}

    # ── Main process ───────────────────────────────────────────────────────
    def process(self, text_input=None) -> dict:
        # Chưa cấu hình AI
        if not AI_ENABLED:
            return {
                "type":     "ai_disabled",
                "message":  "Dạ trợ lý AI chưa được kích hoạt (thiếu GEMINI_API_KEY). "
                            "Vui lòng thêm khóa API vào backend/.env rồi khởi động lại máy chủ ạ.",
                "products": [],
            }

        # Xác nhận đăng bài (lệnh nội bộ từ frontend)
        if text_input == "__CONFIRM_POST__":
            return self._confirm_post()

        # Rate limit
        rl = self._check_rate_limit()
        if rl:
            return rl

        self.last_chat_time     = time.time()
        self.daily_chats_count += 1

        user_text = (text_input or "").strip()
        if not user_text:
            return {"type": "error", "message": "Không nhận được đầu vào.", "products": []}

        # RAG + giá thị trường (0 Gemini call)
        rag_docs     = db_search_crop_knowledge(user_text)
        market_hint  = ""
        pname_hint   = self.seller_collected_data.get("name", "")
        if pname_hint:
            mp = db_get_market_price(pname_hint)
            if mp:
                market_hint = (
                    f"{mp['product_name']} ({mp['standard']}, {mp['region']}): "
                    f"{mp['min_price']:,.0f}–{mp['max_price']:,.0f}đ/kg "
                    f"| TB: {mp['avg_price']:,.0f}đ/kg "
                    f"| Ngưỡng đàm phán: {mp['negotiate_threshold']:,.0f}đ/kg"
                )

        # 1 Gemini call
        ai     = unified_main_handler(user_text, self.seller_collected_data, rag_docs, market_hint)
        intent = ai.get("intent", "UNKNOWN")

        # ── BUYER ──────────────────────────────────────────────────────────
        if intent == "BUYER":
            criteria = ai["buyer_criteria"]
            products = [{**p, "detail_url": f"/product/{p['id']}",
                             "contact_url": f"/contact/{p['id']}"}
                        for p in db_buyer_search(criteria)]
            message = ai.get("buyer_message", "")
            if not message:
                name = criteria.get("search_summary") or criteria.get("product_name") or "nông sản"
                message = (
                    f"Cháu tìm được {len(products)} sản phẩm phù hợp với '{name}' ạ."
                    if products else
                    f"Dạ cháu chưa tìm thấy '{name}' phù hợp. "
                    "Cô/chú để lại thông tin để cháu báo khi có hàng nhé ạ!"
                )
            return {"type": "buyer_result", "message": message, "products": products,
                    "has_results": bool(products), "criteria": criteria}

        # ── SELLER ─────────────────────────────────────────────────────────
        elif intent == "SELLER":
            extracted = ai.get("seller_extracted", {})
            # Gộp thông tin mới vào session
            self.seller_collected_data.update(
                {k: v for k, v in extracted.items() if v is not None}
            )

            # Chưa đủ thông tin → hỏi tiếp
            if not ai.get("seller_complete"):
                next_q = ai.get("seller_next_question", "Cháu cần thêm thông tin để đăng bài ạ.")
                return {
                    "type":      "seller_collecting",
                    "message":   next_q,
                    "products":  [],
                    "collected": dict(self.seller_collected_data),
                }

            action = ai.get("seller_action", "none")

            # Cần đàm phán giá
            if action == "negotiate":
                return {
                    "type":    "seller_negotiate",
                    "message": ai.get("seller_negotiate_message",
                                      "Giá này hơi cao so với thị trường, cô/chú xem lại giúp cháu nhé ạ."),
                    "products": [],
                }

            # Đủ thông tin + giá hợp lý → tạo preview, chờ xác nhận
            if action == "post":
                payload = ai.get("seller_post", {})
                # Lưu vào pending
                self.pending_post_payload = payload

                preview_msg = (
                    "Dạ cháu đã soạn xong bài đăng cho cô/chú rồi ạ! 🌿\n"
                    "Cô/chú xem qua nội dung bên dưới, nếu ưng thì nhấn "
                    "**Đăng bài lên shop** để cháu đăng ngay nhé!"
                )
                return {
                    "type":    "seller_ready_to_post",
                    "message": preview_msg,
                    "payload": payload,
                    "products": [],
                }

            # Fallback
            return {"type": "seller_collecting",
                    "message": "Cháu cần thêm thông tin, cô/chú nhắn tiếp nhé ạ.",
                    "products": []}

        # ── RAG ────────────────────────────────────────────────────────────
        elif intent == "RAG":
            return {
                "type":    "rag_answer",
                "message": ai.get("rag_answer", "Dạ cháu chưa có đủ tài liệu về vấn đề này ạ."),
                "products": [],
            }

        # ── UNKNOWN ────────────────────────────────────────────────────────
        else:
            return {
                "type":    "unknown",
                "message": ai.get("unknown_reply",
                    "Dạ cháu là trợ lý nông nghiệp ạ! Cháu có thể giúp cô/chú:\n"
                    "• 🛒 Tìm mua nông sản\n• 📢 Đăng bán nông sản\n"
                    "• 🌱 Hỏi kỹ thuật trồng trọt, VietGAP\nCô/chú cần giúp gì ạ?"),
                "products": [],
            }

    def reset(self):
        self.seller_collected_data = {}
        self.pending_post_payload  = {}
