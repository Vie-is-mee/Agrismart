# =============================================================================
# AGRI-CHATBOX - LOGIC AI TỐI ƯU v2.0
# Tác giả: AI Assistant
# Mô tả: Chatbot nông nghiệp SELLER / BUYER / RAG — kết nối SQL Server thật.
#
# 🚀 TỐI ƯU REQUEST:
#   - Không có ảnh : 1 Gemini call/lượt
#   - Có ảnh hợp lệ: 2 Gemini calls (vision + unified handler)
#   - Ảnh bị từ chối: 1 call (vision, dừng sớm)
#   - Tất cả query DB: Python/pyodbc, KHÔNG tốn Gemini quota
#
# ⚠️  CÀI ĐẶT:
#   pip install google-generativeai python-dotenv pillow SpeechRecognition pyodbc
#
# ⚙️  BIẾN MÔI TRƯỜNG (.env):
#   GEMINI_API_KEY=your_key_here
#   DB_CONNECTION_STRING=DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=AgriEco_DB;Trusted_Connection=yes;
#   # Hoặc dùng user/pass:
#   # DB_CONNECTION_STRING=DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=AgriEco_DB;UID=sa;PWD=your_pass;
# =============================================================================

import google.generativeai as genai
import json
import os
import contextlib
from PIL import Image
from dotenv import load_dotenv
import time
from datetime import datetime, date

try:
    import pyodbc
    HAS_PYODBC = True
except ImportError:
    HAS_PYODBC = False
    print("⚠️  pyodbc chưa được cài. Chạy: pip install pyodbc")

# =============================================================================
# SECTION 0: CẤU HÌNH
# =============================================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")
DB_CONNECTION_STRING = os.getenv(
    "DB_CONNECTION_STRING",
    "DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;"
    "DATABASE=AgriEco_DB;Trusted_Connection=yes;"
)

genai.configure(api_key=GEMINI_API_KEY)

MAIN_MODEL   = "gemini-2.5-flash"
VISION_MODEL = "gemini-2.5-flash"

# =============================================================================
# SECTION 1: KẾT NỐI DATABASE
# =============================================================================

@contextlib.contextmanager
def db_cursor(autocommit: bool = False):
    """
    Context manager mở/đóng kết nối SQL Server an toàn.
    Tự commit khi thành công, rollback khi có lỗi.

    Usage:
        with db_cursor() as cur:
            cur.execute("SELECT ...")
    """
    if not HAS_PYODBC:
        raise RuntimeError("pyodbc chưa cài — không thể kết nối DB.")
    conn = None
    try:
        conn = pyodbc.connect(DB_CONNECTION_STRING, timeout=10, autocommit=autocommit)
        cursor = conn.cursor()
        yield cursor
        if not autocommit:
            conn.commit()
    except pyodbc.Error as exc:
        if conn and not autocommit:
            try:
                conn.rollback()
            except Exception:
                pass
        print(f"  [DB] Lỗi kết nối/truy vấn: {exc}")
        raise
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass


def _row_to_dict(cursor, row) -> dict:
    """Chuyển pyodbc.Row thành dict theo tên cột."""
    cols = [col[0] for col in cursor.description]
    return dict(zip(cols, row))

# =============================================================================
# SECTION 2: HÀM TRUY VẤN DB THẬT (thay toàn bộ mock cũ)
# =============================================================================

def db_get_market_price(product_name: str) -> dict:
    """
    🔎 Tra giá thị trường từ bảng Market_Prices (qua view vw_Market_Price_Summary).
    Trả về dict gồm avg_price, min, max, negotiate_threshold.
    Trả về {} nếu không tìm thấy hoặc lỗi DB.

    SQL tương đương:
        SELECT TOP 1 ... FROM vw_Market_Price_Summary
        WHERE product_name LIKE '%cam sành%'
        ORDER BY update_date DESC
    """
    if not product_name:
        return {}
    try:
        with db_cursor() as cur:
            cur.execute("""
                SELECT TOP 1
                    product_name, standard, region,
                    min_price, max_price, unit, update_date,
                    CAST((min_price + max_price) / 2.0 AS DECIMAL(15,2)) AS avg_price
                FROM vw_Market_Price_Summary
                WHERE LOWER(product_name) LIKE ?
                ORDER BY update_date DESC
            """, f"%{product_name.lower()}%")
            row = cur.fetchone()
            if row:
                d = _row_to_dict(cur, row)
                avg = float(d["avg_price"])
                return {
                    "product_name":        d["product_name"],
                    "standard":            d["standard"],
                    "region":              d["region"],
                    "min_price":           float(d["min_price"]),
                    "max_price":           float(d["max_price"]),
                    "avg_price":           avg,
                    "negotiate_threshold": round(avg * 1.15),
                    "unit":                d["unit"],
                }
    except Exception as exc:
        print(f"  [DB] db_get_market_price error: {exc}")
    return {}


def db_search_crop_knowledge(query: str) -> list:
    """
    📚 Tìm tài liệu RAG từ Crop_Knowledge + Crop_Disease_Info.
    Dùng keyword matching Python để xác định loại cây, sau đó query DB.
    Trả về list[str] — mỗi phần tử là 1 đoạn tài liệu cho prompt AI.

    SQL tương đương:
        SELECT * FROM Crop_Knowledge WHERE crop_name = N'Lúa'
        SELECT * FROM vw_Crop_Disease_Chat WHERE crop_name = N'Lúa'
    """
    # Bản đồ từ khóa → tên cây trong DB
    KEYWORD_MAP = {
        "lúa":           "Lúa",
        "gạo":           "Lúa",
        "vàng lá lúa":   "Lúa",
        "đạo ôn":        "Lúa",
        "bạc lá":        "Lúa",
        "rầy nâu":       "Lúa",
        "lem lép":       "Lúa",
        "cà phê robusta":"Cà phê Robusta",
        "cà phê arabica":"Cà phê Arabica",
        "cà phê":        "Cà phê Robusta",
        "robusta":       "Cà phê Robusta",
        "arabica":       "Cà phê Arabica",
        "cam sành":      "Cam sành",
        "cam":           "Cam sành",
        "xoài":          "Xoài",
        "sầu riêng":     "Sầu riêng",
        "monthong":      "Sầu riêng",
        "ri6":           "Sầu riêng",
        "thanh long":    "Thanh long",
        "hồ tiêu":       "Hồ tiêu",
        "tiêu đen":      "Hồ tiêu",
        "hạt tiêu":      "Hồ tiêu",
        "điều":          "Điều",
        "hạt điều":      "Điều",
        "vải thiều":     "Vải thiều",
        "vải":           "Vải thiều",
        "nhãn":          "Nhãn",
        "nhãn lồng":     "Nhãn",
        "dưa hấu":       "Dưa hấu",
        "khoai lang":    "Khoai lang",
        "khoai":         "Khoai lang",
        "mít thái":      "Mít Thái",
        "mít":           "Mít Thái",
        "bơ":            "Bơ",
        "bơ 034":        "Bơ",
    }

    query_lower = query.lower()
    matched_crops: set = set()
    for kw, crop_name in KEYWORD_MAP.items():
        if kw in query_lower:
            matched_crops.add(crop_name)

    if not matched_crops:
        return []

    disease_trigger_words = [
        "bệnh", "thối", "héo", "vàng lá", "đốm", "rầy", "sâu", "rệp",
        "nấm", "vi khuẩn", "gỉ sắt", "đạo ôn", "thán thư", "chết nhanh",
        "chết chậm", "lùn", "xoắn", "triệu chứng", "phòng trị", "thuốc",
    ]
    is_disease_query = any(kw in query_lower for kw in disease_trigger_words)

    docs = []
    try:
        with db_cursor() as cur:
            for crop in matched_crops:
                # ── Kiến thức chăm sóc tổng quát ────────────────────────────
                cur.execute("""
                    SELECT crop_name, description, care_tips,
                           storage_tips, growing_regions, harvest_months,
                           popular_standard
                    FROM Crop_Knowledge
                    WHERE crop_name = ?
                """, crop)
                row = cur.fetchone()
                if row:
                    d = _row_to_dict(cur, row)
                    docs.append(
                        f"[Kiến thức về {d['crop_name']}]\n"
                        f"Mô tả: {d['description']}\n"
                        f"Vùng trồng: {d['growing_regions']}\n"
                        f"Mùa vụ: {d['harvest_months']}\n"
                        f"Tiêu chuẩn phổ biến: {d['popular_standard']}\n"
                        f"Kỹ thuật chăm sóc: {d['care_tips']}\n"
                        f"Bảo quản: {d['storage_tips']}"
                    )

                # ── Thông tin bệnh cây ───────────────────────────────────────
                cur.execute("""
                    SELECT disease_name, symptoms, causes, prevention, treatment
                    FROM vw_Crop_Disease_Chat
                    WHERE crop_name = ?
                """, crop)
                diseases = cur.fetchmany(5)  # Tối đa 5 bệnh/loại cây

                for d_row in diseases:
                    d = _row_to_dict(cur, d_row)
                    if is_disease_query:
                        # Lọc bệnh khớp với nội dung câu hỏi
                        combined = (d["disease_name"] + " " + (d["symptoms"] or "")).lower()
                        if any(kw in combined for kw in query_lower.split()):
                            docs.append(
                                f"[Bệnh '{d['disease_name']}' trên {crop}]\n"
                                f"Triệu chứng: {d['symptoms']}\n"
                                f"Nguyên nhân: {d['causes']}\n"
                                f"Phòng ngừa: {d['prevention']}\n"
                                f"Điều trị: {d['treatment']}"
                            )
                    else:
                        # Câu hỏi kỹ thuật chung — tóm tắt ngắn
                        docs.append(
                            f"[Bệnh '{d['disease_name']}' trên {crop}]\n"
                            f"Triệu chứng: {d['symptoms']}\n"
                            f"Điều trị tóm tắt: {d['treatment']}"
                        )
    except Exception as exc:
        print(f"  [DB] db_search_crop_knowledge error: {exc}")

    return docs[:5]  # Giới hạn 5 tài liệu để prompt không quá dài


def db_buyer_search(criteria: dict) -> list:
    """
    🛒 Tìm sản phẩm theo tiêu chí (tên, giá, số lượng, vị trí, tiêu chuẩn).
    Query view vw_Active_Products đã lọc sẵn is_deleted=0, status='active'.
    Trả về list[dict] tương thích với code xử lý cũ.

    SQL tương đương:
        SELECT TOP 5 * FROM vw_Active_Products
        WHERE LOWER(name) LIKE '%xoài%'
          AND price <= 40000
          AND quantity >= 50
        ORDER BY rating DESC, price ASC
    """
    MIEN_TAY = [
        "tiền giang", "đồng tháp", "an giang", "kiên giang", "long an",
        "vĩnh long", "bến tre", "hậu giang", "sóc trăng", "trà vinh",
        "cần thơ", "bạc liêu", "cà mau",
    ]

    conds  = []
    params = []

    pname = criteria.get("product_name", "")
    if pname:
        conds.append("(LOWER(name) LIKE ? OR LOWER(category) LIKE ?)")
        params += [f"%{pname.lower()}%", f"%{pname.lower()}%"]

    if criteria.get("max_price_per_kg"):
        conds.append("price <= ?")
        params.append(criteria["max_price_per_kg"])

    if criteria.get("min_price_per_kg"):
        conds.append("price >= ?")
        params.append(criteria["min_price_per_kg"])

    if criteria.get("min_quantity_kg"):
        conds.append("quantity >= ?")
        params.append(criteria["min_quantity_kg"])

    q_kws = criteria.get("quality_keywords") or []
    if q_kws:
        conds.append("(" + " OR ".join(["LOWER(standard) LIKE ?" for _ in q_kws]) + ")")
        params += [f"%{kw.lower()}%" for kw in q_kws]

    loc = (criteria.get("location") or "").lower().strip()
    if loc:
        if any(t in loc for t in ["miền tây", "đbscl", "đồng bằng sông cửu"]):
            loc_parts = []
            for prov in MIEN_TAY:
                loc_parts.append("(LOWER(seller_address) LIKE ? OR LOWER(market_region) LIKE ?)")
                params += [f"%{prov}%", f"%{prov}%"]
            conds.append("(" + " OR ".join(loc_parts) + ")")
        else:
            conds.append("(LOWER(seller_address) LIKE ? OR LOWER(market_region) LIKE ?)")
            params += [f"%{loc}%", f"%{loc}%"]

    where = ("WHERE " + " AND ".join(conds)) if conds else ""
    sql = f"""
        SELECT TOP 5
            id, name, category, standard, quantity, unit,
            price, rating, image_url,
            seller_name, seller_phone, seller_address
        FROM vw_Active_Products
        {where}
        ORDER BY rating DESC, price ASC
    """

    results = []
    try:
        with db_cursor() as cur:
            cur.execute(sql, params)
            cols = [c[0] for c in cur.description]
            for row in cur.fetchall():
                d = dict(zip(cols, row))
                results.append({
                    "id":           d["id"],
                    "name":         d["name"],
                    "price_per_kg": float(d["price"]),
                    "quantity_kg":  float(d["quantity"] or 0),
                    "location":     d["seller_address"] or "",
                    "seller_name":  d["seller_name"] or "",
                    "seller_phone": d["seller_phone"] or "",
                    "image_url":    d["image_url"] or "",
                    "rating":       float(d["rating"] or 0),
                    "standard":     d["standard"] or "",
                })
    except Exception as exc:
        print(f"  [DB] db_buyer_search error: {exc}")

    return results


def db_insert_product(payload: dict, seller_id: int) -> int:
    """
    ➕ INSERT sản phẩm mới vào bảng Products sau khi SELLER cung cấp đủ thông tin.
    Tự tra market_price_id nếu có giá tham chiếu.
    Trả về product_id vừa tạo, hoặc -1 nếu lỗi.

    SQL tương đương:
        INSERT INTO Products (seller_id, market_price_id, name, quantity, unit,
                              price, ai_marketing_content, status, rating)
        OUTPUT INSERTED.id
        VALUES (...)
    """
    name        = payload.get("title") or payload.get("name") or "Sản phẩm nông sản"
    description = payload.get("description") or ""
    price       = float(payload.get("final_price") or 0)
    quantity    = float(payload.get("quantity") or 0)

    # Tìm market_price_id tự động theo tên sản phẩm
    market_price_id = None
    first_word = name.split()[0] if name.split() else ""
    try:
        with db_cursor() as cur:
            cur.execute("""
                SELECT TOP 1 id FROM Market_Prices
                WHERE LOWER(product_name) LIKE ?
                ORDER BY update_date DESC
            """, f"%{first_word.lower()}%")
            mp = cur.fetchone()
            if mp:
                market_price_id = mp[0]
    except Exception:
        pass

    # INSERT sản phẩm
    try:
        with db_cursor() as cur:
            cur.execute("""
                INSERT INTO Products
                    (seller_id, market_price_id, name, quantity, unit,
                     price, ai_marketing_content, status, rating)
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, N'kg', ?, ?, 'active', 0)
            """, (seller_id, market_price_id, name, quantity, price, description))
            row = cur.fetchone()
            new_id = row[0] if row else -1
            print(f"  [DB] INSERT Products id={new_id} | '{name}' | {price:,.0f}đ/kg")
            return new_id
    except Exception as exc:
        print(f"  [DB] db_insert_product error: {exc}")
        return -1

# =============================================================================
# SECTION 3: ĐẦU VÀO ĐA PHƯƠNG THỨC
# =============================================================================

def process_voice_input(voice_path: str) -> str:
    """Chuyển file âm thanh → text (0 API calls)."""
    print(f"  [VOICE] Đang nhận dạng: {voice_path}...")
    try:
        import speech_recognition as sr
        recognizer = sr.Recognizer()
        with sr.AudioFile(voice_path) as source:
            audio = recognizer.record(source)
        text = recognizer.recognize_google(audio, language="vi-VN")
        print(f"  [VOICE] → '{text}'")
        return text
    except ImportError:
        print("  [VOICE] ⚠️  Chưa cài SpeechRecognition.")
        return ""
    except Exception as exc:
        print(f"  [VOICE] Lỗi: {exc}")
        return ""


def process_image_unified(image_path: str) -> dict:
    """
    ✅ TỐI ƯU: Gộp verify + semantic extraction thành 1 vision API call.
    - EXIF check: Python thuần, 0 API calls
    - AI verify + extract: 1 API call (JSON gộp)
    """
    print(f"  [IMAGE] Kiểm tra + trích xuất ngữ nghĩa: {image_path}...")

    # Lớp 1: EXIF (Python, 0 API calls)
    try:
        has_exif = bool(Image.open(image_path).getexif())
    except Exception:
        has_exif = False

    # Lớp 2: AI Vision
    model  = genai.GenerativeModel(VISION_MODEL)
    prompt = """
Bạn là chuyên gia thẩm định ảnh nông nghiệp. Phân tích bức ảnh này và trả về JSON:
{
    "is_suspicious": true/false,
    "fraud_reason": "lý do nghi ngờ nếu có, chuỗi rỗng nếu ảnh ổn",
    "description": "mô tả ngắn: đây là cây/sản phẩm gì, tình trạng, dấu hiệu bệnh lý nếu có"
}
Dấu hiệu nghi ngờ: watermark/logo thương mại, phông nền studio tách nền, ánh sáng phi thực tế, ảnh stock.
"""
    try:
        uploaded = genai.upload_file(path=image_path)
        response = model.generate_content(
            [prompt, uploaded],
            generation_config={"response_mime_type": "application/json"}
        )
        ai = json.loads(response.text)
    except Exception as exc:
        print(f"  [IMAGE] Lỗi AI vision: {exc}. Cho qua.")
        ai = {"is_suspicious": False, "fraud_reason": "", "description": "Không thể nhận diện."}

    is_authentic = has_exif and not ai.get("is_suspicious", False)
    print(f"  [IMAGE] EXIF: {has_exif} | AI: {'⚠️ Nghi ngờ' if ai.get('is_suspicious') else '✅ Ổn'}")

    return {
        "is_authentic":   is_authentic,
        "fraud_warning":  ai.get("fraud_reason", ""),
        "image_semantics": ai.get("description", ""),
    }


def process_multimodal_input(text_input=None, voice_path=None, image_path=None) -> dict:
    """
    Cửa ngõ đầu vào đa phương thức.
    Image → 1 API call (nếu có). Voice/Text → 0 API calls.
    """
    print("=" * 60)
    print("📥  PIPELINE TIỀN XỬ LÝ ĐẦU VÀO")

    ctx = {
        "user_intent_text": "",
        "image_status":     "no_image",
        "image_semantics":  "",
        "fraud_warning":    "",
    }

    if voice_path:
        ctx["user_intent_text"] += process_voice_input(voice_path)
    if text_input:
        ctx["user_intent_text"] += f" {text_input}"
    ctx["user_intent_text"] = ctx["user_intent_text"].strip()

    if image_path:
        img = process_image_unified(image_path)
        if not img["is_authentic"]:
            ctx["image_status"]  = "suspicious_image"
            ctx["fraud_warning"] = img["fraud_warning"]
            print(f"  🚨 TỪ CHỐI ẢNH: {img['fraud_warning']}")
        else:
            ctx["image_status"]   = "valid_image"
            ctx["image_semantics"] = img["image_semantics"]
            ctx["user_intent_text"] += f" [Ngữ cảnh từ ảnh đính kèm: {img['image_semantics']}]"

    preview = ctx["user_intent_text"][:100]
    print(f"  ✅ Text cuối: '{preview}...'")
    print("=" * 60)
    return ctx

# =============================================================================
# SECTION 4: UNIFIED MAIN HANDLER — 1 API CALL cho tất cả
# =============================================================================

def unified_main_handler(
    user_text:         str,
    seller_collected:  dict,
    has_valid_image:   bool,
    rag_docs:          list,
    market_price_hint: str = "",
) -> dict:
    """
    ✅ TỐI ƯU: 1 API call duy nhất thay thế router + handler + generator cũ.
    Prompt gộp vừa phân loại intent, vừa xử lý toàn bộ logic, trả 1 JSON.
    Python side chỉ còn đọc JSON và điều phối DB/UI.
    """
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
- RAG    : hỏi bệnh cây, kỹ thuật canh tác, phân bón, VietGAP, bảo quản
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
        "product_name":      null,
        "min_quantity_kg":   null,
        "max_price_per_kg":  null,
        "min_price_per_kg":  null,
        "location":          null,
        "quality_keywords":  [],
        "search_summary":    ""
    }},
    "buyer_message": "",

    "seller_extracted": {{
        "name": null, "location": null, "quantity": null,
        "price": null, "has_image": {str(has_valid_image).lower()}
    }},
    "seller_complete":           false,
    "seller_next_question":      "",
    "seller_action":             "none",
    "seller_negotiate_message":  "",
    "seller_post": {{
        "title":        "",
        "description":  "",
        "final_price":  0,
        "quantity":     0,
        "db_status":    "ready_to_insert"
    }},

    "rag_answer":    "",
    "unknown_reply": ""
}}

Câu của người dùng: "{user_text}"
"""

    model    = genai.GenerativeModel(MAIN_MODEL)
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(response_mime_type="application/json"),
        )
        result = json.loads(response.text)
        print(f"  [UNIFIED] → Intent: {result.get('intent')} | Action: {result.get('seller_action','n/a')}")
        return result
    except Exception as exc:
        # BẮT LỖI SẬP MẠNG HOẶC GOOGLE CHẶN
        print(f"  [GEMINI ERROR] Lỗi API: {exc}")
        return {
            "intent": "UNKNOWN",
            "unknown_reply": "Dạ hiện tại đường truyền mạng đang hơi chậm, não cháu xử lý chưa kịp. Cô/chú đợi vài phút nữa rồi nhắn lại giúp cháu nhé ạ!"
        }

# =============================================================================
# SECTION 5: KHỞI TẠO PHIÊN CHAT
# =============================================================================

def init_chat_session():
    """Chat session giữ lịch sử hội thoại tự nhiên."""
    model = genai.GenerativeModel(MAIN_MODEL)
    return model.start_chat(history=[])

# =============================================================================
# SECTION 6: AI ORCHESTRATION LAYER
# =============================================================================

class AgriChatbot:
    """
    Chatbot nông nghiệp tổng hợp.

    Số API calls/lượt:
      - Không có ảnh : 1 Gemini call
      - Có ảnh hợp lệ: 2 Gemini calls (vision + unified)
      - Ảnh bị từ chối: 1 Gemini call (vision, dừng sớm)
    Mọi query DB đều dùng pyodbc — KHÔNG tốn Gemini quota.
    """

    def __init__(self, seller_user_id: int = 1):
        """
        seller_user_id: ID người dùng hiện tại trong bảng Users.
        Dùng để INSERT sản phẩm đúng seller_id khi đăng bài.
        Trong production: lấy từ JWT/session sau đăng nhập.
        """
        self.chat_session         = init_chat_session()
        self.seller_collected_data: dict  = {}
        self.has_valid_image:       bool  = False
        self.seller_user_id:        int   = seller_user_id
        
        # --- THÊM BỘ ĐẾM RATE LIMITING VÀO ĐÂY ---
        self.last_chat_time: float = 0.0  # Lưu timestamp (giây) của lần nhắn cuối
        self.daily_chats_count: int = 0   # Số tin đã nhắn trong ngày
        self.current_date: date = datetime.now().date() # Ngày hiện tại

    # ──────────────────────────────────────────────────────────────────────────

    def process(self, text_input=None, voice_path=None, image_path=None) -> dict:
        """Entry point chính của chatbot."""
        
        # --- BƯỚC 0: TRẠM KIỂM SOÁT RATE LIMITING ---
        MAX_CHATS_PER_DAY = 20  # Giới hạn 20 tin/ngày/người
        COOLDOWN_SECONDS = 12   # Bắt buộc đợi 12 giây giữa 2 tin nhắn

        # 1. Reset bộ đếm nếu đã qua ngày mới
        today = datetime.now().date()
        if today > self.current_date:
            self.current_date = today
            self.daily_chats_count = 0

        # 2. Kiểm tra giới hạn theo ngày (Hết API trong 1 ngày)
        if self.daily_chats_count >= MAX_CHATS_PER_DAY:
            return {
                "type": "rate_limit_day",
                "message": "Dạ xin lỗi cô/chú vì sự bất tiện này, nhưng hiện cô/chú đã hết lượt nhờ cháu tư vấn trong hôm nay rồi ạ! Ngày mai cô/chú hãy nhắn lại nhé! Cảm ơn cô/chú đã sử dụng website ạ!",
                "products": []
            }

        # 3. Kiểm tra giới hạn tốc độ gõ (Đợi số giây)
        now = time.time()
        time_passed = now - self.last_chat_time
        if time_passed < COOLDOWN_SECONDS:
            seconds_left = int(COOLDOWN_SECONDS - time_passed)
            return {
                "type": "rate_limit_minute",
                "message": f"Dạ cô/chú thao tác nhanh quá, hệ thống xử lý không kịp ạ. Cô/chú vui lòng đợi {seconds_left} giây nữa để nhắn tin tiếp nhé, mong cô chú thông cảm ạ!",
                "products": []
            }

        # Nếu qua ải an toàn, cập nhật lại thời gian và tăng số đếm tin nhắn
        self.last_chat_time = now
        self.daily_chats_count += 1

        # ── Bước 1: Tiền xử lý đa phương thức (0 hoặc 1 vision call) ─────────
        ctx = process_multimodal_input(text_input, voice_path, image_path)

        if image_path:
            if ctx["image_status"] == "valid_image":
                self.has_valid_image = True
            elif ctx["image_status"] == "suspicious_image":
                return {
                    "type":     "fraud_warning",
                    "message":  f"🚨 Ảnh bị từ chối: {ctx['fraud_warning']}. "
                                "Cô/chú vui lòng chụp ảnh thật từ điện thoại tại vườn/ruộng nhé ạ!",
                    "products": [],
                }

        user_text = ctx["user_intent_text"]
        if not user_text:
            return {"type": "error", "message": "Không nhận được đầu vào.", "products": []}

        # ── Bước 2: Tìm tài liệu RAG từ DB (0 Gemini calls) ──────────────────
        rag_docs = db_search_crop_knowledge(user_text)

        # ── Bước 3: Tra giá thị trường (0 Gemini calls) ───────────────────────
        market_hint = ""
        product_name_hint = self.seller_collected_data.get("name", "")
        if product_name_hint:
            mp = db_get_market_price(product_name_hint)
            if mp:
                market_hint = (
                    f"{mp['product_name']} ({mp['standard']}, {mp['region']}): "
                    f"{mp['min_price']:,.0f}–{mp['max_price']:,.0f}đ/kg "
                    f"| Trung bình: {mp['avg_price']:,.0f}đ/kg "
                    f"| Ngưỡng đàm phán (>+15%): {mp['negotiate_threshold']:,.0f}đ/kg"
                )

        # ── Bước 4: 1 Gemini call duy nhất ───────────────────────────────────
        print("\n" + "─" * 60)
        print("🤖  UNIFIED HANDLER — 1 GEMINI CALL")
        ai = unified_main_handler(
            user_text,
            self.seller_collected_data,
            self.has_valid_image,
            rag_docs,
            market_hint,
        )
        print("─" * 60)

        intent = ai.get("intent", "UNKNOWN")

        # ── Bước 5: Xử lý kết quả (0 Gemini calls) ───────────────────────────

        # ── BUYER ─────────────────────────────────────────────────────────────
        if intent == "BUYER":
            criteria   = ai["buyer_criteria"]
            db_results = db_buyer_search(criteria)
            products   = [
                {**p,
                 "detail_url":  f"/product/{p['id']}",
                 "contact_url": f"/contact/{p['id']}"}
                for p in db_results
            ]
            message = ai.get("buyer_message", "")
            if not message:
                name = criteria.get("search_summary") or criteria.get("product_name") or "nông sản"
                message = (
                    f"Em tìm được {len(products)} sản phẩm phù hợp với "
                    f"yêu cầu '{name}' của anh/chị ạ."
                    if products else
                    f"Dạ hiện tại em chưa tìm thấy '{name}' phù hợp. "
                    "Anh/chị có thể để lại thông tin để em thông báo khi có hàng ạ!"
                )
            return {
                "type":        "buyer_result",
                "message":     message,
                "products":    products,
                "has_results": bool(products),
                "criteria":    criteria,
            }

        # ── SELLER ────────────────────────────────────────────────────────────
        elif intent == "SELLER":
            extracted = ai.get("seller_extracted", {})
            self.seller_collected_data.update(
                {k: v for k, v in extracted.items() if v is not None}
            )

            if not ai.get("seller_complete"):
                return {
                    "type":      "seller_collecting",
                    "message":   ai.get("seller_next_question",
                                        "Cháu cần thêm thông tin để đăng bài ạ."),
                    "products":  [],
                    "collected": dict(self.seller_collected_data),
                }

            action = ai.get("seller_action", "none")

            if action == "negotiate":
                return {
                    "type":    "seller_negotiate",
                    "message": ai.get("seller_negotiate_message",
                                      "Giá này hơi cao so với thị trường, "
                                      "cô/chú xem xét lại giúp cháu nhé ạ."),
                    "products": [],
                }

            # action == "post" → đăng bài, INSERT vào DB
            payload    = ai.get("seller_post", {})
            new_prod_id = db_insert_product(payload, self.seller_user_id)

            # Reset trạng thái sau khi đăng thành công
            self.seller_collected_data = {}
            self.has_valid_image       = False

            status_note = (
                f" (ID sản phẩm: #{new_prod_id})" if new_prod_id > 0
                else " (⚠️ Lưu DB thất bại — kiểm tra kết nối)"
            )
            return {
                "type":    "seller_posted",
                "message": f"✅ Đã đăng bài: **{payload.get('title', '')}**"
                           f"{status_note}\n{payload.get('description', '')}",
                "products": [],
                "payload":  payload,
                "product_id": new_prod_id,
            }

        # ── RAG ───────────────────────────────────────────────────────────────
        elif intent == "RAG":
            return {
                "type":    "rag_answer",
                "message": ai.get("rag_answer",
                                  "Dạ cháu chưa có đủ tài liệu về vấn đề này ạ."),
                "products": [],
            }

        # ── UNKNOWN ───────────────────────────────────────────────────────────
        else:
            return {
                "type":    "unknown",
                "message": ai.get(
                    "unknown_reply",
                    "Dạ cháu là trợ lý nông nghiệp ạ! Cháu có thể giúp cô/chú:\n"
                    "• 🛒 **Tìm mua** nông sản\n"
                    "• 📢 **Đăng bán** nông sản\n"
                    "• 🌱 **Hỏi kỹ thuật** trồng trọt, VietGAP\n"
                    "Cô/chú cần giúp gì ạ?",
                ),
                "products": [],
            }

    # ──────────────────────────────────────────────────────────────────────────

    def reset(self):
        """Reset toàn bộ trạng thái khi user bắt đầu phiên mới."""
        self.chat_session          = init_chat_session()
        self.seller_collected_data = {}
        self.has_valid_image       = False

# =============================================================================
# SECTION 7: FLASK API ENDPOINT MẪU
# =============================================================================
# Uncomment khi tích hợp vào app.py

# =============================================================================
# SECTION 7: FLASK API ENDPOINT (Giao tiếp với Web/Ngrok)
# =============================================================================
from flask import Flask, request, jsonify
from flask_cors import CORS # Bắt buộc phải có để Web Colab không bị lỗi chặn CORS

# Khởi tạo máy chủ Web thu nhỏ bằng Flask
app = Flask(__name__)
CORS(app) # Cấp phép mọi luồng dữ liệu đi qua

# Khởi tạo não AI (Giả lập user ID = 1 đang đăng nhập)
chatbot = AgriChatbot(seller_user_id=1)

@app.route("/api/chat", methods=["POST"])
def chat_endpoint():
    """Cửa ngõ nhận dữ liệu JSON từ giao diện React/HTML gửi tới"""
    data = request.json
    print(f"\n[SERVER] Nhận được tin nhắn từ Web: {data.get('text')}")
    
    # Ném chữ của Web vào cho Class AgriChatbot xử lý
    result = chatbot.process(
        text_input = data.get("text"),
        voice_path = data.get("voice_path"),
        image_path = data.get("image_path"),
    )
    
    # Trả kết quả JSON về cho Web hiển thị
    return jsonify(result)

# =============================================================================
# SECTION 8: KHỞI ĐỘNG HỆ THỐNG (MAIN)
# =============================================================================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🚀  AGRI-CHATBOX ĐANG CHẠY CHẾ ĐỘ SERVER (CỔNG 5000) 🚀")
    print("=" * 60)
    
    # Lệnh này cắm điện giữ cho Python không bị tắt, liên tục lắng nghe ở cổng 5000
    app.run(host="0.0.0.0", port=5000, debug=False)

    # Truyền seller_user_id=1 (Nguyễn Văn Trồng trong Users)
    # bot = AgriChatbot(seller_user_id=1)

    # test_cases = [
    #     # ("BUYER TEST 1", "cần mua 50kg xoài cát Hòa Lộc, giá dưới 80k/kg, giao ở Đồng Tháp"),
    #     # ("BUYER TEST 2", "tìm mua 1 tạ gạo ST25 hữu cơ Sóc Trăng"),
    #     # ("BUYER TEST 3", "có ai bán cà phê robusta Đắk Lắk xuất khẩu không"),
    #     ("SELLER TEST",  "tôi muốn bán 300kg thanh long ruột đỏ Bình Thuận, giá 30k/kg"),
    #     # ("RAG TEST 1",   "cây xoài nhà tôi bị đốm nâu trên lá, làm sao trị?"),
    #     # ("RAG TEST 2",   "lúa nhà tôi đang bị vàng lá, triệu chứng có thể là bệnh gì?"),
    #     # ("RAG TEST 3",   "kỹ thuật chăm sóc sầu riêng đúng cách là như thế nào?"),
    # ]

    # for label, query in test_cases:
    #     print(f"\n{'=' * 60}")
    #     print(f"[{label}] Đầu vào: '{query}'")
    #     result = bot.process(text_input=query)
    #     print(f"\n💬 AI Message:\n{result['message']}")
    #     if result.get("products"):
    #         print(f"\n📦 Sản phẩm ({len(result['products'])} kết quả):")
    #         for p in result["products"]:
    #             print(f"  → [{p['id']}] {p['name']} | "
    #                   f"{p['price_per_kg']:,.0f}đ/kg | "
    #                   f"{p['quantity_kg']:.0f}kg | "
    #                   f"{p['location'][:30]} | "
    #                   f"⭐{p['rating']} | {p['standard']}")
        # bot.reset()
