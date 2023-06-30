const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

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

app.set("view engine", "ejs");
// Middleware for parsing POST request body to make it human-readable:
app.use(express.urlencoded({ extended: true }));

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id]};
  // console.log(req.cookies.user_id);
  // console.log(templateVars);
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const userId = req.cookies.user_id;
  if (!userId) {
    res.status(401).send("Sorry, only registered users can create short URLs. Please log in or create an account");
  } else {
    console.log(req.body); // Log the POST request body to the console
    const tinyURL = generateRandomString();
    urlDatabase[tinyURL] = req.body.longURL;
    res.redirect(`/urls/${tinyURL}`);
  }
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id;
  if (!userId) {
    res.redirect("/login");
  } else {
    const templateVars = { user: users[userId] };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const userId = req.cookies.user_id;
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
  if (!email || !password) {
    res.status(400).send("Please enter a valid email and password.");
  } else if (getUserByEmail(email, users)) {
    res.status(400).send("It looks like an account with this email address already exists!");
  } else {
    const userRandomID = generateRandomString();
    users[userRandomID] = { id: userRandomID, email: email, password: password };
    res.cookie("user_id", userRandomID);
    // console.log(users[userRandomID]);
    res.redirect("/urls");
  }
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id];
    res.redirect(longURL);
  } else {
    res.status(404).send("Sorry, we couldn't find the page you're looking for.");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.get("/login", (req, res) => {
  const userId = req.cookies.user_id;
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
  let userId;

  if (!getUserByEmail(email, users)) {
    res.status(403).send("Sorry, we couldn't find an account associated with this email address.");
  } else {
    const user = getUserByEmail(email, users);
    userId = user.id;
    if (password !== user.password) {
      res.status(403).send("Incorrect password: the password entered does not match our records.");
    }
  }

  res.cookie("user_id", userId);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// trying to access home route results in "Cannot GET" message;
// redirecting to /urls route to avoid confusion:
app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});