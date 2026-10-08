# Tổng quan về đề tài
- Tên: Hệ thống đặt vé tàu hỏa trực tuyến.
- Mục tiêu: 
  + Quản lý đặt ghế tàu chạy theo tuyến gồm nhiều chặng liên tiếp.
  + Giải quyết bài toán tranh chấp ghế ngồi khi 2 người cùng đặt chung ghế cùng lúc.
  + Tối ưu hóa việc bán ghế theo từng phân đoạn hành trình để tối đa hóa tỷ lệ lấp đầy ghế. 

# Bối cảnh và bài toán nghiệp vụ

## Bối cảnh và bài toán:
- Một đoàn tàu chạy qua nhiều ga:
  Ga 0: Hà Nội -> Ga 1: Nam Định -> Ga 2: Vinh -> Ga 3: Huế -> Ga 4: Đà Nẵng

- Quy tắc nghiệp vụ: Ghế số n không bị chiếm trọn vẹn cả chuyến nếu khách chỉ đi 1 chặng ngắn.
  + Khách hàng A đi từ ga 0 -> ga 2.
  + Ghế số n từ ga 2 -> ga 4 vẫn hoàn toàn trống và hệ thống phải cho phép khách hàng B mua tiếp chặng này trên cùng một ghế số n.
  + Nhưng nếu khách C muốn mua từ ga 1 -> ga 3 trên ghế số 5 thì hệ thống sẽ phải từ chối vì bị xung đột với khách A ở chặng 0 -> 2 (trùng chặng ga 1 -> ga 2).

## Khó khăn:
- Kiểm tra ghế và đặt chỗ theo chặng: Cần cấu trúc dữ liệu nhỏ gọn, kiểm tra trùng lặp nhanh O(1).
- Chống bán trùng vé: Hai người cùng bấm mua 1 ghế cùng thời điểm thì chỉ 1 người thành công.
- Tính Idempotency (tính bất biến): Mạng lag, người dùng bấm nút đặt vé nhiều lần thì không được tạo 2 vé hoặc trừ tiền 2 lần.

# Giải thuật: BITMASK

## Quy ước Bitmask trong dự án:
- Hành trình gồm N = 4 chặng, tương ứng với 4 bit nhị phân:
  + Chặng 0 (Ga 0 -> 1): Bit 0 (giá trị 1, nhị phân: 0001)
  + Chặng 1 (Ga 1 -> 2): Bit 1 (giá trị 2, nhị phân: 0010)
  + Chặng 2 (Ga 2 -> 3): Bit 2 (giá trị 4, nhị phân: 0100)
  + Chặng 3 (Ga 3 -> 4): Bit 3 (giá trị 8, nhị phân: 1000)
  + Trạng thái ghế trống hoàn toàn: 0 (nhị phân: 0000)
  + Trạng thái ghế kín toàn bộ chuyến: 15 (nhị phân: 1111)

## Công thức toán học và thao tác bitwise:
- Tạo mặt nạ chặng đặt (buildSegmentMask):
  + segmentCount = toIndex - fromIndex
  + segmentMask = ((1 << segmentCount) - 1) << fromIndex
  + Ví dụ: Đi từ Ga 0 -> Ga 2 thì segmentCount = 2, segmentMask = 3 (nhị phân 0011, chiếm chặng 0 và 1).

- Kiểm tra xung đột chặng (hasConflict):
  + Phép tính: (occupiedMask & requestedMask) !== 0
  + Nếu khác 0: Trùng chặng, báo lỗi và từ chối đặt vé.
  + Nếu bằng 0: Chặng còn trống, cho phép đặt vé.
  + Ví dụ: Ghế đang có khách đi chặng 0 -> 2 (occupiedMask = 3 tức 0011).
    Khách B đặt chặng 2 -> 4 (requestedMask = 12 tức 1100): 0011 & 1100 = 0 -> Đặt thành công.
    Khách C đặt chặng 1 -> 3 (requestedMask = 6 tức 0110): 0011 & 0110 = 2 (khác 0) -> Báo lỗi trùng ghế.

- Nhả ghế khi hủy vé (buildClearMask):
  + clearMask = 15 ^ segmentMask (dùng phép XOR để đảo bit)
  + Cập nhật lại ghế: occupiedMask = occupiedMask & clearMask

# Mô hình kiến trúc (Hexagonal Architecture)
Dự án chia làm 4 tầng rõ ràng để dễ bảo trì và kiểm thử:
- Domain: Chứa thuật toán tính bitmask (segment-mask.js), không dính gì tới Express hay MongoDB.
- Application: Chứa các use case xử lý nghiệp vụ cụ thể (đặt vé, hủy vé, tra cứu ghế, đăng nhập...).
- Presentation: Chứa Controller và Route của Express để nhận request từ client, kiểm tra dữ liệu và trả về JSON.
- Infrastructure: Chứa các phần kết nối ra ngoài như Mongoose (MongoDB), Redis, JWT.
- Tác dụng: Tách biệt nghiệp vụ khỏi công nghệ. Sau này có đổi database hoặc framework khác thì chỉ cần sửa tầng Infrastructure hoặc Presentation, toàn bộ logic cốt lõi bên trong giữ nguyên.

# Thiết kế Database (MongoDB)
- Bảng User:
  + email: Email người dùng (unique, lowercase).
  + password: Mật khẩu đã hash bằng bcrypt (12 rounds).
  + refreshToken: Dùng để duy trì phiên đăng nhập.

- Bảng SeatInventory (Kho ghế):
  + tripId: Mã chuyến tàu (ví dụ: SE1-2026).
  + seatNumber: Số ghế (từ 1 đến 40).
  + occupiedMask: Số nguyên từ 0 đến 15 thể hiện chặng đã có người ngồi.
  + allocations: Mảng lưu danh sách vé đã đặt trên ghế này (mỗi vé gồm bookingId, userId, fromIndex, toIndex, segmentMask, requestId, fingerprint).
  + Index: Đặt unique index trên cặp (tripId, seatNumber) để không bao giờ bị trùng lặp số ghế.

# Các chức năng chính (Nghiệp vụ)

## 1. Xác thực (Auth)
- Đăng ký: Nhận email và password, kiểm tra email chưa tồn tại, hash password rồi lưu vào DB.
- Đăng nhập: So khớp mật khẩu, cấp cặp token:
  + accessToken: Sống 15 phút, dùng để gọi các API cần đăng nhập.
  + refreshToken: Sống 7 ngày, lưu vào DB để cấp lại accessToken khi hết hạn.
- Đăng xuất: Xóa refreshToken trong DB của user.

## 2. Tra cứu ghế theo chặng (GET /api/v1/trips/:tripId/seats)
- Nhận ga đi (from) và ga đến (to).
- Dùng phép toán AND bitwise (&) để kiểm tra từng ghế xem chặng đó còn trống không.
- Sử dụng Cache 2 tầng (RAM 2 giây + Redis 60 giây) để khách xem không phải query DB liên tục.

## 3. Đặt vé (POST /api/v1/bookings)
- Yêu cầu người dùng phải đăng nhập (Bearer Token).
- Chống bấm lặp do lag mạng (Idempotency): Khách gửi kèm Idempotency-Key. Nếu bấm 2 lần do mạng chậm thì hệ thống trả lại kết quả vé cũ, không tạo vé mới.
- Chống bán trùng ghế (Race Condition): Dùng cập nhật nguyên tử trên MongoDB (findOneAndUpdate với $bitsAllClear). Nếu nhiều người cùng bấm mua 1 ghế cùng lúc, chỉ người đến trước đổi được bit của ghế, người đến sau sẽ bị từ chối ngay lập tức (lỗi 409 SEGMENT_CONFLICT).

## 4. Xem chi tiết vé và Hủy vé
- Xem vé (GET /api/v1/bookings/:bookingId): Chỉ chính chủ sở hữu vé mới xem được thông tin vé của mình.
- Hủy vé (DELETE /api/v1/bookings/:bookingId): Xóa vé khỏi mảng allocations và dùng phép AND với clearMask để nhả các bit chặng tương ứng về 0 cho người khác mua tiếp.
