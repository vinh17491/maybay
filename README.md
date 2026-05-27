# SkyBook - Hệ thống Đặt vé Máy bay

Dự án này là một ứng dụng web hiện đại được xây dựng bằng Next.js, cung cấp các tính năng tìm kiếm chuyến bay, đặt vé và quản lý chuyên nghiệp.

## 🚀 Hướng dẫn triển khai lên Vercel (Chi tiết)

Để triển khai thành công hệ thống SkyBook lên Vercel, hãy thực hiện theo 5 bước sau:

### Bước 1: Chuẩn bị Cơ sở dữ liệu & Cache
Dự án yêu cầu PostgreSQL và Redis để hoạt động ổn định.
1.  **Database (PostgreSQL):** Khuyên dùng [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) hoặc [Neon.tech](https://neon.tech/).
    *   Tạo một dự án database mới và sao chép chuỗi kết nối `DATABASE_URL`.
2.  **Cache (Redis):** Khuyên dùng [Upstash Redis](https://upstash.com/) (tối ưu cho Serverless).
    *   Tạo một Redis database mới và lấy chuỗi kết nối `REDIS_URL`.

### Bước 2: Cập nhật mã nguồn
Đảm bảo bạn đã đẩy các thay đổi mới nhất lên GitHub:
```bash
git add .
git commit -m "feat: prepare for vercel deployment"
git push origin main
```

### Bước 3: Cấu hình trên Vercel Dashboard
1.  Truy cập [Vercel Dashboard](https://vercel.com/new) và chọn repository `maybay`.
2.  **Cấu hình Environment Variables:** Thêm các biến sau vào mục **Settings > Environment Variables**:

| Biến môi trường | Ghi chú |
| :--- | :--- |
| `DATABASE_URL` | Lấy từ Bước 1 (Postgres) |
| `REDIS_URL` | Lấy từ Bước 1 (Upstash) |
| `NEXTAUTH_SECRET` | Chuỗi ngẫu nhiên (Tạo bằng: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |
| `STRIPE_SECRET_KEY` | Lấy từ Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Lấy sau khi tạo Webhook trên Stripe |
| `AMADEUS_CLIENT_ID` | API Key từ Amadeus Dashboard |
| `AMADEUS_CLIENT_SECRET` | API Secret từ Amadeus Dashboard |

3.  Nhấn nút **Deploy** và đợi quá trình hoàn tất.

### Bước 4: Khởi tạo dữ liệu (Database Migration)
Sau khi Deploy xong lần đầu, bạn cần khởi tạo cấu trúc bảng:
1.  Tại máy local (đã cấu hình `DATABASE_URL` tới database production):
```bash
npx prisma db push
npx prisma db seed
```

### Bước 5: Cấu hình Stripe Webhook
Truy cập Stripe Dashboard, tạo một Webhook mới trỏ về:
`https://your-domain.vercel.app/api/webhooks/stripe`
Chọn sự kiện: `checkout.session.completed`.

---

## 🛠 Công nghệ sử dụng
- **Framework:** Next.js 15 (App Router)
- **Database:** Prisma ORM with PostgreSQL
- **State Management:** tRPC & React Query
- **Styling:** Tailwind CSS & Shadcn/UI
- **Payment:** Stripe API
- **Caching:** Redis

---

## 📋 Báo cáo Audit Hệ thống (Cập nhật 27/05/2026)
Hệ thống đã được quét và khắc phục các lỗi nghiêm trọng về luồng thanh toán và dữ liệu. Hiện đang ở trạng thái ổn định cơ bản.

*Note: Tài liệu được cập nhật tự động bởi Senior AI Engineer.*
