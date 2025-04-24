const express = require("express");
const {
	createBug,
	getAllBugs,
	getBugById,
	updateBug,
	deleteBug,
} = require("../controllers/bugsController");
const router = express.Router();

router.post("/", createBug);
router.get("/", getAllBugs);
router.get("/:id", getBugById);
router.patch("/:id", updateBug);
router.delete("/:id", deleteBug);

module.exports = router;
