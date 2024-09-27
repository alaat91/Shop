const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
//const csurf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const { doubleCsrf } = require("csrf-csrf");

const MONGODB_URI =
  "mongodb+srv://alaa:VGBROuEktfc8EC6A@cluster0.6qnuz.mongodb.net/shop?retryWrites=true&w=majority&appName=Cluster0";

// csrf-csrf vars:
const CSRF_SECRET = "super csrf secret";
const COOKIES_SECRET = "super cookie secret";
const CSRF_COOKIE_NAME = "_csrf";

const errorController = require("./controllers/error");
const User = require("./models/user");

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const doubleCsrfOptions = {
  getSecret: () => CSRF_SECRET, // A function that optionally takes the request and returns a secret
  cookieName: CSRF_COOKIE_NAME, // The name of the cookie to be used, recommend using Host prefix.
  cookieOptions: { sameSite: "lax", secure: false },
  size: 64, // The size of the generated tokens in bits
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest: (req) => {
    if (req.body._csrf) {
      return req.body._csrf; // Name of your input from the view (look explanation below)
    }
    return req["x-csrf-token"];
  },
};

//const csrfProtection = csurf("123456789iamasecret987654321look");
const { doubleCsrfProtection } = doubleCsrf(doubleCsrfOptions);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(cookieParser(COOKIES_SECRET));
//app.use(csrfProtection);
app.use(doubleCsrfProtection);

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        console.log("No user found");
        return next(); // Proceed without attaching `req.user` if no user is found
      }
      req.user = user;
      console.log("User found:", req.user); // Add a log to check if the user is being found correctly
      next();
    })
    .catch((err) => console.log(err));
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken(); // Generates CSRF token and passes it to views
  }
  next();
});

// Logging middleware for CSRF tokens
app.use((req, res, next) => {
  console.log("CSRF Cookie:", req.cookies[CSRF_COOKIE_NAME]); // Logs the CSRF token stored in the cookie
  console.log("Request CSRF Token:", req.body._csrf); // Logs the CSRF token sent in the request body (e.g., from a POST request)
  console.log("Expected CSRF Token (generated):", req.csrfToken());
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    writeConcern: { w: "majority" },
  })
  .then((result) => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
