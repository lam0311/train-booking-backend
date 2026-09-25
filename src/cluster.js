const cluster = require("node:cluster");
const os = require("node:os");

// Day la process cha
if (cluster.isPrimary) {
    // dem so core
    const numCPUs = os.cpus().length;

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Neu 1 worker bi chet thi tu dong tao lai
    cluster.on("exit", (worker, code) => {
        cluster.fork();
    });

    // neu la process con thi chay server.js binh thuong
} else {
    require("./server.js");
}