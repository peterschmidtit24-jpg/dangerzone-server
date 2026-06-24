const router = require("express").Router();
const User = require("../models/User.model");

const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const { verifyToken } = require("../middlewares/auth.middlewares");

// POST "/api/auth/signup" => creating the user document
router.post("/signup", async(req, res, next) => {

  console.log(req.body)
  const { username, email, password } = req.body

  // backend validations
  if (!email || !password) {
    res.status(400).json({errorMessage: "Email and Password are required"})
    return // this is to stop te execution of the route
  }

  // the strenght of the password
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm
  if (passwordRegex.test(password) === false) {
    res.status(400).json({errorMessage: "Password is not strongh enough. Needs to have at least one digit, one uppercase, one lowercase and 8 characters of length."})
    return // this is to stop te execution of the route
  }

  try {

    // email already exists
    const foundUser = await User.findOne({email: email})
    if (foundUser) {
      res.status(400).json({errorMessage: "User already registered with that email"})
      return // this is to stop te execution of the route
    }

    //* BONUS
    // validate data types for all properties
    // format of the email to be correct
  
    // we will create the document and send an ok message

    // hash the password for user security
    const hashPassword = await bcrypt.hash(password, 12)

    const newUser = {
      username: username,
      email: email,
      password: hashPassword
    }

    await User.create(newUser)

    res.status(201).send("user created!")
    
  } catch (error) {
    next(error) // send the error to the 500 error handling in express
  }
})

// POST "/api/auth/login" => validating the user credentials and sending the token
router.post("/login", async(req, res, next) => {

  console.log(req.body)
  const { email, password } = req.body

  // check the values of email and password exist
    if (!email || !password) {
    res.status(400).json({errorMessage: "Email and Password are required"})
    return // this is to stop te execution of the route
  }

  try {
    // if the document doesn't exist
    const foundUser = await User.findOne({email: email})
    console.log(foundUser)
    if (!foundUser) {
      res.status(400).json({errorMessage: "User not found with that email. Please signup first"})
      return // this is to stop te execution of the route
    }

    // check password
    const isPasswordCorrect = await bcrypt.compare(password, foundUser.password)
    if (!isPasswordCorrect) {
      res.status(400).json({errorMessage: "Password is not correct"})
      return // this is to stop te execution of the route
    }

    // we have finish the authentication process
    const payload = {
      _id: foundUser._id,
      email: foundUser.email,
      //! if we had roles, they need to be here as part of the payload of the token
      role: foundUser.role
    }

    const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
      expiresIn: "7d"
    })

    res.status(200).json({authToken: authToken})
  } catch (error) {
    next(error)
  }

})

// GET "/api/auth/verify" => validating the user token on subsequent visits
router.get("/verify", verifyToken, (req, res) => {
  res.status(200).json(req.payload)
})

module.exports = router;