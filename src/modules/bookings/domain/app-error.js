/**
 * Lớp lỗi chuẩn của toàn bộ hệ thống
 * làm cho tầng nghiệp vụ ném lỗi mà không cần biết đến Express
 */
class AppError extends Error {
    constructor(code, message, statusCode = 400) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.statusCode = statusCode;
    };
}

module.exports = AppError;

