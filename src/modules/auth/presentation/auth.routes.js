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

const controller = new AuthController(
    register,
    login,
    refreshToken,
    logout
);

router.post("/auth/register", controller.register);
router.post("/auth/login", controller.login);
router.post("/auth/refresh", controller.refresh);
router.post("/auth/logout", controller.logout);

module.exports = router;

