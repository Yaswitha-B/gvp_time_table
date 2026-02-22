const express = require('express')
const router = express.Router()
const { generateTimetable } = require('../controllers/timetableController')

router.post('/generate', (req, res) => {
  try {
    const request = req.body
    const result = generateTimetable(request)
    res.json({
      success: true,
      timetable: result.timetable,
      unplaced: result.unplaced
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router