const { z } = require("zod");

const authSchema = z.object({
    email: 
        z.string()
        .trim()
        .email()
        .max(254),
    password: 
        z.string()
        .min(6)
        .max(72)   // bcrypt chỉ dùng tối đa 72 byte
});

module.exports =  authSchema ;