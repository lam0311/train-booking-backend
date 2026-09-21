class AuthController {

    constructor(registerUseCase, loginUseCase, refreshTokenUseCase, logoutUseCase) {
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.registerUseCase = registerUseCase;
        this.loginUseCase = loginUseCase;
        this.logoutUseCase = logoutUseCase;
    }

    register = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await this.registerUseCase.execute({ email, password });
            return res.status(201).json({ data: result });
        } catch (error) {
            next(error);
        }
    };

    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await this.loginUseCase.execute({ email, password });

            return res.status(200).json({ data: result });
        } catch (error) {
            next(error);
        }
    };

    refresh = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            const result = await this.refreshTokenUseCase.execute({ refreshToken });
            return res.status(200).json({ data: result });
        } catch (error) {
            next(error);
        }
    };

    logout = async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
            const result = await this.logoutUseCase.execute({ refreshToken });
            return res.status(200).json({ data: result });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = AuthController;