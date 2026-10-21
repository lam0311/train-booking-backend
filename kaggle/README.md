# Hướng dẫn Benchmark - Train Booking Backend

## Mục đích
Script benchmark dùng để đo hiệu năng server, tìm breaking point (điểm gãy) khi tăng dần số concurrent users.  
Nhóm sau khi nâng cấp dự án chỉ cần chạy lại script này → so sánh kết quả với bảng Phase 1 Baseline.

## Cách chạy trên Kaggle

### Bước 1: Tạo notebook
- Vào Kaggle -> New Notebook
- Accelerator: None (CPU)

### Bước 2: Copy code
- Copy toàn bộ nội dung file `benchmark.py` vào 1 cell của notebook

### Bước 3: Cấu hình 
Chỉ cần sửa 2 dòng đầu:
```python
BASE_URL    = "https://train-booking-backend-3ri7.onrender.com"  # URL server
COMMIT_HASH = "de4ef84"   # commit hash hiện tại
```

### Bước 4: Chạy
Bấm Run -> chờ.

## Giải thích các phase

| Phase | Tên | Mô tả |
|-------|-----|--------|
| 0 | Wake Up | Đánh thức server Render |
| 1 | Warm Up | Gửi request nhẹ 20 giây để khởi động connection pool |
| 2 | Step Load Test | Tăng dần concurrent users (50 → 3000), mỗi bậc gửi 4000 requests |

## Giải thích các metric

| Metric | Ý nghĩa |
|--------|---------|
| req/s (throughput) | Số request server xử lý được mỗi giây |
| p50 | 50% request có latency ≤ giá trị này (median) |
| p95 | 95% request có latency ≤ giá trị này |
| p99 | 99% request có latency ≤ giá trị này |
| max | Latency cao nhất |
| err% | Tỷ lệ request thất bại (không trả về 2xx) |

## Tiêu chí đánh giá Breaking Point

Server bị coi là "gãy" khi 1 trong 2 điều kiện xảy ra:
- `error_pct > 5%` — Quá nhiều request thất bại
- `p99 > 5000ms` — Response quá chậm

## Test thêm POST /bookings

Mặc định script chỉ test GET /seats.  
Muốn test cả POST /bookings (đặt vé, ghi DB):

```python
TEST_ALL_ENDPOINTS = True   # Đổi từ False → True
```

Script sẽ tự tạo tài khoản test, đăng nhập lấy token, rồi benchmark POST.