# Hướng Dẫn Khởi Chạy Dự Án SkyBooking

Tài liệu này hướng dẫn bạn cách thiết lập và khởi chạy dự án Web Bán Vé Máy Bay (SkyBooking) từ đầu.

## 1. Yêu cầu hệ thống
Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:
- **Node.js** (Phiên bản 20 trở lên)
- **Docker & Docker Desktop** (Khuyên dùng để chạy Database nhanh chóng)
- **NPM** (Đi kèm với Node.js)

---

## 2. Các phương thức khởi chạy

### Cách 1: Sử dụng Docker (Nhanh nhất & Đơn giản nhất)
Cách này sẽ tự động cài đặt Database (PostgreSQL), Redis và Web Server trong các container riêng biệt.

1. Mở Terminal tại thư mục gốc của dự án.
2. Chạy lệnh sau để khởi động toàn bộ hệ thống:
   ```bash
   docker-compose up --build
   ```
3. Đợi khoảng 1-2 phút để các service khởi động hoàn tất.
4. Truy cập website tại: [http://localhost:3000](http://localhost:3000)

---

### Cách 2: Chạy trực tiếp bằng NPM (Dành cho Lập trình viên)
Nếu bạn muốn chỉnh sửa code và xem thay đổi ngay lập tức (Hot Reload).

**Bước 1: Cài đặt các thư viện phụ thuộc**
```bash
npm install
```

**Bước 2: Khởi động Database & Redis**
Bạn có thể dùng Docker để chỉ khởi chạy cơ sở dữ liệu và Redis:
```bash
docker-compose up -d db redis
```

**Bước 3: Thiết lập Cơ sở dữ liệu (Prisma)**
Đồng bộ cấu hình bảng và nạp dữ liệu mẫu (Sân bay, hãng bay, admin):
```bash
npx prisma db push
npx prisma db seed
```

**Bước 4: Khởi chạy ứng dụng**
```bash
npm run dev
```
Truy cập website tại: [http://localhost:3000](http://localhost:3000)

---

## 3. Dữ liệu thực tế (Tùy chọn)
Nếu bạn muốn có dữ liệu sân bay và hãng hàng không thực tế từ OpenFlights (hơn 10,000 sân bay và 60,000 tuyến bay):
1. Đảm bảo server/DB đang chạy.
2. Mở một terminal mới và chạy:
```bash
# Tải dữ liệu
npx tsx src/scripts/dataset-download.ts
# Import vào Database (có thể mất vài phút)
npx tsx src/scripts/dataset-import.ts
```

---

## 4. Thông tin tài khoản quản trị (Admin)
Sau khi chạy lệnh `seed`, hệ thống sẽ tạo sẵn một tài khoản quản trị tối cao:
- **Email:** `admin@skybooking.com`
- **Mật khẩu:** `password123`
- **Link đăng nhập Admin:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 5. Các tệp cấu hình quan trọng
- `.env`: Chứa các biến môi trường.
- `prisma/schema.prisma`: Định nghĩa cấu trúc cơ sở dữ liệu.
- `docker-compose.yml`: Cấu hình các dịch vụ Docker.

## 6. Xử lý lỗi thường gặp
- **Lỗi kết nối Database:** Kiểm tra xem Docker Desktop đã mở chưa.
- **Lỗi build Docker:** Nếu gặp lỗi khi build, hãy thử `docker-compose build --no-cache`.
- **Lỗi Node Version:** Đảm bảo dùng Node.js 20+.
