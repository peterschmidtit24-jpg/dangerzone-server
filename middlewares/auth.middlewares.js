const jwt = require("jsonwebtoken")

function verifyToken(req, res, next) {

  console.log(req.headers)

  try {
    const authToken = req.headers.authorization.split(" ")[1]
    const payload = jwt.verify(authToken, process.env.TOKEN_SECRET)
    req.payload = payload // we are passing the info from this user (token owner) to the route
    next() //move the request to the next route. Meaning, the token is valid!
  } catch (error) {
    // the token is invalid:
    //  - there is no token
    //  - the token has expired
    //  - the token has been modified
    res.status(401).json({errorMessage: "Token invalid or doesn't exist"})
  }

}

// secondary middleware just for checking if the user is an admin
function verifyAdmin(req, res, next) {

  if (req.payload.role === "admin") {
    next() // you are allowed in the route
  } else {
    res.status(401).json({errorMessage: "You are not an admin"})
  }

}

module.exports = {
  verifyToken, 
  verifyAdmin
}