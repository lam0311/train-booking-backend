require("dotenv").config();
const { connectDatabase, disconnectDatabase } = require("../src/config/database");
const SeatInventory = require("../src/modules/bookings/infrastructure/seat-inventory.model");
const Trip = require("../src/modules/trips/infrastructure/trip.model");

const TOTAL_SEATS = 40;
const BENCHMARK_TRIP_ID = "SE1-2026";

const TRIP_SCHEDULES = [
    {
        code: "SE1A",
        stations: [
            { index: 0, name: "Hà Nội", arrivalTime: null, departureTime: "06:00" },
            { index: 1, name: "Phủ Lý", arrivalTime: "06:40", departureTime: "06:42" },
            { index: 2, name: "Ninh Bình", arrivalTime: "07:38", departureTime: "07:40" },
            { index: 3, name: "Thanh Hóa", arrivalTime: "09:12", departureTime: "09:15" },
            { index: 4, name: "Vinh", arrivalTime: "11:30", departureTime: null }
        ]
    },
    {
        code: "SE1B",
        stations: [
            { index: 0, name: "Hà Nội", arrivalTime: null, departureTime: "09:00" },
            { index: 1, name: "Phủ Lý", arrivalTime: "09:40", departureTime: "09:42" },
            { index: 2, name: "Ninh Bình", arrivalTime: "10:38", departureTime: "10:40" },
            { index: 3, name: "Thanh Hóa", arrivalTime: "12:12", departureTime: "12:15" },
            { index: 4, name: "Vinh", arrivalTime: "14:30", departureTime: null }
        ]
    },
    {
        code: "SE2A",
        stations: [
            { index: 0, name: "Vinh", arrivalTime: null, departureTime: "13:30" },
            { index: 1, name: "Thanh Hóa", arrivalTime: "15:42", departureTime: "15:45" },
            { index: 2, name: "Ninh Bình", arrivalTime: "17:15", departureTime: "17:18" },
            { index: 3, name: "Phủ Lý", arrivalTime: "18:12", departureTime: "18:15" },
            { index: 4, name: "Hà Nội", arrivalTime: "19:00", departureTime: null }
        ]
    },
    {
        code: "SE2B",
        stations: [
            { index: 0, name: "Vinh", arrivalTime: null, departureTime: "17:00" },
            { index: 1, name: "Thanh Hóa", arrivalTime: "19:12", departureTime: "19:15" },
            { index: 2, name: "Ninh Bình", arrivalTime: "20:45", departureTime: "20:48" },
            { index: 3, name: "Phủ Lý", arrivalTime: "21:42", departureTime: "21:45" },
            { index: 4, name: "Hà Nội", arrivalTime: "22:30", departureTime: null }
        ]
    }
];

const seedDatabase = async () => {
    try {
        console.log("Đang kết nối Database để nạp dữ liệu mẫu...");
        await connectDatabase(process.env.MONGODB_URL);

        await SeatInventory.deleteMany({});
        await Trip.deleteMany({});
        console.log("Đã xóa dữ liệu cũ của các chuyến tàu");

        const startDate = new Date();
        const tripsToCreate = [];
        const seatInventoriesToCreate = [];

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + dayOffset);
            const dateString = date.toISOString().split("T")[0];

            for (const { code, stations } of TRIP_SCHEDULES) {
                const tripId = `${code}-${dateString}`;

                tripsToCreate.push({
                    tripId,
                    date: dateString,
                    stations
                });

                for (let seatNumber = 1; seatNumber <= TOTAL_SEATS; seatNumber++) {
                    seatInventoriesToCreate.push({
                        tripId,
                        seatNumber,
                        occupiedMask: 0,
                        allocations: []
                    });
                }
            }
        }

        // Seed thêm chuyến cố định SE1-2026 phục vụ kiểm thử tải (Kaggle Benchmark)
        tripsToCreate.push({
            tripId: BENCHMARK_TRIP_ID,
            date: startDate.toISOString().split("T")[0],
            stations: TRIP_SCHEDULES[0].stations
        });

        for (let seatNumber = 1; seatNumber <= TOTAL_SEATS; seatNumber++) {
            seatInventoriesToCreate.push({
                tripId: BENCHMARK_TRIP_ID,
                seatNumber,
                occupiedMask: 0,
                allocations: []
            });
        }

        await Trip.insertMany(tripsToCreate);
        await SeatInventory.insertMany(seatInventoriesToCreate);

        console.log(`Đã tạo ${tripsToCreate.length} chuyến tàu`);
        console.log(`Đã tạo ${seatInventoriesToCreate.length} bản ghi ghế`);
        console.log("THÀNH CÔNG NẠP DỮ LIỆU MẪU");
    } catch (error) {
        console.error("Lỗi khi seed dữ liệu:", error);
        process.exitCode = 1;
    } finally {
        await disconnectDatabase();
    }
};

seedDatabase();