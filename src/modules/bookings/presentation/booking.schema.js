// định nghĩa kiểu dữ liệu booking được phép đi vào backend

const { z } = require("zod");

const bookingSchema = z.object({
    tripId: z.string()
        .trim()
        .min(1)
        .max(120),

    seatNumber: z.coerce.number()
        .int()
        .min(1)
        .max(1000),

    fromIndex: z.coerce.number()
        .int()
        .min(0)
        .max(3),

    toIndex: z.coerce.number()
        .int()
        .min(1)
        .max(4)
}).refine(
    data => data.fromIndex < data.toIndex,
    {
        message: "toIndex phải lớn hơn fromIndex",
        path: ["toIndex"]
    }
);

module.exports = bookingSchema;