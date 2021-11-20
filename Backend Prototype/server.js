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
    res.redirect("/events_user");
  } else if (req.session.loggedin && req.session.isadmin) {
    res.redirect("/events_admin");
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
        if (err) throw err;
        events_timeframe = [];
        result.forEach((event_var) => {
          event_time = event_var.session_start_time;
          current_time = new Date().getHours();
          event_time = parseInt(event_time.split(":")[0]);
          if (Math.abs(event_time - current_time) <= 1) {
            events_timeframe.push(event_var);
          }
        });
        res.render("pages/events_user", {
          events: events_timeframe,
        });
      });
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

// edit_events page
 
app.get('/edit_event', function(req, res) {
  if(!req.session.loggedin){res.redirect('/login');}
  
  
  var id = req.query.event;
  
 
  db.collection('events').findOne({"session_id": id}, function(err, result) {
    if (err) throw err;
   


    res.render('/edit_event', {
      event: result
    })
  });

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

//When user updates their details from the profile page
app.post("/updateprofile", function (req, res) {
  //Get the database entry for the currently logged in user
  db.collection("users").findOne(
    { email: req.session.currentuser },
    function (err, current_entry) {
      if (err) throw err;
      console.log(current_entry);

      //If the user does not wish to update their password
      if (req.body.pass == "") {
        var newvalues = {
          $set: {
            postcode: req.body.postcode,
            email: req.body.email,
            emergency: {
              name: req.body.emergency_name,
              phonenumber: req.body.emergency_phone,
            },
          },
        };
        //Push updated information to database
        db.collection("users").updateOne(
          current_entry,
          newvalues,
          function (err, res) {
            if (err) throw err;
            console.log("Record successfully updated (password not changed)");
          }
        );
        res.redirect("/events_user");
      } else {
        //If the user has decided to change their password
        //Check that the entered password matches the current password
        //And that the 2 new passwords entered match
        if (
          req.body.pass == current_entry.password &&
          req.body.newPass == req.body.newPassConfirm
        ) {
          var newvalues = {
            $set: {
              postcode: req.body.postcode,
              email: req.body.email,
              password: req.body.newPass,
              emergency: {
                name: req.body.emergency_name,
                phonenumber: req.body.emergency_phone,
              },
            },
          };
          //Push updated information to database
          db.collection("users").updateOne(
            current_entry,
            newvalues,
            function (err, res) {
              if (err) throw err;
              console.log("Record successfully updated (password changed)");
            }
          );
          res.redirect("/events_user");
        } else {
          console.log("Incorrect password(s) entered");
        }
      }
    }
  );
});

//logout button
app.get("/dologout", function (req, res) {
  req.session.destroy();
  res.redirect("/login.html");
});

//delete session
app.get("/delete_session", function (req, res) {
  var session_name_to_remove = req.body.session_name;
  db.collection("events").deleteOne(
    { session_name: session_name_to_remove },
    function (err, result) {
      if (err) throw err;
      console.log("session removed");
      res.redirect("/events_admin")
    }
  );
});

//Deletes the currently logged in user from the database
app.post("/deleteaccount", function (req, res) {
  //Check that the user is logged in
  if (!req.session.loggedin) {
    res.redirect("/login.html");
    return;
  }

  var email = req.session.currentuser;
  db.collection("users").deleteOne({ email: email }, function (err, result) {
    if (err) throw err;
    //If successful, redirect user to login page and destroy session
    req.session.destroy();
    res.redirect("/login.html");
  });
});

//Starts the server
app.listen(8080);
