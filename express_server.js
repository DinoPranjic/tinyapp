const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser')
app.use(cookieParser())
const bcrypt = require('bcryptjs');

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "default"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "default"}
};

const users = {};

const generateRandomString = () => {
  result = '';
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

const emailLookUp = (input, needKey) => {
  for (const key in users) {
    if (users[key]["email"] === input) {
      if (!needKey) {
      return true;
      } else {
        return key;
      }
    } else {
      continue;
    }
  }
  return false;
    
};

const urlsForUser = (id) => {
  const newDatabase = {};
  for (const key in urlDatabase) {
    if (urlDatabase[key]["userID"] === id) {
      newDatabase[key] = urlDatabase[key]
    }
  }
  return newDatabase;
}



app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const UserUrlDatabase = urlsForUser(req.cookies["user_id"]);

  const templateVars = { 
    username: users[req.cookies["user_id"]],
    urls: UserUrlDatabase 
  };

  if (!users[req.cookies["user_id"]]) {
    return res.status(400).send('You must be logged in to view URLs')
  }

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: users[req.cookies["user_id"]]
  };

  if (!users[req.cookies["user_id"]]) {
    return res.redirect("/login")
  }

  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL;

  if (urlDatabase[req.params.shortURL]) {
    longURL = urlDatabase[req.params.shortURL]["longURL"]
  } else {
    return res.status(400).send('Sorry! That URL doesn\'t seem to exist!');
  }

  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL]["longURL"],
    username: users[req.cookies["user_id"]]};

  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const newURL = generateRandomString();

  if (!users[req.cookies["user_id"]]) {
    return res.status(400).send('You must be logged in to add a short URL!');
  }


  urlDatabase[newURL] = {
    longURL: longURL,
    userID: req.cookies["user_id"]
  }

  const templateVars = { 
    shortURL: `${newURL}`, 
    longURL: `${urlDatabase[newURL]["longURL"]}`,
    username: users[req.cookies["user_id"]]};

  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;

  //checks if user is logged in first
  if (!users[req.cookies["user_id"]]) {
    return res.status(400).send('You must be logged in to do that!')
  }

  //if user is not owner of URL display this message
  if(urlDatabase[shortURL]["userID"] !== req.cookies["user_id"]) {
    return res.status(400).send('That URL does not belong to you!')
  }

  urlDatabase[shortURL]["longURL"] = newLongURL;

  const templateVars = { 
    shortURL: `${shortURL}`, 
    longURL: `${newLongURL}`,
    username: users[req.cookies["user_id"]] }
  res.render("urls_show", templateVars);

})

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;

  //checks if URL exists
  if (!urlDatabase[shortURL]) {
    return res.status(400).send('That URL does not exist!');
  }

  //checks if user is logged in 
  if (!users[req.cookies["user_id"]]) {
    return res.status(400).send('You must be logged in to do that!');
  }

  //checks if user owns the URL
  if (urlDatabase[shortURL]["userID"] !== req.cookies["user_id"]) {
    return res.status(400).send('This URL does not belong to you!');
  }
  
  //delete URL from database
  delete urlDatabase[shortURL];

  //recreate new database with all URLS owned by user
  const UserUrlDatabase = urlsForUser(req.cookies["user_id"]);

  const templateVars = { 
    urls: UserUrlDatabase,
    username: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
})

app.get("/register", (req, res) => {

  const templateVars = {
    username: users[req.cookies["user_id"]]
  };

  if (users[req.cookies["user_id"]]) {
    return res.redirect("/urls");
  }

  res.render("registration", templateVars);
})

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(userPassword, 10);


  if (userEmail === "" || userPassword === "") {
    return res.status(400).send('Invalid email or password');
  }

  if (emailLookUp(userEmail, false)) {
    return res.status(400).send('That email is already in use.');
  } 

  else {
    users[userID] = {
    "id": userID,
    "email": userEmail,
    "password": hashedPassword
  };

  res.cookie("user_id", userID);
  res.redirect("/urls")
}
})

app.get("/login", (req, res) => {
  const templateVars = {
    username: users[req.cookies["user_id"]]

  }

  if(users[req.cookies["user_id"]]) {
    return res.redirect("/urls");
  }

  res.render("login", templateVars)
})

app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  let userID = "";

  if (emailLookUp(inputEmail, false)) {
    userID = emailLookUp(inputEmail, true);
  } else {
    res.status(403).send("Incorrect Username");
  }

  if (!bcrypt.compareSync(inputPassword, users[userID]["password"])){
    res.status(403).send("Incorrect password");
  } else {  
      res.cookie("user_id", userID);
      res.redirect("/urls");
}
  
});

app.post("/logout", (req, res) => {

  res.clearCookie("user_id");
  res.redirect("/login");
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});