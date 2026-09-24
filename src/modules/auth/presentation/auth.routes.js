const express = require("express");
const MongooseUserRepository = require("../infrastructure/mongoose-user.repository");
const RegisterUseCase = require("../application/register.use-case");
const LoginUseCase = require("../application/login.use-case");
const RefreshTokenUseCase = require("../application/refresh-token.use-case");
const LogoutUseCase = require("../application/logout.use-case");
const AuthController = require("./auth.controller");

const router = express.Router();

const repository = new MongooseUserRepository();
const register = new RegisterUseCase(repository);
const login = new LoginUseCase(repository);
const logout = new LogoutUseCase(repository);
const refreshToken = new RefreshTokenUseCase(repository);
const rateLimit = require("express-rate-limit"); // Giới hạn request cho mỗi IP

const controller = new AuthController(
    register,
    login,
    refreshToken,
    logout
);

const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: {
            code: "TOO_MANY_REQUESTS",
            message: "Bạn thao tác quá nhanh, vui lòng thử lại sau"
        }
    }
});

router.post("/auth/login", authLimiter, controller.login);
router.post("/auth/register", authLimiter, controller.register);
router.post("/auth/refresh", authLimiter, controller.refresh);
router.post("/auth/logout", controller.logout);

module.exports = router;

