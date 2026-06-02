-- =============================================================================
--  AgriSmart — Schema SQLite (AgriEco_DB)
--  Chuyển thể từ final.sql (SQL Server) sang SQLite cho dễ chạy.
--  Đã BỔ SUNG các bảng/view mà backend chatbot tham chiếu nhưng schema gốc thiếu:
--    - Bảng Crop_Knowledge      (cho tính năng RAG hỏi kỹ thuật)
--    - View vw_Market_Price_Summary  (tra giá thị trường)
--    - View vw_Active_Products  (đủ cột: standard, quantity, unit,
--                                seller_phone, seller_address, market_region)
--  Đã THÊM:
--    - Users.password_hash      (để đăng nhập/đăng ký thật)
--    - Market_Prices.unit
-- =============================================================================

PRAGMA foreign_keys = ON;

-- ── NGƯỜI DÙNG ───────────────────────────────────────────────────────────────
CREATE TABLE Users (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    phone            TEXT    NOT NULL UNIQUE,
    password_hash    TEXT,                         -- thêm mới: phục vụ auth
    address          TEXT,
    cooperative_name TEXT,
    role             TEXT    NOT NULL DEFAULT 'buyer'
                     CHECK (role IN ('admin','seller','buyer')),
    is_deleted       INTEGER DEFAULT 0,
    created_at       TEXT    DEFAULT (datetime('now','localtime'))
);

-- ── GIÁ THỊ TRƯỜNG ───────────────────────────────────────────────────────────
CREATE TABLE Market_Prices (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT    NOT NULL,
    standard     TEXT,
    region       TEXT,
    unit         TEXT    DEFAULT 'kg',             -- thêm mới: view cần cột này
    min_price    REAL,
    max_price    REAL,
    update_date  TEXT    DEFAULT (date('now','localtime'))
);

-- ── SẢN PHẨM ─────────────────────────────────────────────────────────────────
CREATE TABLE Products (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id            INTEGER NOT NULL,
    market_price_id      INTEGER,
    category             TEXT,
    name                 TEXT    NOT NULL,
    standard             TEXT,
    quantity             REAL,
    unit                 TEXT,
    price                REAL    NOT NULL,
    ai_suggested_price   REAL,
    ai_marketing_content TEXT,
    image_url            TEXT,
    status               TEXT    DEFAULT 'active'
                         CHECK (status IN ('pending','active','hidden')),
    rating               REAL    DEFAULT 0.0,
    is_deleted           INTEGER DEFAULT 0,
    created_at           TEXT    DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (seller_id)       REFERENCES Users(id),
    FOREIGN KEY (market_price_id) REFERENCES Market_Prices(id) ON DELETE SET NULL
);

-- ── ĐƠN HÀNG ─────────────────────────────────────────────────────────────────
CREATE TABLE Orders (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id         INTEGER NOT NULL,
    total_amount     REAL    NOT NULL,
    shipping_address TEXT    NOT NULL,
    order_status     TEXT    DEFAULT 'pending'
                     CHECK (order_status IN ('pending','confirmed','shipping','completed','canceled')),
    created_at       TEXT    DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (buyer_id) REFERENCES Users(id)
);

CREATE TABLE Order_Items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id      INTEGER NOT NULL,
    product_id    INTEGER NOT NULL,
    quantity      REAL    NOT NULL,
    price_at_time REAL    NOT NULL,
    FOREIGN KEY (order_id)   REFERENCES Orders(id),
    FOREIGN KEY (product_id) REFERENCES Products(id)
);

CREATE TABLE Product_Price_History (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    old_price  REAL,
    new_price  REAL    NOT NULL,
    changed_at TEXT    DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (product_id) REFERENCES Products(id)
);

-- ── KIẾN THỨC CÂY TRỒNG (RAG) ────────────────────────────────────────────────
CREATE TABLE Crop_Knowledge (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_name        TEXT NOT NULL,
    description      TEXT,
    care_tips        TEXT,
    storage_tips     TEXT,
    growing_regions  TEXT,
    harvest_months   TEXT,
    popular_standard TEXT
);

-- ── CHỈ MỤC ──────────────────────────────────────────────────────────────────
CREATE INDEX IX_Products_Category_Price ON Products(category, price);
CREATE INDEX IX_Products_Name           ON Products(name);
CREATE INDEX IX_Market_Prices_Name      ON Market_Prices(product_name);
CREATE INDEX IX_Crop_Knowledge_Name     ON Crop_Knowledge(crop_name);

-- ── VIEW: SẢN PHẨM ĐANG BÁN (đủ cột cho backend buyer-search) ────────────────
CREATE VIEW vw_Active_Products AS
SELECT
    p.id,
    p.name,
    p.category,
    p.standard,
    p.quantity,
    p.unit,
    p.price,
    p.rating,
    p.image_url,
    u.name              AS seller_name,
    u.phone             AS seller_phone,
    u.address           AS seller_address,
    u.cooperative_name,
    mp.region           AS market_region
FROM Products p
INNER JOIN Users u        ON p.seller_id = u.id
LEFT  JOIN Market_Prices mp ON p.market_price_id = mp.id
WHERE p.status = 'active' AND p.is_deleted = 0 AND u.is_deleted = 0;

-- ── VIEW: TÓM TẮT GIÁ THỊ TRƯỜNG ─────────────────────────────────────────────
CREATE VIEW vw_Market_Price_Summary AS
SELECT
    product_name,
    standard,
    region,
    unit,
    min_price,
    max_price,
    update_date
FROM Market_Prices;
