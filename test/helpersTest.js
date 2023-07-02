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

const testUrlDatabase = {
  i3BoGr: {
    longURL: "https://transequality.org/",
    userID: "aJ48lW"
  },
  d8Eks0: {
    longURL: "https://www.thetrevorproject.org/",
    userID: "aJ48lW"
  },
  lW8f5h: {
    longURL: "https://itgetsbettercanada.org/",
    userID: "kae7Gd"
  },
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

describe('urlsForUser', function() {
  it('should return an object containing short URL(s) for the given user ID', function() {
    const urlsActual = urlsForUser("aJ48lW", testUrlDatabase);
    const urlsExpected = {
      i3BoGr: {
        longURL: "https://transequality.org/",
        userID: "aJ48lW"
      },
      d8Eks0: {
        longURL: "https://www.thetrevorproject.org/",
        userID: "aJ48lW"
      }
    };
    assert.deepEqual(urlsActual, urlsExpected);
  });

  it('should return an empty object where user cannot be located in the database', function() {
    const urlsActual = urlsForUser("LDj3n6", testUrlDatabase);
    const urlsExpected = {};

    assert.deepEqual(urlsActual, urlsExpected);
  });
});