const SeatInventory = require("./seat-inventory.model");
const getRedisClient = require("../../../config/redis");
const LocalCache = require("../../../shared/infrastructure/local-cache");
const inFlightLoads = new Map();

// sử lý các thao tác nguyên tử
class MongooseSeatInventoryRepository {

    // Xóa cache khi dữ liệu ghế của chuyến tàu bị thay đổi
    invalidateTripCache = async (tripId) => {
        try {
            const redis = getRedisClient();

            const cacheKey = `seats:${tripId}`;

            LocalCache.delete(cacheKey);

            if (redis && redis.status === "ready") {
                await redis.del(cacheKey);
            }

        } catch (err) {
            console.warn("Lỗi xóa cache Redis:", err.message);
        }
    };



    loadSeatsFromLowerCache = async (tripId, cacheKey) => {
        const redis = getRedisClient();
        if (redis && redis.status === "ready") {
            try {
                const cached = await redis.get(cacheKey);

                if (cached) {
                    const seats = JSON.parse(cached);

                    LocalCache.set(
                        cacheKey,
                        seats,
                        2_000
                    );

                    return seats;
                }
            } catch (err) {
                console.warn("Lỗi đọc cache Redis:", err.message);
            }
        }

        const seats = await SeatInventory
            .find({ tripId })
            .select("seatNumber occupiedMask")
            .lean();

        LocalCache.set(
            cacheKey,
            seats,
            2_000
        );


        if (redis && redis.status === "ready" && seats.length > 0) {
            try {
                await redis.set(
                    cacheKey,
                    JSON.stringify(seats),
                    "EX",
                    60
                );
            } catch (error) {
                console.warn(
                    "Lỗi ghi Redis:",
                    error.message
                );
            }
        }
        return seats;
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

        const localSeats = LocalCache.get(cacheKey);

        if (localSeats) {
            return localSeats;
        }

        // Nếu đã có request đang tải key này,
        // dùng chung Promise với request đó.
        const existingLoad = inFlightLoads.get(cacheKey);

        if (existingLoad) {
            return existingLoad;
        }

        const loadPromise = this.loadSeatsFromLowerCache(tripId, cacheKey);

        inFlightLoads.set(
            cacheKey,
            loadPromise
        );


        try {
            return await loadPromise;
        } finally {
            // Sau khi hoàn thành hoặc gặp lỗi, thì xóa promise ra khỏi map
            inFlightLoads.delete(cacheKey);
        }
    };
}

module.exports = MongooseSeatInventoryRepository;
