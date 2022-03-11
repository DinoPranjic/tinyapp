const express = require("express");
const app = express();

const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require('bcryptjs');

const cookieSession = require('cookie-session');

// helper functions
const { emailLookUp, urlsForUser, generateRandomString } = require('./helpers');

// allows for images in ejs templates
app.use(express.static('docs'));

//sets encrypted cookies
app.use(cookieSession({
  name: 'session',
  keys: ["dino"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.set("view engine", "ejs");

const urlDatabase = {};

const users = {};

//Homepage
app.get("/", (req, res) => {
  const templateVars = {
    "username": users[req.session.user_id]
  };

  res.render('welcome', templateVars);
  
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// main urls page
app.get("/urls", (req, res) => {
  const UserUrlDatabase = urlsForUser(req.session.user_id, urlDatabase);

  const templateVars = {
    username: users[req.session.user_id],
    urls: UserUrlDatabase
  };

  //checks if user is logged on
  if (!users[req.session.user_id]) {
    const templateVars = {
      "error" : {
        "msg": "You must be logged in to view URLs!"
      },
      "username": users[req.session.user_id]
    };
    return res.status(400).render('error', templateVars);
  }

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: users[req.session.user_id]
  };

  // Checks if user is logged on
  if (!users[req.session.user_id]) {
    const templateVars = {
      "error" : {
        "msg": "You must be logged in to create short URLS!"
      },
      "username": users[req.session.user_id]
    };
    return res.render('error', templateVars);
  }

  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL;

  //checks if url exists first
  if (urlDatabase[req.params.shortURL]) {
    longURL = urlDatabase[req.params.shortURL]["longURL"];
  } else {
    const templateVars = {
      "error" : {
        "msg": "Sorry! That URL doesn't seem to exist!"
      },
      "username": users[req.session.user_id]
    };
    return res.status(400).render('error', templateVars);
  }

  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!users[req.session.user_id]) {
    const templateVars = {
      "error" : {
        "msg": "You must be logged in to do that!"
      },
      "username": users[req.session.user_id]
    };
    return res.status(400).render('error', templateVars);
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]["longURL"],
    username: users[req.session.user_id]};

  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const newURL = generateRandomString();

  if (!users[req.session.user_id]) {
    const templateVars = {
      "error" : {
        "msg": "You must be logged in to add a short URL!"
      },
      "username": users[req.session.user_id]
    };
    return res.status(400).render('error', templateVars);
  }


  urlDatabase[newURL] = {
    longURL: longURL,
    userID: req.session.user_id
  };

  const templateVars = {
    shortURL: `${newURL}`,
    longURL: `${urlDatabase[newURL]["longURL"]}`,
    username: users[req.session.user_id]};

  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;

  //checks if user is logged in first
  if (!users[req.session.user_id]) {
    const templateVars = {
      "error" : {
        "msg": "You must be logged in to do that!"
      },
      "username": users[req.session.user_id]
    };
    return res.status(400).render('error', templateVars);
  }

  //if user is not owner of URL display this message
  if (urlDatabase[shortURL]["userID"] !== req.session.user_id) {
    const templateVars = {
      "error" : {
        "msg": "That URL does not belong to you!"
      },
      "username": users[req.session.user_id]
    };
    return res.status(400).render('error', templateVars);
  }

  urlDatabase[shortURL]["longURL"] = newLongURL;

  const templateVars = {
    shortURL: `${shortURL}`,
    longURL: `${newLongURL}`,
    username: users[req.session.user_id] };

  res.render("urls_show", templateVars);

});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;

  //checks if URL exists
  if (!urlDatabase[shortURL]) {
    const templateVars = {
      "error" : {
        "msg": "That URL does not exist!"
      },
      "username": users[req.session.user_id]
    };
    return res.status(400).render('error', templateVars);
  }

  //checks if user is logged in
  if (!users[req.session.user_id]) {
    const templateVars = {
      "error" : {
        "msg": "You must be logged in to do that!"
      },
      "username": users[req.session.user_id]
    };
    return res.status(400).render('error', templateVars);
  }

  //checks if user owns the URL
  if (urlDatabase[shortURL]["userID"] !== req.session.user_id) {
    const templateVars = {
      "error" : {
        "msg": "This URL does not belong to you!"
      },
      "username": users[req.session.user_id]
    };
    return res.status(400).render('error', templateVars);
  }

  //delete URL from database
  delete urlDatabase[shortURL];

  //recreate new database with all URLS owned by user
  const UserUrlDatabase = urlsForUser(req.session.user_id);

  //send mofified database and user back to urls page
  const templateVars = {
    urls: UserUrlDatabase,
    username: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {

  const templateVars = {
    username: users[req.session.user_id]
  };

  if (users[req.session.user_id]) {
    return res.redirect("/urls");
  }

  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  // hashes password
  const hashedPassword = bcrypt.hashSync(userPassword, 10);

  // checks if email and password are empty strings
  if (userEmail === "" || userPassword === "") {
    const templateVars = {
      "error" : {
        "msg": "Invalid Email or password!"
      },
      "username": users[req.session.user_id]
    };

    return res.status(400).render('error', templateVars);
  }

  // checks if email is already in use
  if (emailLookUp(userEmail, users)) {
    const templateVars = {
      "error" : {
        "msg": "That email is already in use!"
      },
      "username": users[req.session.user_id]
    };
    return res.status(400).render('error', templateVars);
  } else {
    req.session.user_id = userID;

    //stores only hashed password
    users[req.session.user_id] = {
      "id": userID,
      "email": userEmail,
      "password": hashedPassword
    };

    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    username: users[req.session.user_id]

  };
  // if user already logged in, redirect to urls page
  if (users[req.session.user_id]) {
    return res.redirect("/urls");
  }

  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  let userID = "";

  if (emailLookUp(inputEmail, users)) {
    userID = emailLookUp(inputEmail, users);
  } else {
    const templateVars = {
      "error" : {
        "msg": "Incorrect username!"
      },
      "username": users[req.session.user_id]
    };
    res.status(403).render('error', templateVars);
  }

  // checks stored hashed password against user input password
  if (!bcrypt.compareSync(inputPassword, users[userID]["password"])) {
    const templateVars = {
      "error" : {
        "msg": "Incorrect password!"
      },
      "username": users[req.session.user_id]
    };
    res.status(403).render('error', templateVars);
  } else {
    req.session.user_id = userID;
    res.redirect("/urls");
  }
  
});

app.post("/logout", (req, res) => {

  // Destroys cookie session
  req.session = null;
  res.redirect("/login");
});


app.listen(PORT, () => {
  console.log(`TinyApp Server listening on port ${PORT}!`);
});