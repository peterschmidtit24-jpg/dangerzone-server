const router = require("express").Router()
const User = require("../models/User.model")


router.get("/all-users", (req, res) => {
    res.send("all users")
})

router.get("/user/:userId", (req, res) => {
    res.send(`user ${req.params.userId}`)
})

router.post("/user/:userId", (req, res) => {
    res.send(`create user for ${req.params.userId}`)
})

router.put("/user/:userId", (req, res) => {
    res.send(`update user ${req.params.userId}`)
})

router.delete("/user/:userId", (req, res) => {
    res.send(`delete user ${req.params.userId}`)
})

module.exports = router
