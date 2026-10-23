# Tech Stack & Middleware

Tài liệu ghi lại các công cụ và middleware đang được tích hợp trong dự án.

---

## Middleware

### cors
- **Package**: `cors`
- **Mục đích**: Cho phép frontend ở domain khác gọi API (Cross-Origin Resource Sharing)
- **Dùng khi**: Browser chặn request từ `localhost:3000` đến `localhost:5000`
- **Config hiện tại**: Cho phép tất cả origin (mặc định)

```js
app.use(cors());
```

---

### helmet
- **Package**: `helmet`
- **Mục đích**: Tự động set các HTTP security headers, ẩn thông tin framework
- **Bảo vệ khỏi**: Clickjacking, MIME sniffing, thông lộ X-Powered-By
- **Config hiện tại**: Dùng mặc định (đủ cho hầu hết trường hợp)

```js
app.use(helmet());
```

Header tiêu biểu helmet thêm vào:
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=15552000
X-Powered-By: (đã xóa)
```

---

### compression
- **Package**: `compression`
- **Mục đích**: Nén response bằng gzip trước khi gửi về client, giảm băng thông
- **Hoạt động khi**: Response body > 1KB (threshold mặc định)
- **Config hiện tại**: Dùng mặc định

```js
app.use(compression());
```

Ví dụ:
```
Không nén: JSON 50KB → gửi 50KB
Có nén:    JSON 50KB → nén còn ~8KB → gửi 8KB
```

---

### express-rate-limit
- **Package**: `express-rate-limit`
- **Mục đích**: Giới hạn số request mỗi IP trong một khoảng thời gian, chống spam và brute force
- **Config hiện tại**: 300 request / 1 phút / IP

```js
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 phut
    max: 300,              // toi da 300 request
    standardHeaders: true,
    legacyHeaders: false
});
app.use(globalLimiter);
```

Khi vượt giới hạn → trả về `429 Too Many Requests`.

---

## Database

### mongoose
- **Package**: `mongoose`
- **Mục đích**: ODM (Object Document Mapper) để làm việc với MongoDB
- **Config hiện tại**:
  - `maxPoolSize: 30` — tối đa 30 connection đồng thời
  - `serverSelectionTimeoutMS: 30000` — chờ tối đa 30 giây khi kết nối
  - `tlsAllowInvalidCertificates: true` — bỏ qua lỗi TLS cert trên Windows (chỉ dùng khi dev)

---

## Auth

### bcryptjs
- **Package**: `bcryptjs`
- **Mục đích**: Hash password trước khi lưu vào DB, so sánh password khi login
- **Config hiện tại**: `rounds = 12` (càng cao càng an toàn, càng chậm)
- `rounds = 10` → ~100ms/hash | `rounds = 12` → ~400ms/hash

### jsonwebtoken
- **Package**: `jsonwebtoken`
- **Mục đích**: Tạo và xác thực JWT token cho việc xác thực người dùng
- **Config hiện tại**:
  - Access token: hết hạn sau `15m`
  - Refresh token: hết hạn sau `7d`

---

## tool SAST SEMGREP:
- Cài đặt: Mở terminal chạy câu lệnh: pip install semgrep
- Ta sử dụng trực tiếp bộ rules tiêu chuẩn của OWASP Top 10 từ Semgrep Registry: `semgrep scan --config p/owasp-top-ten src/`
- Đây là tool phân tích mã nguồn tĩnh (SAST) để đánh giá toàn diện độ bảo mật của hệ thống.
- Bộ rules chứa 560 rules tiêu chuẩn của cộng đồng. SEMGREP tự động lựa chọn 72 rules tương thích cho mã nguồn Node.js/JavaScript backend và kiểm tra toàn bộ 47 file.

## AUDIT:
- **Package**: `audit`
- **Mục đích**: Rà soát toàn bộ các gói runtime dependency
- Đảm bảo không sử dụng thư viện có lỗ hổng CVE
- npm audit --omit=dev