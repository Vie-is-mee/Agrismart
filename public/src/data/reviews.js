// ============================================================
//  data/reviews.js — Dữ liệu đánh giá sản phẩm mẫu
//  Trong thực tế sẽ được lưu trữ trong database
// ============================================================

export const sampleReviews = [
  // Product 1 - Cam Cao Phong
  { id: "r101", productId: 1, author: "Trần Thị Bình", initials: "TB", rating: 5, date: "2025-12-03", content: "Cam ngọt tự nhiên, vỏ mỏng và rất nhiều nước. Gia đình tôi đặt hàng lần 3 rồi, lần nào cũng tươi ngon như nhau!", helpful: 24 },
  { id: "r102", productId: 1, author: "Nguyễn Hải Long", initials: "HL", rating: 5, date: "2025-11-28", content: "Cam Cao Phong đúng chuẩn, không lẫn với cam Trung Quốc. Chua ngọt vừa phải, trẻ em nhà mình rất thích.", helpful: 18 },
  { id: "r103", productId: 1, author: "Lê Thu Hiền", initials: "TH", rating: 4, date: "2025-11-15", content: "Hàng tươi, giao nhanh. Có vài quả hơi nhỏ nhưng vị ngon. Sẽ mua lại.", helpful: 7 },
  { id: "r104", productId: 1, author: "Phạm Minh Đức", initials: "MĐ", rating: 5, date: "2025-10-20", content: "Mua làm quà tặng sếp, được khen ngon. Đóng gói chắc chắn, không bị dập.", helpful: 11 },

  // Product 2 - Bưởi Đoan Hùng
  { id: "r201", productId: 2, author: "Vũ Thị Lan", initials: "VL", rating: 5, date: "2025-11-10", content: "Bưởi ngon quá! Múi dày, ít xơ, ngọt thanh. Đây đúng là bưởi Đoan Hùng thật sự rồi!", helpful: 20 },
  { id: "r202", productId: 2, author: "Đỗ Văn Tuấn", initials: "ĐT", rating: 4, date: "2025-10-30", content: "Ngon, tươi, giao đúng hẹn. Múi vàng đẹp. Trừ 1 sao vì hơi chua so với kỳ vọng.", helpful: 5 },
  { id: "r203", productId: 2, author: "Hoàng Thanh Nga", initials: "HN", rating: 5, date: "2025-10-15", content: "Lần đầu mua online trái cây mà không thất vọng. Bưởi to, đẹp, không bị rỗng. Cảm ơn shop!", helpful: 15 },

  // Product 3 - Thanh Long
  { id: "r301", productId: 3, author: "Nguyễn Thị Cúc", initials: "NC", rating: 4, date: "2025-12-01", content: "Thanh long ruột đỏ đẹp, ngọt. Giao hàng nhanh, đóng gói kỹ. Tuy nhiên 2/5 quả hơi chín quá.", helpful: 9 },
  { id: "r302", productId: 3, author: "Trần Công Minh", initials: "TM", rating: 5, date: "2025-11-20", content: "Ruột đỏ đúng nghĩa, ngọt tự nhiên, không phải loại pha trộn. Ăn mát, đẹp mắt khi bày đĩa.", helpful: 14 },

  // Product 5 - Rau Đà Lạt
  { id: "r501", productId: 5, author: "Lý Hồng Nhung", initials: "LN", rating: 5, date: "2025-12-05", content: "Xà lách baby giòn, sạch, không có mùi lạ. Rõ ràng là rau cao nguyên chuẩn. Mua mỗi tuần luôn!", helpful: 31 },
  { id: "r502", productId: 5, author: "Bùi Văn Khoa", initials: "BK", rating: 5, date: "2025-11-25", content: "Giao trong ngày, lá vẫn tươi và giòn. Đóng gói túi lưới thông thoáng rất chuyên nghiệp.", helpful: 19 },
  { id: "r503", productId: 5, author: "Trần Mỹ Linh", initials: "ML", rating: 4, date: "2025-11-12", content: "Rau ngon, nhưng đôi khi lá ngoài hơi héo một chút khi nhận. Vẫn sẽ mua lại.", helpful: 6 },

  // Product 8 - Gạo ST25
  { id: "r801", productId: 8, author: "Phan Anh Tú", initials: "PT", rating: 5, date: "2025-12-02", content: "Gạo ST25 thật sự khác biệt! Nấu thơm, dẻo, hạt đều. Đây là loại gạo ngon nhất tôi từng ăn.", helpful: 42 },
  { id: "r802", productId: 8, author: "Mai Thị Thu", initials: "MT", rating: 5, date: "2025-11-18", content: "Gạo sạch, nấu cơm có mùi thơm thoang thoảng dù không cần thêm gì. Đúng là gạo ngon nhất thế giới!", helpful: 35 },
  { id: "r803", productId: 8, author: "Cao Minh Tâm", initials: "CM", rating: 4, date: "2025-11-01", content: "Gạo ngon, cơm không bị nát. Nhưng bao bì đơn giản quá, không xứng với chất lượng hàng.", helpful: 8 },

  // Product 12 - Mật ong
  { id: "r1201", productId: 12, author: "Đinh Thị Hoa", initials: "ĐH", rating: 5, date: "2025-11-30", content: "Mật sậm màu, thơm hoa rừng, kết tinh tự nhiên ở đáy hũ — đây là dấu hiệu mật nguyên chất!", helpful: 28 },
  { id: "r1202", productId: 12, author: "Võ Trung Kiên", initials: "VK", rating: 5, date: "2025-11-10", content: "Chữa ho cho con hiệu quả. Mật sền sệt, ngọt thanh, không có mùi cồng kềnh của mật giả.", helpful: 22 },
  { id: "r1203", productId: 12, author: "Nguyễn Phước Lộc", initials: "NL", rating: 4, date: "2025-10-25", content: "Mật ngon, nhưng giao hàng hơi chậm so với dự kiến. Shop nên cải thiện thêm về vận chuyển.", helpful: 10 },
];

export function getReviewsByProductId(productId) {
  return sampleReviews.filter(r => r.productId === Number(productId));
}

export function getRatingDistribution(productId) {
  const reviews = getReviewsByProductId(productId);
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1; });
  return dist;
}
