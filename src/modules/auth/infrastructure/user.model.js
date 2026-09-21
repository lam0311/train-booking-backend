const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        default: null
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;



