function prettyPrintTimetable(timetable, meta) {
    const { days, slots_per_day } = meta;

    const columnWidth = 28;

    const pad = (text) => {
        text = text || "";
        if (text.length > columnWidth)
            return text.slice(0, columnWidth - 1) + "…";
        return text.padEnd(columnWidth, " ");
    };

    const separator = "-".repeat((slots_per_day + 1) * (columnWidth + 1));

    for (const section in timetable) {

        console.log("\n============================================================");
        console.log(`                      SECTION ${section}`);
        console.log("============================================================\n");

        // Header row
        let header = pad("DAY");
        for (let s = 1; s <= slots_per_day; s++) {
            header += "|" + pad(`Slot ${s}`);
        }
        console.log(header);
        console.log(separator);

        // For each day
        for (const day of days) {

            // We print 3 lines per day (course / teachers / rooms)
            let courseRow = pad(day);
            let teacherRow = pad("");
            let roomRow = pad("");

            for (let s = 1; s <= slots_per_day; s++) {

                const cell = timetable[section][day][s];

                if (!cell) {
                    courseRow += "|" + pad("FREE");
                    teacherRow += "|" + pad("");
                    roomRow += "|" + pad("");
                }
                else if (typeof cell === "string") {
                    courseRow += "|" + pad(cell);
                    teacherRow += "|" + pad("");
                    roomRow += "|" + pad("");
                }
                else {
                    const teachers = cell.teachers?.join(", ") || "-";
                    const rooms = cell.rooms?.join(", ") || "-";

                    courseRow += "|" + pad(cell.course);
                    teacherRow += "|" + pad("T: " + teachers);
                    roomRow += "|" + pad("R: " + rooms);
                }
            }

            console.log(courseRow);
            console.log(teacherRow);
            console.log(roomRow);
            console.log(separator);
        }

        console.log("\n");
    }
}

module.exports = { prettyPrintTimetable };