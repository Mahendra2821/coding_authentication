const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeServerAndDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("server Started"));
  } catch (e) {
    console.log(`Error:${e.message}`);
    process.exit(1);
  }
};
initializeServerAndDatabase();
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  console.log(username);
  const selectUserQuery = `SELECT * FROM user WHERE username="${username}";`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    if (password.length >= 5) {
      const createUserQuery = `
        INSERT INTO 
            user (username, name, password, gender, location) 
        VALUES 
            (
            '${username}', 
            '${name}',
            '${hashedPassword}', 
            '${gender}',
            '${location}'
            )`;
      await db.run(createUserQuery);

      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const dbUser = await db.get(selectUserQuery);
  console.log(dbUser);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    console.log(password, dbUser.password);
    const evaluatePassword = await bcrypt.compare(password, dbUser.password);
    if (evaluatePassword) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//success
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  console.log(newPassword, oldPassword);

  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  console.log(dbUser);
  const evaluatePassword = await bcrypt.compare(oldPassword, dbUser.password);

  const lengthOFNewPassword = newPassword.length;
  console.log(evaluatePassword);
  if (evaluatePassword) {
    if (lengthOFNewPassword < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = `UPDATE user SET password=${newHashedPassword} WHERE username='${username}';`;
      await db.run(updateQuery);
      console.log(db);
      console.log(newHashedPassword);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
