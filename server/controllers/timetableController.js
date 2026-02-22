
const timetableService = require("../services/timetableService")

exports.generateTimetable = (req, res) => {
    try {
        const data = req.body

        const result = timetableService.generate(data)

        res.json(result)
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        })
    }

}