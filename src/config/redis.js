const Redis = require("ioredis");

let redisClient = null;

const getRedisClient = () => {
    if (redisClient) return redisClient;

    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        console.warn("REDIS_URL chưa được cấu hình. Chạy ở chế độ không Cache.");
        return null;
    }

    try {
        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 1,
            connectTimeout: 1000,
            enableOfflineQueue: false,
            lazyConnect: true
        });

        redisClient.on("connect", () => console.log("Redis connected successfully"));
        redisClient.on("error", (err) => console.warn("Redis Error:", err.message));

        redisClient.connect().catch((err) => {
            console.warn(err.message);
        });

        return redisClient;
    } catch (error) {
        console.warn("Khởi tạo Redis thất bại:", error.message);
        return null;
    }
};

module.exports = getRedisClient;

