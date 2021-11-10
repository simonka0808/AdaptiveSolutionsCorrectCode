//Import modules for mongo database and express to run the server
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017/dllt_db";
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();

app.use(
  session({
    secret: "cookie_secret",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

//Store static html files in the public folder
app.use(express.static("public"));

var db;

//Attempt to connect to the database
MongoClient.connect(url, function (err, database) {
  if (err) throw err;
  db = database;
});

//When a user navigates to the domain,
//they will be redirected to the register page
app.get("/", function (req, res) {
  if (req.session.loggedin) {
    res.render("pages/events_user", {});
  } else {
    res.redirect("/register");
  }
});

//Sign In page
app.get("/signIn", function (req, res) {
  res.sendFile("public/signIn.html", { root: __dirname });
});

//Register page
app.get("/register", function (req, res) {
  res.sendFile("public/register.html", { root: __dirname });
});

//User Events page
app.get("/events_user", function (req, res) {
  res.render("pages/events_user");
});

//Admin Events page
app.get("/events_admin", function (req, res) {
  res.render("pages/events_admin");
});

//User Profile page
app.get("/profile", function (req, res) {
  res.render("pages/profile");
});

//Admin Users page
app.get("/users", function (req, res) {
  res.render("pages/users");
});

//--------------------------------- POST ROUTES ----------------------------------------

app.post("/dologin", function (req, res) {
  console.log(JSON.stringify(req.body));
  var email = req.body.email;
  var pword = req.body.pass;
});

/*
  //Find one user from the database that matches the entered username
  db.collection("users").findOne(
    { "login.username": uname },
    function (err, result) {
      if (err) throw err;

      if (!result) {
        res.redirect("/signIn");
        return;
      }

      //Check if the password attempt matches the database password
      if (result.login.password == pword) {
        req.session.loggedin = true;
        //If successful, store the user's username in the session cookie
        req.session.currentuser = uname;
        console.log("User Logged In");
        res.redirect("/");
      } else {
        res.redirect("/signIn");
      }
    }
  );
});
*/

//Starts the server
app.listen(8080);
