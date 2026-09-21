const bcrypt = require("bcryptjs");
const { signAccessToken, signRefreshToken } = require("../../../shared/infrastructure/jwt");
const AppError = require("../../../shared/domain/app-error");

class LoginUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    execute = async ({ email, password }) => {
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new AppError("INVALID", "Email hoặc mật khẩu không đúng!", 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AppError("INVALID", "Email hoặc mật khẩu không đúng!", 401);
        }

        const payload = {
            userId: user._id.toString(),
            email: user.email
        };

        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        await this.userRepository.updateRefreshToken(user._id, refreshToken);

        return { accessToken, refreshToken };
    };
}

module.exports = LoginUseCase;