const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const app = express();

const PORT = 8080; // default port 8080
const SALT = 10;

const { getUserByEmail, urlsForUser, generateRandomString } = require("./helpers.js");

app.set("view engine", "ejs");
// Middleware for parsing POST request body to make it human-readable:
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: [generateRandomString()],
  maxAge: 24 * 60 * 60 * 1000 // 24hours
}));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {};


/**
 * GET PAGES ----------------------------------------------------------------------------------------------------------
 */


// Trying to access home route results in "Cannot GET" message;
// redirecting to /urls route to avoid confusion:
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Display URL index page:
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect(401, "/login");
  } else {
    const templateVars = {
      urls: urlsForUser(req.session.user_id, urlDatabase), 
      user: users[req.session.user_id]
    };
    res.render("urls_index", templateVars);
  }
});

// Display page for creating new URL:
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect("/login");
  } else {
    const templateVars = { user: users[userId] };
    res.render("urls_new", templateVars);
  }
});

// Registration page:
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[userId] };
    res.render("urls_registration", templateVars);
  }
});

// Log in page:
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[userId] };
    res.render("urls_login", templateVars);
  }
});

// Show card containing long URL and short URL link (and edit option):
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  if (urlDatabase[req.params.id]) {
    if (userId === urlDatabase[req.params.id].userID) {
      const templateVars = {
        id: req.params.id,
        longURL: urlDatabase[req.params.id].longURL,
        user: users[req.session.user_id]
      };
      res.render("urls_show", templateVars);
    } else if (!userId) {
      res.status(401).send("Sorry, you must be logged in to perform this action.");
    } else if (userId !== urlDatabase[req.params.id].userID) {
      res.status(403).send("Sorry, you do not have permission to access this page.");
    }
  } else {
    res.status(404).send("Sorry, we couldn't find the page you're looking for.");
  }
});

// On short URL click, redirect user to the corresponding long URL:
app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send("Sorry, we couldn't find the page you're looking for.");
  }
});


/**
 * POST ROUTES ----------------------------------------------------------------------------------------------------------
 */


// Register (create) new user (action):
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const salt = bcrypt.genSaltSync(SALT);
  const hashedPassword = bcrypt.hashSync(password, salt);

  if (!email || !password) {
    res.status(400).send("Please enter a valid email and password.");
  } else if (getUserByEmail(email, users)) {
    res.status(400).send("It looks like an account with this email address already exists!");
  } else {
    const userRandomID = generateRandomString();
    users[userRandomID] = {
      id: userRandomID,
      email: email,
      password: hashedPassword
    };
    req.session.user_id = userRandomID;
    res.redirect("/urls");
  }
});

// Log in (action):
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  if (!getUserByEmail(email, users)) {
    res.status(403).send("Sorry, we couldn't find an account associated with this email address.");
  } else {
    const pwdsMatch = bcrypt.compareSync(password, user.password);
    if (!pwdsMatch) {
      res.status(403).send("Incorrect password: the password entered does not match our records.");
    }
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

// Log out (action):
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Add a new URL to the index:
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.status(401).send("Sorry, only registered users can create short URLs. Please log in or create an account");
  } else {
    const tinyURL = generateRandomString();
    urlDatabase[tinyURL] = {
      longURL: req.body.longURL,
      userID: userId
    };
    res.redirect(`/urls/${tinyURL}`);
  }
});

// Edit URL:
app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

// Update an existing URL (action):
app.post("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  // if the URL doesn't exist in the database at all:
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("Sorry, this URL does not exist in our database.");
  // if the appropriate user is logged in:
  } else if (userId === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  // if user is not logged in at all:
  } else if (!userId) {
    res.status(401).send("Sorry, you must be logged in to perform this action.");
  // if someone is logged in, but they do not own the URL:
  } else if (userId !== urlDatabase[req.params.id].userID) {
    res.status(403).send("Sorry, you do not have permission to edit this URL.");
  }
});

// Delete an existing URL:
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  // if the URL doesn't exist in the database at all:
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("Sorry, this URL does not exist in our database.");
  // if the appropriate user is logged in:
  } else if (userId === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  // if user is not logged in at all:
  } else if (!userId) {
    res.status(401).send("Sorry, you must be logged in to perform this action.");
  // if someone is logged in, but they do not own the URL:
  } else if (userId !== urlDatabase[req.params.id].userID) {
    res.status(403).send("Sorry, you do not have permission to delete this URL.");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});