const SeatInventory = require("./seat-inventory.model");
const getRedisClient = require("../../../config/redis");

// sử lý các thao tác nguyên tử
class MongooseSeatInventoryRepository {

    // Xóa cache khi dữ liệu ghế của chuyến tàu bị thay đổi
    invalidateTripCache = async (tripId) => {
        try {
            const redis = getRedisClient();

            if (redis) {
                await redis.del(`seats:${tripId}`);
            }

        } catch (err) {
            console.warn("Lỗi xóa cache Redis:", err.message);
        }
    };




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

        if (updateSeat) {
            await this.invalidateTripCache(tripId);
        }

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

        if (updateSeat) {
            await this.invalidateTripCache(updateSeat.tripId);
        }
        return updateSeat;
    };

    findSeatByBookingId = async ({ bookingId, userId }) => {
        return SeatInventory.findOne({
            allocations: {
                $elemMatch: {
                    bookingId, userId
                }
            }
        })
            .select("_id tripId seatNumber allocations")
            .lean();
    };

    // lấy sơ đồ ghế của chuyến tàu
    findSeatByTrip = async (tripId) => {
        const cacheKey = `seats:${tripId}`;
        const redis = getRedisClient();

        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            } catch (err) {
                console.warn("Lỗi đọc cache Redis:", err.message);
            }
        }

        const seats = await SeatInventory.find({ tripId })
            .select("seatNumber occupiedMask")
            .lean();

        if (redis && seats.length > 0) {
            try {
                await redis.set(cacheKey, JSON.stringify(seats), "EX", 60);
            } catch (err) {
                console.warn("Lỗi ghi cache Redis:", err.message);
            }
        }

        return seats;
    };
}

module.exports = MongooseSeatInventoryRepository;
