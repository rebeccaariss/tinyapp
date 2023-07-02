const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const app = express();

const PORT = 8080; // default port 8080
const SALT = 10;

// generateRandomString function implemented based on
// https://www.programiz.com/javascript/examples/generate-random-strings#:~
// :text=random()%20method%20is%20used,a%20random%20character%20is%20generated.
const generateRandomString = function() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
};

app.set("view engine", "ejs");
// Middleware for parsing POST request body to make it human-readable:
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: [generateRandomString()],
  maxAge: 24 * 60 * 60 * 1000 // 24hours
}));

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };
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

const urlsForUser = function(id) {
  const urls = {};
  for (const tinyURL in urlDatabase) {
    if (urlDatabase[tinyURL].userID === id) {
      urls[tinyURL] = urlDatabase[tinyURL];
    }
  }
  return urls;
};

const getUserByEmail = function(email, users) {
  let userObj;
  // we don't need to know the user_id to access values here:
  for (const id in users) {
    if (users[id].email === email) {
      userObj = users[id];
    }
  }
  return userObj;
};

// trying to access home route results in "Cannot GET" message;
// redirecting to /urls route to avoid confusion:
app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect(401, "/login");
  } else {
    const templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id]};
    // console.log(req.cookies.user_id);
    // console.log(templateVars);
    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.status(401).send("Sorry, only registered users can create short URLs. Please log in or create an account");
  } else {
    console.log(req.body); // Log the POST request body to the console
    const tinyURL = generateRandomString();
    urlDatabase[tinyURL] = {
      longURL: req.body.longURL,
      userID: userId
    };
    res.redirect(`/urls/${tinyURL}`);
  }
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect("/login");
  } else {
    const templateVars = { user: users[userId] };
    res.render("urls_new", templateVars);
  }
});

// this is the page with the card containing long URL and short URL link (and edit option)
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  if (urlDatabase[req.params.id]) {
    if (userId === urlDatabase[req.params.id].userID) {
      const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: users[req.session.user_id] };
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

app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[userId] };
    res.render("urls_registration", templateVars);
  }
});

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
    users[userRandomID] = { id: userRandomID, email: email, password: hashedPassword };
    req.session.user_id = userRandomID;
    // console.log(users[userRandomID]);
    res.redirect("/urls");
  }
});

// this takes the user to the corresponding long URL
app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send("Sorry, we couldn't find the page you're looking for.");
  }
});

// for deleting an existing URL:
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

// for updating existing URL:
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

app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (userId) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[userId] };
    res.render("urls_login", templateVars);
  }
});

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

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});