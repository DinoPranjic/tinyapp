const { assert } = require('chai');

const { emailLookUp, urlsForUser } = require('../helpers.js');

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

const testDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "default"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "default"
  },
  "r3rgts": {
    longURL: "http://www.facebook.com",
    userID: "fake"
  }

};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = emailLookUp("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(expectedUserID, user);
  });

  it('should return undefined for nonexistant email', function() {
    const user = emailLookUp("fake@fake.com", testUsers);
    assert.isUndefined(user, 'user is not defined');
  })

});

describe('urlsForUser', function() {
  it('should return all urls owned by a user', function() {
    const urlsUser = urlsForUser("default", testDatabase);
    const expectedURLS = {
      "b2xVn2": {
        longURL: "http://www.lighthouselabs.ca",
        userID: "default"
      },
      "9sm5xK": {
        longURL: "http://www.google.com",
        userID: "default"
      }
    };

    assert.deepEqual(urlsUser, expectedURLS);
  })

  it('should return empty object if user does not exist', function() {
    const urlsUser = urlsForUser("person", testDatabase);
    const expectedURLS = {};

    assert.deepEqual(urlsUser, expectedURLS);
  })
})