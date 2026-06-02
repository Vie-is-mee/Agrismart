"""
database.py — Lớp truy cập SQLite cho AgriSmart.

- get_conn()      : mở kết nối sqlite3 (row factory = sqlite3.Row).
- db_cursor()     : context manager tự commit/rollback.
- init_db()       : tạo schema + seed dữ liệu nếu file DB chưa tồn tại.
- hash_password / verify_password : băm mật khẩu PBKDF2 (thuần Python, không cần lib ngoài).
"""

import os
import sqlite3
import hashlib
import binascii
import contextlib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# DB nằm ở ../db/agrieco.db (cùng cây thư mục dự án)
DB_PATH = os.environ.get(
    "DB_PATH",
    os.path.normpath(os.path.join(BASE_DIR, "..", "db", "agrieco.db")),
)
SCHEMA_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", "db", "schema.sql"))
SEED_PATH = os.path.normpath(os.path.join(BASE_DIR, "..", "db", "seed.sql"))

# Mật khẩu mặc định cho các tài khoản seed
_SEED_PASSWORD = "123456"


# ── Băm mật khẩu (PBKDF2-HMAC-SHA256) ────────────────────────────────────────
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return "pbkdf2$" + binascii.hexlify(salt).decode() + "$" + binascii.hexlify(dk).decode()


def verify_password(password: str, stored: str) -> bool:
    try:
        _, salt_hex, hash_hex = stored.split("$")
        salt = binascii.unhexlify(salt_hex)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
        return binascii.hexlify(dk).decode() == hash_hex
    except Exception:
        return False


# ── Kết nối ──────────────────────────────────────────────────────────────────
def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


@contextlib.contextmanager
def db_cursor(autocommit: bool = False):
    conn = get_conn()
    try:
        cur = conn.cursor()
        yield cur
        if not autocommit:
            conn.commit()
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row) -> dict:
    return {k: row[k] for k in row.keys()} if row else {}


# ── Khởi tạo DB ──────────────────────────────────────────────────────────────
def init_db(force: bool = False) -> None:
    """Tạo DB từ schema.sql + seed.sql nếu chưa tồn tại (hoặc force=True)."""
    if force and os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    if os.path.exists(DB_PATH):
        return  # đã có DB, không seed lại

    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    with open(SCHEMA_PATH, encoding="utf-8") as f:
        schema_sql = f.read()
    with open(SEED_PATH, encoding="utf-8") as f:
        seed_sql = f.read()

    # Thay placeholder mật khẩu seed bằng hash thật của '123456'
    seed_sql = seed_sql.replace("__SEED_PW__", hash_password(_SEED_PASSWORD))

    conn = get_conn()
    try:
        conn.executescript(schema_sql)
        conn.executescript(seed_sql)
        conn.commit()
        print(f"  [DB] Đã khởi tạo SQLite tại: {DB_PATH}")
    finally:
        conn.close()


if __name__ == "__main__":
    # Cho phép: python database.py  → tạo lại DB từ đầu
    init_db(force=True)
    with db_cursor() as cur:
        for tbl in ["Users", "Products", "Market_Prices", "Crop_Knowledge"]:
            cur.execute(f"SELECT COUNT(*) AS c FROM {tbl}")
            print(f"  {tbl}: {cur.fetchone()['c']} dòng")
