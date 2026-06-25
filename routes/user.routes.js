const router = require("express").Router()
const User = require("../models/User.model")


router.get("/all-users", async (req, res, next) => {
    try {
        const users = await User.find()
        
        res.status(200).json(users)
    } catch (error) {
        next(error)
    }
})

router.get("/user/:userId", async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId)

        if (!user) {
            res.status(404).json({ errorMessage: "User not found" })
            return
        }

        res.status(200).json(user)
    } catch (error) {
        next(error)
    }
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
