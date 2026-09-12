const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest", // dùng cú pháp js mới nhất cho project
            sourceType: "commonjs", // Ép buộc sử dụng CommonJS 
            globals: {
                ...globals.node, // Khai báo các biến của Node.js
            },
        },
        rules: {
            "quotes": ["error", "double"], // Ép buộc sử dụng dấu nháy kép
            "semi": ["error", "always"], // Ép buộc sử dụng dấu chấm phẩy
            "no-undefined": "error", // Báo lỗi khi sử dụng biến chưa được khai báo
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }], // Báo lỗi khi khai báo biến nhưng không sử dụng, ngoại trừ các biến bắt đầu bằng dấu gạch dưới
            "eqeqeq": ["error", "always"], // Ép buộc sử dụng toán tử so sánh === và !== thay vì == và !=
            "no-console": "off", // Cho phép sử dụng console.log
        },
    },

    // Bỏ qua các thư mục không cần quét
    {
        ignores: [
            "node_modules/**",
            "dist/**",
            "coverage/**",
            "src/**/*.test.js",
            "src/**/*.spec.js",
        ]
    }
];