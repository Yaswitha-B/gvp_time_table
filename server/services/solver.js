function solve(state, index, depth = 0) {
    if (index > state.bestPlaced) {
        state.bestPlaced = index;
        state.bestState = deepCloneState(state);
    }

    if (index >= state.activities.length) {
        return true;
    }

    const activity = state.activities[index];

    const slotOptions = getCandidateSlots(state, activity);

    for (const slotId of slotOptions) {

        if (!canPlaceActivity(state, activity, slotId)) {
            continue;
        }

        const teacherSelection = selectTeachers(state, activity, slotId);
        if (!teacherSelection) continue;

        const roomSelection = selectRoom(state, activity, slotId);
        if (!roomSelection) continue;

        placeActivity(state, activity, slotId, teacherSelection, roomSelection);

        if (solve(state, index + 1, depth + 1)) {
            return true;
        }

        unplaceActivity(state, activity, slotId, teacherSelection, roomSelection);
    }

    return false;
}

function deepCloneState(state) {
    return {
        sectionSchedule: JSON.parse(JSON.stringify(state.sectionSchedule)),
        teacherBusy: JSON.parse(JSON.stringify(state.teacherBusy)),
        roomBusy: JSON.parse(JSON.stringify(state.roomBusy)),
        teacherLock: JSON.parse(JSON.stringify(state.teacherLock))
    };
}

function getCandidateSlots(state, activity) {
    const totalSlots = state.slots.length;
    const slotsPerDay = state.slotsPerDay; 
    const duration = activity.duration;

    const candidates = [];

    for (let slotId = 0; slotId < totalSlots; slotId++) {
        const dayStart = Math.floor(slotId / slotsPerDay) * slotsPerDay;
        const dayEnd = dayStart + slotsPerDay;
        if (slotId + duration > dayEnd) continue;
        candidates.push(slotId);
    }
    return candidates.sort(() => Math.random() - 0.5);
}

function canPlaceActivity(state, activity, slotId) {

    const duration = activity.duration;

    // SYNCHRONIZED
    if (activity.is_synchronized) {

        for (const section of activity.sections) {

            for (let d = 0; d < duration; d++) {

                const sId = slotId + d;

                if (
                    sId >= state.slots.length ||
                    state.sectionSchedule[section][sId] !== null
                ) {
                    return false;
                }
            }
        }

    } 

    // NORMAL (single section)
    else {

        const section = activity.section;

        for (let d = 0; d < duration; d++) {

            const sId = slotId + d;

            if (
                sId >= state.slots.length ||
                state.sectionSchedule[section][sId] !== null
            ) {
                return false;
            }
        }
    }

    return true;
}

function selectTeachers(state, activity, slotId) {

    const required = activity.required_teachers;

    if (required === 0) {
        return [];
    }

    const duration = activity.duration;
    const selected = [];

    const sections = activity.sections || [activity.section];

    for (const teacher of activity.teacher_pool) {

        
        let locked = false;
        for (const section of sections) {
            if (state.teacherLock[section] &&
                state.teacherLock[section][activity.course] &&
                state.teacherLock[section][activity.course] !== teacher) {
                locked = true;
                break;
            }
        }
        if (locked) continue;

        
        let available = true;
        for (let d = 0; d < duration; d++) {
            if (state.teacherBusy[teacher][slotId + d]) {
                available = false;
                break;
            }
        }

        if (!available) continue;

        selected.push(teacher);

        if (selected.length === required) {
            break;
        }
    }

    if (selected.length < required) {
        return null;
    }

    return selected;
}

function selectRoom(state, activity, slotId) {

    const duration = activity.duration;
    const requiredType = activity.room_type;

    let totalStudents = 0;

    if (activity.sections) {
        activity.sections.forEach(section => {
            totalStudents += state.sectionStrength[section];
        });
    } else {
        totalStudents = state.sectionStrength[activity.section];
    }

    const candidateRooms = [];

    for (const room in state.roomBusy) {

        const roomInfo = state.roomInfo[room];

        if (requiredType && roomInfo.type !== requiredType) continue;

        let free = true;
        for (let d = 0; d < duration; d++) {
            if (state.roomBusy[room][slotId + d]) {
                free = false;
                break;
            }
        }

        if (!free) continue;

        candidateRooms.push(room);
    }

    candidateRooms.sort((a, b) =>
        state.roomInfo[b].capacity - state.roomInfo[a].capacity
    );

    const selectedRooms = [];
    let covered = 0;

    for (const room of candidateRooms) {
        selectedRooms.push(room);
        covered += state.roomInfo[room].capacity;
        if (covered >= totalStudents) break;
    }

    if (covered < totalStudents) {
        return null;
    }

    return selectedRooms;
}

function placeActivity(state, activity, slotId, teachers, rooms) {

    const duration = activity.duration;
    const sections = activity.sections || [activity.section];

    for (const section of sections) {
        for (let d = 0; d < duration; d++) {
            state.sectionSchedule[section][slotId + d] = {
                course: activity.course,
                teachers,
                rooms
            };
        }
    }

    for (const teacher of teachers) {
        for (let d = 0; d < duration; d++) {
            state.teacherBusy[teacher][slotId + d] = true;
        }
    }

    for (const room of rooms) {
        for (let d = 0; d < duration; d++) {
            state.roomBusy[room][slotId + d] = true;
        }
    }

    if (!activity.is_synchronized) {
        const section = activity.section;
        if (!state.teacherLock[section][activity.course]) {
            state.teacherLock[section][activity.course] = teachers[0];
        }
    }
}

function unplaceActivity(state, activity, slotId, teachers, rooms) {

    const duration = activity.duration;
    const sections = activity.sections || [activity.section];

    for (const section of sections) {
        for (let d = 0; d < duration; d++) {
            state.sectionSchedule[section][slotId + d] = null;
        }
    }

    for (const teacher of teachers) {
        for (let d = 0; d < duration; d++) {
            state.teacherBusy[teacher][slotId + d] = false;
        }
    }

    for (const room of rooms) {
        for (let d = 0; d < duration; d++) {
            state.roomBusy[room][slotId + d] = false;
        }
    }

}


module.exports = {
    solve
};
