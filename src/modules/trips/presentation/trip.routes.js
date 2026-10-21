const express = require("express");
const validateQuery = require("../../../shared/presentation/validate-query");
const { z } = require("zod");

const MongooseTripRepository = require("../infrastructure/mongoose-trip.repository");
const GetTripsUseCase = require("../application/get-trips.use-case");
const TripController = require("./trip.controller");
const { STATIONS } = require("../../../shared/constants/stations");

const repository = new MongooseTripRepository();
const getTripsUseCase = new GetTripsUseCase(repository);
const controller = new TripController(getTripsUseCase);

const getTripsSchema = z.object({
  from: z.string().trim().min(1),
  to: z.string().trim().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
}).refine(
  data => data.from !== data.to,
  {
    message: "Ga xuất phát và ga đích phải khác nhau",
    path: ["to"]
  }
);

const router = express.Router();

// GET /api/v1/stations - trả về danh sách 5 ga cố định
router.get("/stations", (req, res) => {
  return res.status(200).json({ data: STATIONS });
});

// GET /api/v1/trips?from=&to=&date=
router.get("/trips", validateQuery(getTripsSchema), controller.getTrips);

module.exports = router;