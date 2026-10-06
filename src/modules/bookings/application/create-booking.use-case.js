const crypto = require("node:crypto");
const AppError = require("../../../shared/domain/app-error");
const { buildSegmentMask } = require("../domain/segment-mask");

class CreateBookingUsecase {
    constructor(seatInventoryRepository) {
        this.seatInventoryRepository = seatInventoryRepository;
    }

    execute = async ({ tripId, seatNumber, fromIndex, toIndex, userId, idempotencyKey }) => {

        const fingerprint = crypto.createHash("sha256")
            .update(JSON.stringify({ tripId, seatNumber, fromIndex, toIndex }))
            .digest("hex");

        let requestId;

        if (idempotencyKey) {
            requestId = crypto.createHash("sha256")
                .update(JSON.stringify({ userId, idempotencyKey }))
                .digest("hex");

            const previous = await this.seatInventoryRepository.findByRequestId(requestId);

            if (previous) {
                // Nếu cùng key nhưng đổi thông tin đặt vé thì chặn ngay lập tức
                if (previous.fingerprint !== fingerprint) {
                    throw new AppError(
                        "IDEMPOTENCY_CONFLICT",
                        "Idempotency-Key này đã được dùng cho một thông tin đặt vé khác!",
                        409
                    );
                }

                return {
                    booking: previous,
                    replayed: true
                };
            }
        }

        const segmentMask = buildSegmentMask(fromIndex, toIndex);

        // tạo mội mã vé random
        const bookingId = crypto.randomUUID();

        const allocation = {
            bookingId,
            userId: userId || "guest-user",
            fromIndex,
            toIndex,
            segmentMask,
            createdAt: new Date(),
            requestId: requestId || null,
            fingerprint
        };

        const updateSeat = await this.seatInventoryRepository.allocate({
            tripId,
            seatNumber,
            allocation
        });

        if (!updateSeat) {
            throw new AppError(
                "SEGMENT_CONFLICT",
                `Ghế số ${seatNumber} đã có người đặt ở chặng này hoặc không tồn tại!`,
                409
            );
        }

        // trả về thông tin đặt vé 
        const newBooking = {
            bookingId,
            tripId,
            seatNumber,
            fromIndex,
            toIndex,
            segmentMask,
            status: "CONFIRMED"
        };

        return {
            booking: newBooking,
            replayed: false
        };
    };
};

module.exports = CreateBookingUsecase;
