const router = require("express").Router();

// ℹ️ Organize and connect all your route files here.
const authRouter = require("./auth.routes")
router.use("/auth", authRouter)

const incidentRouter = require("./incident.routes")
router.use("/", incidentRouter)

const commentRouter = require("./comment.routes")
router.use("/", commentRouter)

const userRouter = require("./user.routes")
router.use("/", userRouter)

const geocodeRouter = require("./geocode.routes")
router.use("/", geocodeRouter)

//* EXAMPLE of how a route can be made private by checking the token

const { verifyToken, verifyAdmin } = require("../middlewares/auth.middlewares");
router.get("/example-of-private-route", verifyToken, (req, res) => {

  console.log(req.payload)
  //! WE WILL USE THE REQ.PAYLOAD when we need to know info about who is calling the server

  // - if we create a document, to assign the id of the document creator
  // - if the user wants to see its own profile, we use the id from the token
  // - if someone is trying to delete/edit a document we could use the id from the payload to verify if the person owns that document

  res.send("This is private info example.You have succesfully accessed a private route")
})

router.get("/example-of-admin-route", verifyToken, verifyAdmin, (req, res) => {

  // example of admin requests
  // - ban a user
  // - delete/edit any comment or any document diregarding the owner
  // - create products in a e-commerce

  res.send("you are an admin! you can process this request")

})

module.exports = router;
