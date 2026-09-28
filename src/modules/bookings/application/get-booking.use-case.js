const AppError = require("../../../shared/domain/app-error");

class GetBookingUseCase {
    constructor(seatInventoryRepository) {
        this.seatInventoryRepository = seatInventoryRepository;
    }

    execute = async ({ bookingId, userId }) => {
        const seat = await this.seatInventoryRepository.findSeatByBookingId({ bookingId, userId });
        if (!seat) {
            throw new AppError(
                "NOT_FOUND", "Vé không tồn tại hoặc bạn không có quyền xem vé này!", 404
            );
        }

        const allocation = seat.allocations.find(
            (item) => item.bookingId === bookingId && item.userId === userId
        );

        if (!allocation) {
            throw new AppError("NOT_FOUND", "Không tìm thấy thông tin vé!", 404);
        }

        return {
            bookingId: allocation.bookingId,
            tripId: seat.tripId,
            seatNumber: seat.seatNumber,
            fromIndex: allocation.fromIndex,
            toIndex: allocation.toIndex,
            segmentMask: allocation.segmentMask,
            createdAt: allocation.createdAt
        };

    };
}


module.exports = GetBookingUseCase;
