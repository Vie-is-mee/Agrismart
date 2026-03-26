// ============================================================
//  data/products.js — Dữ liệu sản phẩm mẫu
//  Thay thế bằng API thực khi kết nối backend
// ============================================================

export const categories = [
  {
    id: "fruits",
    label: "Trái Cây Tươi",
    emoji: "🍊",
    icon: "/icons/TraiCayTuoi.ico",
    color: "#fff3cd",
  },
  {
    id: "vegetables",
    label: "Rau Củ Quả",
    emoji: "🥦",
    icon: "/icons/RauCuQua.ico",
    color: "#d8f3dc",
  },
  {
    id: "grains",
    label: "Gạo & Ngũ Cốc",
    emoji: "🌾",
    icon: "/icons/GaoVaNguCoc.ico",
    color: "#fde8c8",
  },
  {
    id: "herbs",
    label: "Gia Vị & Thảo Mộc",
    emoji: "🌿",
    icon: "/icons/GiaVi.ico",
    color: "#e0f2e9",
  },
  {
    id: "dried",
    label: "Đặc Sản Khô",
    emoji: "🧅",
    icon: "/icons/DacSanKho.ico",
    color: "#f5e6d3",
  },
];

export const products = [
  // ── TRÁI CÂY ──────────────────────────────────────────
  {
    id: 1,
    category: "fruits",
    shopId: "shop-1",
    name: "Cam Cao Phong",
    origin: "Tỉnh Hòa Bình",
    price: 85000,
    unit: "kg",
    image:
      "https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80",
    badge: "Bán Chạy",
    badgeType: "green",
    rating: 4.8,
    reviews: 312,
    description:
      "Cam ngọt vỏ mỏng trồng trên vùng núi đá vôi Hòa Bình. Giàu Vitamin C, vị ngọt thanh hài hòa. Thu hoạch tháng 10–12 hằng năm.",
    story:
      "Cam Cao Phong phát triển trong tiểu khí hậu đặc biệt của Hòa Bình, nơi sự kết hợp giữa không khí núi mát mẻ và đất giàu khoáng chất tạo ra loại quả có tỷ lệ đường-axit hoàn hảo mà không nơi nào sánh được.",
    tags: ["hữu-cơ", "theo-mùa", "vitamin-c"],
    inStock: true,
    stockQty: 48,
    minOrder: 1,
  },
  {
    id: 2,
    category: "fruits",
    shopId: "shop-1",
    name: "Bưởi Đoan Hùng",
    origin: "Tỉnh Phú Thọ",
    price: 60000,
    unit: "kg",
    image:
      "https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=400&q=80",
    badge: "Đặc Sản Địa Phương",
    badgeType: "amber",
    rating: 4.7,
    reviews: 198,
    description:
      "Bưởi đặc sản Đoan Hùng vỏ mỏng, múi trong, vị ngọt thanh nhẹ. Nổi tiếng hơn 100 năm trên vùng đất ven sông Lô.",
    story:
      "Hơn 100 năm qua, người dân Đoan Hùng canh tác giống bưởi đặc biệt này bên bờ sông Lô. Sương mù sông và đất đỏ bazan tạo nên hương vị đặc trưng không thể nhầm lẫn.",
    tags: ["di-sản", "ít-chua"],
    inStock: true,
    stockQty: 35,
    minOrder: 2,
  },
  {
    id: 3,
    category: "fruits",
    shopId: "shop-2",
    name: "Thanh Long Ruột Đỏ",
    origin: "Tỉnh Bình Thuận",
    price: 45000,
    unit: "kg",
    image:
      "https://images.unsplash.com/photo-1527325678964-54921661f888?w=400&q=80",
    badge: "Giàu Chất Chống Oxy Hóa",
    badgeType: "red",
    rating: 4.6,
    reviews: 267,
    description:
      "Thanh long ruột đỏ rực rỡ từ vùng ven biển nắng Bình Thuận. Ngọt tự nhiên, giàu chất chống oxy hóa mạnh mẽ.",
    story:
      "Bình Thuận chiếm hơn 50% sản lượng thanh long của Việt Nam. Khí hậu ven biển với nắng dồi dào tạo ra quả có màu đỏ đậm và vị ngọt tự nhiên đặc biệt.",
    tags: ["chống-oxy-hóa", "đặc-sản", "ít-calo"],
    inStock: true,
    stockQty: 120,
    minOrder: 1,
  },
  {
    id: 4,
    category: "fruits",
    shopId: "shop-2",
    name: "Xoài Cát Tiền Giang",
    origin: "Tỉnh Tiền Giang",
    price: 55000,
    unit: "kg",
    image:
      "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80",
    badge: "Theo Mùa",
    badgeType: "amber",
    rating: 4.9,
    reviews: 421,
    description:
      "Xoài cát đồng bằng sông Cửu Long — thịt siêu ngọt, không xơ, màu vàng óng. Hương vị miền Nam chính hiệu.",
    story:
      "Xoài cát Tiền Giang trồng trên vùng phù sa đồng bằng sông Mê Kông, được bồi đắp tự nhiên mỗi mùa mưa. Quả ngọt đến mức được gọi là 'vua xoài'.",
    tags: ["cao-cấp", "đồng-bằng-sông-cửu-long", "siêu-ngọt"],
    inStock: false,
    stockQty: 0,
    minOrder: 2,
  },

  // ── RAU CỦ ──────────────────────────────────────────
  {
    id: 5,
    category: "vegetables",
    shopId: "shop-3",
    name: "Rau Xà Lách Baby Đà Lạt",
    origin: "Tỉnh Lâm Đồng",
    price: 35000,
    unit: "gói 250g",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80",
    badge: "Thủy Canh",
    badgeType: "green",
    rating: 4.7,
    reviews: 156,
    description:
      "Xà lách baby giòn tươi trồng thủy canh tại Đà Lạt — không thuốc trừ sâu, thu hoạch theo đơn hàng.",
    story:
      "Ở độ cao 1.500m, nhiệt độ mát mẻ và nước sạch từ núi Đà Lạt tạo điều kiện lý tưởng để trồng rau xanh quanh năm. Hệ thống thủy canh đảm bảo không có dư lượng thuốc trừ sâu.",
    tags: ["không-thuốc", "thủy-canh", "ăn-liền"],
    inStock: true,
    stockQty: 92,
    minOrder: 1,
  },
  {
    id: 6,
    category: "vegetables",
    shopId: "shop-4",
    name: "Khoai Lang Tím Hữu Cơ",
    origin: "Tỉnh Vĩnh Long",
    price: 28000,
    unit: "kg",
    image:
      "https://images.unsplash.com/photo-1596097559945-0a6d30a6a0df?w=400&q=80",
    badge: "Hữu Cơ",
    badgeType: "green",
    rating: 4.5,
    reviews: 89,
    description:
      "Khoai lang tím hữu cơ từ Vĩnh Long, được chứng nhận sạch. Giàu anthocyanin và chất xơ tự nhiên.",
    story:
      "Được trồng bởi các hộ nông dân nhỏ ở đồng bằng sông Cửu Long bằng phương pháp hữu cơ truyền thống qua nhiều thế hệ. Không bao giờ dùng phân bón hóa học.",
    tags: ["hữu-cơ", "chứng-nhận", "chống-oxy-hóa"],
    inStock: true,
    stockQty: 67,
    minOrder: 1,
  },
  {
    id: 7,
    category: "vegetables",
    shopId: "shop-3",
    name: "Măng Tây Xanh Ninh Thuận",
    origin: "Tỉnh Ninh Thuận",
    price: 72000,
    unit: "bó 500g",
    image:
      "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80",
    badge: "Cao Cấp",
    badgeType: "amber",
    rating: 4.8,
    reviews: 143,
    description:
      "Măng tây xanh mềm, bơ ngậy từ thủ phủ măng tây Việt Nam. Thu hoạch lúc bình minh, giao trong ngày để giữ độ tươi tối đa.",
    story:
      "Đất cát đỏ và nắng gay gắt Ninh Thuận tạo ra măng tây với đầu búp đặc biệt mềm và hương vị đậm bơ mà các đầu bếp khắp Việt Nam đều ưa chuộng hơn hàng nhập khẩu.",
    tags: ["cao-cấp", "đầu-bếp-chọn", "ít-carb"],
    inStock: true,
    stockQty: 200,
    minOrder: 1,
  },

  // ── GẠO & NGŨ CỐC ──────────────────────────────────────────
  {
    id: 8,
    category: "grains",
    shopId: "shop-4",
    name: "Gạo ST25 Đặc Sản",
    origin: "Tỉnh Sóc Trăng",
    price: 42000,
    unit: "kg",
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    badge: "Ngon Nhất Thế Giới",
    badgeType: "amber",
    rating: 5.0,
    reviews: 634,
    description:
      "ST25 — giống gạo đoạt danh hiệu Gạo Ngon Nhất Thế Giới. Mềm dẻo, thơm nhẹ, vị ngọt tự nhiên làm cho mỗi bữa cơm thêm đặc biệt.",
    story:
      "Do kỹ sư nông nghiệp Hồ Quang Cua phát triển sau 30 năm nghiên cứu, gạo ST25 đã nhiều lần đoạt giải Gạo Ngon Nhất Thế Giới. Đây là báu vật lúa gạo của Việt Nam.",
    tags: ["đoạt-giải", "thơm", "cao-cấp"],
    inStock: true,
    stockQty: 15,
    minOrder: 2,
  },
  {
    id: 9,
    category: "grains",
    shopId: "shop-4",
    name: "Mè Đen An Giang",
    origin: "Tỉnh An Giang",
    price: 95000,
    unit: "500g",
    image:
      "https://images.unsplash.com/photo-1612201141937-4d30df137fa1?w=400&q=80",
    badge: "Siêu Thực Phẩm",
    badgeType: "green",
    rating: 4.6,
    reviews: 77,
    description:
      "Hạt mè đen tự nhiên giàu canxi, sắt và chất béo lành mạnh. Rang thơm dậy mùi bùi đặc trưng.",
    story:
      "Thu hoạch hai vụ mỗi năm bởi nông dân vùng ngập lũ An Giang. Phơi nắng truyền thống trong 3 ngày cô đặc dầu tự nhiên và tạo nên hương vị đất đặc trưng.",
    tags: ["siêu-thực-phẩm", "canxi", "không-gluten"],
    inStock: true,
    stockQty: 43,
    minOrder: 1,
  },

  // ── GIA VỊ ───────────────────────────────────────────
  {
    id: 10,
    category: "herbs",
    shopId: "shop-5",
    name: "Tiêu Đen Phú Quốc",
    origin: "Tỉnh Kiên Giang",
    price: 180000,
    unit: "250g",
    image:
      "https://images.unsplash.com/photo-1514733670139-4d66c773f476?w=400&q=80",
    badge: "Chỉ Dẫn Địa Lý",
    badgeType: "green",
    rating: 4.9,
    reviews: 289,
    description:
      "Tiêu đen Phú Quốc được bảo hộ chỉ dẫn địa lý. Hương thơm nồng nàn, hậu vị cay nhẹ thanh. Được dùng bởi các nhà hàng hàng đầu thế giới.",
    story:
      "Đất núi lửa và khí hậu biển đặc thù của đảo Phú Quốc tạo ra tiêu với hương vị phức tạp độc đáo. Chứng nhận chỉ dẫn địa lý đảm bảo chỉ tiêu trồng trên đảo mới được mang tên này.",
    tags: ["chỉ-dẫn-địa-lý", "cao-cấp", "xuất-khẩu"],
    inStock: true,
    stockQty: 88,
    minOrder: 1,
  },
  {
    id: 11,
    category: "herbs",
    shopId: "shop-5",
    name: "Sả Khô Đồng Nai",
    origin: "Tỉnh Đồng Nai",
    price: 38000,
    unit: "200g",
    image:
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80",
    badge: null,
    badgeType: null,
    rating: 4.4,
    reviews: 52,
    description:
      "Sả khô thơm ngát dùng pha trà, nấu canh và ướp thịt. Thu hoạch bền vững, phơi nắng tự nhiên.",
    story:
      "Sả của chúng tôi trồng trên những mảnh đất nhỏ của hộ gia đình ở Đồng Nai. Thu hoạch lúc sáng sớm khi hàm lượng tinh dầu đạt đỉnh, trước khi nắng làm bay bớt chất thơm.",
    tags: ["trà-thảo-mộc", "thơm", "thảo-dược"],
    inStock: true,
    stockQty: 156,
    minOrder: 1,
  },

  // ── MẬT ONG ───────────────────────────────────────────
  {
    id: 12,
    category: "honey",
    shopId: "shop-5",
    name: "Mật Ong Rừng Tây Nguyên",
    origin: "Tỉnh Đắk Lắk",
    price: 220000,
    unit: "hũ 500ml",
    image:
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80",
    badge: "Nguyên Chất Không Lọc",
    badgeType: "amber",
    rating: 4.9,
    reviews: 198,
    description:
      "Mật ong rừng nguyên chất thu từ tổ ong tự nhiên trong rừng Tây Nguyên. Màu sậm, hương phức hợp, giàu enzyme và phấn hoa.",
    story:
      "Các thợ lấy mật người dân tộc thiểu số đã khai thác mật từ những cánh rừng này qua nhiều thế hệ. Mỗi hũ chứa tinh chất của hàng trăm loài hoa dại chỉ có ở cao nguyên Đắk Lắk.",
    tags: ["nguyên-chất", "không-lọc", "rừng-tự-nhiên", "chống-oxy-hóa"],
    inStock: true,
    stockQty: 31,
    minOrder: 1,
  },

  // ── ĐẶC SẢN KHÔ ───────────────────────────────────────────
  {
    id: 13,
    category: "dried",
    shopId: "shop-1",
    name: "Nhãn Lồng Sấy Hưng Yên",
    origin: "Tỉnh Hưng Yên",
    price: 145000,
    unit: "500g",
    image:
      "https://images.unsplash.com/photo-1601493700629-8bba3b9e6e8d?w=400&q=80",
    badge: "Truyền Thống",
    badgeType: "amber",
    rating: 4.7,
    reviews: 167,
    description:
      "Nhãn lồng sấy đặc sản Hưng Yên — dẻo, ngọt, sấy củi theo phương pháp truyền thống 72 giờ. Thơm đặc trưng không lẫn vào đâu.",
    story:
      "Nhãn Hưng Yên đã được trồng hơn 500 năm. Quy trình sấy củi truyền thống kéo dài 72 giờ giữ nguyên đường tự nhiên và tạo nên chiều sâu hương vị caramel đặc biệt.",
    tags: ["truyền-thống", "di-sản", "sấy-tự-nhiên"],
    inStock: true,
    stockQty: 74,
    minOrder: 1,
  },
  {
    id: 14,
    category: "dried",
    shopId: "shop-2",
    name: "Nho Khô Ninh Thuận",
    origin: "Tỉnh Ninh Thuận",
    price: 88000,
    unit: "300g",
    image:
      "https://images.unsplash.com/photo-1596569637738-4c406f09c4af?w=400&q=80",
    badge: "Mới",
    badgeType: "red",
    rating: 4.5,
    reviews: 34,
    description:
      "Nho khô phơi nắng từ vùng trồng nho duy nhất của Việt Nam. Ngọt đậm đà, dẻo thơm — lý tưởng để ăn vặt và làm bánh.",
    story:
      "Khí hậu bán khô hạn và 300 ngày nắng mỗi năm của Ninh Thuận tạo điều kiện lý tưởng cho cây nho. Nho được hái tay và phơi nắng trên giàn tre truyền thống trong 2 tuần.",
    tags: ["phơi-nắng", "ăn-vặt", "không-đường-thêm"],
    inStock: true,
    stockQty: 9,
    minOrder: 1,
  },
];

export const promotions = [
  {
    id: "promo1",
    title: "Tươi Thẳng Từ Nông Trại 🌾",
    subtitle: "Miễn phí giao hàng cho đơn từ 500.000₫",
    bg: "linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)",
    cta: "Mua Ngay",
    link: "/products",
    image: "/images/Slide1.jpg",
  },
  {
    id: "promo2",
    title: "Rau sạch hoàn toàn ",
    subtitle: "Cam Cao Phong — số lượng có hạn trong mùa này",
    bg: "linear-gradient(135deg, #e9c46a 0%, #f4a261 100%)",
    cta: "Đặt Mua Ngay",
    link: "/products?category=fruits",
    image: "/images/Slide2.jpg",
  },
  {
    id: "promo3",
    title: "Mùa Thu Hoạch",
    subtitle: "Lmao",
    bg: "linear-gradient(135deg, #e9c46a 0%, #f4a261 100%)",
    cta: "Đặt Mua Ngay",
    link: "/products?category=fruits",
    image: "/images/Slide3.jpg",
  },
];

export function getProductById(id) {
  return products.find((p) => p.id === Number(id));
}

export function getProductsByCategory(cat) {
  if (!cat || cat === "all") return products;
  return products.filter((p) => p.category === cat);
}

export function searchProducts(query) {
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.origin.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tags && p.tags.some((t) => t.includes(q))),
  );
}
