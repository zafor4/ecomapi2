require('dotenv/config');
const app = require('./app');
const mongoose = require('mongoose');


global._basedir=__dirname;


const DB=process.env.MONGODB_SERVER

mongoose.connect(DB)
    .then(() => console.log("Connected to MongoDB!"))
    .catch(err => console.error("MongoDB Connection Failed!"));

const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`App running on port ${port}!`);
})
