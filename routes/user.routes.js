const router = require("express").Router()
const User = require("../models/User.model")
const Comment = require("../models/Comment.model")
const Incident = require("../models/Incident.model")
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middlewares")


router.get("/all-users", async (req, res, next) => {
    try {
        const users = await User.find().select("-password")
        
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

router.put("/user/:userId/warn", verifyToken, verifyAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params

        if (req.payload._id === userId) {
            res.status(400).json({ errorMessage: "You cannot warn your own admin account" })
            return
        }

        const warnedUser = await User
            .findByIdAndUpdate(
                userId,
                {
                    $inc: { warnings: 1 },
                    $set: { warnedAt: new Date() }
                },
                { new: true, runValidators: true }
            )
            .select("-password")

        if (!warnedUser) {
            res.status(404).json({ errorMessage: "User not found" })
            return
        }

        res.status(200).json(warnedUser)
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

        if (isAdmin && isOwner) {
            res.status(400).json({ errorMessage: "You cannot ban your own admin account" })
            return
        }

        const userToDelete = await User.findById(userId).select("-password")

        if (!userToDelete) {
            res.status(404).json({ errorMessage: "User not found" })
            return
        }

        const userIncidents = await Incident.find({ createdBy: userId }).select("comments")
        const incidentCommentIds = userIncidents.flatMap((incident) => incident.comments)
        const userComments = await Comment.find({ user: userId }).select("_id")
        const userCommentIds = userComments.map((comment) => comment._id)
        const commentIdsToDelete = [...incidentCommentIds, ...userCommentIds]

        await Comment.deleteMany({ _id: { $in: commentIdsToDelete } })
        await Incident.deleteMany({ createdBy: userId })
        await Incident.updateMany(
            { comments: { $in: commentIdsToDelete } },
            { $pull: { comments: { $in: commentIdsToDelete } } }
        )

        await User.findByIdAndDelete(userId)

        res.status(200).json({
            deletedComments: commentIdsToDelete.length,
            deletedIncidents: userIncidents.length,
            message: "User deleted"
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router
