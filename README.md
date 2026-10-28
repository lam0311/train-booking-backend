# Train Booking Backend

Backend RESTful API cho hệ thống đặt vé tàu, được xây dựng bằng Node.js và Express. Dịch vụ này cung cấp nền tảng backend cho các quy trình đặt chỗ tàu, bao gồm định tuyến API, kết nối cơ sở dữ liệu, cấu hình liên quan đến xác thực và tài liệu API.

Dự án được tổ chức thành các module và thành phần dùng chung nhằm dễ bảo trì, tách biệt trách nhiệm và triển khai thuận tiện hơn với Docker.

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cấu hình](#cấu-hình)
- [Bắt đầu](#bắt-đầu)
- [Triển khai với Docker](#triển-khai-với-docker)
- [Tài liệu API](#tài-liệu-api)
- [Kiểm tra sức khỏe dịch vụ](#kiểm-tra-sức-khỏe-dịch-vụ)
- [Phát triển](#phát-triển)
- [Xử lý sự cố](#xử-lý-sự-cố)
- [Giấy phép](#giấy-phép)

---

## Tổng quan

Train Booking Backend là một dịch vụ RESTful API được thiết kế để hỗ trợ ứng dụng đặt vé tàu.

Backend đóng vai trò trung gian giữa client và các dịch vụ dữ liệu phía dưới. Nó nhận các HTTP request, xử lý logic nghiệp vụ, tương tác với cơ sở dữ liệu và trả về phản hồi có cấu trúc.

Dự án bao gồm:

- Một HTTP server dựa trên Express.
- Cấu trúc mã nguồn theo module.
- Kết nối MongoDB thông qua Mongoose.
- Cấu hình dựa trên biến môi trường.
- Tài liệu API thông qua Swagger/OpenAPI.
- Các endpoint health-check để giám sát dịch vụ.
- Hỗ trợ Docker để triển khai theo container.

> Lưu ý: Các chức năng nghiệp vụ và endpoint API cụ thể cần được đối chiếu với mã nguồn hiện tại và đặc tả API.

---

## Công nghệ sử dụng

| Công nghệ | Mục đích |
|---|---|
| Node.js | Môi trường chạy JavaScript cho backend |
| Express.js | HTTP server và định tuyến API |
| MongoDB | Cơ sở dữ liệu hướng tài liệu (document-oriented) |
| Mongoose | Mô hình hóa đối tượng cho MongoDB |
| JWT | Hỗ trợ xác thực dựa trên token |
| Redis / ioredis | Tích hợp Redis, nếu ứng dụng có sử dụng |
| Swagger / OpenAPI | Tài liệu API |
| Docker | Đóng gói ứng dụng bằng container |
| Docker Compose | Quản lý vòng đời container và cấu hình runtime |
| ESLint | Kiểm tra chất lượng mã nguồn |

---

## Kiến trúc hệ thống

Ứng dụng áp dụng mô hình **Hexagonal Architecture (Ports & Adapters)** kết hợp phân tách theo từng module nghiệp vụ. Logic cốt lõi (Domain) được giữ độc lập, không phụ thuộc vào framework Express hay cơ sở dữ liệu MongoDB.

### Các tầng xử lý chính trong mỗi module

- **Domain Layer**: Chứa thực thể và logic nghiệp vụ thuần túy (thuật toán Bitmask, kiểm tra xung đột chặng), hoàn toàn không phụ thuộc thư viện bên ngoài.
- **Application Layer**: Chứa các Use Case điều phối quy trình (tạo đặt vé, hủy vé, tra cứu tình trạng ghế).
- **Presentation Layer**: Express Controllers, Routers và Zod Schema để kiểm thực dữ liệu đầu vào.
- **Infrastructure Layer**: Triển khai các adapter giao tiếp ngoại vi (Mongoose ODM cho MongoDB, Redis client cho cache và lock phân tán).
- **Shared Components**: Cung cấp middleware bảo vệ (auth, rate limit, helmet, error handling) và các tiện ích dùng chung giữa các module.

### Vòng đời của một request

Một API request thông thường đi theo luồng sau:

1. Client gửi một HTTP request.
2. Express nhận request và áp dụng các middleware đã cấu hình.
3. Request được định tuyến đến API handler phù hợp.
4. Ứng dụng thực hiện xử lý cần thiết và các thao tác với cơ sở dữ liệu.
5. Backend trả về HTTP response cho client.

Các lớp xử lý cụ thể phụ thuộc vào cách triển khai của từng module.

---

## Cấu trúc dự án

```text
train-booking-backend/
├── src/
│   ├── config/          # Cấu hình ứng dụng và hạ tầng
│   ├── modules/         # Các module chức năng và nghiệp vụ
│   ├── public/          # Tài nguyên tĩnh do ứng dụng phục vụ
│   ├── shared/          # Các thành phần dùng chung
│   ├── app.js            # Cấu hình ứng dụng Express
│   └── server.js         # Điểm khởi chạy server
├── scripts/
│   └── seed.js           # Script nạp dữ liệu mẫu
├── documents/            # Tài liệu dự án
├── docker/               # Tài nguyên liên quan đến Docker
├── postman/              # Tài nguyên kiểm thử API
├── .env.example          # Ví dụ cấu hình môi trường
├── .dockerignore         # Các tệp bị loại khỏi Docker build context
├── .gitignore             # Quy tắc bỏ qua của Git
├── Dockerfile             # Định nghĩa Docker image
├── compose.yaml           # Cấu hình Docker Compose
├── package.json           # Dependencies và npm scripts
├── package-lock.json      # Phiên bản dependencies đã khóa
├── openapi.json           # Đặc tả OpenAPI dạng JSON
└── swagger.yaml           # Đặc tả Swagger/OpenAPI
```

Một số tệp, bao gồm cấu hình Docker, có thể khác nhau tùy theo nhánh hiện tại hoặc thiết lập triển khai.

---

## Cấu hình

Ứng dụng sử dụng biến môi trường để cấu hình runtime và các dịch vụ bên ngoài.

Tạo tệp `.env` cục bộ dựa trên `.env.example`:

```bash
cp .env.example .env
```

Trên Windows PowerShell, dùng:

```powershell
Copy-Item .env.example .env
```

Cấu hình các giá trị cần thiết trong `.env`:

```dotenv
PORT=5000
HOSTNAME=localhost

MONGODB_URL=your_mongodb_connection_string
DB_MAX_POOL=20
DB_MIN_POOL=2

JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

REDIS_URL=your_redis_connection_string
```

### Biến môi trường

| Biến | Mô tả |
|---|---|
| `PORT` | Cổng mà backend lắng nghe |
| `HOSTNAME` | Cấu hình hostname, nếu ứng dụng có sử dụng |
| `MONGODB_URL` | Chuỗi kết nối MongoDB |
| `DB_MAX_POOL` | Kích thước tối đa của connection pool cơ sở dữ liệu, nếu được cấu hình |
| `DB_MIN_POOL` | Kích thước tối thiểu của connection pool cơ sở dữ liệu, nếu được cấu hình |
| `JWT_ACCESS_SECRET` | Khóa bí mật dùng cho các thao tác với access token |
| `JWT_REFRESH_SECRET` | Khóa bí mật dùng cho các thao tác với refresh token |
| `JWT_ACCESS_EXPIRES` | Thời hạn của access token |
| `JWT_REFRESH_EXPIRES` | Thời hạn của refresh token |
| `REDIS_URL` | Chuỗi kết nối Redis, nếu Redis được bật |

Hãy sử dụng thông tin xác thực hợp lệ cho các dịch vụ mà ứng dụng yêu cầu. Cấu hình Redis chỉ cần thiết nếu triển khai hiện tại có khởi tạo và sử dụng Redis.

**Lưu ý về bảo mật:**

- Không bao giờ commit `.env` hoặc thông tin xác thực thật lên hệ thống quản lý phiên bản.
- Giữ `.env.example` không chứa bí mật thật.
- Sử dụng các JWT secret mạnh và được tạo độc lập.
- Cấu hình quyền truy cập mạng và thông tin xác thực của cơ sở dữ liệu một cách phù hợp.
- Cung cấp các secret production thông qua môi trường triển khai hoặc một trình quản lý secret (secrets manager).

---

## Bắt đầu

### Yêu cầu

Để phát triển cục bộ, hãy cài đặt:

- [Node.js](https://nodejs.org/)
- npm
- Một instance MongoDB, ví dụ [MongoDB Atlas](https://www.mongodb.com/atlas)
- Redis, nếu cấu hình ứng dụng hiện tại yêu cầu

### 1. Clone repository

```bash
git clone https://github.com/lam0311/train-booking-backend
cd train-booking-backend
```

### 2. Cài đặt dependencies

```bash
npm ci
```

### 3. Cấu hình biến môi trường

Tạo `.env` từ `.env.example` và cấu hình các chuỗi kết nối cũng như secret cần thiết.

### 4. Khởi động server phát triển

```bash
npm run dev
```

Script phát triển sử dụng Nodemon để tự động khởi động lại server khi tệp thay đổi.

### 5. Chạy server production ở máy cục bộ

```bash
npm start
```

Mặc định, ứng dụng sử dụng cổng `5000`, trừ khi được ghi đè bởi cấu hình môi trường.

---

## Triển khai với Docker

Docker cho phép chạy backend trong một môi trường nhất quán mà không cần cài Node.js trực tiếp trên máy triển khai.

### Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) hoặc Docker Engine
- Docker Compose
- Một tệp `.env` hợp lệ

### Pull và chạy từ DockerHub

Nếu bạn muốn chạy image dựng sẵn mà không cần build từ mã nguồn, hãy dùng các lệnh sau.

**Docker Image:** `thanhtran22096/train-booking-backend:1.0`

Pull image:

```bash
docker pull thanhtran22096/train-booking-backend:1.0
```

Tạo tệp `.env` chứa các biến môi trường cần thiết, sau đó chạy container:

```bash
docker run -d \
  --name train-booking-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env \
  YOUR_USERNAME/train-booking-backend:1.0
```

API sẽ khả dụng tại `http://localhost:5000`.

Xem log của container:

```bash
docker logs -f train-booking-backend
```

Dừng container:

```bash
docker stop train-booking-backend
```

Xóa container:

```bash
docker rm train-booking-backend
```

**Lưu ý:** Tệp `.env` phải chứa các giá trị cấu hình hợp lệ cho các dịch vụ bên ngoài cần thiết, chẳng hạn MongoDB.

### 1. Build và khởi động ứng dụng

Từ thư mục gốc của dự án, chạy:

```bash
docker compose up --build -d
```

Lệnh này build image nếu cần và khởi động các container đã cấu hình ở chế độ detached.

### 2. Kiểm tra trạng thái container

```bash
docker compose ps
```

### 3. Xem log ứng dụng

```bash
docker compose logs -f backend
```

Nhấn `Ctrl+C` để ngừng theo dõi log.

### 4. Dừng ứng dụng

```bash
docker compose down
```

### 5. Build lại sau khi thay đổi mã nguồn

```bash
docker compose up -d --build
```

### Ghi chú về cấu hình

- Container backend mặc định expose cổng `5000`.
- Tệp `.env` cung cấp các biến môi trường lúc runtime.
- MongoDB Atlas và dịch vụ Redis bên ngoài có thể nằm ngoài Docker.
- Đảm bảo `.env` không bị sao chép vào Docker image.
- Docker image của ứng dụng và cơ sở dữ liệu là các tài nguyên riêng biệt; việc build lại image không tự động cấp phát các dịch vụ cơ sở dữ liệu bên ngoài.

---

## Tài liệu API

Dự án có kèm tài liệu Swagger/OpenAPI.

Khi ứng dụng đang chạy cục bộ hoặc xem bản trực tuyến, hãy mở:

- **Swagger UI (Cục bộ):** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **Swagger UI (Trực tuyến):** [https://train-booking-backend-public.vercel.app/api-docs/](https://train-booking-backend-public.vercel.app/api-docs/)
- **Giao diện Demo Trực tuyến:** [https://train-booking-backend-public.vercel.app](https://train-booking-backend-public.vercel.app)
- **Tệp OpenAPI JSON:** `openapi.json`

Swagger UI cho phép lập trình viên xem các endpoint đã được tài liệu hóa, kiểm tra schema của request và response, và thử nghiệm các thao tác API được hỗ trợ.

Các endpoint khả dụng và yêu cầu xác thực được xác định bởi phần triển khai API hiện tại và đặc tả API.

### Các API Endpoint

API được tổ chức thành các nhóm chức năng sau:

| Nhóm | Endpoint | Method | Mô tả |
|---|---|---|---|
| **System** | `/health/live` | GET | Kiểm tra ứng dụng có đang chạy hay không |
| **System** | `/health/ready` | GET | Kiểm tra mức độ sẵn sàng của ứng dụng |
| **System** | `/openapi.json` | GET | Lấy đặc tả OpenAPI |
| **Authentication** | `/api/v1/auth/register` | POST | Đăng ký tài khoản mới |
| **Authentication** | `/api/v1/auth/login` | POST | Xác thực người dùng và cấp token |
| **Authentication** | `/api/v1/auth/refresh` | POST | Làm mới access token |
| **Authentication** | `/api/v1/auth/logout` | POST | Đăng xuất và xử lý thu hồi token theo cách triển khai |
| **Stations** | `/stations` | GET | Lấy thông tin ga và chỉ số (index) của ga |
| **Trips** | `/trips` | GET | Tìm kiếm chuyến tàu theo tuyến và ngày đi |
| **Trips** | `/trips/{tripId}/seats?from=&to=` | GET | Lấy tình trạng ghế trống cho một đoạn của chuyến |
| **Bookings** | `/bookings` | POST | Tạo đặt vé cho một đoạn của chuyến đã chọn |
| **Bookings** | `/bookings/me` | GET | Lấy danh sách đặt vé của người dùng đã xác thực |
| **Bookings** | `/bookings/{bookingId}` | GET | Lấy thông tin đặt vé theo ID, tùy thuộc vào quyền truy cập |
| **Bookings** | `/bookings/{bookingId}` | DELETE | Hủy đặt vé, tùy thuộc vào quyền truy cập |

Tham khảo Swagger UI để xem đầy đủ định nghĩa endpoint, tham số request, request body, schema response và yêu cầu xác thực.

### Quy trình đặt vé điển hình

Một quy trình đặt vé điển hình gồm các bước sau:

1. **Xác thực:** Gọi `POST /api/v1/auth/login` để nhận access token và refresh token.
2. **Tìm chuyến:** Gọi `GET /trips?from=&to=&date=` với các tham số tuyến và ngày đi cần thiết.
3. **Kiểm tra ghế trống:** Gọi `GET /trips/{tripId}/seats?from=&to=` để xem các ghế còn trống của đoạn đã chọn.
4. **Tạo đặt vé:** Gọi `POST /bookings` với thông tin đặt vé cần thiết và một access token hợp lệ.
5. **Quản lý đặt vé:** Dùng `GET /bookings/me` để xem các đặt vé của cá nhân, `GET /bookings/{bookingId}` để xem chi tiết một đặt vé, hoặc `DELETE /bookings/{bookingId}` để yêu cầu hủy.

### Đặt vé theo đoạn (Segment-Based Booking) & Thuật toán Bitmask

Hệ thống hỗ trợ đặt ghế cho một đoạn cụ thể của hành trình bằng giải thuật **Bitmask**, tối ưu hóa việc kiểm tra xung đột ghế với độ phức tạp $O(1)$.

Với tuyến tàu có 5 ga (chỉ số `0` đến `4`), hành trình được chia thành 4 đoạn tương ứng với một số nguyên 4-bit (`0` đến `15`):
- Đoạn 0 (Ga 0 → 1): Bit 0 (giá trị 1, `0001`)
- Đoạn 1 (Ga 1 → 2): Bit 1 (giá trị 2, `0010`)
- Đoạn 2 (Ga 2 → 3): Bit 2 (giá trị 4, `0100`)
- Đoạn 3 (Ga 3 → 4): Bit 3 (giá trị 8, `1000`)

Mỗi ghế lưu trạng thái qua trường `occupiedMask` (từ `0` - trống toàn bộ, đến `15` - kín toàn bộ chuyến).

**Các phép toán bitwise chính:**
- **Tạo mặt nạ yêu cầu (`segmentMask`):** Với hành trình từ `fromIndex` đến `toIndex`, mặt nạ chiếm chỗ được tính bằng:
  `segmentMask = ((1 << (toIndex - fromIndex)) - 1) << fromIndex;`
  Ví dụ: chặng `0 → 2` chiếm đoạn 0 và 1 (`0011` = 3); chặng `2 → 4` chiếm đoạn 2 và 3 (`1100` = 12).
- **Kiểm tra xung đột:** Thực hiện phép toán bitwise AND:
  `hasConflict = (occupiedMask & requestedMask) !== 0;`
  Nếu kết quả bằng `0`, hai đoạn không giao nhau, hệ thống cho phép khách đặt cùng ghế vật lý.
- **Cập nhật nguyên tử tại MongoDB:** Khi đặt vé, hệ thống dùng toán tử `$bitsAllClear: requestedMask` kết hợp `$bit: { occupiedMask: { or: requestedMask } }` để chống bán trùng ghế (race condition) trực tiếp ở cấp độ cơ sở dữ liệu.

---

## Kiểm tra sức khỏe dịch vụ

Ứng dụng cung cấp các endpoint health-check.

| Endpoint | Mục đích |
|---|---|
| `GET /health/live` | Kiểm tra ứng dụng có đang chạy hay không |
| `GET /health/ready` | Kiểm tra ứng dụng đã sẵn sàng hay chưa, bao gồm tình trạng sẵn sàng của cơ sở dữ liệu |

Ví dụ:

```bash
curl http://localhost:5000/health/live
```

Kiểm tra mức độ sẵn sàng của cơ sở dữ liệu:

```bash
curl http://localhost:5000/health/ready
```

Phản hồi liveness thành công không nhất thiết có nghĩa là mọi dependency bên ngoài đều khả dụng. Hãy dùng endpoint readiness để kiểm tra điều kiện sẵn sàng của ứng dụng.

---

## Phát triển

### Các npm script khả dụng

| Lệnh | Mô tả |
|---|---|
| `npm start` | Khởi động backend server |
| `npm run dev` | Khởi động server phát triển với Nodemon |
| `npm run seed` | Thực thi script nạp dữ liệu mẫu |
| `npm run lint` | Chạy các kiểm tra lint đã cấu hình |
| `npm run lint:fix` | Chạy tự động sửa lỗi lint, nếu cấu hình hiện tại hỗ trợ |

Xem `package.json` để biết chính xác các script và tùy chọn khả dụng trong phiên bản hiện tại.

### Nạp dữ liệu mẫu (Seeding)

Dự án có `scripts/seed.js` để nạp dữ liệu mẫu.

Trước khi chạy:

```bash
npm run seed
```

hãy xem lại script để hiểu nó kết nối tới cơ sở dữ liệu nào và nó tạo, cập nhật hay xóa dữ liệu. Luôn sử dụng đúng cơ sở dữ liệu phát triển khi thử nghiệm việc nạp dữ liệu.

### Quy trình làm việc với nhánh và đóng góp

Để phát triển cộng tác:

1. Tạo một nhánh tính năng (feature branch).
2. Thực hiện và kiểm thử các thay đổi.
3. Commit các thay đổi với thông điệp mô tả rõ ràng.
4. Push nhánh lên remote repository.
5. Mở pull request để review, nếu quy trình của nhóm yêu cầu.

Không commit secret, thông tin xác thực được tạo ra, hoặc các tệp `.env` cục bộ.

---

## Xử lý sự cố

### Lỗi kết nối MongoDB

Hãy kiểm tra rằng:

- `MONGODB_URL` hợp lệ.
- Thông tin xác thực cơ sở dữ liệu chính xác.
- Cơ sở dữ liệu cho phép kết nối từ môi trường triển khai.
- Dịch vụ cơ sở dữ liệu đang khả dụng.

### Container thoát ngay lập tức

Kiểm tra log:

```bash
docker compose logs backend
```

Tìm các lỗi như thiếu biến môi trường, kết nối cơ sở dữ liệu thất bại, thiếu tệp hoặc lỗi khởi động.

### Cổng đã được sử dụng

Nếu cổng `5000` đang bị chiếm, hãy đổi ánh xạ cổng phía host trong `compose.yaml`, ví dụ:

```yaml
ports:
  - "5001:5000"
```

Backend vẫn lắng nghe ở cổng `5000` bên trong container, trong khi client truy cập thông qua cổng `5001` trên host.

### Swagger UI không tải được

Xác minh rằng `swagger.yaml` có mặt tại đường dẫn mà ứng dụng mong đợi và server đã khởi động thành công.

---

## Giấy phép

Hãy bổ sung thông tin giấy phép phù hợp tại đây trước khi phân phối dự án công khai.
