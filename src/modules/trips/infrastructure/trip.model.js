const mongoose = require("mongoose");

const { Schema } = mongoose;

const tripStationSchema = new Schema({
  index: { type: Number, required: true },
  name: { type: String, required: true },
  arrivalTime: { type: String },
  departureTime: { type: String }
}, { _id: false });

const tripSchema = new Schema({
  tripId: { type: String, required: true, unique: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  stations: { type: [tripStationSchema], required: true }
}, { timestamps: true });

const Trip = mongoose.model("Trip", tripSchema, "trips");

module.exports = Trip;