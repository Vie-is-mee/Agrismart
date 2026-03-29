// ============================================================
//  data/shops.js — Dữ liệu gian hàng / cửa hàng nông sản
// ============================================================

export const shops = [
  {
    id: "shop-1",
    name: "Vườn Trái Cây Cao Phong",
    owner: "Nguyễn Văn An",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80",
    coverImage: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=80",
    location: "Tỉnh Hòa Bình & Phú Thọ",
    description:
      "Gia đình tôi canh tác vườn cam và bưởi đặc sản trên vùng núi đá vôi Hòa Bình hơn 20 năm. Chúng tôi cam kết cung cấp trái cây sạch, không thuốc kích thích, thu hoạch đúng độ chín và giao tận tay người tiêu dùng.",
    established: "2018",
    rating: 4.8,
    totalReviews: 510,
    totalSales: 2340,
    responseRate: 98,
    verified: true,
    certifications: ["VietGAP", "GlobalGAP"],
    tags: ["trái cây", "hữu cơ", "miền bắc"],
    productIds: [1, 2, 13],
    socialLinks: { facebook: "#", zalo: "#" },
  },
  {
    id: "shop-2",
    name: "Nông Sản Phương Nam",
    owner: "Trần Thị Mai",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80",
    coverImage: "https://images.unsplash.com/photo-1596546096855-ccb2dcbd3dfd?w=1200&q=80",
    location: "Tỉnh Bình Thuận & Tiền Giang",
    description:
      "Chúng tôi là trang trại gia đình chuyên trồng thanh long và xoài đặc sản vùng đồng bằng sông Cửu Long và ven biển Bình Thuận. Mỗi quả đều được chăm sóc kỹ lưỡng từ lúc nở hoa đến khi thu hoạch.",
    established: "2019",
    rating: 4.7,
    totalReviews: 688,
    totalSales: 1870,
    responseRate: 95,
    verified: true,
    certifications: ["VietGAP"],
    tags: ["trái cây", "miền nam", "xuất khẩu"],
    productIds: [3, 4, 14],
    socialLinks: { facebook: "#", zalo: "#" },
  },
  {
    id: "shop-3",
    name: "Nông Trại Đà Lạt Xanh",
    owner: "Phạm Thị Hương",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&q=80",
    coverImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80",
    location: "Tỉnh Lâm Đồng & Ninh Thuận",
    description:
      "Trang trại rau sạch ở độ cao 1.500m trên cao nguyên Lâm Đồng. Chúng tôi áp dụng kỹ thuật canh tác nhà kính hiện đại kết hợp hoàn toàn không sử dụng thuốc trừ sâu hóa học.",
    established: "2020",
    rating: 4.9,
    totalReviews: 423,
    totalSales: 1560,
    responseRate: 99,
    verified: true,
    certifications: ["Organic Certified", "VietGAP"],
    tags: ["rau sạch", "hữu cơ", "đà lạt", "nhà kính"],
    productIds: [5, 7],
    socialLinks: { facebook: "#", zalo: "#" },
  },
  {
    id: "shop-4",
    name: "Đặc Sản Mekong",
    owner: "Lê Văn Hùng",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80",
    coverImage: "https://images.unsplash.com/photo-1602435926651-4e0f0b9d0afc?w=1200&q=80",
    location: "Tỉnh Vĩnh Long, Sóc Trăng & An Giang",
    description:
      "Chuyên cung cấp các đặc sản vùng đồng bằng sông Cửu Long — gạo ST25 cao cấp, khoai lang tím và mè đen hữu cơ. Tất cả sản phẩm được trồng trên đất phù sa màu mỡ và thu hoạch tay.",
    established: "2017",
    rating: 4.8,
    totalReviews: 392,
    totalSales: 3120,
    responseRate: 97,
    verified: true,
    certifications: ["VietGAP", "HACCP"],
    tags: ["gạo", "ngũ cốc", "mekong", "đặc sản"],
    productIds: [6, 8, 9],
    socialLinks: { facebook: "#", zalo: "#" },
  },
  {
    id: "shop-5",
    name: "Hương Vị Tây Nguyên",
    owner: "Y Blơm Niê",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
    coverImage: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&q=80",
    location: "Tỉnh Đắk Lắk, Đồng Nai & Kiên Giang",
    description:
      "Gia đình người dân tộc Ê-đê chúng tôi gìn giữ nghề lấy mật ong rừng, trồng tiêu và sả theo phương pháp tổ tiên truyền lại. Mỗi sản phẩm mang theo văn hóa và tri thức bản địa đại ngàn Tây Nguyên.",
    established: "2021",
    rating: 4.9,
    totalReviews: 286,
    totalSales: 950,
    responseRate: 93,
    verified: false,
    certifications: [],
    tags: ["mật ong", "gia vị", "tây nguyên", "bản địa"],
    productIds: [10, 11, 12],
    socialLinks: { facebook: "#", zalo: "#" },
  },
];

export function getShopById(id) {
  return shops.find(s => s.id === id);
}

export function getShopByProductId(productId) {
  return shops.find(s => s.productIds.includes(Number(productId)));
}
