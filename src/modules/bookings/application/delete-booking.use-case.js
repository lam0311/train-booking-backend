const { buildClearMask } = require("../domain/segment-mask");
const AppError = require("../../../shared/domain/app-error");

class DeleteBookingUseCase {
    constructor(seatInventoryRepository) {
        this.seatInventoryRepository = seatInventoryRepository;
    }

    execute = async ({ bookingId, userId }) => {
        const seat = await this.seatInventoryRepository.findSeatByBookingId({ bookingId, userId });

        if (!seat) {
            throw new AppError(
                "NOT_FOUND",
                "Vé không tồn tại hoặc bạn không có quyền hủy vé này!",
                404
            );
        }
        // lấy đúng chặn của cái ghế đó 
        const allocation = seat.allocations.find(
            (item) => item.bookingId === bookingId && item.userId === userId
        );

        const clearMask = buildClearMask(allocation.segmentMask);

        const updatedSeat = await this.seatInventoryRepository.releaseOwned({
            bookingId,
            userId,
            clearMask
        });

        if (!updatedSeat) {
            throw new AppError("DELETE_FAILED", "Hủy vé thất bại, vui lòng thử lại!", 409);
        }

        return {
            bookingId,
            message: "Đã hủy vé thành công!",
        };
    };
}

module.exports = DeleteBookingUseCase;