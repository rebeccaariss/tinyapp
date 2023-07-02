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

module.exports = getUserByEmail;