const path = require("path");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const { doubleCsrf } = require("csrf-csrf");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
require("dotenv").config();

const MONGODB_URI = process.env.MONGO_CONNECTION_STRING;

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

function fileFilter(req, file, cb) {
  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted

  // To reject this file pass `false`, like so:
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    // To accept the file pass `true`, like so:
    cb(null, false);
  }
}

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

//Adding helmet middleware to protect my response headers
// app.use(helmet());

// Adding compression middleware to compress the size of my assets files
app.use(compression());

// Writing the user logs from morgan to a file called access.log using writable stream function and append the logs using flag 'a'
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  {
    flags: "a",
  }
);
// Adding logging middleware to produce a log entry
app.use(morgan("combined", { stream: accessLogStream }));

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
    return req.headers["x-csrf-token"];
  },
};

//const csrfProtection = csurf("123456789iamasecret987654321look");
const { doubleCsrfProtection } = doubleCsrf(doubleCsrfOptions);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: storage, fileFilter: fileFilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(flash());
app.use(cookieParser(COOKIES_SECRET));

// CSRF protection middleware
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
      // Add a log to check if the user is being found correctly
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken(); // Generates CSRF token and passes it to views
  }
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.get("/500", errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
  // res.status(500).render("500", {
  //   pageTitle: "Error!",
  //   path: "/500",
  //   isAuthenticated:req.session.isLoggedIn,
  // });
  console.log("error:", error);
  res.redirect("/500");
});

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    writeConcern: { w: "majority" },
  })
  .then((result) => {
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => {
    console.log(err);
  });
