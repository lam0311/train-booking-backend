const express = require("express");

const MongooseSeatInventoryResponsitory = require("../infrastructure/mongoose-seat-inventory.repository");
const createBookingUseCase = require("../application/create-booking.use-case");
const getSeatsUseCase = require("../application/get-seats.use-case");
const deleteBookingUseCase = require("../application/delete-booking.use-case");
const BookingController = require("./booking.controller");
const authMiddleware = require("../../../shared/presentation/auth.middleware");

const router = express.Router();

const repository = new MongooseSeatInventoryResponsitory();
const createBooking = new createBookingUseCase(repository);
const getSeats = new getSeatsUseCase(repository);
const deleteBooking = new deleteBookingUseCase(repository);

const controller = new BookingController(createBooking, getSeats, deleteBooking);

router.post("/bookings", controller.createBooking);
router.get("/trips/:tripId/seats", controller.getSeats);
router.delete("/bookings/:bookingId", authMiddleware, controller.deleteBooking);

module.exports = router;