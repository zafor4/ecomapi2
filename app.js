require('express-async-errors');
const express=require('express')
const app = express();
const error = require('./middlewares/error');


require('./middlewares/index')(app)
require('./middlewares/routes')(app)





app.use(error);

module.exports = app;