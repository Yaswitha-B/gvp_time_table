const { solve } = require("./solver");
const { formatOutput } = require("./formatter");
const { prettyPrintTimetable } = require("../utils/prettyPrint");

function generate(data) {
    const activities = expandActivities(data);

    activities.sort((a, b) => {
        const diff = computeDifficulty(b) - computeDifficulty(a);
        if (diff !== 0) return diff;
        return Math.random() - 0.5; 
    });

    const slotData = generateSlots(data.meta, data.time_blocks || {});
    const result = runScheduler(
        activities,
        slotData,
        data
    );
    return result;
}

function computeDifficulty(activity) {
    let score = 0;
    score += activity.duration * 5;
    if (activity.is_synchronized) score += 15;
    if (activity.is_continuous) score += 8;
    score += activity.required_teachers * 4;
    score -= activity.teacher_pool.length;
    return score;
}

function expandActivities(data) {

    const activities = [];
    const sections = Object.keys(data.meta.sections);
    const courseTypes = data.course_type;

    for (const typeName in courseTypes) {

        const typeConfig = courseTypes[typeName];
        const {
            slots,
            is_continuous,
            is_synchronized,
            courses
        } = typeConfig;

        for (const courseName in courses) {

            const course = courses[courseName];

            const teacherPool = course.teachers || [];
            const requiredTeachers = course.required_teachers || 0;
            const roomType = course.room_type || null;

            // SYNCHRONIZED COURSE (single grouped activity)
            if (is_synchronized) {

                if (is_continuous) {

                    activities.push({
                        sections: sections,         
                        course: courseName,
                        type: typeName,
                        teacher_pool: teacherPool,
                        required_teachers: requiredTeachers,
                        room_type: roomType,
                        duration: slots,
                        is_continuous: true,
                        is_synchronized: true
                    });

                } else {

                    for (let i = 0; i < slots; i++) {

                        activities.push({
                            sections: sections,
                            course: courseName,
                            type: typeName,
                            teacher_pool: teacherPool,
                            required_teachers: requiredTeachers,
                            room_type: roomType,
                            duration: 1,
                            is_continuous: false,
                            is_synchronized: true
                        });
                    }
                }

            }

            // NORMAL COURSE (per section)
            else {

                sections.forEach((section) => {

                    if (is_continuous) {

                        activities.push({
                            section: section,
                            course: courseName,
                            type: typeName,
                            teacher_pool: teacherPool,
                            required_teachers: requiredTeachers,
                            room_type: roomType,
                            duration: slots,
                            is_continuous: true,
                            is_synchronized: false
                        });

                    } else {

                        for (let i = 0; i < slots; i++) {

                            activities.push({
                                section: section,
                                course: courseName,
                                type: typeName,
                                teacher_pool: teacherPool,
                                required_teachers: requiredTeachers,
                                room_type: roomType,
                                duration: 1,
                                is_continuous: false,
                                is_synchronized: false
                            });
                        }
                    }
                });
            }
        }
    }

    return activities;
}

function getSlotId(meta, day, slot) {

    const { days, slots_per_day } = meta;
    const dayIndex = days.indexOf(day);
    if (dayIndex === -1) return -1;
    return dayIndex * slots_per_day + (slot - 1);
}

function generateSlots(meta) {

    const { days, slots_per_day } = meta;
    const slots = [];
    days.forEach((day) => {
        for (let s = 1; s <= slots_per_day; s++) {
            slots.push({
                day: day,
                slot: s
            });
        }
    });
    return slots;
}

function initializeState(activities, slots, data) {

    const sections = Object.keys(data.meta.sections);
    const totalSlots = slots.length;
    const sectionStrength = data.meta.sections;
    const roomInfo = data.room;

    // Section Schedule
    const sectionSchedule = {};
    sections.forEach((section) => {
        sectionSchedule[section] = new Array(totalSlots).fill(null);
    });

    // Teacher Busy
    const teacherBusy = {};
    activities.forEach((activity) => {
        activity.teacher_pool.forEach((teacher) => {
            if (!teacherBusy[teacher]) {
                teacherBusy[teacher] = new Array(totalSlots).fill(false);
            }
        });
    });

    // Room Busy
    const roomBusy = {};
    const rooms = Object.keys(data.room || {});
    rooms.forEach((room) => {
        roomBusy[room] = new Array(totalSlots).fill(false);
    });

    // Teacher Lock
    const teacherLock = {};
    sections.forEach((section) => {
        teacherLock[section] = {};
    });

    const state = {
        slots,
        activities,
        sectionSchedule,
        teacherBusy,
        roomBusy,
        teacherLock,
        sectionStrength,
        roomInfo,
        slotsPerDay: data.meta.slots_per_day,
        bestPlaced: 0,
        bestState: null
    };

    applyTimeBlocks(state, data.time_blocks, data.meta);

    return state;
}

function applyTimeBlocks(state, timeBlocks, meta) {

    if (!timeBlocks) return;

    for (const blockName in timeBlocks) {

        const block = timeBlocks[blockName];

        const blockDays = block.days || [];
        const blockSections = block.sections || [];
        const blockSlots = block.slot || [];

        blockDays.forEach((day) => {
            blockSlots.forEach((slot) => {

                const slotId = getSlotId(meta, day, slot);

                if (slotId < 0) return;

                blockSections.forEach((section) => {

                    if (!state.sectionSchedule[section]) return;

                    state.sectionSchedule[section][slotId] = blockName;

                });

            });
        });
    }
}

function runScheduler(activities, slots, data) {

    const state = initializeState(activities, slots, data);

    const success = solve(state, 0);

    if (success || state.bestPlaced){
        const formatted = formatOutput(state.sectionSchedule, data.meta);
        prettyPrintTimetable(formatted, data.meta);

        return {
            status: success ? "success" : "partial",
            timetable: formatted
        };
    }

    return {
        status: "failed",
        timetable: {}
    };
}

module.exports = {
    generate
};