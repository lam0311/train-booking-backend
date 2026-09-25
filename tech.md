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
- **Config hiện tại**: 2000 request / 1 phút / IP (nâng lên để test tải không bị chặn nhầm)

```js
const globalLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 phut
    max: 2000,             // toi da 2000 request
    standardHeaders: true,
    legacyHeaders: false
});
app.use(globalLimiter);
```

Khi vượt giới hạn → trả về `429 Too Many Requests`.

---

## Architecture & Scalability

### Node.js Cluster
- **Module**: `node:cluster`, `node:os`
- **Mục đích**: Tận dụng tối đa đa nhân CPU của server bằng cách phân nhánh (fork) các worker process.
- **Entry point**: `src/cluster.js` (gọi qua script `npm start`)
- **Cơ chế**:
  - Primary process đếm số core (`os.cpus().length`) và khởi tạo tương ứng số worker process.
  - OS tự động phân phối (round-robin / load-balance) các kết nối mạng đến các worker.
  - Tự động hồi sinh (restart) worker mới nếu có worker bất kỳ bị crash (`cluster.on("exit")`).

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

## Sẽ tích hợp thêm

| Công cụ | Mục đích | Trạng thái |
|---|---|---|
| Node.js Cluster | Dùng nhiều CPU core, tăng throughput | Đã làm ✅ |
| In-memory cache | Cache GET seats, giảm query DB | Chưa làm |
