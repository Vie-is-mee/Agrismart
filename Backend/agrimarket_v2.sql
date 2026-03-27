-- ============================================================
-- AgriEco_DB  -  PHIÊN BẢN CẢI TIẾN v2.1
-- Ngày cập nhật : 25/03/2026
-- Thay đổi so với v2.0:
--   ✅ Thêm cột [rating] vào bảng Products
--   ✅ Cập nhật vw_Active_Products để trả về rating
--   ✅ Bổ sung 14 sản phẩm mẫu (từ 6 → 20 sản phẩm)
--   ✅ Bổ sung thêm giá thị trường cho rau củ & nông sản phổ biến
-- ============================================================

USE [master]
GO

-- ──────────────────────────────────────────────────────────
-- 0. TẠO DATABASE (bỏ qua nếu đã có)
-- ──────────────────────────────────────────────────────────
-- IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'AgriEco_DB')
-- BEGIN
--     CREATE DATABASE [AgriEco_DB]
--         CONTAINMENT = NONE
--         ON PRIMARY
--         ( NAME = N'AgriEco_DB',
--           FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\AgriEco_DB.mdf',
--           SIZE = 8192KB, MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
--         LOG ON
--         ( NAME = N'AgriEco_DB_log',
--           FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\AgriEco_DB_log.ldf',
--           SIZE = 8192KB, MAXSIZE = 2048GB, FILEGROWTH = 65536KB )
--         WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
-- END
-- GO
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'AgriEco_DB')
BEGIN
    CREATE DATABASE [AgriEco_DB]
END
GO

ALTER DATABASE [AgriEco_DB] SET COMPATIBILITY_LEVEL = 160
GO
ALTER DATABASE [AgriEco_DB] SET ANSI_NULLS ON
GO
ALTER DATABASE [AgriEco_DB] SET ANSI_PADDING ON
GO
ALTER DATABASE [AgriEco_DB] SET ANSI_WARNINGS ON
GO
ALTER DATABASE [AgriEco_DB] SET QUOTED_IDENTIFIER ON
GO
ALTER DATABASE [AgriEco_DB] SET RECOVERY FULL
GO
ALTER DATABASE [AgriEco_DB] SET MULTI_USER
GO
ALTER DATABASE [AgriEco_DB] SET AUTO_UPDATE_STATISTICS ON
GO

USE [AgriEco_DB]
GO

-- ============================================================
-- PHẦN 1 – CẤU TRÚC BẢNG (SCHEMA)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1.1 Bảng Users
-- ──────────────────────────────────────────────────────────
CREATE TABLE [dbo].[Users] (
    [id]               INT            IDENTITY(1,1) NOT NULL,
    [name]             NVARCHAR(255)  NOT NULL,
    [phone]            VARCHAR(20)    NOT NULL,
    [email]            VARCHAR(255)   NULL,
    [address]          NVARCHAR(MAX)  NULL,
    [cooperative_name] NVARCHAR(255)  NULL,
    [role]             VARCHAR(20)    NOT NULL,
    [is_deleted]       BIT            NOT NULL DEFAULT 0,
    [created_at]       DATETIME       NULL     DEFAULT GETDATE(),
    [updated_at]       DATETIME       NULL     DEFAULT GETDATE(),

    CONSTRAINT PK_Users PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT CK_Users_Role CHECK ([role] IN ('admin','seller','buyer'))
)
GO

ALTER TABLE [dbo].[Users]
    ADD CONSTRAINT UQ_Users_Phone UNIQUE ([phone])
GO
ALTER TABLE [dbo].[Users]
    ADD CONSTRAINT UQ_Users_Email UNIQUE ([email])
GO

-- ──────────────────────────────────────────────────────────
-- 1.2 Bảng Market_Prices
-- ──────────────────────────────────────────────────────────
CREATE TABLE [dbo].[Market_Prices] (
    [id]           INT             IDENTITY(1,1) NOT NULL,
    [product_name] NVARCHAR(255)   NOT NULL,
    [standard]     NVARCHAR(100)   NULL,
    [region]       NVARCHAR(100)   NULL,
    [min_price]    DECIMAL(15, 2)  NULL,
    [max_price]    DECIMAL(15, 2)  NULL,
    [unit]         NVARCHAR(20)    NOT NULL DEFAULT N'kg',
    [update_date]  DATE            NULL     DEFAULT GETDATE(),

    CONSTRAINT PK_Market_Prices PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT CK_Market_Prices_Range
        CHECK ([min_price] IS NULL OR [max_price] IS NULL
               OR [min_price] <= [max_price]),
    CONSTRAINT UQ_Market_Prices_Combo
        UNIQUE ([product_name], [region], [standard])
)
GO

-- ──────────────────────────────────────────────────────────
-- 1.3 Bảng Products
--     ✅ v2.1: Thêm cột [rating] DECIMAL(3,1) — điểm đánh giá 0–5
-- ──────────────────────────────────────────────────────────
CREATE TABLE [dbo].[Products] (
    [id]                     INT             IDENTITY(1,1) NOT NULL,
    [seller_id]              INT             NOT NULL,
    [market_price_id]        INT             NULL,
    [category]               NVARCHAR(100)   NULL,
    [name]                   NVARCHAR(255)   NOT NULL,
    [standard]               NVARCHAR(100)   NULL,
    [quantity]               DECIMAL(10, 2)  NULL,
    [unit]                   NVARCHAR(50)    NULL,
    [price]                  DECIMAL(15, 2)  NOT NULL,
    [ai_suggested_price]     DECIMAL(15, 2)  NULL,
    [ai_marketing_content]   NVARCHAR(MAX)   NULL,
    [image_url]              NVARCHAR(MAX)   NULL,
    [rating]                 DECIMAL(3, 1)   NOT NULL DEFAULT 0,  -- ✅ MỚI v2.1
    [status]                 VARCHAR(20)     NULL DEFAULT 'active',
    [is_deleted]             BIT             NOT NULL DEFAULT 0,
    [created_at]             DATETIME        NULL  DEFAULT GETDATE(),
    [updated_at]             DATETIME        NULL  DEFAULT GETDATE(),

    CONSTRAINT PK_Products PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT CK_Products_Status
        CHECK ([status] IN ('active','pending','hidden')),
    CONSTRAINT CK_Products_Price
        CHECK ([price] > 0),
    CONSTRAINT CK_Products_Rating
        CHECK ([rating] >= 0 AND [rating] <= 5)               -- ✅ MỚI v2.1
)
GO

-- ──────────────────────────────────────────────────────────
-- 1.4 Bảng Orders
-- ──────────────────────────────────────────────────────────
CREATE TABLE [dbo].[Orders] (
    [id]               INT             IDENTITY(1,1) NOT NULL,
    [buyer_id]         INT             NOT NULL,
    [total_amount]     DECIMAL(15, 2)  NOT NULL,
    [shipping_address] NVARCHAR(MAX)   NOT NULL,
    [order_status]     VARCHAR(20)     NULL DEFAULT 'pending',
    [payment_method]   VARCHAR(50)     NULL DEFAULT 'cod',
    [note]             NVARCHAR(MAX)   NULL,
    [created_at]       DATETIME        NULL DEFAULT GETDATE(),
    [updated_at]       DATETIME        NULL DEFAULT GETDATE(),

    CONSTRAINT PK_Orders PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT CK_Orders_Status
        CHECK ([order_status] IN
               ('pending','confirmed','shipping','completed','canceled')),
    CONSTRAINT CK_Orders_TotalAmount
        CHECK ([total_amount] >= 0)
)
GO

-- ──────────────────────────────────────────────────────────
-- 1.5 Bảng Order_Items
-- ──────────────────────────────────────────────────────────
CREATE TABLE [dbo].[Order_Items] (
    [id]             INT             IDENTITY(1,1) NOT NULL,
    [order_id]       INT             NOT NULL,
    [product_id]     INT             NOT NULL,
    [quantity]       DECIMAL(10, 2)  NOT NULL,
    [price_at_time]  DECIMAL(15, 2)  NOT NULL,

    CONSTRAINT PK_Order_Items PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT CK_Order_Items_Qty   CHECK ([quantity] > 0),
    CONSTRAINT CK_Order_Items_Price CHECK ([price_at_time] >= 0)
)
GO

-- ──────────────────────────────────────────────────────────
-- 1.6 Bảng Product_Price_History
-- ──────────────────────────────────────────────────────────
CREATE TABLE [dbo].[Product_Price_History] (
    [id]            INT             IDENTITY(1,1) NOT NULL,
    [product_id]    INT             NOT NULL,
    [old_price]     DECIMAL(15, 2)  NOT NULL,
    [new_price]     DECIMAL(15, 2)  NOT NULL,
    [change_reason] NVARCHAR(255)   NULL,
    [changed_at]    DATETIME        NOT NULL DEFAULT GETDATE(),
    [changed_by]    INT             NULL,

    CONSTRAINT PK_Product_Price_History PRIMARY KEY CLUSTERED ([id] ASC)
)
GO

-- ──────────────────────────────────────────────────────────
-- 1.7 Bảng Crop_Knowledge
-- ──────────────────────────────────────────────────────────
CREATE TABLE [dbo].[Crop_Knowledge] (
    [id]               INT            IDENTITY(1,1) NOT NULL,
    [crop_name]        NVARCHAR(100)  NOT NULL,
    [category]         NVARCHAR(100)  NULL,
    [description]      NVARCHAR(MAX)  NULL,
    [growing_regions]  NVARCHAR(500)  NULL,
    [harvest_months]   NVARCHAR(200)  NULL,
    [popular_standard] NVARCHAR(200)  NULL,
    [care_tips]        NVARCHAR(MAX)  NULL,
    [storage_tips]     NVARCHAR(MAX)  NULL,

    CONSTRAINT PK_Crop_Knowledge PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT UQ_Crop_Knowledge_Name UNIQUE ([crop_name])
)
GO

-- ──────────────────────────────────────────────────────────
-- 1.8 Bảng Crop_Disease_Info
-- ──────────────────────────────────────────────────────────
CREATE TABLE [dbo].[Crop_Disease_Info] (
    [id]             INT            IDENTITY(1,1) NOT NULL,
    [crop_id]        INT            NOT NULL,
    [disease_name]   NVARCHAR(200)  NOT NULL,
    [symptoms]       NVARCHAR(MAX)  NULL,
    [causes]         NVARCHAR(MAX)  NULL,
    [prevention]     NVARCHAR(MAX)  NULL,
    [treatment]      NVARCHAR(MAX)  NULL,

    CONSTRAINT PK_Crop_Disease_Info PRIMARY KEY CLUSTERED ([id] ASC)
)
GO


-- ============================================================
-- PHẦN 2 – FOREIGN KEYS
-- ============================================================

ALTER TABLE [dbo].[Products]
    ADD CONSTRAINT FK_Products_Seller
        FOREIGN KEY ([seller_id]) REFERENCES [dbo].[Users] ([id])
GO

ALTER TABLE [dbo].[Products]
    ADD CONSTRAINT FK_Products_MarketPrice
        FOREIGN KEY ([market_price_id]) REFERENCES [dbo].[Market_Prices] ([id])
        ON DELETE SET NULL
GO

ALTER TABLE [dbo].[Orders]
    ADD CONSTRAINT FK_Orders_Buyer
        FOREIGN KEY ([buyer_id]) REFERENCES [dbo].[Users] ([id])
GO

ALTER TABLE [dbo].[Order_Items]
    ADD CONSTRAINT FK_OrderItems_Order
        FOREIGN KEY ([order_id]) REFERENCES [dbo].[Orders] ([id])
        ON DELETE CASCADE
GO

ALTER TABLE [dbo].[Order_Items]
    ADD CONSTRAINT FK_OrderItems_Product
        FOREIGN KEY ([product_id]) REFERENCES [dbo].[Products] ([id])
GO

ALTER TABLE [dbo].[Product_Price_History]
    ADD CONSTRAINT FK_PriceHistory_Product
        FOREIGN KEY ([product_id]) REFERENCES [dbo].[Products] ([id])
GO

ALTER TABLE [dbo].[Crop_Disease_Info]
    ADD CONSTRAINT FK_Disease_Crop
        FOREIGN KEY ([crop_id]) REFERENCES [dbo].[Crop_Knowledge] ([id])
        ON DELETE CASCADE
GO


-- ============================================================
-- PHẦN 3 – INDEX
-- ============================================================

CREATE NONCLUSTERED INDEX IX_Products_Name
    ON [dbo].[Products] ([name])
    INCLUDE ([price], [category], [status], [is_deleted], [rating])
GO

CREATE NONCLUSTERED INDEX IX_Products_Category_Price
    ON [dbo].[Products] ([category], [price])
    WHERE [is_deleted] = 0
GO

CREATE NONCLUSTERED INDEX IX_Products_Status_Deleted
    ON [dbo].[Products] ([status], [is_deleted])
GO

CREATE NONCLUSTERED INDEX IX_Products_SellerID
    ON [dbo].[Products] ([seller_id])
    WHERE [is_deleted] = 0
GO

-- ✅ v2.1: Index hỗ trợ sắp xếp theo rating (chatbot ưu tiên hàng đánh giá cao)
CREATE NONCLUSTERED INDEX IX_Products_Rating
    ON [dbo].[Products] ([rating] DESC, [price] ASC)
    WHERE [is_deleted] = 0 AND [status] = 'active'
GO

CREATE NONCLUSTERED INDEX IX_MarketPrices_ProductName
    ON [dbo].[Market_Prices] ([product_name])
    INCLUDE ([min_price], [max_price], [region], [standard], [update_date])
GO

CREATE NONCLUSTERED INDEX IX_MarketPrices_Region
    ON [dbo].[Market_Prices] ([region], [product_name])
GO

CREATE NONCLUSTERED INDEX IX_Orders_BuyerID
    ON [dbo].[Orders] ([buyer_id], [created_at] DESC)
GO

CREATE NONCLUSTERED INDEX IX_PriceHistory_ProductID
    ON [dbo].[Product_Price_History] ([product_id], [changed_at] DESC)
GO

CREATE NONCLUSTERED INDEX IX_Disease_CropID
    ON [dbo].[Crop_Disease_Info] ([crop_id])
GO


-- ============================================================
-- PHẦN 4 – DỮ LIỆU MẪU
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 4.1 Users
-- ──────────────────────────────────────────────────────────
SET IDENTITY_INSERT [dbo].[Users] ON
INSERT [dbo].[Users] ([id],[name],[phone],[email],[address],[cooperative_name],[role])
VALUES
 (1,N'Nguyễn Văn Trồng','0901234567','van.trong@gmail.com',
    N'Huyện Vũng Liêm, Tỉnh Vĩnh Long',N'HTX Nông nghiệp Vũng Liêm','seller'),
 (2,N'Lê Thị Thu','0987654321','thi.thu@gmail.com',
    N'Huyện Krông Pắc, Tỉnh Đắk Lắk',NULL,'seller'),
 (3,N'Trần Minh Khách','0911222333','minh.khach@gmail.com',
    N'Quận 1, TP. Hồ Chí Minh',NULL,'buyer'),
 (4,N'Phạm Thị Mua','0944555666','thi.mua@gmail.com',
    N'Quận Cầu Giấy, Hà Nội',NULL,'buyer'),
 (5,N'Admin Quản Trị','0999999999','admin@agriecoplatform.vn',
    N'Hệ thống',NULL,'admin'),
 (6,N'Hoàng Văn Tiêu','0912345678','van.tieu@gmail.com',
    N'Huyện Chư Sê, Tỉnh Gia Lai',N'HTX Tiêu Chư Sê','seller'),
 (7,N'Nguyễn Thị Xoài','0923456789','thi.xoai@gmail.com',
    N'Huyện Cao Lãnh, Tỉnh Đồng Tháp',N'HTX Xoài Cát Hòa Lộc','seller'),
 (8,N'Trần Văn Thanh Long','0934567890','van.thanhlong@gmail.com',
    N'Huyện Hàm Thuận Nam, Tỉnh Bình Thuận',NULL,'seller'),
 (9,N'Phạm Văn Sầu','0945678901','van.sau@gmail.com',
    N'Huyện Cai Lậy, Tỉnh Tiền Giang',N'HTX Sầu Riêng Cai Lậy','seller'),
 (10,N'Lê Thị Điều','0956789012','thi.dieu@gmail.com',
    N'Huyện Đồng Phú, Tỉnh Bình Phước',NULL,'seller'),
 (11,N'Nguyễn Văn Vải','0967890123','van.vai@gmail.com',
    N'Huyện Lục Ngạn, Tỉnh Bắc Giang',N'HTX Vải Thiều Lục Ngạn','seller'),
 (12,N'Trần Thị Nhãn','0978901234','thi.nhan@gmail.com',
    N'Huyện Tiên Lữ, Tỉnh Hưng Yên',NULL,'seller'),
 (13,N'Lê Văn Dưa','0989012345','van.dua@gmail.com',
    N'Huyện Đức Huệ, Tỉnh Long An',NULL,'seller'),
 (14,N'Phạm Thị Khoai','0990123456','thi.khoai@gmail.com',
    N'Huyện Bình Tân, Tỉnh Vĩnh Long',NULL,'seller')
SET IDENTITY_INSERT [dbo].[Users] OFF
GO

-- ──────────────────────────────────────────────────────────
-- 4.2 Market_Prices (Giá thực tế tháng 03/2026)
-- ──────────────────────────────────────────────────────────
SET IDENTITY_INSERT [dbo].[Market_Prices] ON
INSERT [dbo].[Market_Prices]
    ([id],[product_name],[standard],[region],[min_price],[max_price],[unit],[update_date])
VALUES
-- === Lúa gạo ===
 (1,  N'Lúa tươi OM 18',       N'Thường',     N'Miền Tây',   5900,  6100,  N'kg', '2026-03-25'),
 (2,  N'Lúa tươi Đài Thơm 8',  N'Thường',     N'Miền Tây',   6100,  6200,  N'kg', '2026-03-25'),
 (3,  N'Lúa tươi IR 50404',    N'Thường',     N'Miền Tây',   5400,  5500,  N'kg', '2026-03-25'),
 (4,  N'Lúa tươi OM 5451',     N'Thường',     N'Miền Tây',   5700,  5900,  N'kg', '2026-03-25'),
 (5,  N'Gạo nguyên liệu OM 5451',N'Thường',   N'Miền Tây',   8300,  8400,  N'kg', '2026-03-25'),
 (6,  N'Gạo nguyên liệu OM 380', N'Thường',   N'Miền Tây',   7500,  7600,  N'kg', '2026-03-25'),
 (7,  N'Gạo Đài Thơm 8',       N'Xuất khẩu', N'Miền Tây',   9150,  9350,  N'kg', '2026-03-25'),
 (8,  N'Gạo IR 504',           N'Thường',     N'Miền Tây',   8000,  8100,  N'kg', '2026-03-25'),
 (9,  N'Gạo ST25',             N'Hữu cơ',    N'Sóc Trăng',  35000, 42000, N'kg', '2026-03-25'),
 (10, N'Gạo ST25',             N'VietGAP',   N'Sóc Trăng',  28000, 35000, N'kg', '2026-03-25'),

-- === Cà phê ===
 (11, N'Cà phê Robusta',       N'Xuất khẩu', N'Tây Nguyên', 93000, 97000, N'kg', '2026-03-25'),
 (12, N'Cà phê Robusta',       N'Thường',    N'Tây Nguyên', 90000, 95000, N'kg', '2026-03-25'),
 (13, N'Cà phê Arabica',       N'Đặc sản',  N'Lâm Đồng',  130000,165000, N'kg', '2026-03-25'),
 (14, N'Cà phê Arabica',       N'VietGAP',  N'Sơn La',    120000,145000, N'kg', '2026-03-25'),

-- === Trái cây ===
 (15, N'Cam sành',             N'VietGAP',  N'Miền Tây',   14000, 19000, N'kg', '2026-03-25'),
 (16, N'Cam sành',             N'Thường',   N'Miền Tây',   10000, 15000, N'kg', '2026-03-25'),
 (17, N'Xoài cát Hòa Lộc',    N'GlobalGAP',N'Đồng Tháp',  50000, 85000, N'kg', '2026-03-25'),
 (18, N'Xoài cát Hòa Lộc',    N'VietGAP',  N'Đồng Tháp',  40000, 65000, N'kg', '2026-03-25'),
 (19, N'Xoài Đài Loan',        N'Thường',   N'Miền Tây',   25000, 40000, N'kg', '2026-03-25'),
 (20, N'Sầu riêng Monthong',   N'Xuất khẩu',N'Tiền Giang', 100000,140000,N'kg', '2026-03-25'),
 (21, N'Sầu riêng Monthong',   N'VietGAP',  N'Đồng Nai',   90000,120000, N'kg', '2026-03-25'),
 (22, N'Sầu riêng Ri6',        N'Thường',   N'Miền Tây',   70000, 90000, N'kg', '2026-03-25'),
 (23, N'Sầu riêng Chuồng Bò',  N'Thường',   N'Tiền Giang', 85000, 95000, N'kg', '2026-03-25'),
 (24, N'Thanh long ruột đỏ',   N'VietGAP',  N'Bình Thuận', 22000, 35000, N'kg', '2026-03-25'),
 (25, N'Thanh long ruột đỏ',   N'Thường',   N'Bình Thuận', 15000, 28000, N'kg', '2026-03-25'),
 (26, N'Thanh long ruột trắng',N'Thường',   N'Bình Thuận',  8000, 18000, N'kg', '2026-03-25'),
 (27, N'Dưa hấu',              N'VietGAP',  N'Miền Tây',    8000, 13000, N'kg', '2026-03-25'),
 (28, N'Dưa hấu',              N'Thường',   N'Miền Tây',    5000, 10000, N'kg', '2026-03-25'),
 (29, N'Vải thiều',            N'VietGAP',  N'Bắc Giang',  30000, 55000, N'kg', '2026-03-25'),
 (30, N'Nhãn lồng',            N'VietGAP',  N'Hưng Yên',   30000, 60000, N'kg', '2026-03-25'),
 (31, N'Mít Thái',             N'Thường',   N'Đồng Nai',   15000, 30000, N'kg', '2026-03-25'),
 (32, N'Bơ 034',               N'VietGAP',  N'Đắk Lắk',   35000, 65000, N'kg', '2026-03-25'),

-- === Gia vị & công nghiệp ===
 (33, N'Hồ tiêu đen',          N'Xuất khẩu',N'Đắk Lắk',  140000,160000, N'kg', '2026-03-25'),
 (34, N'Hồ tiêu đen',          N'VietGAP',  N'Gia Lai',   145000,165000, N'kg', '2026-03-25'),
 (35, N'Hạt điều thô',         N'Thường',   N'Bình Phước', 35000, 50000, N'kg', '2026-03-25'),
 (36, N'Hạt điều nhân',        N'Xuất khẩu',N'Bình Phước',180000,220000, N'kg', '2026-03-25'),

-- === Rau củ ===
 (37, N'Khoai lang tím Nhật',  N'VietGAP',  N'Vĩnh Long',  15000, 25000, N'kg', '2026-03-25'),
 (38, N'Hành tím',             N'VietGAP',  N'Sóc Trăng',  22000, 38000, N'kg', '2026-03-25'),
 (39, N'Cải ngọt',             N'VietGAP',  N'TP.HCM',      8000, 15000, N'kg', '2026-03-25'),
 (40, N'Rau muống',            N'VietGAP',  N'Miền Nam',    5000, 10000, N'kg', '2026-03-25'),

-- === Bổ sung v2.1 ===
 (41, N'Sầu riêng Dona',       N'VietGAP',  N'Lâm Đồng',   80000,110000, N'kg', '2026-03-25'),
 (42, N'Nhãn xuồng cơm vàng',  N'VietGAP',  N'Tiền Giang',  25000, 45000, N'kg', '2026-03-25'),
 (43, N'Vải thiều Thanh Hà',   N'VietGAP',  N'Hải Dương',   25000, 45000, N'kg', '2026-03-25'),
 (44, N'Dưa hấu không hạt',    N'VietGAP',  N'Long An',      9000, 14000, N'kg', '2026-03-25'),
 (45, N'Khoai lang tím',       N'Thường',   N'Vĩnh Long',   10000, 18000, N'kg', '2026-03-25'),
 (46, N'Mít Thái siêu sớm',    N'VietGAP',  N'Tiền Giang',  18000, 28000, N'kg', '2026-03-25'),
 (47, N'Bơ 034',               N'Hữu cơ',   N'Đắk Lắk',    50000, 75000, N'kg', '2026-03-25'),
 (48, N'Cà phê Arabica Cầu Đất',N'Specialty',N'Lâm Đồng', 150000,200000, N'kg', '2026-03-25'),
 (49, N'Hạt tiêu trắng',       N'Xuất khẩu',N'Bình Phước', 200000,250000, N'kg', '2026-03-25'),
 (50, N'Gạo thơm Jasmine',     N'VietGAP',  N'Long An',     13000, 18000, N'kg', '2026-03-25')
SET IDENTITY_INSERT [dbo].[Market_Prices] OFF
GO

-- ──────────────────────────────────────────────────────────
-- 4.3 Products (✅ v2.1: Thêm cột rating + 14 sản phẩm mới)
-- ──────────────────────────────────────────────────────────
SET IDENTITY_INSERT [dbo].[Products] ON
INSERT [dbo].[Products]
    ([id],[seller_id],[market_price_id],[category],[name],[standard],
     [quantity],[unit],[price],[ai_suggested_price],[ai_marketing_content],
     [image_url],[rating],[status])
VALUES

-- === Sản phẩm gốc (id 1-6, cập nhật thêm rating) ===
(1,  1, 15, N'Trái cây',
    N'Cam sành Vĩnh Long loại 1', N'VietGAP',
    500, N'kg', 18000, 16500,
    N'🍊 Cam sành Vĩnh Long chuẩn VietGAP - mọng nước, vắt được nhiều nước. Đặt ngay để có giá tận gốc từ nhà vườn!',
    N'https://example.com/cam-sanh-vinh-long.jpg', 4.8, 'active'),

(2,  2, 11, N'Cà phê',
    N'Cà phê Robusta nhân xô Đắk Lắk', N'Xuất khẩu',
    1500, N'kg', 95000, 93500,
    N'☕ Nguồn sỉ Cà phê Robusta Đắk Lắk - đậm vị, hạt to đều. Phơi mộc trong nhà kính, đảm bảo độ ẩm tiêu chuẩn xuất khẩu.',
    N'https://example.com/ca-phe-robusta-dak-lak.jpg', 4.7, 'active'),

(3,  1, 9,  N'Lúa gạo',
    N'Gạo ST25 chuẩn lúa - tôm', N'Hữu cơ',
    200, N'kg', 42000, 40000,
    N'🌾 Gạo ST25 canh tác 1 vụ lúa 1 vụ tôm. Hạt gạo dài, cơm dẻo ngọt hậu. Chăm sóc bữa ăn an toàn cho gia đình!',
    N'https://example.com/gao-st25-lua-tom.jpg', 5.0, 'active'),

(4,  6, 33, N'Gia vị',
    N'Hồ tiêu đen Chư Sê xuất khẩu', N'Xuất khẩu',
    300, N'kg', 150000, 148000,
    N'🌶️ Tiêu đen Chư Sê - hương thơm đặc trưng, hạt đều, độ cay vừa. Đạt tiêu chuẩn xuất khẩu sang EU và Mỹ.',
    N'https://example.com/tieu-den-chu-se.jpg', 4.9, 'active'),

(5,  7, 17, N'Trái cây',
    N'Xoài cát Hòa Lộc Cao Lãnh GlobalGAP', N'GlobalGAP',
    150, N'kg', 75000, 72000,
    N'🥭 Xoài cát Hòa Lộc Đồng Tháp - thịt vàng, ngọt lịm, ít xơ. Chuẩn GlobalGAP xuất khẩu. Giao nguyên thùng.',
    N'https://example.com/xoai-cat-hoa-loc.jpg', 4.9, 'active'),

(6,  8, 24, N'Trái cây',
    N'Thanh long ruột đỏ Bình Thuận VietGAP', N'VietGAP',
    800, N'kg', 28000, 26000,
    N'🐉 Thanh long ruột đỏ Bình Thuận - trái to, da bóng, ruột đỏ đậm. VietGAP - an toàn tuyệt đối.',
    N'https://example.com/thanh-long-ruot-do.jpg', 4.6, 'active'),

-- === Sản phẩm mới v2.1 (id 7-20) ===
(7,  9, 20, N'Trái cây',
    N'Sầu riêng Monthong Cai Lậy xuất khẩu', N'Xuất khẩu',
    400, N'kg', 120000, 115000,
    N'👑 Vua trái cây Sầu Riêng Monthong Cai Lậy - múi vàng óng, hạt lép, béo ngậy. Đạt tiêu chuẩn xuất Trung Quốc và EU.',
    N'https://example.com/sau-rieng-monthong-cai-lay.jpg', 5.0, 'active'),

(8,  9, 22, N'Trái cây',
    N'Sầu riêng Ri6 Tiền Giang thương phẩm', N'Thường',
    600, N'kg', 78000, 75000,
    N'🍈 Sầu Riêng Ri6 - cơm vàng, thơm nức, giá dễ chịu hơn Monthong. Phù hợp mua số lượng lớn.',
    N'https://example.com/sau-rieng-ri6.jpg', 4.5, 'active'),

(9,  7, 19, N'Trái cây',
    N'Xoài Đài Loan Đồng Tháp trái vụ', N'Thường',
    300, N'kg', 35000, 33000,
    N'🥭 Xoài Đài Loan Đồng Tháp - trái lớn, vỏ xanh đậm, ăn giòn ngọt. Thích hợp cho nhà hàng, quán trái cây.',
    N'https://example.com/xoai-dai-loan.jpg', 4.3, 'active'),

(10, 10, 35, N'Gia vị',
    N'Hạt điều thô Bình Phước loại 1', N'Thường',
    1000, N'kg', 45000, 43000,
    N'🥜 Hạt điều thô Bình Phước - hạt to đều, tỉ lệ nhân cao. Bán sỉ cho xưởng chế biến và xuất khẩu.',
    N'https://example.com/hat-dieu-binh-phuoc.jpg', 4.6, 'active'),

(11, 11, 29, N'Trái cây',
    N'Vải thiều Lục Ngạn đặc sản chín sớm', N'VietGAP',
    200, N'kg', 48000, 45000,
    N'🍒 Vải thiều Lục Ngạn chín sớm - vỏ đỏ tươi, cùi dày, hạt nhỏ. Đặc sản Bắc Giang nức tiếng cả nước.',
    N'https://example.com/vai-thieu-luc-ngan.jpg', 4.9, 'active'),

(12, 12, 30, N'Trái cây',
    N'Nhãn lồng Hưng Yên chính vụ', N'VietGAP',
    150, N'kg', 50000, 48000,
    N'🍈 Nhãn lồng Hưng Yên - thơm nức, cùi dày trong, hạt nhỏ. Chỉ có 1 mùa/năm - đặt trước để không bỏ lỡ!',
    N'https://example.com/nhan-long-hung-yen.jpg', 5.0, 'active'),

(13, 13, 44, N'Rau củ quả',
    N'Dưa hấu không hạt Long An loại 1', N'VietGAP',
    2000, N'kg', 11000, 10000,
    N'🍉 Dưa hấu không hạt Long An - trái to 5-8kg, ruột đỏ đậm, ngọt lịm. Hàng VietGAP an toàn cho gia đình.',
    N'https://example.com/dua-hau-khong-hat.jpg', 4.7, 'active'),

(14, 14, 37, N'Rau củ quả',
    N'Khoai lang tím Nhật Bình Tân VietGAP', N'VietGAP',
    800, N'kg', 22000, 20000,
    N'🍠 Khoai lang tím Nhật Bình Tân - củ đẹp đều, ruột tím đậm, ngọt bùi. Rất giàu anthocyanin tốt cho sức khỏe.',
    N'https://example.com/khoai-lang-tim-nhat.jpg', 4.8, 'active'),

(15, 2, 13, N'Cà phê',
    N'Cà phê Arabica Đà Lạt Cầu Đất specialty', N'Đặc sản',
    100, N'kg', 160000, 155000,
    N'☕ Cà phê Arabica Cầu Đất Đà Lạt - độ chua tinh tế, hương hoa quả tự nhiên. Rang xay theo đơn, giao trong 3 ngày.',
    N'https://example.com/arabica-cau-dat.jpg', 5.0, 'active'),

(16, 9, 41, N'Trái cây',
    N'Sầu riêng Dona Lâm Đồng VietGAP', N'VietGAP',
    250, N'kg', 100000, 95000,
    N'🌟 Sầu Riêng Dona Lâm Đồng - múi vàng nhạt, vị ngọt thanh không ngấy. Phù hợp ăn số lượng lớn.',
    N'https://example.com/sau-rieng-dona.jpg', 4.4, 'active'),

(17, 1, 5,  N'Lúa gạo',
    N'Gạo OM 5451 Vĩnh Long thường', N'Thường',
    500, N'kg', 8400, 8000,
    N'🌾 Gạo OM 5451 Vĩnh Long - hạt dài vừa, cơm mềm, giá bình dân. Phù hợp cho bếp ăn tập thể và nhà hàng.',
    N'https://example.com/gao-om5451.jpg', 4.2, 'active'),

(18, 6, 34, N'Gia vị',
    N'Hồ tiêu đen Gia Lai VietGAP', N'VietGAP',
    200, N'kg', 155000, 152000,
    N'🌶️ Tiêu đen Gia Lai VietGAP - hạt đều chắc, màu đen bóng, cay thơm đặc trưng. Không tồn dư thuốc BVTV.',
    N'https://example.com/tieu-den-gia-lai-vietgap.jpg', 4.8, 'active'),

(19, 8, 26, N'Trái cây',
    N'Thanh long ruột trắng Bình Thuận nghịch vụ', N'Thường',
    1200, N'kg', 15000, 14000,
    N'🐉 Thanh long ruột trắng Bình Thuận - trái tươi thu hoạch buổi sáng. Nguồn hàng ổn định quanh năm nhờ thắp đèn.',
    N'https://example.com/thanh-long-ruot-trang.jpg', 4.1, 'active'),

(20, 10, 36, N'Gia vị',
    N'Hạt điều nhân W320 Bình Phước xuất khẩu', N'Xuất khẩu',
    500, N'kg', 200000, 195000,
    N'🥜 Hạt điều nhân W320 - size đều, màu trắng ngà, hạt không vỡ. Đạt tiêu chuẩn xuất khẩu châu Âu.',
    N'https://example.com/hat-dieu-nhan-w320.jpg', 4.9, 'active')

SET IDENTITY_INSERT [dbo].[Products] OFF
GO

-- ──────────────────────────────────────────────────────────
-- 4.4 Orders & Order_Items
-- ──────────────────────────────────────────────────────────
SET IDENTITY_INSERT [dbo].[Orders] ON
INSERT [dbo].[Orders]
    ([id],[buyer_id],[total_amount],[shipping_address],[order_status],[payment_method])
VALUES
(1, 3, 180000,  N'123 Lê Lợi, Quận 1, TP. Hồ Chí Minh',  'pending',   'cod'),
(2, 4, 380000,  N'456 Xuân Thủy, Cầu Giấy, Hà Nội',       'confirmed', 'banking'),
(3, 3, 750000,  N'123 Lê Lợi, Quận 1, TP. Hồ Chí Minh',  'completed', 'banking'),
(4, 4, 4800000, N'456 Xuân Thủy, Cầu Giấy, Hà Nội',       'completed', 'banking'),
(5, 3, 1100000, N'123 Lê Lợi, Quận 1, TP. Hồ Chí Minh',  'confirmed', 'cod')
SET IDENTITY_INSERT [dbo].[Orders] OFF
GO

SET IDENTITY_INSERT [dbo].[Order_Items] ON
INSERT [dbo].[Order_Items] ([id],[order_id],[product_id],[quantity],[price_at_time])
VALUES
(1, 1, 1,  10.00,  18000.00),
(2, 2, 2,   4.00,  95000.00),
(3, 3, 3,  10.00,  42000.00),
(4, 3, 1,   5.00,  18000.00),
(5, 4, 7,  40.00, 120000.00),
(6, 5, 11,  10.00,  48000.00),
(7, 5, 13, 100.00,  11000.00)
SET IDENTITY_INSERT [dbo].[Order_Items] OFF
GO

-- ──────────────────────────────────────────────────────────
-- 4.5 Product_Price_History
-- ──────────────────────────────────────────────────────────
INSERT [dbo].[Product_Price_History]
    ([product_id],[old_price],[new_price],[change_reason],[changed_by])
VALUES
(2,  90000,  95000, N'Giá cà phê thế giới tăng, điều chỉnh theo thị trường', 2),
(3,  38000,  42000, N'Gạo ST25 khan hiếm sau tết, thị trường tăng giá',       1),
(7, 110000, 120000, N'Sầu riêng vào chính vụ xuất khẩu, nhu cầu tăng mạnh',   9),
(4, 145000, 150000, N'Hồ tiêu thế giới tăng do thiếu nguồn cung từ Ấn Độ',    6)
GO

-- ──────────────────────────────────────────────────────────
-- 4.6 Crop_Knowledge (Kiến thức nông sản cho chatbot)
-- ──────────────────────────────────────────────────────────
SET IDENTITY_INSERT [dbo].[Crop_Knowledge] ON
INSERT [dbo].[Crop_Knowledge]
    ([id],[crop_name],[category],[description],[growing_regions],
     [harvest_months],[popular_standard],[care_tips],[storage_tips])
VALUES
(1,N'Lúa',N'Lương thực',
N'Cây lương thực quan trọng nhất Việt Nam. Các giống phổ biến: OM5451, Đài Thơm 8, ST25, IR 504, OM 380.',
N'Đồng bằng sông Cửu Long, Đồng bằng sông Hồng, Duyên hải miền Trung',
N'Vụ Đông Xuân: tháng 1-3; Vụ Hè Thu: tháng 6-8; Vụ Thu Đông: tháng 10-11',
N'VietGAP, Hữu cơ, SRP (Tiêu chuẩn lúa gạo bền vững)',
N'Bón phân theo nguyên tắc 4 đúng (đúng loại, đúng lượng, đúng lúc, đúng cách). Giữ mực nước ruộng 3-5cm trong giai đoạn đẻ nhánh. Phun thuốc phòng đạo ôn cổ bông trước trổ 7-10 ngày.',
N'Phơi lúa đến độ ẩm 14-14,5% trước khi bảo quản. Kho phải khô ráo, thoáng mát. Dùng bao tải PP sạch hoặc silo chứa ngũ cốc.'
),
(2,N'Cà phê Robusta',N'Công nghiệp',
N'Loại cà phê chủ lực của Việt Nam, chiếm hơn 95% sản lượng. Hương vị đậm, độ cafein cao. Trồng chủ yếu ở Tây Nguyên.',
N'Đắk Lắk, Gia Lai, Đắk Nông, Lâm Đồng, Kon Tum',
N'Thu hoạch chính vụ: tháng 10 - tháng 1 năm sau',
N'Xuất khẩu 4C, UTZ, Rainforest Alliance; VietGAP; Hữu cơ',
N'Tưới nước bổ sung vào mùa khô (3-4 lần/vụ). Bón phân NPK đợt 1 sau thu hoạch, đợt 2 đầu mùa mưa, đợt 3 giai đoạn quả phát triển. Tỉa cành tạo tán hàng năm để giữ năng suất.',
N'Hái quả đỏ chín hoàn toàn. Phơi khô đến độ ẩm dưới 13%. Bảo quản trong bao PP hoặc bao GrainPro, để nơi thoáng mát, tránh ẩm.'
),
(3,N'Cà phê Arabica',N'Công nghiệp',
N'Cà phê cao cấp với hương thơm tinh tế, độ chua đặc trưng. Trồng ở vùng cao >1000m. Giá trị kinh tế cao hơn Robusta.',
N'Lâm Đồng (Đà Lạt, Cầu Đất), Sơn La, Điện Biên, Quảng Trị',
N'Thu hoạch: tháng 10 - tháng 12',
N'Specialty coffee, Hữu cơ, Rain Forest Alliance',
N'Cần bóng mát khi còn nhỏ. Đất tơi xốp, pH 5.5-6.5. Tưới điều độ, tránh ngập úng. Kiểm soát nghiêm ngặt bệnh gỉ sắt.',
N'Chế biến ướt (wet process) cho chất lượng cao nhất. Rang xay trong vòng 1 tháng sau khi chế biến.'
),
(4,N'Cam sành',N'Trái cây',
N'Loại cam đặc sản Miền Tây, vỏ sần sùi màu xanh vàng, ruột cam đỏ, ngọt thanh, nhiều nước. Giống nổi tiếng: Cam sành Vĩnh Long, Hà Giang.',
N'Vĩnh Long, Tiền Giang, Hậu Giang, Hà Giang',
N'Chính vụ: tháng 11 - tháng 3; Trái vụ: tháng 6 - tháng 8',
N'VietGAP, GlobalGAP',
N'Bón phân hữu cơ để cải tạo đất. Tỉa cành thông thoáng phòng bệnh. Bao trái để tránh ruồi vàng. Tưới đều, tránh để đất khô cứng gây nứt trái.',
N'Bảo quản ở nhiệt độ 8-10°C được 4-6 tuần. Ở nhiệt độ thường chỉ giữ được 1-2 tuần. Chọn trái còn cuống, không dập.'
),
(5,N'Xoài',N'Trái cây',
N'Trái cây xuất khẩu chủ lực. Giống nổi tiếng: Xoài cát Hòa Lộc (Đồng Tháp), Xoài Cát Chu (Đồng Tháp), Xoài Đài Loan, Xoài Úc.',
N'Đồng Tháp, Tiền Giang, Đồng Nai, Khánh Hòa, Bình Thuận',
N'Xoài cát Hòa Lộc: tháng 3-5; Xoài Cát Chu: tháng 4-6; Xoài Đài Loan: tháng 5-7',
N'GlobalGAP, VietGAP, Hữu cơ',
N'Xử lý ra hoa bằng KNO3 hoặc Ethephon vào tháng 10-11. Bao trái khi quả to bằng nắm tay để phòng ruồi đục trái. Bón kali cao trước thu hoạch 1 tháng tăng độ ngọt.',
N'Thu hoạch khi cuống rụng tự nhiên hoặc quả đạt độ chín 80-90%. Bảo quản lạnh 10-13°C giữ được 3-4 tuần.'
),
(6,N'Sầu riêng',N'Trái cây',
N'Vua trái cây với giá trị kinh tế cao nhất. Giống chủ lực: Monthong (xuất khẩu), Ri6, Chuồng Bò, Dona (Lâm Đồng).',
N'Tiền Giang, Bến Tre, Vĩnh Long, Đồng Nai, Đắk Lắk, Lâm Đồng, Bình Phước',
N'Miền Tây: tháng 3-5; Đông Nam Bộ: tháng 4-7; Tây Nguyên: tháng 7-9',
N'GlobalGAP, VietGAP (bắt buộc cho xuất khẩu Trung Quốc)',
N'Xử lý ra hoa bằng cách giữ khô hạn, sau đó tưới nước đủ ẩm kích thích. Bón phân cân đối P-K cao giai đoạn tượng hoa. Kiểm soát chặt dư lượng thuốc BVTV theo tiêu chuẩn xuất khẩu.',
N'Thu hoạch khi cuống có màu vàng nâu, gõ tiếng đục. Bảo quản lạnh 15-18°C được 1-2 tuần.'
),
(7,N'Thanh long',N'Trái cây',
N'Trái cây đặc sản Bình Thuận. Loại: ruột trắng (phổ biến), ruột đỏ (giá cao hơn). Xuất khẩu chủ yếu sang Trung Quốc.',
N'Bình Thuận, Long An, Tiền Giang, Tây Ninh',
N'Chính vụ: tháng 5-8; Nghịch vụ (thắp điện): quanh năm',
N'GlobalGAP, VietGAP, JGAP (xuất Nhật)',
N'Kéo dài thắp điện 8-10 giờ/đêm để kích thích ra hoa nghịch vụ. Tỉa bỏ trái dị dạng, chỉ để 1-2 trái/cành. Bón kali cao trước thu hoạch tăng màu sắc vỏ trái.',
N'Thu hoạch khi vỏ đỏ đều (ruột đỏ) hoặc vàng hồng (ruột trắng). Bảo quản lạnh 8-10°C được 2-3 tuần.'
),
(8,N'Hồ tiêu',N'Gia vị',
N'Gia vị xuất khẩu chủ lực với giá trị cao. Loại: tiêu đen (sấy cả vỏ), tiêu trắng (bóc vỏ). Giống: Tiêu Vĩnh Linh, Tiêu Ấn Độ.',
N'Gia Lai, Đắk Lắk, Đắk Nông, Bình Phước, Đồng Nai, Bà Rịa - Vũng Tàu',
N'Thu hoạch: tháng 1 - tháng 4',
N'Hữu cơ, GlobalGAP, Rainforest Alliance',
N'Trồng trên trụ sống (cây gòn, muồng...) hoặc trụ bê tông. Tưới tiết kiệm mùa khô. Kiểm soát tuyến trùng bằng Trichoderma. Không trồng lại sau khi đất bị nhiễm Phytophthora.',
N'Phơi khô đến độ ẩm dưới 12% trước khi bảo quản. Đóng bao kín, để nơi khô mát, tránh ánh sáng trực tiếp.'
),
(9,N'Điều',N'Công nghiệp',
N'Cây công nghiệp dễ trồng, chịu hạn tốt. Hạt điều nhân là mặt hàng xuất khẩu tỷ đô. Việt Nam là nước chế biến điều lớn nhất thế giới.',
N'Bình Phước, Đồng Nai, Bà Rịa - Vũng Tàu, Bình Thuận, Lâm Đồng',
N'Thu hoạch: tháng 2 - tháng 4',
N'Hữu cơ, GlobalGAP',
N'Tỉa cành tạo tán sau thu hoạch. Bón NPK đợt 1 đầu mùa mưa, đợt 2 trước ra hoa. Phòng bệnh thán thư bằng thuốc đồng trong mùa mưa.',
N'Hạt điều thô phơi khô đến độ ẩm 8%. Bảo quản bao kín, tránh mối mọt.'
),
(10,N'Vải thiều',N'Trái cây',
N'Trái cây đặc sản miền Bắc. Vải thiều Lục Ngạn (Bắc Giang) nổi tiếng nhất. Xuất khẩu mạnh sang Trung Quốc, Nhật, EU.',
N'Bắc Giang (Lục Ngạn), Hải Dương (Thanh Hà)',
N'Chính vụ: tháng 5 - tháng 7',
N'GlobalGAP, VietGAP, hữu cơ',
N'Bón lân và kali cao để hỗ trợ đậu trái. Xử lý ra hoa sớm bằng cách giảm tưới vào tháng 11-12. Phòng nhện lông nhung và bệnh thán thư nghiêm ngặt.',
N'Vải tươi bảo quản được 1-3 ngày ở nhiệt độ thường. Bảo quản lạnh 2-5°C được 4-6 tuần. Xuất khẩu cần qua xử lý lưu huỳnh hoặc đông lạnh.'
),
(11,N'Nhãn',N'Trái cây',
N'Trái cây ngọt, thơm. Nhãn lồng Hưng Yên nổi tiếng nhất. Có thể sản xuất nhãn xuồng cơm vàng ở miền Nam.',
N'Hưng Yên, Sơn La, Tiền Giang, Vĩnh Long, Đồng Tháp',
N'Nhãn lồng Hưng Yên: tháng 7-8; Nhãn miền Nam: tháng 4-6',
N'VietGAP, GlobalGAP',
N'Tỉa cành sau thu hoạch để cây phục hồi. Bón phân hữu cơ + vô cơ cân đối. Phòng chổi rồng (bệnh virut) bằng cách kiểm soát nhện lông nhung.',
N'Nhãn tươi chỉ giữ được 3-5 ngày ở nhiệt độ thường. Cấp đông IQF bảo quản được 12-18 tháng.'
),
(12,N'Dưa hấu',N'Rau củ quả',
N'Cây trồng ngắn ngày, thu hoạch 70-90 ngày. Giống phổ biến: Hắc Mỹ Nhân, dưa không hạt. Thị trường xuất khẩu chính: Trung Quốc.',
N'Long An, Tây Ninh, Bình Thuận, Quảng Nam, Quảng Ngãi',
N'Tháng 12 - tháng 5 (mùa khô)',
N'VietGAP, GlobalGAP',
N'Cần thoát nước tốt, không chịu úng. Đặt trái lên gốc rơm tránh tiếp xúc đất gây thối. Kiểm soát ruồi đục trái bằng bẫy methyl eugenol.',
N'Dưa chín trữ được 2-3 tuần ở nhiệt độ thường. Dấu hiệu chín: tua dây gần cuống khô, tiếng gõ bộp.'
),
(13,N'Khoai lang',N'Rau củ quả',
N'Cây lương thực phụ, dễ trồng. Giống đặc sản: Khoai lang tím Nhật (Vĩnh Long), khoai lang Đà Lạt.',
N'Vĩnh Long, Đà Lạt - Lâm Đồng, Bình Tân (Vĩnh Long)',
N'Tháng 3-5 (Hè Thu) và tháng 8-10 (Đông Xuân)',
N'VietGAP, hữu cơ',
N'Trồng luống cao thoát nước. Bón kali cao tăng chất lượng củ. Không bón đạm quá nhiều gây thân lá phát triển nhiều, ít củ.',
N'Khoai lang tươi bảo quản 1-2 tháng ở nơi mát, thoáng. Không để lạnh dưới 10°C sẽ hỏng.'
),
(14,N'Mít Thái',N'Trái cây',
N'Mít không hạt, múi dày, giòn ngọt. Xuất khẩu sang Trung Quốc. Mít Thái siêu sớm thu hoạch quanh năm.',
N'Đồng Nai, Tiền Giang, Đắk Lắk, Bình Phước',
N'Quanh năm (giống siêu sớm); Chính vụ: tháng 3-7',
N'VietGAP, GlobalGAP',
N'Bao trái bằng túi nylon hoặc túi foam phòng ruồi đục. Khi trái to bằng đầu gối, bón thêm kali. Cắt sạch những trái quá dày hoặc mọc sát thân.',
N'Mít xanh ổn định hơn mít chín khi vận chuyển xa. Mít chín chỉ dùng được 1-2 ngày ở nhiệt độ thường.'
),
(15,N'Bơ',N'Trái cây',
N'Trái cây giàu dinh dưỡng, ngày càng được ưa chuộng. Giống phổ biến: Bơ 034 (Đắk Lắk), Booth 7, Reed.',
N'Đắk Lắk, Lâm Đồng, Gia Lai, Đắk Nông',
N'Tháng 6-9 (chính vụ 034); Tháng 12-3 (nghịch vụ Reed)',
N'VietGAP, GlobalGAP',
N'Trồng xen cà phê là mô hình phổ biến. Bón phân cân đối, tránh bón đạm quá nhiều. Phòng bệnh thối gốc bằng Fosetyl-Al định kỳ.',
N'Bơ cứng sau thu hoạch, cần 3-7 ngày chín ở nhiệt độ phòng. Bơ chín bảo quản lạnh 3-5°C được 1 tuần.'
)
SET IDENTITY_INSERT [dbo].[Crop_Knowledge] OFF
GO

-- ──────────────────────────────────────────────────────────
-- 4.7 Crop_Disease_Info (Thông tin bệnh cây cho chatbot RAG)
-- ──────────────────────────────────────────────────────────
INSERT [dbo].[Crop_Disease_Info]
    ([crop_id],[disease_name],[symptoms],[causes],[prevention],[treatment])
VALUES

-- === Lúa (crop_id = 1) ===
(1,N'Bệnh đạo ôn (cháy lá)',
N'Lá xuất hiện vết hình thoi, tâm xám trắng, viền nâu. Trên cổ bông: cổ bông thối đen, hạt lép lửng.',
N'Nấm Magnaporthe oryzae. Phát triển mạnh khi trời âm u, nhiều sương mù, nhiệt độ 20-25°C, bón nhiều đạm.',
N'Sử dụng giống kháng. Bón phân cân đối, giảm đạm. Theo dõi thường xuyên khi thời tiết bất lợi.',
N'Phun thuốc: Tricyclazole (Beam, Filia), Isoprothiolane (Fuji-One), Propiconazole. Phun sớm khi phát hiện vết bệnh đầu tiên. Phun phòng trước trổ bông 5-7 ngày.'
),
(1,N'Bệnh bạc lá vi khuẩn',
N'Lá lúa vàng từ chóp xuống, mép lá có viền vàng rồi khô trắng. Cắt lá nhúng vào nước sẽ thấy dịch vi khuẩn chảy ra.',
N'Vi khuẩn Xanthomonas oryzae pv. oryzae. Lây lan qua nước, vết thương do gió bão, côn trùng.',
N'Dùng giống kháng. Tránh bón đạm quá nhiều, đặc biệt sau bão lụt. Tiêu hủy tàn dư cây bệnh.',
N'Phun Copper hydroxide (Champion, Kocide), Kasugamycin (Kasumin), Bismerthiazol (Sasa). Phun sau bão hoặc mưa lớn. Bổ sung kali tăng đề kháng cây.'
),
(1,N'Rầy nâu và lùn xoắn lá',
N'Lá lúa xoắn, lùn thấp, không trổ được hoặc trổ bị dị dạng. Rầy non màu nâu tụ ở gốc cây.',
N'Rầy nâu (Nilaparvata lugens) là côn trùng chích hút và truyền virus lùn xoắn lá.',
N'Chọn giống kháng rầy. Không bón đạm quá nhiều. Ruộng phải đảm bảo thông thoáng.',
N'Phun Imidacloprid (Admire, Confidor), Thiamethoxam (Actara), Buprofezin (Applaud). Phun vào buổi sáng sớm khi rầy hoạt động mạnh. Kết hợp rút nước cạn ruộng trước khi phun.'
),
(1,N'Lem lép hạt',
N'Hạt gạo bị lép hoặc có vết đen, nâu trên vỏ trấu. Tỷ lệ hạt xanh cao, gạo dễ gãy.',
N'Phức hợp nhiều loại nấm và vi khuẩn: Bipolaris oryzae, Sarocladium oryzae, Xanthomonas. Mưa nhiều trong giai đoạn trổ bông.',
N'Bón cân đối NPK. Phun thuốc phòng trong giai đoạn trổ - chín sữa.',
N'Phun Carbendazim + Hexaconazole, Difenoconazole (Score), Propiconazole (Tilt) giai đoạn đòng đòng đến trổ.'
),

-- === Cà phê Robusta (crop_id = 2) ===
(2,N'Bệnh gỉ sắt (vàng lá gỉ sắt)',
N'Mặt dưới lá xuất hiện vết bột màu vàng cam (bào tử nấm). Lá vàng và rụng sớm, cây mất dần sức sống.',
N'Nấm Hemileia vastatrix. Phát triển mạnh trong mùa mưa, ẩm độ cao >80%, nhiệt độ 20-25°C.',
N'Trồng giống kháng (cà phê TR9, TR11). Tỉa cành thông thoáng. Phun phòng định kỳ trong mùa mưa.',
N'Phun Copper hydroxide (Norshield, Champion), Trifloxystrobin (Flint), Propiconazole. Phun 2-3 lần trong mùa mưa, cách nhau 3-4 tuần.'
),
(2,N'Rệp sáp hại rễ và thân',
N'Cây sinh trưởng kém, lá vàng nhạt không rõ nguyên nhân. Kiểm tra gốc cây thấy rệp sáp trắng bám vào rễ.',
N'Rệp sáp Planococcus citri, P. lilacinus. Phổ biến trong mùa khô, kiến là tác nhân di chuyển rệp.',
N'Kiểm soát kiến bằng bẫy dầu nhớt quanh gốc. Tưới nước đủ ẩm.',
N'Tưới hoặc phun Imidacloprid, Thiamethoxam vào đất quanh gốc. Dùng dầu khoáng phun định kỳ. Kết hợp diệt kiến.'
),
(2,N'Bệnh thán thư (đốm nâu)',
N'Đầu cành, chùm quả có vết nâu đen, thối và khô. Quả non rụng hàng loạt trong mùa mưa.',
N'Nấm Colletotrichum gloeosporioides. Lây lan qua mưa và gió, mạnh nhất đầu mùa mưa.',
N'Tỉa cành thông thoáng. Không để vườn ẩm ướt quá. Phun phòng đầu mùa mưa.',
N'Phun Mancozeb (Dithane, Dipomate), Azoxystrobin (Amistar), Propiconazole khi phát hiện bệnh.'
),
(2,N'Bệnh thối rễ (khô cành)',
N'Cành cà phê héo rũ, lá vàng và rụng từng cành, sau đó chết dần. Rễ thối nâu.',
N'Nấm Phytophthora cinnamomi, Pythium spp. Đất thoát nước kém, ngập úng.',
N'Trồng trên đất thoát nước tốt. Tạo rãnh thoát nước. Không trồng lại ngay trên đất nhiễm bệnh.',
N'Tưới Fosetyl-Al (Aliette, Agrifos) vào gốc, kết hợp phun lên lá. Metalaxyl-M (Ridomil) trong mùa mưa.'
),

-- === Cam sành (crop_id = 4) ===
(4,N'Bệnh vàng lá Greening (HLB)',
N'Lá vàng loang lổ không đều (vàng không đối xứng), cành khô chết dần từ trên xuống. Quả méo mó, nhỏ, vị đắng.',
N'Vi khuẩn Candidatus Liberibacter asiaticus, lây lan bởi rầy chổng cánh (Diaphorina citri). Không có thuốc chữa trị.',
N'Trồng cây sạch bệnh có nguồn gốc rõ ràng. Kiểm soát rầy chổng cánh định kỳ bằng thuốc trừ sâu. Tiêu hủy cây bệnh ngay khi phát hiện.',
N'KHÔNG CÓ THUỐC CHỮA. Nhổ bỏ cây bệnh để ngăn lây lan. Phun Imidacloprid, Abamectin kiểm soát rầy chổng cánh vector.'
),
(4,N'Sâu vẽ bùa',
N'Lá non bị sâu đào đường hầm bên trong, tạo thành hình vẽ ngoằn ngoèo màu trắng bạc. Lá bị quăn.',
N'Bướm Phyllocnistis citrella đẻ trứng trên lá non. Phổ biến trong mùa ra đọt.',
N'Bao bọc chồi non. Không bón nhiều đạm kích thích ra đọt liên tục.',
N'Phun Abamectin (Vibamec, Agrimec), Spinosad (Success, Tracer) khi cây vừa nhú đọt non. Phun 2 lần cách nhau 5-7 ngày.'
),
(4,N'Bệnh thối gốc chảy nhựa',
N'Gốc cây chảy nhựa màu vàng nâu, vỏ gốc nứt và thối. Cây vàng úa, sinh trưởng kém.',
N'Nấm Phytophthora parasitica, P. citrophthora. Đất ẩm, thoát nước kém, vết thương cơ học.',
N'Thoát nước tốt. Tránh vun đất quá cao vào gốc. Không tưới vào buổi chiều tối.',
N'Cạo sạch phần vỏ bị thối, phơi khô. Bôi Metalaxyl + Copper (Ridomil Gold MZ) hoặc Fosetyl-Al vào vết thương. Tưới Aliette vào đất.'
),

-- === Xoài (crop_id = 5) ===
(5,N'Bệnh thán thư',
N'Trên lá non, hoa, quả có vết nâu đen, tròn hoặc không đều. Hoa bị thối và rụng nhiều trong mùa mưa.',
N'Nấm Colletotrichum gloeosporioides. Lây lan rất nhanh trong điều kiện ẩm ướt.',
N'Tỉa cành thông thoáng. Không để vườn ẩm quá. Bao trái khi quả còn nhỏ.',
N'Phun Azoxystrobin (Amistar), Difenoconazole (Score), Mancozeb khi cây ra hoa và trái non. Phun 3-4 lần cách nhau 7-10 ngày.'
),
(5,N'Bệnh phấn trắng',
N'Hoa và lá non có lớp phấn trắng bao phủ. Hoa không đậu quả, lá quăn.',
N'Nấm Oidium mangiferae. Phát triển mạnh khi thời tiết khô, ẩm, nhiệt độ 20-25°C.',
N'Tỉa cành thông thoáng. Phun phòng khi cây ra bông.',
N'Phun lưu huỳnh dạng bột (Sulflow) hoặc Hexaconazole (Anvil), Myclobutanil khi hoa vừa nhú.'
),
(5,N'Ruồi đục quả',
N'Quả non bị đục lỗ nhỏ, sau đó thối và rụng. Bên trong quả có dòi nhỏ màu trắng.',
N'Ruồi đục quả Bactrocera dorsalis, B. correcta đẻ trứng vào quả non.',
N'Bao trái bằng túi nylon hoặc túi foam khi quả còn nhỏ. Bẫy methyl eugenol để bẫy ruồi đực.',
N'Bao trái là biện pháp hiệu quả nhất. Phun Spinosad (Success), Naled nếu mật độ ruồi cao trước khi bao trái.'
),

-- === Sầu riêng (crop_id = 6) ===
(6,N'Bệnh xì mủ thân (Phytophthora)',
N'Thân cây chảy nhựa màu nâu vàng, vỏ cây ở gốc thối. Cây héo, úa vàng rồi chết.',
N'Nấm Phytophthora palmivora. Đất ẩm, ngập úng, rễ cây bị tổn thương.',
N'Trồng trên đất thoát nước tốt. Không vun đất cao quá cổ rễ. Không tưới quá nhiều.',
N'Cạo vỏ vết bệnh, phơi khô. Bôi Fosetyl-Al (Aliette) hoặc Metalaxyl (Ridomil) vào vết thương. Tưới Aliette 300g/100L vào đất quanh gốc. Lặp lại mỗi 2 tháng.'
),
(6,N'Sâu đục thân đục cành',
N'Cành sầu riêng héo đột ngột từng nhánh. Thân cây có lỗ đục kèm phân (mùn cưa).',
N'Xén tóc Batocera rufomaculata đẻ trứng vào nách cành. Sâu non đục vào thân.',
N'Bẫy ánh sáng bắt xén tóc trưởng thành. Quét vôi gốc cây ngăn đẻ trứng.',
N'Dùng xilanh bơm Chlorpyrifos (Dursban) hoặc Cypermethrin vào lỗ đục, bịt lại bằng đất sét. Cắt bỏ cành bị hại nặng và tiêu hủy.'
),
(6,N'Bệnh thối trái',
N'Quả sầu riêng trên cây có vết nâu đen, mùi hôi. Múi bên trong thối nâu.',
N'Nấm Phytophthora palmivora, Rhizopus stolonifer. Lây lan qua nước mưa, côn trùng.',
N'Bao trái bằng túi lưới hoặc túi foam. Phun phòng nấm định kỳ.',
N'Phun Fosetyl-Al (Aliette), Metalaxyl + Mancozeb (Ridomil Gold MZ) từ khi trái nhỏ đến trước thu hoạch 2 tuần.'
),

-- === Thanh long (crop_id = 7) ===
(7,N'Bệnh đốm nâu (đốm nâu thân cành)',
N'Cành thanh long có đốm tròn màu nâu vàng rồi lõm xuống, khô. Nhiều đốm liền nhau khiến cành thối.',
N'Nấm Neoscytalidium dimidiatum. Phát triển mạnh trong điều kiện nóng ẩm.',
N'Tỉa bỏ cành bệnh, vệ sinh vườn. Không tưới trên ngọn cây.',
N'Phun Hexaconazole (Anvil), Difenoconazole (Score), Copper hydroxide khi phát hiện bệnh. Phun 2-3 lần cách nhau 7 ngày.'
),
(7,N'Rệp sáp hại trái và cành',
N'Cành non và trái thanh long có lớp bột trắng (rệp sáp). Trái khi chín có vết nâu xấu, giảm giá trị.',
N'Rệp sáp Dysmicoccus neobrevipes. Phổ biến trong mùa khô, phát tán nhờ kiến và gió.',
N'Kiểm soát kiến trong vườn. Tỉa cành thông thoáng.',
N'Phun Imidacloprid (Confidor), dầu khoáng, Spirotetramat (Movento) khi mật độ rệp cao.'
),

-- === Hồ tiêu (crop_id = 8) ===
(8,N'Bệnh chết nhanh (Phytophthora)',
N'Tiêu chết đột ngột trong vài ngày. Lá héo nhưng còn xanh, rễ và gốc thân thối nâu.',
N'Nấm Phytophthora capsici. Lây lan rất nhanh qua nước mưa, dụng cụ canh tác, đất nhiễm bệnh.',
N'Không trồng lại trên đất đã nhiễm bệnh (cách ly 3-5 năm). Trồng trên đất thoát nước tốt. Dùng chế phẩm Trichoderma khi trồng mới.',
N'Tưới Fosetyl-Al (Aliette 80 WP) 300g/100L vào gốc khi phát hiện. Ridomil Gold 68 WP pha 30g/10L phun xung quanh gốc. Nhổ bỏ cây chết, rắc vôi bột vào hố.'
),
(8,N'Bệnh chết chậm (tuyến trùng)',
N'Tiêu sinh trưởng kém dần trong nhiều tháng, lá vàng, đốt ngắn. Đào rễ thấy nốt sần bất thường (u rễ).',
N'Tuyến trùng Meloidogyne incognita kết hợp với nấm Fusarium solani. Phổ biến trên đất cát, nhiễm tuyến trùng lâu năm.',
N'Bón nhiều phân hữu cơ hoai mục. Dùng chế phẩm sinh học Bacillus subtilis, Trichoderma khi trồng. Luân canh cây họ hòa thảo.',
N'Tưới Carbofuran (Furadan) hoặc Ethoprophos (Mocap) vào đất quanh gốc. Kết hợp phun Phosphorous acid (Agri-Fos) lên lá. Lặp lại 2-3 lần cách nhau 1 tháng.'
),
(8,N'Rệp sáp hại tiêu',
N'Hạt tiêu non teo lại không phát triển, chùm quả lưa thưa. Kiểm tra thấy rệp sáp trắng bám vào hạt và cành.',
N'Rệp sáp Ferrisia virgata. Mật độ tăng trong mùa khô, kiến phát tán rệp.',
N'Kiểm soát kiến trong vườn. Tỉa cành thông thoáng trong mùa khô.',
N'Phun Spirotetramat (Movento), dầu khoáng. Dùng bẫy dầu nhớt vòng quanh trụ tiêu diệt kiến vận chuyển rệp.'
),

-- === Điều (crop_id = 9) ===
(9,N'Bệnh thán thư hoa và quả non',
N'Hoa điều bị thối đen, quả non rụng hàng loạt trong mùa mưa. Vết bệnh nâu đen trên cuống hoa.',
N'Nấm Colletotrichum gloeosporioides. Phổ biến khi mưa nhiều trong mùa ra hoa (tháng 12 - tháng 2).',
N'Tỉa cành thông thoáng. Phun phòng đầu mùa hoa.',
N'Phun Copper oxychloride (COC 85), Azoxystrobin (Amistar), Propiconazole khi cây ra hoa. Phun 2-3 lần cách nhau 7-10 ngày.'
),
(9,N'Bọ xít muỗi (bọ vòi voi)',
N'Hoa và quả non héo và chết đột ngột. Thấy vết chích nhỏ màu nâu đen trên hoa, quả.',
N'Bọ xít Helopeltis antonii chích hút nhựa hoa và quả non.',
N'Vệ sinh vườn, cắt bỏ cành khô. Dùng bẫy dính màu vàng.',
N'Phun Imidacloprid (Confidor), Thiamethoxam (Actara), Chlorpyrifos vào buổi sáng sớm khi cây ra hoa.'
),

-- === Vải thiều (crop_id = 10) ===
(10,N'Bệnh thán thư vải',
N'Chùm hoa và quả non bị thối nâu, rụng hàng loạt. Quả chín có đốm nâu làm mất giá.',
N'Nấm Colletotrichum gloeosporioides. Phổ biến khi thời tiết ẩm, mưa nhiều.',
N'Tỉa cành thông thoáng. Phun phòng trước khi hoa nở.',
N'Phun Difenoconazole (Score), Trifloxystrobin + Propiconazole (Flint Plus) khi hoa nở và quả non. Phun 3-4 lần cách nhau 7 ngày.'
),
(10,N'Nhện lông nhung (bệnh chổi rồng vải)',
N'Đọt non, lá non có lớp lông trắng vàng, lá không mở được, xoắn teo lại trông như chổi.',
N'Nhện Eriophyes litchii (Acari). Phổ biến vào giai đoạn cây ra đọt mới.',
N'Phun thuốc phòng khi cây vừa nhú đọt mới.',
N'Phun Abamectin (Vibamec, Agrimec), dầu khoáng khi phát hiện nhện. Phun 2 lần cách nhau 5-7 ngày.'
),

-- === Bơ (crop_id = 15) ===
(15,N'Bệnh thối rễ, thối thân Phytophthora',
N'Lá vàng, cây còi cọc, cành khô chết dần từ trên xuống. Rễ và phần gốc thân có màu nâu đen, thối.',
N'Nấm Phytophthora cinnamomi. Cực kỳ nguy hiểm, đất thoát nước kém là nguyên nhân chính.',
N'Trồng trên đất đồi dốc, thoát nước tốt. Không trồng lại trên đất đã nhiễm bệnh.',
N'Phun/tưới Fosetyl-Al (Aliette), Metalaxyl + Mancozeb (Ridomil Gold MZ) định kỳ 3 tháng/lần phòng bệnh. Cạo vỏ bôi thuốc khi có vết thương.'
),
(15,N'Bệnh thán thư bơ',
N'Quả bơ có vết nâu đen, lõm dần. Khi chín quả bị thối bên trong dù vỏ ngoài chưa hỏng.',
N'Nấm Colletotrichum gloeosporioides. Nhiễm từ khi còn trên cây, triệu chứng biểu hiện sau thu hoạch.',
N'Phun phòng nấm định kỳ trong mùa mưa. Tránh tổn thương quả khi thu hoạch.',
N'Phun Azoxystrobin (Amistar), Difenoconazole (Score) khi quả đang phát triển. Sau thu hoạch nhúng quả vào nước nóng 50°C trong 10 phút kiểm soát bệnh tiềm ẩn.'
),

-- === Dưa hấu (crop_id = 12) ===
(12,N'Bệnh héo rũ dưa hấu (nấm Fusarium)',
N'Cây dưa héo đột ngột dù đủ nước. Cắt đôi gốc thấy vết nâu trong bó mạch dẫn. Cây chết trong 3-5 ngày.',
N'Nấm Fusarium oxysporum f.sp. niveum tồn tại lâu trong đất.',
N'Luân canh cây khác họ bầu bí ít nhất 3-4 năm. Dùng giống kháng. Bón vôi cải thiện pH đất.',
N'Hiện chưa có thuốc đặc trị hiệu quả. Phòng bệnh là chính: khử trùng đất bằng Dazomet (Basamid), tưới chế phẩm Trichoderma, bón vôi.'
),
(12,N'Bệnh đốm góc lá (vi khuẩn)',
N'Lá dưa có vết đốm góc cạnh (bị giới hạn bởi gân lá) màu nâu, xung quanh hơi vàng. Giọt dịch vi khuẩn vào buổi sáng.',
N'Vi khuẩn Acidovorax citrulli. Lây lan qua hạt giống, nước tưới, mưa bắn.',
N'Dùng hạt giống sạch bệnh. Tránh tưới phun trên lá. Luân canh.',
N'Phun Copper hydroxide (Champion), Kasugamycin (Kasumin) ngay khi phát hiện. Không để vườn quá ẩm.'
),

-- === Khoai lang (crop_id = 13) ===
(13,N'Bệnh ghẻ sần khoai lang',
N'Củ khoai lang có vết sần sùi, nứt, màu nâu xám bên ngoài. Chất lượng và giá trị thương phẩm giảm nhiều.',
N'Nấm Streptomyces ipomoeae. Phổ biến trên đất cát, pH kiềm hoặc thiếu bo.',
N'Bón vôi dolomite đúng liều (không quá nhiều). Dùng giống kháng. Luân canh với lúa.',
N'Bón lưu huỳnh dạng bột vào đất hạ thấp pH. Tưới chế phẩm Trichoderma. Không có thuốc đặc trị.'
),

-- === Mít Thái (crop_id = 14) ===
(14,N'Bệnh thối trái mít (Phytophthora)',
N'Trái mít non bị thối đen tại cuống hoặc đầu trái. Mủ chảy nhiều, mùi hôi. Trái rụng hàng loạt.',
N'Nấm Phytophthora palmivora. Phổ biến trong mùa mưa ẩm, lây qua nước mưa bắn từ đất.',
N'Tỉa cành thông thoáng. Vệ sinh vườn sạch lá rụng. Phun phòng trước mùa mưa.',
N'Phun Fosetyl-Al (Aliette), Metalaxyl + Mancozeb (Ridomil Gold) từ khi trái bằng nắm tay. Phun 2-3 lần cách nhau 10-14 ngày.'
)
GO


-- ============================================================
-- PHẦN 5 – TRIGGER TỰ ĐỘNG
-- ============================================================

CREATE OR ALTER TRIGGER trg_Product_Price_Change
ON [dbo].[Products]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF UPDATE([price])
    BEGIN
        INSERT INTO [dbo].[Product_Price_History]
            ([product_id], [old_price], [new_price], [change_reason])
        SELECT
            d.[id],
            d.[price]                  AS old_price,
            i.[price]                  AS new_price,
            N'Cập nhật giá tự động'    AS change_reason
        FROM deleted d
        JOIN inserted i ON d.[id] = i.[id]
        WHERE d.[price] <> i.[price];
    END
END
GO

CREATE OR ALTER TRIGGER trg_Products_UpdatedAt
ON [dbo].[Products]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Products]
    SET [updated_at] = GETDATE()
    WHERE [id] IN (SELECT [id] FROM inserted);
END
GO

CREATE OR ALTER TRIGGER trg_Users_UpdatedAt
ON [dbo].[Users]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Users]
    SET [updated_at] = GETDATE()
    WHERE [id] IN (SELECT [id] FROM inserted);
END
GO

CREATE OR ALTER TRIGGER trg_Orders_UpdatedAt
ON [dbo].[Orders]
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[Orders]
    SET [updated_at] = GETDATE()
    WHERE [id] IN (SELECT [id] FROM inserted);
END
GO


-- ============================================================
-- PHẦN 6 – VIEW HỖ TRỢ CHATBOT
-- ============================================================

-- ✅ v2.1: Thêm p.[rating] vào SELECT
CREATE OR ALTER VIEW [dbo].[vw_Active_Products]
AS
SELECT
    p.[id],
    p.[name],
    p.[category],
    p.[standard],
    p.[quantity],
    p.[unit],
    p.[price],
    p.[rating],                          -- ✅ MỚI v2.1
    p.[ai_suggested_price],
    p.[ai_marketing_content],
    p.[image_url],
    u.[name]             AS seller_name,
    u.[phone]            AS seller_phone,
    u.[cooperative_name] AS seller_cooperative,
    u.[address]          AS seller_address,
    mp.[region]          AS market_region,
    mp.[min_price]       AS market_min_price,
    mp.[max_price]       AS market_max_price
FROM [dbo].[Products] p
INNER JOIN [dbo].[Users]          u  ON p.[seller_id]       = u.[id]
LEFT  JOIN [dbo].[Market_Prices]  mp ON p.[market_price_id] = mp.[id]
WHERE p.[status] = 'active'
  AND p.[is_deleted] = 0
  AND u.[is_deleted] = 0
GO

CREATE OR ALTER VIEW [dbo].[vw_Market_Price_Summary]
AS
SELECT
    [product_name],
    [region],
    [standard],
    [min_price],
    [max_price],
    [unit],
    [update_date],
    CAST(([min_price] + [max_price]) / 2.0 AS DECIMAL(15,2)) AS avg_price
FROM [dbo].[Market_Prices]
GO

CREATE OR ALTER VIEW [dbo].[vw_Crop_Disease_Chat]
AS
SELECT
    ck.[crop_name],
    ck.[category],
    cd.[disease_name],
    cd.[symptoms],
    cd.[causes],
    cd.[prevention],
    cd.[treatment]
FROM [dbo].[Crop_Disease_Info] cd
INNER JOIN [dbo].[Crop_Knowledge] ck ON cd.[crop_id] = ck.[id]
GO


-- ============================================================
-- PHẦN 7 – KIỂM TRA DỮ LIỆU (Sanity Check)
-- ============================================================
/*
SELECT 'Users'                  AS [Table], COUNT(*) AS [Rows] FROM [dbo].[Users]
UNION ALL
SELECT 'Market_Prices',         COUNT(*) FROM [dbo].[Market_Prices]
UNION ALL
SELECT 'Products',              COUNT(*) FROM [dbo].[Products]
UNION ALL
SELECT 'Orders',                COUNT(*) FROM [dbo].[Orders]
UNION ALL
SELECT 'Order_Items',           COUNT(*) FROM [dbo].[Order_Items]
UNION ALL
SELECT 'Product_Price_History', COUNT(*) FROM [dbo].[Product_Price_History]
UNION ALL
SELECT 'Crop_Knowledge',        COUNT(*) FROM [dbo].[Crop_Knowledge]
UNION ALL
SELECT 'Crop_Disease_Info',     COUNT(*) FROM [dbo].[Crop_Disease_Info]

-- Kết quả mong đợi v2.1:
-- Users: 14 | Market_Prices: 50 | Products: 20 | Crop_Disease_Info: 30+
*/

USE [master]
GO
ALTER DATABASE [AgriEco_DB] SET READ_WRITE
GO


-- ============================================================
-- HƯỚNG DẪN SỬ DỤNG CHO CHATBOT (Python / pyodbc)
-- ============================================================
-- 1. Tra giá thị trường:
--    SELECT * FROM vw_Market_Price_Summary WHERE LOWER(product_name) LIKE N'%xoài%'
--
-- 2. Tìm sản phẩm (chatbot BUYER):
--    SELECT TOP 5 * FROM vw_Active_Products
--    WHERE LOWER(name) LIKE N'%xoài%' AND price <= 80000
--    ORDER BY rating DESC, price ASC
--
-- 3. Hỏi về bệnh cây (chatbot RAG):
--    SELECT * FROM vw_Crop_Disease_Chat WHERE crop_name = N'Lúa'
--
-- 4. Xem kiến thức chăm sóc:
--    SELECT care_tips, storage_tips FROM Crop_Knowledge WHERE crop_name = N'Sầu riêng'
--
-- 5. Đăng sản phẩm mới (chatbot SELLER):
--    INSERT INTO Products (seller_id, market_price_id, name, quantity, unit,
--                          price, ai_marketing_content, status, rating)
--    OUTPUT INSERTED.id
--    VALUES (@seller_id, @mp_id, @name, @qty, N'kg', @price, @desc, 'active', 0)
--
-- 6. Soft-delete user (KHÔNG xóa vật lý):
--    UPDATE Users SET is_deleted=1, updated_at=GETDATE() WHERE id = @user_id
--
-- 7. Lịch sử giá sản phẩm:
--    SELECT * FROM Product_Price_History WHERE product_id = @id ORDER BY changed_at DESC
-- ============================================================
