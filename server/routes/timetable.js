const express = require("express");
const router = express.Router();

const timetableController = require("../controllers/timetableController");

router.post(
  "/generate_timetable",
  timetableController.generateTimetable  
);

module.exports = router;