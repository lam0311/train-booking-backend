const crypto = require("node:crypto");
const AppError = require("../domain/app-error");
const { buildSegmentMask } = require("../domain/segment-mask");

class CreateBookingUsecase {
    constructor(seatInventoryRepository) {
        this.seatInventoryRepository = seatInventoryRepository;
    }

    execute = async ({ tripId, seatNumber, fromIndex, toIndex, userId }) => {
        const segmentMask = buildSegmentMask(fromIndex, toIndex);

        // tạo mội mã vé random
        const bookingId = crypto.randomUUID();

        const allocation = {
            bookingId,
            userId: userId || "guest-user",
            fromIndex,
            toIndex,
            segmentMask,
            createdAt: new Date()
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
        return {
            bookingId,
            tripId,
            seatNumber,
            fromIndex,
            toIndex,
            segmentMask,
            status: "CONFIRMED"
        };
    };
};

module.exports = CreateBookingUsecase;
