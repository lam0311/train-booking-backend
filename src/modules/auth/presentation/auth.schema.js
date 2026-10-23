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
            .max(72)
});

module.exports = authSchema;