const User = require("./user.model");

class MongooseUserRepository {

    // Tìm user theo email
    findByEmail = async (email) => {
        return await User.findOne({ email });
    };

    // Tìm user theo id
    findById = async (id) => {
        return await User.findById(id);
    };

    save = async ({ email, passwordHash }) => {
        const user = new User({ email, passwordHash });
        return await user.save();
    };

    // Cập nhật refresh token
    updateRefreshToken = async (userId, refreshToken) => {
        return await User.findByIdAndUpdate(
            userId,
            { refreshToken },
            { new: true }
        );
    };
};

module.exports = MongooseUserRepository;