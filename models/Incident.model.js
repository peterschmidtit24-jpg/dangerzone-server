
const { Schema, model } = require("mongoose")

const incidentSchema = new Schema(
    {
        incidentType: {
            type: String,
            enum: ["fire", "pothole", "crime", "accident", "crowded", "water", "broken", "litter", "speed", "other"],
            required: true
        },
        location: {
            type: String,
            required: true
        },
        severity: {
            type: String,
            enum: ["low", "medium", "high"],
            required: true
        },
        probableDuration: {
            type: String,
            enum: ["hours", "days"],
            required: true
        },
        description: {
            type: String,
            required: true
        },
        active: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        comments: [
            {
                type: Schema.Types.ObjectId,
                ref: "Comment"
            }
        ]
    },
    {
        timestamps: true
    }
)

const Incident = model("Incident", incidentSchema);

module.exports = Incident;
