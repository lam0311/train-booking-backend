const { buildSegmentMask, hasConflict } = require("../domain/segment-mask");

class GetSeatsUseCase {
    constructor(seatInventoryRepository) {
        this.seatInventoryRepository = seatInventoryRepository;
    }

    execute = async ({ tripId, fromIndex, toIndex }) => {
        const requestedMask = buildSegmentMask(fromIndex, toIndex);

        const seats = await this.seatInventoryRepository.findSeatByTrip(tripId);

        const seatMap = seats.map((seat) => {
            const isAvailable = !hasConflict(seat.occupiedMask, requestedMask);
            return {
                seatNumber: seat.seatNumber,
                available: isAvailable
            };
        });

        return {
            tripId,
            fromIndex,
            toIndex,
            requestedMask,
            seats: seatMap,
        };
    };

}

module.exports = GetSeatsUseCase;
