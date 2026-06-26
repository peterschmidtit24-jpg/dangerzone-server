const router = require("express").Router()
const User = require("../models/User.model")
const Comment = require("../models/Comment.model")
const Incident = require("../models/Incident.model")
const { verifyToken } = require("../middlewares/auth.middlewares")


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

// not needed since it is handled by the auth middleware
router.post("/user", (req, res) => {
    res.send(`Go to login route to create a new user`)
})


router.put("/user/:userId", verifyToken, async (req, res, next) => {
    try {
        const { userId } = req.params
        const { username, email, role } = req.body

        const isOwner = req.payload._id === userId
        const isAdmin = req.payload.role === "admin"

        if (!isOwner && !isAdmin) {
            res.status(403).json({ errorMessage: "You cannot edit this user" })
            return
        }

        const updateData = {
            username,
            email
        }

        if (isAdmin) {
            updateData.role = role
        }

        const updatedUser = await User
            .findByIdAndUpdate(
                userId,
                updateData,
                { new: true, runValidators: true }
            )
            .select("-password")

        if (!updatedUser) {
            res.status(404).json({ errorMessage: "User not found" })
            return
        }

        res.status(200).json(updatedUser)
    } catch (error) {
        next(error)
    }
})

router.delete("/user/:userId", verifyToken, async (req, res, next) => {
    try {
        const { userId } = req.params

        const isOwner = req.payload._id === userId
        const isAdmin = req.payload.role === "admin"

        if (!isOwner && !isAdmin) {
            res.status(403).json({ errorMessage: "You cannot delete this user" })
            return
        }

        const deletedUser = await User.findByIdAndDelete(userId).select("-password")

        if (!deletedUser) {
            res.status(404).json({ errorMessage: "User not found" })
            return
        }

        const userComments = await Comment.find({ user: userId }).select("_id")
        const userCommentIds = userComments.map((comment) => comment._id)

        await Incident.updateMany(
            { comments: { $in: userCommentIds } },
            { $pull: { comments: { $in: userCommentIds } } }
        )
        await Comment.deleteMany({ user: userId })

        res.status(200).json({ message: "User deleted" })
    } catch (error) {
        next(error)
    }
})

module.exports = router
