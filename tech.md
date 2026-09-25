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
- **Module**: `node:cluster`, `node:os` (Built-in Node.js module, không cần cài thêm thư viện ngoài).
- **Mục đích**: Giải quyết điểm nghẽn Single-Thread của Node.js, tận dụng triệt để kiến trúc CPU đa nhân của máy chủ để nhân rộng khả năng xử lý song song.
- **Entry point**: `src/cluster.js` (kích hoạt qua `npm start`).

#### Cơ chế hoạt động:
1. **Primary Process (Master)**:
   - Đóng vai trò điều phối, gọi `os.cpus().length` để xác định số lượng CPU cores khả dụng trên hệ thống.
   - Sử dụng `cluster.fork()` để nhân bản tương ứng bấy nhiêu tiến trình con (**Worker Processes**).
   - Lắng nghe sự kiện `cluster.on('exit')`: Nếu một worker bất kỳ gặp sự cố và crash, Primary sẽ tự động fork ngay một worker mới để thế chỗ (**Self-healing / Zero downtime**).
2. **Worker Processes (Con)**:
   - Mỗi worker lắng nghe cùng một cổng mạng (Port) và chia sẻ socket server mà không xung đột port nhờ cơ chế phân bổ kết nối Round-Robin của Master/OS.
   - Chạy độc lập mã nguồn ứng dụng `server.js`.

#### Code triển khai (`src/cluster.js`):
```js
const cluster = require("node:cluster");
const os = require("node:os");

if (cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    console.log(`Primary ${process.pid} is running. Forking ${numCPUs} workers...`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Forking replacement...`);
        cluster.fork();
    });
} else {
    require("./server.js");
}
```

#### Kết quả đánh giá hiệu năng thực tế (Kaggle Benchmark):
- **Trước khi Cluster** (Single Process):
  - Tải 100 users: ~55 req/s
  - Tải 300 users: ~69 req/s (Throughput chạm trần)
- **Sau khi Cluster** (Multi-worker Process):
  - Tải 100 users: **73 req/s** (+33%)
  - Tải 300 users: **109 req/s** (+58%)
  - Tải 1,000 users: **225 req/s** (0.0% error)
  - Tải 2,000 users: **244 req/s** (0.0% error, Throughput đỉnh tăng gấp **3.5 lần**)

#### Lưu ý khi sử dụng:
- Các worker hoạt động trên các vùng nhớ (Memory Space) riêng biệt, không chia sẻ biến toàn cục. Do đó, các tác vụ như Session, In-memory Cache, hoặc Rate-limiter bộ nhớ cục bộ cần chú ý tính phân tán nếu scale lớn hơn.

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
