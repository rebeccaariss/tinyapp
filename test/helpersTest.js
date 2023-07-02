const { assert } = require('chai');

const { getUserByEmail, urlsForUser, generateRandomString } = require("../helpers.js");

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it('should return undefined where email does not exist in database', function() {
    const user = getUserByEmail("bob_leponge@krustykrab.com", testUsers);
    const expectedUser = undefined;
    assert.equal(user, expectedUser);
  });
});