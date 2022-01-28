const mongoose = require("mongoose");

require('dotenv/config');

try {
    mongoose.connect(process.env.DB_LINK, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoIndex: false
    });
}catch(err) {
    console.log("[ERROR - DB]:" + err)
    process.exit(0);
}

const db = mongoose.connection;

db.on("error", (err) => {
    console.log("[ERROR - DB]:" + err);
    process.exit(0);
})

db.once("open", () => {
    console.log("[MongoDB]: Connection successful.");
});

module.exports = mongoose;