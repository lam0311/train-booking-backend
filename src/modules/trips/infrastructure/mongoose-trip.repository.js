const Trip = require("./trip.model");

class MongooseTripRepository {
  findByTripId = async (tripId) => {
    return Trip.findOne({ tripId }).lean();
  };

  findByDate = async (date) => {
    return Trip.find({ date }).lean();
  };

  findByTripIds = async (tripIds) => {
    return Trip.find({ tripId: { $in: tripIds } }).lean();
  };
}

module.exports = MongooseTripRepository;