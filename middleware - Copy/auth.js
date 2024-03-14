const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  var token = req.header("Cookie");
  //console.log(req);
  if (!token) {
    return res.status(401).send("Access denied");
  }

  try {
    token = token.split("=")[1];

    const decoded = jwt.verify(token, "securetokendonotshare");
    req.user = decoded;
    next();
  } catch {
    res.status(400).send("Invalid token.");
  }
};
