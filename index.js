const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoDbSession = require("connect-mongodb-session")(session);
const bcrypt = require("bcryptjs");
const ejs = require("ejs");
require("dotenv").config();
const app = express();
const userModel = require("./models/User");
// const { K } = require("handlebars");

const PORT = process.env.PORT;
const mongoURI = "mongodb://localhost:27017/Sessions";
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log("Your database is connected");
  });

const store = new MongoDbSession({
  uri: mongoURI,
  collection: "mySessions",
});

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "key that will sign cookie",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
// app.get("/", (req, res) => {
//   req.session.isAuth = true;
//   console.log(req.session);
//   console.log(req.session.id);
//   res.send("Hello Sahil");
// });

const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", (req, res) => {
  res.render("landing");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email: email });

  if (!user) {
    return res.redirect("/login");
  }

  const ismatch = await bcrypt.compare(password, user.password);
  if (!ismatch) {
    return res.redirect("/login");
  }

  req.session.isAuth = true;
  res.redirect("dashboard");
});

app.get("/register", (req, res) => {
  const err = req.query.error;
  res.render("register", { err });
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  let user = await userModel.findOne({ email: email });

  if (user) {
    return res.redirect("/register");
    // return res.redirect("/register");
  } else {
    let hashedPassword = await bcrypt.hash(password, 12);
    user = new userModel({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();
    res.redirect("/login");
  }
});

app.get("/dashboard", isAuth, (req, res) => {
  res.render("dashboard");
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect("/");
  });
});

app.listen(PORT, () => {
  console.log(`Your server is running on http://localhost:${PORT}`);
});
