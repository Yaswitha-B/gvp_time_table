const express = require("express");
const app = express();

const timetableRoutes = require("./routes/timetable");

app.use(express.json());
app.use("/api", timetableRoutes);

const port = 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});