const express = require('express');
const bodyParser = require("body-parser");

const app = express();

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.json());

//initialize
app.use('/api', require('./routes/api'));

//listen for requests
app.listen(process.env.port || 5002, () => console.log('server start on port 5002'))