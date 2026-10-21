const crypto = require("node:crypto");
const AppError = require("../../../shared/domain/app-error");
const { buildSegmentMask } = require("../domain/segment-mask");
const { buildSegmentInfo } = require("../../trips/domain/trip-info");

class CreateBookingUsecase {
    constructor(seatInventoryRepository, tripRepository) {
        this.seatInventoryRepository = seatInventoryRepository;
        this.tripRepository = tripRepository;
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

        // Lấy thông tin chuyến tàu để enrich response
        const trip = await this.tripRepository.findByTripId(tripId);
        const segmentInfo = buildSegmentInfo(trip, fromIndex, toIndex);

        // trả về thông tin đặt vé
        return {
            bookingId,
            tripId,
            seatNumber,
            fromIndex,
            toIndex,
            segmentMask,
            from: segmentInfo.from,
            to: segmentInfo.to,
            status: "CONFIRMED"
        };
    };
};

module.exports = CreateBookingUsecase;
