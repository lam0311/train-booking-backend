const AppError = require("../../../shared/domain/app-error");
const { buildSegmentInfo } = require("../../trips/domain/trip-info");

class GetMyBookingsUseCase {
    constructor(seatInventoryRepository, tripRepository) {
        this.seatInventoryRepository = seatInventoryRepository;
        this.tripRepository = tripRepository;
    }

    execute = async ({ userId }) => {
        // Lấy tất cả các allocation của user
        const seats = await this.seatInventoryRepository.findBookingsByUser(userId);

        // Nhóm theo tripId để tối ưu việc lấy trip info
        // Lấy tripId từ seat (không phải từ allocation)
        const tripIds = [...new Set(seats.map(seat => seat.tripId))];

        // Lấy thông tin tất cả các trip cần thiết
        const trips = await this.tripRepository.findByTripIds(tripIds);
        const tripMap = {};
        trips.forEach(trip => {
            tripMap[trip.tripId] = trip;
        });

        // Xây dựng danh sách vé
        const bookings = [];
        for (const seat of seats) {
            for (const allocation of seat.allocations) {
                if (allocation.userId === userId) {
                    const trip = tripMap[seat.tripId]; // Lấy trip từ seat.tripId
                    const segmentInfo = buildSegmentInfo(trip, allocation.fromIndex, allocation.toIndex);

                    bookings.push({
                        bookingId: allocation.bookingId,
                        tripId: seat.tripId, // Lấy tripId từ seat
                        seatNumber: seat.seatNumber,
                        fromIndex: allocation.fromIndex,
                        toIndex: allocation.toIndex,
                        from: segmentInfo.from,
                        to: segmentInfo.to,
                        createdAt: allocation.createdAt
                    });
                }
            }
        }

        // Sắp xếp theo thời gian đặt vé mới nhất trước
        return bookings.sort((a, b) => b.createdAt - a.createdAt);
    };
}

module.exports = GetMyBookingsUseCase;