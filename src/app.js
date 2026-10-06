const express = require("express");
const cors = require("cors");
const bookingRoutes = require("./modules/bookings/presentation/booking.routes");
const authRoutes = require("./modules/auth/presentation/auth.routes");
const helmet = require("helmet"); // 	Ẩn thông tin, set security headers
const compression = require("compression"); // 	Nén response, giảm băng thông 
const rateLimit = require("express-rate-limit"); // Giới hạn request cho mỗi IP
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");


const CreateApp = () => {
    const app = express();
    app.set("trust proxy", 1);


    const globalLimiter = rateLimit({
        windowMs: 60 * 1000,
        // Moi IP duoc dem lai tu dau sau moi 1 phut,
        max: Number(
            process.env.GLOBAL_RATE_LIMIT_MAX || 2000
        ),
        // Toi da 300 request trong 1 phut moi IP
        standardHeaders: true,
        // Gui them header nay ve cho client biet con duoc bao nhieu request
        legacyHeaders: false
    });

    app.use(cors({
        origin: [
            "http://localhost:5000",
            "https://train-booking-backend-3ri7.onrender.com"
        ]
    }));
    app.use(express.json({ limit: "100kb" }));
    app.use(helmet());
    app.use(compression({
        threshold: 4 * 1024
    }));
    app.use(globalLimiter);

    app.get("/health/live", (req, res) => {
        res.status(200).json({ status: "ok" });
    });

    const swaggerDocument = YAML.load("./swagger.yaml");
    app.get("/openapi.json", (req, res) => {
        res.json(swaggerDocument);
    });
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.use("/api/v1", authRoutes);
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