// setup server
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require("body-parser");

// setup cors and body parser
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// request logger
app.use(function (req, res, next) {
  var log = req.method + " " + req.path + " - " + req.ip;
  console.log(log);
  next();
});

// setup mongoose
const mongoose = require("mongoose");
const { Schema } = mongoose;

// init mongodb connection
mongoose.connect(process.env["MONGO_URI"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// checking connection
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Database connected");
});

// serve public as static
app.use(express.static('public'));

// serve index page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});




// listen to port
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
;