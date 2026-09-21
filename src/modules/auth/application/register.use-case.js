const bcrypt = require("bcryptjs");
const AppError = require("../../../shared/domain/app-error");

class RegisterUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    execute = async ({ email, password }) => {
        const existingUser = await this.userRepository.findByEmail(email);

        if (existingUser) {
            throw new AppError("EMAIL_TAKEN", "Email này đã được sử dụng", 409);
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await this.userRepository.save({ email, passwordHash });

        return {
            userId: user._id.toString(),
            email: user.email,
        };
    };
};

module.exports = RegisterUseCase;

