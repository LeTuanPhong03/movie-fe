# 🎬 CineViet — Frontend

Giao diện đặt vé cho Movie Reservation API (repo backend: folder `movie`, cạnh folder này). Next.js 16.4 (App Router, TypeScript) · Tailwind CSS 4 · TanStack Query 5 · sonner · lucide-react.

## Chạy local

```powershell
# 1. Backend (cổng 5161) — xem README của repo backend
cd D:\hoc\movie\src\MovieReservation.Api; dotnet run --launch-profile http

# 2. Frontend (cổng 3000 — đúng origin BE đã mở CORS ở appsettings.Development.json)
cd D:\hoc\movie-fe
npm install
npm run dev

# Unit test (Vitest)
npm test
```

Mở http://localhost:3000. Đăng nhập nhanh bằng nút **"Dùng tài khoản khách demo"** (`demo@movie.local` / `Demo@12345`).
Admin: `admin@movie.local` + mật khẩu bạn đặt bằng `dotnet user-secrets set "Admin:Password"`.

Biến môi trường (`.env.development`, bản mẫu ở `.env.example`):

| Biến | Ý nghĩa |
|---|---|
| `API_URL` | địa chỉ backend — server Next chuyển tiếp `/api/*` sang đây (`next.config.ts` rewrites). Tính **lúc build** → trên host deploy đặt trước khi build |
| `NEXT_PUBLIC_ALLOW_MANUAL_CONFIRM` | `true` → hiện nút "Thanh toán thử" (gọi `POST /confirm`, BE chỉ bật ở Development) |

## Trang

| Đường dẫn | Nội dung | API |
|---|---|---|
| `/` | banner phim, phim đang chiếu, suất hôm nay | `GET /movies`, `GET /showtimes?date=` |
| `/movies`, `/movies/[id]` | danh sách (tìm, lọc thể loại), chi tiết + lịch 7 ngày | `GET /movies[/{id}]`, `GET /showtimes?date=` |
| `/showtimes` | lịch chiếu theo ngày, gom theo phim | `GET /showtimes?date=` |
| `/booking/[showtimeId]` | sơ đồ ghế, tự làm mới 10 giây/lần, tối đa 8 ghế | `GET /showtimes/{id}[/seats]`, `POST /reservations` |
| `/checkout/[id]` | đếm ngược giữ ghế, thanh toán VNPay / thử, huỷ | `GET /reservations/{id}`, `POST …/payments`, `…/confirm`, `…/cancel` |
| `/payment/vnpay-return` | trang VNPay chuyển về → chuyển query sang BE kiểm chữ ký | `GET /payments/vnpay/return` |
| `/tickets`, `/tickets/[id]` | lịch sử đơn (lọc trạng thái, phân trang), vé chi tiết | `GET /reservations[/{id}]` |
| `/login`, `/register` | | `POST /auth/login`, `/auth/register` |
| `/admin/*` | doanh thu, phim, suất chiếu, phòng chiếu | `GET /reports/revenue`, CRUD `/movies`, `POST /showtimes`, `POST /theaters` |

## Quyết định chính

- **Access token trong RAM, refresh token trong cookie `HttpOnly`** (`lib/api.ts`, `lib/auth-store.ts`): JS (kể cả script XSS) không đọc được refresh token. F5 mất access token → gọi `/api/auth/refresh` lúc mở trang (`startSessionSync`). localStorage chỉ còn cờ `movie.loggedIn` (không bí mật) để khách khỏi gọi refresh vô ích và để đồng bộ đăng nhập/đăng xuất giữa các tab. Lý do đầy đủ: `docs/decisions.md` mục 10 của repo BE.
- **Gọi API qua proxy cùng domain** (`rewrites` trong `next.config.ts`): trình duyệt chỉ thấy domain FE → cookie là first-party, không bị chặn như cookie bên thứ ba khi FE và BE khác domain.
- **Refresh token chỉ gọi một lần tại một thời điểm**: BE dùng rotation (mỗi refresh token dùng 1 lần) → nhiều request cùng 401 phải chờ chung một promise; giữa các tab (chung cookie) xếp hàng bằng Web Locks API (`navigator.locks`), không thì người dùng bị đăng xuất oan.
- **Nối suất / đơn ↔ phim bằng `movieId`**, không bằng tên: tên phim được phép trùng (bản gốc / bản làm lại).
- **Giờ luôn hiển thị theo giờ VN** (`lib/format.ts`) dù máy đặt múi giờ nào; gửi lên BE luôn là UTC có `Z`.
- **Bảo vệ trang ở FE chỉ để trải nghiệm**; quyền thật do BE kiểm (401/403/404).
- `cacheComponents` (mặc định Next 16) prerender cả client component → mọi chỗ đọc URL / giờ hiện tại / phiên nằm trong `<Suspense>` hoặc chỉ chạy sau khi mount (`useNow`, `useSession`, `useAuthReady`).

## Hạn chế do API hiện tại

- Không có API liệt kê phòng chiếu → form tạo suất nhập `TheaterId`, gợi ý phòng demo + phòng đã tạo ở trình duyệt này.
- Mã vạch trên vé chỉ để trang trí (BE chưa có API soát vé).
