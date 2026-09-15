const SeatInventory = require("./seat-inventory.model");

// sử lý các thao tác nguyên tử
class MongooseSeatInventoryRepository {
    /**
     * Kiểm tra: Chỉ cập nhật nếu các bit của chặng yêu cầu ĐANG TRỐNG
     * Cập nhật: Bật các bit đó lên và thêm thông tin vé vào allocations
     */

    allocate = async ({ tripId, seatNumber, allocation }) => {
        const updateSeat = await SeatInventory.findOneAndUpdate(
            {
                tripId,
                seatNumber,
                occupiedMask: { $bitsAllClear: allocation.segmentMask }
            },
            {
                $bit: { occupiedMask: { or: allocation.segmentMask } },
                $push: { allocations: allocation }
            },
            {
                new: true
            }
        ).lean();

        return updateSeat;
    };


    /**
     * Hủy vé và nhả chặng ghế
     */

    releaseOwned = async ({ bookingId, userId, clearMask }) => {
        const updateSeat = await SeatInventory.findOneAndUpdate(
            {
                allocations: { $elemMatch: { bookingId, userId } }
            },
            {
                $bit: { occupiedMask: { and: clearMask } },
                $pull: { allocations: { bookingId, userId } }
            },
            {
                new: true
            }
        );

        return updateSeat;
    };

    findSeatByBookingId = async ({ bookingId, userId }) => {
        return await SeatInventory.findOne({
            allocations: { $elemMatch: { bookingId, userId } }
        });
    };

    // lấy sơ đồ ghế của chuyến tàu
    findSeatByTrip = async (tripId) => {
        return await SeatInventory.find({ tripId })
            .select("seatNumber occupiedMask")
            .lean();

    };
}

module.exports = MongooseSeatInventoryRepository;
