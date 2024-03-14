const express = require("express");
const dotenv = require("dotenv");
const { con } = require("./dbService.js");
const app = express();
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth.js");
dotenv.config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("entry");
});
app.get("/farm", (req, res) => {
  res.render("farm");
});

app.get("/crop", auth, (req, res) => {
  res.render("crop");
  console.log(req.user);
});

app.get("/ecommerce", (req, res) => {
  res.render("ecommerce");
});
app.get("/transaction", (req, res) => {
  res.render("transaction");
});

app.get("/cart", (req, res) => {
  res.render("cart");
});

app.post("/login-api", (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  // console.log(con);

  con.query(
    "SELECT * FROM users where username='" + username + "';",
    async function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      if (result.length == 0) {
        res.status(400).send("Error, user doesnot exist");
      } else {
        var pass = result[0].password;
        console.log(pass, password);
        const validPassword = await bcrypt.compare(password, pass);
        console.log(validPassword);
        if (!validPassword) {
          res.status(400).send("Invaid credentials");
          return;
        }
        res
          .status(200)
          .header("Set-Cookie", "x-auth-token=" + genJWT(username))
          .render("index");
      }
    }
  );
});

var genJWT = function (username) {
  const token = jwt.sign({ username: username }, "securetokendonotshare");
  return token;
};

app.post("/register-api", async (req, res) => {
  const { username, password, confirmPassword, email } = req.body;
  if (username && password && confirmPassword && email) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailPattern.test(email)) {
      //res.status(200).send("Validation complete");
      if (confirmPassword === password) {
        const salt = await bcrypt.genSalt(10);
        var hashedPassword = await bcrypt.hash(password, salt);
        con.query(
          "insert into users values('" +
            username +
            "','" +
            hashedPassword +
            "')",
          async function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            if (result.length == 0) {
              res.status(400).send("Error, user doesnot exist");
            } else {
              res.render("index");
            }
          }
        );
      }
    } else {
      res.status(400).send("Bad request");
    }
  }
});

// Login route
// app.get('/login/:username/:password', (req, res) => {
//     const { username, password } = req.params;
//     const db = dbService.getDbServiceInstance();
//     const result = db.validateUser(username, password);
//     result
//         .then(data => res.json({ data: data }))
//         .catch(err => console.log(err));
// });

// Start the server
//const PORT = process.env.PORT;
app.listen(3000, () => {
  console.log(`Server is running`);
});
