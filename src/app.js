const express = require("express");
const cors = require("cors");
const bookingRoutes = require("./modules/bookings/presentation/booking.routes");


const CreateApp = () => {
    const app = express();

    app.use(cors());
    app.use(express.json({ limit: "100kb" }));

    app.get("/health/live", (req, res) => {
        res.status(200).json({ status: "ok" });
    });

    app.use("/api/v1", bookingRoutes);

    // xử lý lỗi tập chung
    app.use((err, req, res, _next) => {
        const statusCode = err.statusCode || 500;
        const code = err.code || "INTERNAL_ERROR";
        const message = statusCode === 500 ? "Lỗi máy chủ nội bộ" : err.message;

        return res.status(statusCode).json({
            error: {
                code,
                message,
            },
        });
    });

    return app;

};

module.exports = CreateApp; 