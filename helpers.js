const emailLookUp = (email, database) => {
  for (const key in database) {
    if (database[key]["email"] === email) {
      return true;
    } else {
      continue;
    }
  }
  return false;
}

const userLookUp = (email, database) => {
  let id = "";
  for (const key in database) {
    if (database[key]["email"] === email) {
      id = database[key]["id"];
    }
  }
  return id;
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