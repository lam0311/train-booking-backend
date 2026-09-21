const { verifyAccessToken } = require("../infrastructure/jwt");
const AppError = require("../domain/app-error");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    // Kiểm tra header có tồn tại và đúng định dạng "Bearer"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new AppError("UNAUTHORIZED", "Bạn cần đăng nhập để thực hiện thao tác này!", 401));
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(token);

        req.auth = {
            userId: payload.userId,
            email: payload.email
        };

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return next(new AppError("TOKEN_EXPIRED", "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!", 401));
        }

        return next(new AppError("INVALID_TOKEN", "Token không hợp lệ!", 401));
    }
};

module.exports = authMiddleware;
