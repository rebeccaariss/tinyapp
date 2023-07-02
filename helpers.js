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

const urlsForUser = function(id, urlDatabase) {
  const urls = {};
  for (const tinyURL in urlDatabase) {
    if (urlDatabase[tinyURL].userID === id) {
      urls[tinyURL] = urlDatabase[tinyURL];
    }
  }
  return urls;
};

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

module.exports = {
  getUserByEmail,
  urlsForUser,
  generateRandomString
};