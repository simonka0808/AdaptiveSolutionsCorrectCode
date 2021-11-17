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

app.use(bodyParser.urlencoded({ extended: true }));

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
  if (req.session.loggedin && !req.session.isadmin) {
    res.render("pages/events_user", {});
  } else if (req.session.loggedin && req.session.isadmin) {
    res.render("pages/events_admin", {});
  } else {
    res.redirect("/login.html");
  }
});

//Sign In page
app.get("/signIn", function (req, res) {
  res.sendFile("public/login.html", { root: __dirname });
});

//Register page
app.get("/register", function (req, res) {
  res.sendFile("public/register.html", { root: __dirname });
});

//User Events page
app.get("/events_user", function (req, res) {
  if (!req.session.loggedin) {
    res.redirect("/login.html");
  }

  if (!req.session.isadmin) {
    db.collection("events")
    .find({})
    .toArray(function (err, result) {
      events_timeframe = []
      result.forEach(events => {
        event_time = events.session_start_time
        current_time = new Date().get_hour()
        event_time = (int)(event_time.split(":")[0])
        if(Math.absoulute((event_time - current_time)) <= 1){
          events_timeframe.push(events)
        }
    })
      res.render("pages/events_user", {
        events: event_timeframe
      });
    })
    res.render("pages/events_user");
  }
});

//Admin Events page
app.get("/events_admin", function (req, res) {
  if (!req.session.loggedin) {
    res.redirect("/login.html");
  }

  if (req.session.isadmin) {
    db.collection("events")
      .find({})
      .toArray(function (err, result) {
        if (err) throw err;
        res.render("pages/events_admin", {
          events: result,
        });
      });
  }
});

//User Profile page
app.get("/profile", function (req, res) {
  if (!req.session.loggedin) {
    res.redirect("/login.html");
  }

  if (!req.session.isadmin) {
    db.collection("users")
      .find({ email: req.session.currentuser })
      .toArray(function (err, result) {
        if (err) throw err;
        res.render("pages/profile", {
          users: result,
        });
      });
  }
});

app.get("/create_events", function (req, res) {
  if (!req.session.isadmin) {
    res.redirect("/profile");
  } else {
    res.render("pages/create_events");
  }
});

//Admin Users page
app.get("/users", function (req, res) {
  if (!req.session.loggedin) {
    res.redirect("/login.html");
  }

  if (req.session.isadmin) {
    db.collection("users")
      .find({ isAdmin: false })
      .toArray(function (err, result) {
        if (err) throw err;
        res.render("pages/users", {
          users: result,
        });
      });
  }
});

//--------------------------------- POST ROUTES ----------------------------------------

app.post("/dologin", function (req, res) {
  console.log(JSON.stringify(req.body));
  var email = req.body.email;
  var pword = req.body.pass;
  db.collection("users").findOne({ email: email }, function (err, result) {
    if (err) throw err;

    if (!result) {
      res.redirect("/signIn");
      return;
    }

    if (result.password == pword) {
      req.session.loggedin = true;

      req.session.currentuser = email;
      req.session.isadmin = result.isAdmin;
      console.log("user logged in");
      console.log("email: " + req.session.currentuser);
      console.log("is admin: " + req.session.isadmin);
      if (result.isAdmin == true) {
        res.redirect("/events_admin");
      } else {
        res.redirect("/events_user");
      }
    } else {
      res.redirect("/signIn");
    }
  });
});

app.post("/doregister", function (req, res) {
  var pass1 = req.body.pass;
  var pass2 = req.body.passConfirm;

  if (pass1 != pass2) {
    alert("passwords do not match!");
  } else {
    //we create the data string from the form components that have been passed in
    var datatostore = {
      firstname: req.body.first_name,
      lastname: req.body.last_name,
      dob: req.body.dob,
      postcode: req.body.postcode,
      email: req.body.email,
      emergency: {
        name: req.body.emergency_name,
        phonenumber: req.body.emergency_phone,
      },
      isAdmin: false,
      password: req.body.pass,
    };

    //once created we just run the data string against the database and all our new data will be saved/
    db.collection("users").save(datatostore, function (err, result) {
      if (err) throw err;
      console.log("added user to database");
      //when complete redirect to the index
      res.redirect("/login.html");
    });
  }
});

app.post("/createevent", function (req, res) {
  //we create the data string from the form components that have been passed in
  var datatostore = {
    session_id: Math.floor(1000 + Math.random() * 9000),
    session_start_time: req.body.session_start_time,
    session_end_time: req.body.session_end_time,
    date_of_event: req.body.day_of_session,
    session_name: req.body.session_name,
    session_location: req.body.location,
  };

  //once created we just run the data string against the database and all our new data will be saved/
  db.collection("events").save(datatostore, function (err, result) {
    if (err) throw err;
    console.log("added event to database");
    //when complete redirect to the index
    res.redirect("/events_admin");
  });
});

//Starts the server
app.listen(8080);
