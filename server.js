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

// Setup schema
const userSchema = new Schema({
  username: String
});

const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now },
});

// Setup model
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

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
  User.find({}, "username id", function (err, users) {
    if (err) return console.error(err);
    res.json(users);
  });
});

// Add exercises api
app.post("/api/users/:_id/exercises", function (req, res) {
  const id = req.params._id;

  User.findById(id, "id username", function (err, user) {
    if (err) console.error(err);

    const username = user.username;
    const id = user.id;
    const description = req.body.description;
    const duration = Number(req.body.duration);
    const date = req.body.date ? Date.parse(req.body.date) : Date.now();

    const newExercise = new Exercise({
      username: username,
      description : description,
      duration : duration,
      date : date,
    });

    
    newExercise.save(function (err, newExercise) {
      if (err) return console.error(err);

      res.json({
        username: newExercise.username,
        description : newExercise.description,
        duration : newExercise.duration,
        date : newExercise.date.toDateString(),
        _id: id
      })
    });
  });
});

// Get exercises log api
app.get("/api/users/:_id/logs", function (req, res) {
  const id = req.params._id;
  const from = req.query.from;
  const to = req.query.to;
  const limit = req.query.limit;

  // console.log(id, from, to, limit);
  // res.send("response message");

  User.findById(id, "username", function (err, user) {
    if (err) console.error(err);

    const username = user.username;
    let queryFilter = { username: username };
    let queryOptions = {};

    if (from || to) {
      queryFilter.date = {};
      if (from) queryFilter.date.$gte = Date.parse(from);
      if (to) queryFilter.date.$lte = Date.parse(to);
    }

    if (limit) queryOptions.limit = Number(limit);

    const exerciseQuery = Exercise.find(queryFilter, "description duration date", queryOptions);

    exerciseQuery.exec(function (err, exercises) {
      if (err) console.error(err);

      const exerciseCount = exercises.length;
      const exerciseList = exercises.map(function (exercise) {
        return {
          description : exercise.description,
          duration : exercise.duration,
          date : exercise.date.toDateString(),
        }
      })

      res.json({
        username: username,
        count: exerciseCount,
        _id: id,
        log: exerciseList
      });
    });
  });
});

// Listen to port
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});