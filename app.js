const express = require("express");
const dotenv = require("dotenv");
const { con } = require("./dbService.js");
const app = express();
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth.js");
const { v4: uuidv4 } = require("uuid");

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

app.get("/orders", (req, res) => {
  res.render("orders");
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
        var id = result[0].id;
        console.log(pass, password);
        const validPassword = await bcrypt.compare(password, pass);
        console.log(validPassword);
        if (!validPassword) {
          res.status(400).send("Invaid credentials");
          return;
        }
        res
          .status(200)
          .header("Set-Cookie", "x-auth-token=" + genJWT(id, username))
          .render("index");
      }
    }
  );
});

var genJWT = function (id, username) {
  const token = jwt.sign(
    { id: id, username: username },
    "securetokendonotshare"
  );
  return token;
};

app.post("/add-cart-api", auth, async (req, res) => {
  console.log(req.body);
  const user = req.user;
  console.log(req.user);
  var item = req.body.item;
  con.query(
    "select * from cart where item_id=" + item.id + " and complete=0;",
    async function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      if (result.length == 0) {
        console.log("New element");
        con.query(
          `insert into cart(user_id,item_id,quantity,complete) values (${user.id},${item.id},1,0);`,
          async function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            return res.status(200).send("{}");
          }
        );
      } else {
        console.log("existing element");

        con.query(
          `update cart set quantity=quantity+1 where item_id=${item.id} and complete=0;`,
          async function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            return res.status(200).send("{}");
          }
        );
      }
    }
  );
});

app.post("/delete-cart-api", auth, async (req, res) => {
  const user = req.user;
  var item = req.body.item_id;

  con.query(
    `select * from cart where item_id=${item} and user_id=${user.id} and complete=0`,
    async function (err, result, fields) {
      if (err) throw err;
      console.log(result);
      if (result[0].quantity == 1) {
        con.query(
          `delete from cart where item_id=${item} and user_id=${user.id} and complete=0`,
          async function (err, result, fields) {
            if (err) throw err;
            console.log(result);
          }
        );
      } else {
        con.query(
          `update cart set quantity=quantity-1 where item_id=${item} and user_id=${user.id} and complete=0`,
          async function (err, result, fields) {
            if (err) throw err;
            console.log(result);
          }
        );
      }
      return res.status(200).send("{}");
      // return res.status(200).send("{}");
    }
  );
});

app.post("/make-order-api", auth, async (req, res) => {
  const uuid = uuidv4();

  con.query(
    `select * from cart where user_id=${req.user.id} and complete=0`,
    async function (err, result, fields) {
      if (err) throw err;

      result.forEach((element) => {
        con.query(
          `insert into orders (user_id,order_no,cart_id) values (${req.user.id},'${uuid}',${element.id})`,
          async function (err, result, fields) {
            if (err) throw err;
            console.log("inserted ", result);
          }
        );
      });

      return res.status(200).send("{}");
      // return res.status(200).send("{}");
    }
  );
  con.query(
    `update cart set complete=1 where user_id=${req.user.id} and complete=0`,
    async function (err, result, fields) {
      // return res.status(200).send("{}");
    }
  );
});

app.get("/orders-api-get-order-ids", auth, (req, res) => {
  var orders = [];
  var finalOrders = [];
  console.log(req.user.id);
  con.query(
    `select distinct order_no from orders where user_id=${req.user.id};`,
    async function (err, result, fields) {
      if (err) throw err;
      console.log(result);

      result.forEach((x) => {
        orders.push(x.order_no);
      });

      res.status(200).send(orders);
    }
  );
});

app.get("/orders-api-get-order/:id", auth, (req, res) => {
  var finalOrder = {};
  con.query(
    `select * from orders,cart,items where orders.user_id=${req.user.id} and orders.cart_id=cart.id and cart.item_id=items.id and orders.order_no='${req.params.id}';`,
    function (err, result, fields) {
      if (err) throw err;
      console.log(result);

      finalOrder = {
        order_id: req.params.id,
        elements: result,
      };
      return res.status(200).send(finalOrder);
    }
  );
});

app.get("/get-items", auth, (req, res) => {
  con.query(
    "select id,item_name,price from items;",
    async function (err, result, fields) {
      if (err) throw err;
      console.log("Items", result);
      if (result.length == 0) {
        res.status(400).send("Error retrieving items");
      } else {
        res.status(200).send(result);
      }
    }
  );
});

app.get("/get-cart-items", auth, (req, res) => {
  con.query(
    `select * from cart,items where cart.user_id=${req.user.id} and cart.item_id=items.id and complete=0`,
    async function (err, result, fields) {
      if (err) throw err;
      console.log("Items", result);
      if (result.length == 0) {
        res.status(400).send("Error retrieving items");
      } else {
        res.status(200).send(result);
      }
    }
  );
});

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
          "insert into users (username,password) values('" +
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
              res.render("entry");
            }
          }
        );
      }
    } else {
      res.status(400).send("Bad request");
    }
  }
});

app.get("/farm-api", async (req, res) => {
  con.query(`select * from farm;`, async function (err, result, fields) {
    if (err) throw err;
    console.log("Items", result);
    if (result.length == 0) {
      res.status(400).send("Error retrieving items");
    } else {
      res.status(200).send(result);
    }
  });
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
