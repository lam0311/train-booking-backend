require("dotenv").config();
const createApp = require("./app");

const port = Number(process.env.PORT || 5000);
const app = createApp();

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})


