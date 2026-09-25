const mongoose = require("mongoose");
const connectDatabase = async (uri) => {
    try {
        if (!uri) {
            throw new Error("Database URI is not provided");
        }

        await mongoose.connect(uri, {
            maxPoolSize: Number(process.env.DB_MAX_POOL || 20),
            minPoolSize: Number(process.env.DB_MIN_POOL || 2),

            // Đóng connection nhàn rỗi lâu
            maxIdleTimeMS: 30_000,
            // Giới hạn thời gian chờ connection
            waitQueueTimeoutMS: 2_000,

            // Giới hạn thời gian tìm MongoDB
            serverSelectionTimeoutMS: 5_000,
            // Giới hạn thời gian mở connection
            connectTimeoutMS: 5_000,

            // Retry một số thao tác ghi phù hợp
            retryWrites: true,
            tls: true
        });
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1);
    }
};

const disconnectDatabase = async () => {
    try {
        await mongoose.disconnect();
        console.log("Database disconnected successfully");
    } catch (error) {
        console.error("Database disconnection error:", error);
    }
};

module.exports = {
    connectDatabase,
    disconnectDatabase,
};