
const { Schema, model } = require("mongoose")

/*
    Schema (Incident)

    incident-type: enum // e.g. ["fire", "pothole", "crime", "accident", "crowded", "water", "broken", "litter", "speed"]
    location: String // e.g. Mainstreet 23, Munich
    severity: enum // ["low", "medium", "high"]
    probable duration: enum // ["hours", "days"]
    description: String // e.g. 
    active: boolean // active/inactive
    createdBy: Object Ref (link to the reporting user)
    comments: Object Ref (link to comment object)
*/

const incidentSchema = new Schema(
    {
        incidentType: {
            type: String,
            enum: ["fire", "pothole", "crime", "accident", "crowded", "water", "broken", "litter", "speed"],
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
