const emailLookUp = (email, database) => {
  let user = ""
  for (const key in database) {
    if (database[key]["email"] === email) {
      user = database[key]["id"];
      return user;
    } else {
      continue;
    }
  }
  return undefined;
}


const urlsForUser = (id, database) => {
  const newDatabase = {};
  for (const key in database) {
    if (database[key]["userID"] === id) {
      newDatabase[key] = database[key];
    } 
  } 
  return newDatabase;
}

//no way to test with mocha and chai since random string is being generated
const generateRandomString = () => {
  result = '';
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

module.exports = {
  emailLookUp,
  urlsForUser,
  generateRandomString
};