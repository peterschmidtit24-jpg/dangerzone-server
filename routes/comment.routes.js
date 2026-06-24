
const router = require("express").Router()
const Comment = require("../models/Comment.model")


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

router.post("/comment/:commentId", (req, res) => {
    res.send(`create comment for ${req.params.commentId}`)
})

router.put("/comment/:commentId", (req, res) => {
    res.send(`update comment ${req.params.commentId}`)
})

router.delete("/comment/:commentId", (req, res) => {
    res.send(`delete comment ${req.params.commentId}`)
})

module.exports = router
