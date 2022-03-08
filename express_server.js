const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser')
app.use(cookieParser())

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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



app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    username: users[req.cookies["user_id"]],
    urls: urlDatabase 
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: users[req.cookies["user_id"]]
  };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: `${urlDatabase[req.params.shortURL]}`,
    username: users[req.cookies["user_id"]]};

  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const newURL = generateRandomString();


  urlDatabase[newURL] = longURL;

  const templateVars = { 
    shortURL: `${newURL}`, 
    longURL: `${longURL}`,
    username: users[req.cookies["user_id"]]};

  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;

  urlDatabase[shortURL] = newLongURL;

  const templateVars = { 
    shortURL: `${shortURL}`, 
    longURL: `${newLongURL}`,
    username: users[req.cookies["user_id"]] }
  res.render("urls_show", templateVars);

})

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;

  delete urlDatabase[shortURL];

  const templateVars = { 
    urls: urlDatabase,
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
    "password": userPassword
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

  if (users[userID]["password"] !== inputPassword) {
    res.status(403).send("Incorrect password");
  } else {  
      res.cookie("user_id", userID);
      res.redirect("/urls");
}
  
});

app.post("/logout", (req, res) => {

  res.clearCookie("user_id");
  res.redirect("/urls");
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});