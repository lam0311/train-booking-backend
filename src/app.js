const express = require("express");

const CreateApp = () => {
    const app = express();
    app.use(express.json({ limit: "100kb" }));

    app.get("/health/live", (req, res) => {
        res.status(200).json({ status: "ok" });
    });

    return app;

};

module.exports = CreateApp; 