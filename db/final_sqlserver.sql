USE [master]
GO
/****** Object:  Database [AgriEco_DB]    Script Date: 3/27/2026 9:55:31 PM ******/
CREATE DATABASE [AgriEco_DB]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'AgriEco_DB', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\AgriEco_DB.mdf' , SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'AgriEco_DB_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\AgriEco_DB_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [AgriEco_DB] SET COMPATIBILITY_LEVEL = 160
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [AgriEco_DB].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [AgriEco_DB] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [AgriEco_DB] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [AgriEco_DB] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [AgriEco_DB] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [AgriEco_DB] SET ARITHABORT OFF 
GO
ALTER DATABASE [AgriEco_DB] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [AgriEco_DB] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [AgriEco_DB] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [AgriEco_DB] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [AgriEco_DB] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [AgriEco_DB] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [AgriEco_DB] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [AgriEco_DB] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [AgriEco_DB] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [AgriEco_DB] SET  ENABLE_BROKER 
GO
ALTER DATABASE [AgriEco_DB] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [AgriEco_DB] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [AgriEco_DB] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [AgriEco_DB] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [AgriEco_DB] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [AgriEco_DB] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [AgriEco_DB] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [AgriEco_DB] SET RECOVERY FULL 
GO
ALTER DATABASE [AgriEco_DB] SET  MULTI_USER 
GO
ALTER DATABASE [AgriEco_DB] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [AgriEco_DB] SET DB_CHAINING OFF 
GO
ALTER DATABASE [AgriEco_DB] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [AgriEco_DB] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [AgriEco_DB] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [AgriEco_DB] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
EXEC sys.sp_db_vardecimal_storage_format N'AgriEco_DB', N'ON'
GO
ALTER DATABASE [AgriEco_DB] SET QUERY_STORE = ON
GO
ALTER DATABASE [AgriEco_DB] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [AgriEco_DB]
GO
/****** Object:  Table [dbo].[Products]    Script Date: 3/27/2026 9:55:32 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Products](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[seller_id] [int] NOT NULL,
	[market_price_id] [int] NULL,
	[category] [nvarchar](100) NULL,
	[name] [nvarchar](255) NOT NULL,
	[standard] [nvarchar](100) NULL,
	[quantity] [decimal](10, 2) NULL,
	[unit] [nvarchar](50) NULL,
	[price] [decimal](15, 2) NOT NULL,
	[ai_suggested_price] [decimal](15, 2) NULL,
	[ai_marketing_content] [nvarchar](max) NULL,
	[image_url] [nvarchar](max) NULL,
	[status] [varchar](20) NULL,
	[rating] [decimal](2, 1) NULL,
	[is_deleted] [bit] NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Users]    Script Date: 3/27/2026 9:55:32 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Users](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [nvarchar](255) NOT NULL,
	[phone] [varchar](20) NOT NULL,
	[address] [nvarchar](max) NULL,
	[cooperative_name] [nvarchar](255) NULL,
	[role] [varchar](20) NOT NULL,
	[is_deleted] [bit] NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[vw_Active_Products]    Script Date: 3/27/2026 9:55:32 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- ==========================================
-- TẠO VIEW (Góc nhìn ảo tối ưu cho Web)
-- ==========================================
CREATE VIEW [dbo].[vw_Active_Products] AS
SELECT 
    p.id, p.name, p.category, p.price, p.rating, p.image_url, 
    u.name AS seller_name, u.cooperative_name
FROM Products p
INNER JOIN Users u ON p.seller_id = u.id
WHERE p.status = 'active' AND p.is_deleted = 0 AND u.is_deleted = 0;
GO
/****** Object:  Table [dbo].[Market_Prices]    Script Date: 3/27/2026 9:55:32 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Market_Prices](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[product_name] [nvarchar](255) NOT NULL,
	[standard] [nvarchar](100) NULL,
	[region] [nvarchar](100) NULL,
	[min_price] [decimal](15, 2) NULL,
	[max_price] [decimal](15, 2) NULL,
	[update_date] [date] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Order_Items]    Script Date: 3/27/2026 9:55:32 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Order_Items](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[order_id] [int] NOT NULL,
	[product_id] [int] NOT NULL,
	[quantity] [decimal](10, 2) NOT NULL,
	[price_at_time] [decimal](15, 2) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Orders]    Script Date: 3/27/2026 9:55:32 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Orders](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[buyer_id] [int] NOT NULL,
	[total_amount] [decimal](15, 2) NOT NULL,
	[shipping_address] [nvarchar](max) NOT NULL,
	[order_status] [varchar](20) NULL,
	[created_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Product_Price_History]    Script Date: 3/27/2026 9:55:32 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Product_Price_History](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[product_id] [int] NOT NULL,
	[old_price] [decimal](15, 2) NULL,
	[new_price] [decimal](15, 2) NOT NULL,
	[changed_at] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Products_Category_Price]    Script Date: 3/27/2026 9:55:32 PM ******/
CREATE NONCLUSTERED INDEX [IX_Products_Category_Price] ON [dbo].[Products]
(
	[category] ASC,
	[price] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Products_Name]    Script Date: 3/27/2026 9:55:32 PM ******/
CREATE NONCLUSTERED INDEX [IX_Products_Name] ON [dbo].[Products]
(
	[name] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__Users__B43B145F91F05BA6]    Script Date: 3/27/2026 9:55:32 PM ******/
ALTER TABLE [dbo].[Users] ADD UNIQUE NONCLUSTERED 
(
	[phone] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Market_Prices] ADD  DEFAULT (getdate()) FOR [update_date]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT ('pending') FOR [order_status]
GO
ALTER TABLE [dbo].[Orders] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[Product_Price_History] ADD  DEFAULT (getdate()) FOR [changed_at]
GO
ALTER TABLE [dbo].[Products] ADD  DEFAULT ('active') FOR [status]
GO
ALTER TABLE [dbo].[Products] ADD  DEFAULT ((0.0)) FOR [rating]
GO
ALTER TABLE [dbo].[Products] ADD  DEFAULT ((0)) FOR [is_deleted]
GO
ALTER TABLE [dbo].[Products] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT ('buyer') FOR [role]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT ((0)) FOR [is_deleted]
GO
ALTER TABLE [dbo].[Users] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[Order_Items]  WITH CHECK ADD FOREIGN KEY([order_id])
REFERENCES [dbo].[Orders] ([id])
GO
ALTER TABLE [dbo].[Order_Items]  WITH CHECK ADD FOREIGN KEY([product_id])
REFERENCES [dbo].[Products] ([id])
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD FOREIGN KEY([buyer_id])
REFERENCES [dbo].[Users] ([id])
GO
ALTER TABLE [dbo].[Product_Price_History]  WITH CHECK ADD FOREIGN KEY([product_id])
REFERENCES [dbo].[Products] ([id])
GO
ALTER TABLE [dbo].[Products]  WITH CHECK ADD FOREIGN KEY([market_price_id])
REFERENCES [dbo].[Market_Prices] ([id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Products]  WITH CHECK ADD FOREIGN KEY([seller_id])
REFERENCES [dbo].[Users] ([id])
GO
ALTER TABLE [dbo].[Orders]  WITH CHECK ADD CHECK  (([order_status]='canceled' OR [order_status]='completed' OR [order_status]='shipping' OR [order_status]='confirmed' OR [order_status]='pending'))
GO
ALTER TABLE [dbo].[Products]  WITH CHECK ADD CHECK  (([status]='hidden' OR [status]='active' OR [status]='pending'))
GO
ALTER TABLE [dbo].[Users]  WITH CHECK ADD CHECK  (([role]='admin' OR [role]='seller' OR [role]='buyer'))
GO
USE [master]
GO
ALTER DATABASE [AgriEco_DB] SET  READ_WRITE 
GO
