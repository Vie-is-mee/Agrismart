// ============================================================
//  services/api.js — Lớp gọi REST API backend (Flask)
// ============================================================
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

async function handle(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Lỗi máy chủ (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// ── Chat ──────────────────────────────────────────────────
// payload: { text, sessionId, sellerId, imageFile?, audioFile? }
export async function sendChat({ text, sessionId, sellerId = 1, imageFile, audioFile }) {
  // Có file → multipart; không thì JSON.
  if (imageFile || audioFile) {
    const fd = new FormData();
    fd.append("text", text || "");
    fd.append("session_id", sessionId || "default");
    fd.append("seller_id", String(sellerId));
    if (imageFile) fd.append("image", imageFile);
    if (audioFile) fd.append("audio", audioFile);
    const res = await fetch(`${API_URL}/api/chat`, { method: "POST", body: fd });
    return handle(res);
  }
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, session_id: sessionId || "default", seller_id: sellerId }),
  });
  return handle(res);
}

// ── Auth ──────────────────────────────────────────────────
export async function register(payload) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function login(payload) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

// ── Products (tùy chọn) ───────────────────────────────────
export async function fetchProducts({ category, q } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (q) params.set("q", q);
  const res = await fetch(`${API_URL}/api/products?${params.toString()}`);
  return handle(res);
}

export async function checkHealth() {
  const res = await fetch(`${API_URL}/api/health`);
  return handle(res);
}

export { API_URL };
