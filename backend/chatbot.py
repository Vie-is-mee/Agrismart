# =============================================================================
# AGRI-CHATBOX — LOGIC AI (SQLite + Google GenAI SDK)
#
# Refactor từ Chatbox_no_disease.py gốc:
#   - SDK: google-generativeai (EOL 30/11/2025) → google-genai (client-based)
#   - DB : SQL Server/pyodbc → SQLite (database.py)
#   - SQL: TOP N → LIMIT N ; OUTPUT INSERTED.id → cursor.lastrowid
#   - Chạy "degrade" an toàn khi thiếu GEMINI_API_KEY (trả thông báo thân thiện)
#
# Số API call/lượt:  không ảnh = 1 ; có ảnh hợp lệ = 2 ; ảnh bị từ chối = 1
# Mọi truy vấn DB dùng sqlite3 — KHÔNG tốn quota Gemini.
# =============================================================================

import os
import json
import time
from datetime import datetime, date

from database import db_cursor

# ── SDK Gemini (tùy chọn) ────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MAIN_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
VISION_MODEL = os.getenv("GEMINI_VISION_MODEL", MAIN_MODEL)

_genai_client = None
_genai_types = None
try:
    if GEMINI_API_KEY:
        from google import genai
        from google.genai import types as _genai_types
        _genai_client = genai.Client(api_key=GEMINI_API_KEY)
        print(f"  [AI] Google GenAI sẵn sàng (model: {MAIN_MODEL})")
    else:
        print("  [AI] ⚠️  Chưa có GEMINI_API_KEY — chatbot chạy chế độ giới hạn.")
except Exception as exc:  # pragma: no cover
    print(f"  [AI] ⚠️  Không khởi tạo được Google GenAI: {exc}")
    _genai_client = None

AI_ENABLED = _genai_client is not None


def _gen_json(contents):
    """Gọi Gemini, ép trả JSON. contents: list[str | PIL.Image]."""
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
    """Tra giá thị trường từ view vw_Market_Price_Summary. {} nếu không thấy."""
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
    """Tìm tài liệu RAG từ Crop_Knowledge bằng keyword matching."""
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
    """Tìm sản phẩm theo tiêu chí từ view vw_Active_Products."""
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
    name = payload.get("title") or payload.get("name") or "Sản phẩm nông sản"
    description = payload.get("description") or ""
    price = float(payload.get("final_price") or 0)
    quantity = float(payload.get("quantity") or 0)

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
# SECTION 3: ĐẦU VÀO ĐA PHƯƠNG THỨC
# =============================================================================

def process_voice_input(voice_path: str) -> str:
    """Chuyển file âm thanh → text (0 API call). Cần SpeechRecognition (tùy chọn)."""
    try:
        import speech_recognition as sr
        r = sr.Recognizer()
        with sr.AudioFile(voice_path) as source:
            audio = r.record(source)
        return r.recognize_google(audio, language="vi-VN")
    except ImportError:
        print("  [VOICE] ⚠️  Chưa cài SpeechRecognition.")
        return ""
    except Exception as exc:
        print(f"  [VOICE] Lỗi: {exc}")
        return ""


def process_image_unified(image_path: str) -> dict:
    """Gộp verify ảnh + trích xuất ngữ nghĩa thành 1 vision call."""
    from PIL import Image

    try:
        has_exif = bool(Image.open(image_path).getexif())
    except Exception:
        has_exif = False

    prompt = """
Bạn là chuyên gia thẩm định ảnh nông nghiệp. Phân tích bức ảnh này và trả về JSON:
{
    "is_suspicious": true/false,
    "fraud_reason": "lý do nghi ngờ nếu có, chuỗi rỗng nếu ảnh ổn",
    "description": "mô tả ngắn: đây là cây/sản phẩm gì, tình trạng"
}
Dấu hiệu nghi ngờ: watermark/logo thương mại, phông nền studio tách nền, ánh sáng phi thực tế, ảnh stock.
"""
    try:
        img = Image.open(image_path)
        ai = _gen_json([prompt, img])
    except Exception as exc:
        print(f"  [IMAGE] Lỗi AI vision: {exc}. Cho qua.")
        ai = {"is_suspicious": False, "fraud_reason": "", "description": "Không thể nhận diện."}

    is_authentic = has_exif and not ai.get("is_suspicious", False)
    return {
        "is_authentic":    is_authentic,
        "fraud_warning":   ai.get("fraud_reason", ""),
        "image_semantics": ai.get("description", ""),
    }


def process_multimodal_input(text_input=None, voice_path=None, image_path=None) -> dict:
    ctx = {"user_intent_text": "", "image_status": "no_image",
           "image_semantics": "", "fraud_warning": ""}

    if voice_path:
        ctx["user_intent_text"] += process_voice_input(voice_path)
    if text_input:
        ctx["user_intent_text"] += f" {text_input}"
    ctx["user_intent_text"] = ctx["user_intent_text"].strip()

    if image_path:
        img = process_image_unified(image_path)
        if not img["is_authentic"]:
            ctx["image_status"] = "suspicious_image"
            ctx["fraud_warning"] = img["fraud_warning"]
        else:
            ctx["image_status"] = "valid_image"
            ctx["image_semantics"] = img["image_semantics"]
            ctx["user_intent_text"] += f" [Ngữ cảnh từ ảnh đính kèm: {img['image_semantics']}]"
    return ctx


# =============================================================================
# SECTION 4: UNIFIED MAIN HANDLER — 1 API CALL
# =============================================================================

def unified_main_handler(user_text, seller_collected, has_valid_image, rag_docs, market_price_hint=""):
    rag_context = "\n\n".join(rag_docs) if rag_docs else "Không có tài liệu kỹ thuật liên quan."

    prompt = f"""
Bạn là trợ lý AI cho chợ nông sản Việt Nam. Xử lý yêu cầu người dùng và trả về JSON.

=== DỮ LIỆU PHIÊN HIỆN TẠI ===
Thông tin người bán đã thu thập được: {json.dumps(seller_collected, ensure_ascii=False)}
Tình trạng ảnh: {"Đã có ảnh hợp lệ ✅" if has_valid_image else "Chưa có ảnh ❌"}
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
    price (VND), has_image (lấy từ tình trạng ảnh trên)
  - Nếu CHƯA ĐỦ: seller_complete=false, hỏi 1 thứ còn thiếu (seller_next_question).
  - Nếu ĐỦ RỒI:
      + Nếu price > giá thị trường tham chiếu 15%: seller_action="negotiate",
        viết seller_negotiate_message khéo léo đề nghị giá hợp lý.
      + Nếu giá hợp lý: seller_action="post",
        viết seller_post: title hấp dẫn có emoji, description 3-4 câu thân thiện.
  Xưng cháu, gọi cô/chú với giọng mộc mạc gần gũi.

[RAG]
  Trả lời DỰA HOÀN TOÀN vào tài liệu kỹ thuật đã cung cấp ở trên.
  Nếu tài liệu rỗng hoặc không liên quan:
    → rag_answer = "Dạ hệ thống cháu chưa có tài liệu về vấn đề này. Cô/chú liên hệ Trạm Khuyến nông địa phương để được hỗ trợ miễn phí ạ."
  Không bịa thêm thông tin ngoài tài liệu. Xưng cháu, gọi cô/chú.

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
        "price": null, "has_image": {str(has_valid_image).lower()}
    }},
    "seller_complete": false,
    "seller_next_question": "",
    "seller_action": "none",
    "seller_negotiate_message": "",
    "seller_post": {{
        "title": "", "description": "", "final_price": 0,
        "quantity": 0, "db_status": "ready_to_insert"
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
# SECTION 6: AI ORCHESTRATION
# =============================================================================

class AgriChatbot:
    def __init__(self, seller_user_id: int = 1):
        self.seller_collected_data: dict = {}
        self.has_valid_image: bool = False
        self.seller_user_id: int = seller_user_id
        self.last_chat_time: float = 0.0
        self.daily_chats_count: int = 0
        self.current_date: date = datetime.now().date()

    def process(self, text_input=None, voice_path=None, image_path=None) -> dict:
        # ── Nếu chưa cấu hình AI: trả thông báo thân thiện (vẫn cho test giao diện) ──
        if not AI_ENABLED:
            return {
                "type": "ai_disabled",
                "message": "Dạ trợ lý AI chưa được kích hoạt (thiếu GEMINI_API_KEY). "
                           "Vui lòng thêm khóa API vào backend/.env rồi khởi động lại máy chủ ạ.",
                "products": [],
            }

        # ── BƯỚC 0: RATE LIMIT ──
        MAX_CHATS_PER_DAY = int(os.getenv("MAX_CHATS_PER_DAY", "20"))
        COOLDOWN_SECONDS = int(os.getenv("COOLDOWN_SECONDS", "12"))

        today = datetime.now().date()
        if today > self.current_date:
            self.current_date = today
            self.daily_chats_count = 0

        if self.daily_chats_count >= MAX_CHATS_PER_DAY:
            return {"type": "rate_limit_day",
                    "message": "Dạ xin lỗi cô/chú, hôm nay cô/chú đã hết lượt nhờ cháu tư vấn rồi ạ! "
                               "Ngày mai cô/chú nhắn lại nhé. Cảm ơn cô/chú ạ!",
                    "products": []}

        now = time.time()
        passed = now - self.last_chat_time
        if passed < COOLDOWN_SECONDS:
            left = int(COOLDOWN_SECONDS - passed)
            return {"type": "rate_limit_minute",
                    "message": f"Dạ cô/chú thao tác hơi nhanh, hệ thống xử lý chưa kịp ạ. "
                               f"Cô/chú đợi {left} giây nữa rồi nhắn tiếp giúp cháu nhé!",
                    "products": []}

        self.last_chat_time = now
        self.daily_chats_count += 1

        # ── BƯỚC 1: Tiền xử lý đa phương thức ──
        ctx = process_multimodal_input(text_input, voice_path, image_path)

        if image_path:
            if ctx["image_status"] == "valid_image":
                self.has_valid_image = True
            elif ctx["image_status"] == "suspicious_image":
                return {"type": "fraud_warning",
                        "message": f"🚨 Ảnh bị từ chối: {ctx['fraud_warning']}. "
                                   "Cô/chú vui lòng chụp ảnh thật từ điện thoại tại vườn/ruộng nhé ạ!",
                        "products": []}

        user_text = ctx["user_intent_text"]
        if not user_text:
            return {"type": "error", "message": "Không nhận được đầu vào.", "products": []}

        # ── BƯỚC 2-3: RAG + giá thị trường (0 Gemini call) ──
        rag_docs = db_search_crop_knowledge(user_text)
        market_hint = ""
        pname_hint = self.seller_collected_data.get("name", "")
        if pname_hint:
            mp = db_get_market_price(pname_hint)
            if mp:
                market_hint = (f"{mp['product_name']} ({mp['standard']}, {mp['region']}): "
                               f"{mp['min_price']:,.0f}–{mp['max_price']:,.0f}đ/kg "
                               f"| TB: {mp['avg_price']:,.0f}đ/kg "
                               f"| Ngưỡng đàm phán: {mp['negotiate_threshold']:,.0f}đ/kg")

        # ── BƯỚC 4: 1 Gemini call ──
        ai = unified_main_handler(user_text, self.seller_collected_data,
                                  self.has_valid_image, rag_docs, market_hint)
        intent = ai.get("intent", "UNKNOWN")

        # ── BƯỚC 5: Điều phối kết quả ──
        if intent == "BUYER":
            criteria = ai["buyer_criteria"]
            products = [{**p, "detail_url": f"/product/{p['id']}",
                         "contact_url": f"/contact/{p['id']}"}
                        for p in db_buyer_search(criteria)]
            message = ai.get("buyer_message", "")
            if not message:
                name = criteria.get("search_summary") or criteria.get("product_name") or "nông sản"
                message = (f"Cháu tìm được {len(products)} sản phẩm phù hợp với '{name}' ạ."
                           if products else
                           f"Dạ cháu chưa tìm thấy '{name}' phù hợp. "
                           "Cô/chú để lại thông tin để cháu báo khi có hàng nhé ạ!")
            return {"type": "buyer_result", "message": message, "products": products,
                    "has_results": bool(products), "criteria": criteria}

        elif intent == "SELLER":
            extracted = ai.get("seller_extracted", {})
            self.seller_collected_data.update({k: v for k, v in extracted.items() if v is not None})

            if not ai.get("seller_complete"):
                return {"type": "seller_collecting",
                        "message": ai.get("seller_next_question", "Cháu cần thêm thông tin để đăng bài ạ."),
                        "products": [], "collected": dict(self.seller_collected_data)}

            action = ai.get("seller_action", "none")
            if action == "negotiate":
                return {"type": "seller_negotiate",
                        "message": ai.get("seller_negotiate_message",
                                          "Giá này hơi cao so với thị trường, cô/chú xem lại giúp cháu nhé ạ."),
                        "products": []}

            payload = ai.get("seller_post", {})
            new_id = db_insert_product(payload, self.seller_user_id)
            self.seller_collected_data = {}
            self.has_valid_image = False
            note = f" (ID sản phẩm: #{new_id})" if new_id > 0 else " (⚠️ Lưu DB thất bại)"
            return {"type": "seller_posted",
                    "message": f"✅ Đã đăng bài: **{payload.get('title','')}**{note}\n{payload.get('description','')}",
                    "products": [], "payload": payload, "product_id": new_id}

        elif intent == "RAG":
            return {"type": "rag_answer",
                    "message": ai.get("rag_answer", "Dạ cháu chưa có đủ tài liệu về vấn đề này ạ."),
                    "products": []}
        else:
            return {"type": "unknown",
                    "message": ai.get("unknown_reply",
                        "Dạ cháu là trợ lý nông nghiệp ạ! Cháu có thể giúp cô/chú:\n"
                        "• 🛒 Tìm mua nông sản\n• 📢 Đăng bán nông sản\n"
                        "• 🌱 Hỏi kỹ thuật trồng trọt, VietGAP\nCô/chú cần giúp gì ạ?"),
                    "products": []}

    def reset(self):
        self.seller_collected_data = {}
        self.has_valid_image = False
