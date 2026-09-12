require("dotenv").config();
const createApp = require("./app");
const { connectDatabase } = require("./config/database");


const startServer = async () => {
    await connectDatabase(process.env.MONGODB_URL);
    const port = Number(process.env.PORT || 5000);
    const app = createApp();
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });

};

startServer().catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
});






