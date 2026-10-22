const AppError = require("../../../shared/domain/app-error");
const { getStationIndexByName } = require("../../../shared/constants/stations");

class GetTripsUseCase {
  constructor(tripRepository) {
    this.tripRepository = tripRepository;
  }

  execute = async ({ from, to, date }) => {
    const fromIndex = getStationIndexByName(from);
    const toIndex = getStationIndexByName(to);

    if (fromIndex === -1) {
      throw new AppError("VALIDATION_ERROR", `Tên ga xuất phát "${from}" không hợp lệ`, 400);
    }
    if (toIndex === -1) {
      throw new AppError("VALIDATION_ERROR", `Tên ga đích "${to}" không hợp lệ`, 400);
    }
    if (from === to) {
      throw new AppError("VALIDATION_ERROR", "Ga xuất phát và ga đích phải khác nhau", 400);
    }

    const trips = await this.tripRepository.findByDate(date);

    const results = [];
    for (const trip of trips) {

      const fromStation = trip.stations.find(s => s.name === from);
      const toStation = trip.stations.find(s => s.name === to);

      if (!fromStation || !toStation) continue;

      // From index phải nhỏ hơn to index
      if (fromStation.index >= toStation.index) continue;

      results.push({
        tripId: trip.tripId,
        date: trip.date,
        from: {
          index: fromStation.index,
          name: fromStation.name,
          departureTime: fromStation.departureTime
        },
        to: {
          index: toStation.index,
          name: toStation.name,
          arrivalTime: toStation.arrivalTime
        },
        stations: trip.stations
      });
    }

    return results;
  };
}

module.exports = GetTripsUseCase;