const { verifyRefreshToken, signAccessToken } = require("../../../shared/infrastructure/jwt");
const AppError = require("../../../shared/domain/app-error");

class RefreshTokenUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    execute = async ({ refreshToken }) => {
        if (!refreshToken) {
            throw new AppError("NO_REFRESH_TOKEN", "Không có refresh token!", 401);
        }

        let payload;

        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            throw new AppError("INVALID_REFRESH_TOKEN", "Refresh token không hợp lệ hoặc đã hết hạn!", 401);
        }

        const user = await this.userRepository.findById(payload.userId);
        if (!user || user.refreshToken !== refreshToken) {
            throw new AppError("REFRESH_TOKEN_MISMATCH", "Refresh token không hợp lệ!", 401);
        };

        const newAccessToken = signAccessToken({
            userId: user._id.toString(),
            email: user.email
        });

        return { accessToken: newAccessToken };
    };
}

module.exports = RefreshTokenUseCase;