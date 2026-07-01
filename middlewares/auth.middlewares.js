const jwt = require("jsonwebtoken")
const User = require("../models/User.model")

async function verifyToken(req, res, next) {

  try {
    const authHeader = req.headers.authorization || ""
    const authToken = authHeader.split(" ")[1]
    const payload = jwt.verify(authToken, process.env.TOKEN_SECRET)
    const currentUser = await User.findById(payload._id).select("username email role")

    if (!currentUser) {
      res.status(401).json({errorMessage: "Token user no longer exists"})
      return
    }

    req.payload = {
      ...payload,
      _id: currentUser._id.toString(),
      email: currentUser.email,
      username: currentUser.username,
      role: currentUser.role
    } // we are passing the current info from this user (token owner) to the route
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
