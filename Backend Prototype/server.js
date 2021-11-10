const express = require("express");
const session = require("express-session");
const app = express();

app.use(session({
    secret: "cookie_secret",
    resave: true,
    saveUninitialized: true
}));

app.set("view engine", "ejs");

//Store static html files in the public folder
app.use(express.static("public"));

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
app.get("/signIn", function(req, res) {
    res.sendFile("public/signIn.html", { root: __dirname });
});

//Register page
app.get("/register", function(req, res) {
    res.sendFile("public/register.html", {root: __dirname });
});

//User Events page
app.get("/events_user", function(req, res) {
    res.render("pages/events_user");
});

//Admin Events page
app.get("/events_admin", function(req, res) {
    res.render("pages/events_admin");
});

//User Profile page
app.get("/profile", function(req, res) {
    res.render("pages/profile");
});

//Admin Users page
app.get("/users", function(req, res) {
    res.render("pages/users");
});

//--------------------------------- POST ROUTES ----------------------------------------

app.post('/dologin', function(req, res) {
    console.log(JSON.stringify(req.body))
    var email = req.body.email
    var pword = req.body.pass
})

//Starts the server
app.listen(8080);