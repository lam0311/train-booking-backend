require("dotenv").config();
const { connectDatabase, disconnectDatabase } = require("../src/config/database");
const SeatInventory = require("../src/modules/bookings/infrastructure/seat-inventory.model");

const TRIP_ID = "SE1-2026";
const TOTAL_SEATS = 40;

const seedDatabase = async () => {
    try {
        console.log("Đang kết nối Database để nạp dữ liệu mẫu...");
        await connectDatabase(process.env.MONGODB_URL);

        await SeatInventory.deleteMany({ tripId: TRIP_ID });
        console.log(`Đã xóa dữ liệu cũ của chuyến tàu ${TRIP_ID}`);

        const seats = [];
        for (let i = 1; i <= TOTAL_SEATS; i++) {
            seats.push({
                tripId: TRIP_ID,
                seatNumber: i,
                occupiedMask: 0,
                allocations: []
            });
        }

        await SeatInventory.insertMany(seats);
        console.log("THÀNH CÔNG NẠP DỮ LIỆU");
    } catch (error) {
        console.error("Lỗi khi seed dữ liệu:", error);
    } finally {
        await disconnectDatabase();
        process.exit(0);
    }
};

seedDatabase();

