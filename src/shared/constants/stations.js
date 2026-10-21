const STATIONS = [
  { index: 0, name: "Hà Nội" },
  { index: 1, name: "Phủ Lý" },
  { index: 2, name: "Ninh Bình" },
  { index: 3, name: "Thanh Hóa" },
  { index: 4, name: "Vinh" }
];

const getStationIndexByName = (name) => {
  const station = STATIONS.find(s => s.name === name);
  return station ? station.index : -1;
};

const getStationNameByIndex = (index) => {
  const station = STATIONS.find(s => s.index === index);
  return station ? station.name : null;
};

module.exports = {
  STATIONS,
  getStationIndexByName,
  getStationNameByIndex
};