
const router = require("express").Router()
const Comment = require("../models/Comment.model")
const Incident = require("../models/Incident.model")
const { verifyToken } = require("../middlewares/auth.middlewares")


router.get("/all-comments", async (req, res, next) => {
    try {
        const comments = await Comment
            .find()
            .populate("user")

        res.status(200).json(comments)
    } catch (error) {
        next(error)
    }
})

router.get("/all-comments/user/:userId", async (req, res, next) => {
    try {
        const comments = await Comment
            .find({ user: req.params.userId })
            .populate("user")

        res.status(200).json(comments)
    } catch (error) {
        next(error)
    }
})

router.get("/comment/:commentId", async (req, res, next) => {
    try {
        const comment = await Comment
            .findById(req.params.commentId)
            .populate("user")

        if (!comment) {
            res.status(404).json({ errorMessage: "Comment not found" })
            return
        }

        res.status(200).json(comment)
    } catch (error) {
        next(error)
    }
})

router.post("/comment/incident/:incidentId", verifyToken, async (req, res, next) => {
    try {
        const { incidentId } = req.params
        const { comment, flag } = req.body

        const incident = await Incident.findById(incidentId)

        if (!incident) {
            res.status(404).json({ errorMessage: "Incident not found" })
            return
        }

        const newComment = await Comment.create({
            user: req.payload._id,
            comment,
            flag
        })

        const updatedIncident = await Incident
            .findByIdAndUpdate(
                incidentId,
                { $push: { comments: newComment._id } },
                { new: true }
            )
            .populate("createdBy", "username email role")
            .populate({
                path: "comments",
                populate: {
                    path: "user",
                    select: "email username role"
                }
            })

        res.status(201).json(updatedIncident)
    } catch (error) {
        next(error)
    }
})

router.put("/comment/:commentId", verifyToken, async (req, res, next) => {
    try {
        const { commentId } = req.params
        // read comment and flag from the body
        const { comment, flag } = req.body

        const foundComment = await Comment.findById(commentId)

        if (!foundComment) {
            res.status(404).json({ errorMessage: "Comment not found" })
            return
        }

        // comment might be updated only by the owner of the admin
        const isOwner = foundComment.user.toString() === req.payload._id
        const isAdmin = req.payload.role === "admin"

        if (!isOwner && !isAdmin) {
            res.status(403).json({ errorMessage: "You cannot edit this comment" })
            return
        }

        const updatedComment = await Comment
            .findByIdAndUpdate(
                commentId,
                { comment, flag },
                { new: true, runValidators: true }
            )
            .populate("user", "email username role")

        res.status(200).json(updatedComment)
    } catch (error) {
        next(error)
    }
})

router.delete("/comment/:commentId", verifyToken, async (req, res, next) => {
    try {
        const { commentId } = req.params

        const foundComment = await Comment.findById(commentId)

        if (!foundComment) {
            res.status(404).json({ errorMessage: "Comment not found" })
            return
        }

        const isOwner = foundComment.user.toString() === req.payload._id
        const isAdmin = req.payload.role === "admin"

        if (!isOwner && !isAdmin) {
            res.status(403).json({ errorMessage: "You cannot delete this comment" })
            return
        }

        await Comment.findByIdAndDelete(commentId)
        await Incident.updateMany(
            { comments: commentId },
            { $pull: { comments: commentId } }
        )

        res.status(200).json({ message: "Comment deleted" })
    } catch (error) {
        next(error)
    }
})

module.exports = router
