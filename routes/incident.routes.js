
const router = require("express").Router();
const Incident = require("../models/Incident.model");
const Comment = require("../models/Comment.model");
const { verifyToken } = require("../middlewares/auth.middlewares");


router.get("/all-incidents", async (req, res, next) => {
  try {
    const incidents = await Incident
      .find()
      .populate("createdBy", "username email role")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username email role"
        }
      });
      
    res.status(200).json(incidents);
  } catch (error) {
    next(error);
  }
})

router.get("/incident/:incidentId", async (req, res, next) => {
  try {
    const incident = await Incident
      .findById(req.params.incidentId)
      .populate("createdBy", "username email role")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username email role"
        }
      });

    if (!incident) {
      res.status(404).json({ errorMessage: "Incident not found" });
      return;
    }

    res.status(200).json(incident);
  } catch (error) {
    next(error);
  }
})

router.post("/incident", verifyToken, async (req, res, next) => {
  try {
    const {
      incidentType,
      location,
      severity,
      probableDuration,
      description,
      active
    } = req.body;

    const newIncident = await Incident.create({
      incidentType,
      location,
      severity,
      probableDuration,
      description,
      active,
      createdBy: req.payload._id
    });

    const populatedIncident = await newIncident.populate("createdBy", "username email role");

    res.status(201).json(populatedIncident);
  } catch (error) {
    next(error);
  }
})

router.put("/incident/:incidentId", verifyToken, async (req, res, next) => {
  try {
    const { incidentId } = req.params;
    const {
      incidentType,
      location,
      severity,
      probableDuration,
      description,
      active
    } = req.body;

    const foundIncident = await Incident.findById(incidentId);

    if (!foundIncident) {
      res.status(404).json({ errorMessage: "Incident not found" });
      return;
    }

    const isOwner = foundIncident.createdBy.toString() === req.payload._id;

    if (!isOwner) {
      res.status(403).json({ errorMessage: "You cannot edit this incident" });
      return;
    }

    const updatedIncident = await Incident
      .findByIdAndUpdate(
        incidentId,
        {
          incidentType,
          location,
          severity,
          probableDuration,
          description,
          active
        },
        { new: true, runValidators: true }
      )
      // shows also the affected comments to the client
      .populate("createdBy", "username email role")
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username email role"
        }
      });

    res.status(200).json(updatedIncident);
  } catch (error) {
    next(error);
  }
})

router.delete("/incident/:incidentId", verifyToken, async (req, res, next) => {
  try {
    const { incidentId } = req.params;

    const foundIncident = await Incident.findById(incidentId);

    if (!foundIncident) {
      res.status(404).json({ errorMessage: "Incident not found" });
      return;
    }

    const isOwner = foundIncident.createdBy.toString() === req.payload._id;

    if (!isOwner) {
      res.status(403).json({ errorMessage: "You cannot delete this incident" });
      return;
    }

    const deletedIncident = await Incident.findByIdAndDelete(incidentId);

    // delete all the comments related to the incident too
    await Comment.deleteMany({ _id: { $in: deletedIncident.comments } });

    res.status(200).json({ message: "Incident deleted" });
  } catch (error) {
    next(error);
  }
})

module.exports = router;
