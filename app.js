const express = require('express');
const dotenv = require('dotenv');
const {con} = require('./dbService.js');
const app = express();
const cors = require('cors');
const path = require('path');
dotenv.config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

//app.use(express.static(path.join(__dirname, 'public')));


app.get('/',(req,res)=>{
    res.render('index');
});

app.get('/login',(req,res)=>{
    res.render('login');
});

app.post('/login-api',(req,res)=>{
    var username = req.body.username;
    var password = req.body.password;

    // console.log(con);


    con.query("SELECT * FROM users where username='"+username+"' and password='"+password+"'", function (err, result, fields) {
        if (err) throw err;
        console.log(result);
        if(result.length == 0){
            res.status(400).send("Error, user doesnot exist");
        } else {
            res.status(200).render('index');
        }
      });
})


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
