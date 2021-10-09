// Setup server
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const bodyParser = require("body-parser");

// Setup cors and body parser
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Request logger
app.use(function (req, res, next) {
  var log = req.method + " " + req.path + " - " + req.ip;
  console.log(log);
  next();
});

// Setup mongoose
const mongoose = require("mongoose");
const { Schema } = mongoose;

// Init mongodb connection
mongoose.connect(process.env["MONGO_URI"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Checking connection
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Database connected");
});

// Serve public as static
app.use(express.static('public'));

// Serve index page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Setup mongoose schema and model
const userSchema = new Schema({
  username: String,
});

const User = mongoose.model("User", userSchema);

// Create new user api
app.post("/api/users", function (req, res) {
  const username = req.body.username;

  const newUser = new User({
    username: username,
  });

  newUser.save(function (err, newUser) {
    if (err) return console.error(err);
    res.json({
      username: newUser.username,
      _id: newUser.id,
    })
  });
});

// Get all users api
app.get("/api/users", function (req, res) {
  User.find({}, "username id", function (err, docs) {
    if (err) return console.error(err);
    res.json(docs);
  });
});

// Listen to port
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});