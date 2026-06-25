
const { Schema, model } = require("mongoose")

/*
    Schema (Comment)
    user: Object Ref (link to the posting user)
    comment: String  // comment made by the user
    flag: enum ["normal", "suspicious", "toxic"]
*/

const commentSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        comment: {
            type: String,
            trim: true,
            required: true
        },
        flag: {
            type: String,
            enum: ["normal", "suspicious", "toxic"],
            default: "normal"
        }
    },
    {
        timestamps: true
    }
)

const Comment = model("Comment", commentSchema)

module.exports = Comment

