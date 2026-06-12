const express = require('express');
const fs = require('fs');
const app = express();

app.get("/download", (req, res) => {
    const stream = fs.createReadStream("./largefile.dmg");

    let t = 0;
    stream.on("data", (chunk) => {
        console.log(chunk.length);
        t += chunk.length;
        // if (t > 65536 + 65536 + 65536) {
        //     throw new Error("File is too large");
        // }
    });
    stream.on("end", () => {
        console.log("Stream ended");
    });
    stream.on("error", (err) => {
        console.log(err);
    });
    stream.pipe(res);
})

app.listen(4001, () => {
    console.log("Server is running on port 4001");
});