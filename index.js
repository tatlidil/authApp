const express = require("express");
const app = express();

app.use(express.static(__dirname)); // Serve static files from the current directory

const bodyParser = require("body-parser"); // Middleware to parse JSON and URL-encoded data
const expressSession = require("express-session")({
  secret: "secret", // Secret key for signing the session ID cookie
  resave: false, // Avoids resaving session if not modified
  saveUninitialized: false, // Do not save uninitialized sessions
  cookie: {
    secure: false, // Set to true in production when using HTTPS, false for HTTP
    maxAge: 60000, // Session cookie expires in 60000 milliseconds (60 seconds)
  },
});

app.use(bodyParser.json()); // Use bodyParser to parse JSON-formatted requests
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded data with querystring library
app.use(expressSession); // Apply express session middleware with cookie settings

const port = process.env.PORT || 3000; // Use environment provided port or 3000

app.listen(port, () => console.log("App listening on port " + port)); // Start the server and log the port

// Passport configuration for authentication

const passport = require("passport"); // Require passport for authentication

app.use(passport.initialize()); // Initialize passport middleware
app.use(passport.session()); // Enable passport persistent sessions

// MongoDB connection setup

const mongoose = require("mongoose"); // Require mongoose for MongoDB interactions
const passportLocalMongoose = require("passport-local-mongoose"); // Mongoose plugin for Passport

mongoose.connect("mongodb://localhost/MyDatabase", { // Connect to MongoDB
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema; // Define a new schema
const UserDetail = new Schema({ // Schema for user details
  username: String,
  password: String,
});

UserDetail.plugin(passportLocalMongoose); // Add passport-local-mongoose plugin to schema
const UserDetails = mongoose.model("userInfo", UserDetail, "userInfo"); // Create model from schema

passport.use(UserDetails.createStrategy()); // Use static authenticate method of model as Passport strategy
passport.serializeUser(UserDetails.serializeUser()); // Used to serialize the user for the session
passport.deserializeUser(UserDetails.deserializeUser()); // Used to deserialize the user

// Routes

const connectEnsureLogin = require("connect-ensure-login"); // Middleware to ensure user is logged in

app.post("/login", (req, res, next) => { // Post route for login
  passport.authenticate("local", (err, user, info) => { // Use local strategy for authentication
    if (err) {
      return next(err); // Handle errors
    }
    if (!user) {
      return res.redirect("/login?info=" + info); // Redirect back to login page with info parameters if login fails
    }
    req.logIn(user, function (err) { // Log in the user
      if (err) {
        return next(err); // Handle login error
      }
      return res.redirect("/"); // Redirect to home page after successful login
    });
  })(req, res, next);
});

app.get("/login", (req, res) => // Get route for serving the login page
  res.sendFile("html/login.html", { root: __dirname })
);

app.get("/", connectEnsureLogin.ensureLoggedIn(), (req, res) => // Route for home page, ensure user is logged in
  res.sendFile("html/index.html", { root: __dirname })
);

app.get("/private", connectEnsureLogin.ensureLoggedIn(), (req, res) => // Route for private page, ensure user is logged in
  res.sendFile("html/private.html", { root: __dirname })
);

app.get("/user", connectEnsureLogin.ensureLoggedIn(), (req, res) => // Route to get user info, ensure user is logged in
  res.send({ user: req.user })
);

app.get("/logout", (req, res) => { // Route for logging out
  req.logOut(); // Passport's logout method
  res.sendFile("html/logout.html", { root: __dirname }); // Send logout confirmation page
});

// UserDetails.register({ username: "paul", active: false }, "paul");
// UserDetails.register({ username: "joy", active: false }, "joy");
// UserDetails.register({ username: "ray", active: false }, "ray");
