
const router = require("express").Router();
const Incident = require("../models/Incident.model");

// GET "/api/incidents"
// router.get("/", async (req, res, next) => {
/*    
router.get("/", async (req, res, next) => {
  try {
    // const incidents = await Incident.find().populate("comments");
    res.status(200).json(incidents);
  } catch (error) {
    next(error);
  }
});
*/

router.get("/all-incidents", async (req, res, next) => {
  try {
    const incidents = await Incident
      .find()
      .populate("comments");
      
    res.status(200).json(incidents);
  } catch (error) {
    next(error);
  }
})

router.get("/incident/:incidentId", async (req, res, next) => {
  try {
    const incident = await Incident
      .findById(req.params.incidentId)
      .populate("comments");

    if (!incident) {
      res.status(404).json({ errorMessage: "Incident not found" });
      return;
    }

    res.status(200).json(incident);
  } catch (error) {
    next(error);
  }
})

router.post("/incident/:incidentId", (req, res) => {
  res.send(`create incident for ${req.params.incidentId}`);
})

router.put("/incident/:incidentId", (req, res) => {
  res.send(`update incident ${req.params.incidentId}`);
})

router.delete("/incident/:incidentId", (req, res) => {
  res.send(`delete incident ${req.params.incidentId}`);
})

module.exports = router;
