const express = require("express");
const router = express.Router();
const {
	registerScientist,
	getAllScientists,
	updateScientist,
	deleteScientist,
	assignBug,
	unassignBug,
	getScientistBugs,
} = require("../controllers/scientistController");

router.post("/", registerScientist);
router.get("/", getAllScientists);
router.patch("/:id", updateScientist);
router.delete("/:id/delete", deleteScientist);
router.post("/:id/assign", assignBug);
router.post("/:id/unassign", unassignBug); // Uses :id instead of :scientistId
router.get("/:id/bugs", getScientistBugs);

module.exports = router;
