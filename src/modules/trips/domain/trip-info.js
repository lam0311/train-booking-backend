const findStation = (trip, index) => {
  if (!trip || !Array.isArray(trip.stations)) return null;
  return trip.stations.find(s => s.index === index) || null;
};

const buildSegmentInfo = (trip, fromIndex, toIndex) => {
  const fromStation = findStation(trip, fromIndex);
  const toStation = findStation(trip, toIndex);

  return {
    from: {
      index: fromIndex,
      name: fromStation?.name ?? null,
      departureTime: fromStation?.departureTime ?? null
    },
    to: {
      index: toIndex,
      name: toStation?.name ?? null,
      arrivalTime: toStation?.arrivalTime ?? null
    }
  };
};

module.exports = {
  findStation,
  buildSegmentInfo
};