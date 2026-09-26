const { z } = require("zod");

const getSeatsSchema = z.object({
    from: z.coerce.number()
        .int()
        .min(0)
        .max(3)
        .default(0),

    to: z.coerce.number()
        .int()
        .min(1)
        .max(4)
        .default(4)
}).refine(
    data => data.from < data.to,
    {
        message: "to phải lớn hơn from",
        path: ["to"]
    }
);

module.exports = getSeatsSchema;