const express = require('express')
const cors = require('cors')
const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

const timetableRoutes = require('./routes/timetable')
app.use('/api/timetable', timetableRoutes)

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})