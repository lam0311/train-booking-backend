const { verifyRefreshToken } = require("../../../shared/infrastructure/jwt");
const AppError = require("../../../shared/domain/app-error");

class LogoutUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    execute = async ({ refreshToken }) => {
        if (!refreshToken) {
            throw new AppError("NO_REFRESH_TOKEN", "Không có refresh token!", 400);
        }

        let payload;
        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            return { message: "Đã đăng xuất!" };
        }

        await this.userRepository.updateRefreshToken(payload.userId, null);

        return { message: "Đã đăng xuất thành công!" };

    };
}

module.exports = LogoutUseCase;