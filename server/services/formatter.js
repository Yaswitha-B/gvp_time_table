function formatOutput(sectionSchedule, meta) {

    const { days, slots_per_day } = meta;
    const result = {};

    for (const section in sectionSchedule) {

        result[section] = {};

        days.forEach((day, dayIndex) => {

            result[section][day] = {};

            for (let s = 1; s <= slots_per_day; s++) {

                const slotId = dayIndex * slots_per_day + (s - 1);

                result[section][day][s] =
                    sectionSchedule[section][slotId];
            }
        });
    }

    return result;
}

module.exports = {
    formatOutput
};