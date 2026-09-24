const AppError = require("../domain/app-error");

const validateBody = schema => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return next(new AppError(
                "VALIDATION_ERROR",
                result.error.issues[0].message,
                400
            ));
        }

        // Ghi đè body bằng dữ liệu đã kiểm tra.
        req.body = result.data;

        next();
    };
};

module.exports = validateBody;
