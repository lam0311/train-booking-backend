const express = require("express");

const MongooseSeatInventoryResponsitory = require("../infrastructure/mongoose-seat-inventory.repository");
const MongooseTripRepository = require("../../trips/infrastructure/mongoose-trip.repository");
const createBookingUseCase = require("../application/create-booking.use-case");
const getSeatsUseCase = require("../application/get-seats.use-case");
const deleteBookingUseCase = require("../application/delete-booking.use-case");
const getBookingUseCase = require("../application/get-booking.use-case");
const getMyBookingsUseCase = require("../application/get-my-bookings.use-case");
const BookingController = require("./booking.controller");
const authMiddleware = require("../../../shared/presentation/auth.middleware");
const bookingSchema = require("./booking.schema");
const getSeatsSchema = require("./get-seats.schema");
const validateBody = require("../../../shared/presentation/validate-body");
const validateQuery = require("../../../shared/presentation/validate-query");

const router = express.Router();

const repository = new MongooseSeatInventoryResponsitory();
const tripRepository = new MongooseTripRepository();
const createBooking = new createBookingUseCase(repository, tripRepository);
const getSeats = new getSeatsUseCase(repository);
const deleteBooking = new deleteBookingUseCase(repository);
const getBooking = new getBookingUseCase(repository, tripRepository);
const getMyBookings = new getMyBookingsUseCase(repository, tripRepository);

const controller = new BookingController(createBooking, getSeats, deleteBooking, getBooking, getMyBookings);

router.post("/bookings", authMiddleware, validateBody(bookingSchema), controller.createBooking);
router.get("/trips/:tripId/seats", validateQuery(getSeatsSchema), controller.getSeats);
router.get("/bookings/me", authMiddleware, controller.getMyBookings);
router.get("/bookings/:bookingId", authMiddleware, controller.getBooking);
router.delete("/bookings/:bookingId", authMiddleware, controller.deleteBooking);

module.exports = router;