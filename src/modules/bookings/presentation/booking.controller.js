class BookingController {
    constructor(createBookingUseCase, getSeatsUseCase,
        releaseOwnedUseCase, getBookingUseCase, getMyBookingsUseCase) {
        this.createBookingUseCase = createBookingUseCase;
        this.getSeatsUseCase = getSeatsUseCase;
        this.releaseOwnedUseCase = releaseOwnedUseCase;
        this.getBookingUseCase = getBookingUseCase;
        this.getMyBookingsUseCase = getMyBookingsUseCase;
    }

    // API đặt vé 
    createBooking = async (req, res, next) => {
        try {
            const { tripId, seatNumber, fromIndex, toIndex } = req.body;

            const idempotencyKey = req.headers["idempotency-key"];

            const result = await this.createBookingUseCase.execute({
                tripId,
                seatNumber: Number(seatNumber),
                fromIndex: Number(fromIndex),
                toIndex: Number(toIndex),
                userId: req.auth?.userId,
                idempotencyKey
            });

            res.setHeader("Idempotency-Replayed", result.replayed ? "true" : "false");

            return res.status(201).json({ data: result });
        } catch (error) {
            next(error);
        }
    };

    // API xem vé

    getSeats = async (req, res, next) => {
        try {
            const { tripId } = req.params;

            const { from, to } = req.validatedQuery;
            
            const result = await this.getSeatsUseCase.execute({
                tripId,
                fromIndex: Number(from),
                toIndex: Number(to)
            });

            return res.status(200).json({ data: result });

        } catch (error) {
            next(error);
        }
    };

    // API xóa vé
    deleteBooking = async (req, res, next) => {
        try {
            const { bookingId } = req.params;
            const userId = req.auth?.userId || "guest-user";

            const result = await this.releaseOwnedUseCase.execute({
                bookingId,
                userId,
            });

            return res.status(200).json({ data: result });

        } catch (error) {
            next(error);
        }
    };

    getBooking = async (req, res, next) => {
        try {
            const { bookingId } = req.params;
            const userId = req.auth?.userId;

            const result = await this.getBookingUseCase.execute({
                bookingId, userId
            });

            return res.status(200).json({ data: result });
        } catch (error) {
            next(error);
        }
    };
    // API lấy danh sách vé của người dùng hiện tại
    getMyBookings = async (req, res, next) => {
        try {
            const userId = req.auth?.userId;
            if (!userId) {
                return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Chưa xác thực" } });
            }
            
            const result = await this.getMyBookingsUseCase.execute({ userId });

            return res.status(200).json({ data: result });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = BookingController;