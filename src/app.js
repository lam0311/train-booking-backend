const express = require("express");
const cors = require("cors");

const CreateApp = () => {
    const app = express();

    app.use(cors());
    app.use(express.json({ limit: "100kb" }));

    app.get("/health/live", (req, res) => {
        res.status(200).json({ status: "ok" });
    });

    return app;

};

module.exports = CreateApp; 