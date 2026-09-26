const AppError = require("../domain/app-error");

const validateQuery = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);

        if (!result.success) {
            return next(new AppError(
                "VALIDATION_ERROR",
                result.error.issues[0].message,
                400
            ));
        }

        req.query = result.data;
        next();
    };
};

module.exports = validateQuery;