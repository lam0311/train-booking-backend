const mongoose = require("mongoose");
const connectDatabase = async (uri) => {
    try {
        if (!uri) {
            throw new Error("Database URI is not provided");
        }

        await mongoose.connect(uri, {
            maxPoolSize: 30,
            serverSelectionTimeoutMS: 5000,
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