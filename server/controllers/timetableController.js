// ── Init State ───────────────────────────────────────────────
function initState(request) {
  const { sections, days, slots_per_day } = request.meta
  const { time_blocks } = request

  const timetable = {}
  for (const section of Object.keys(sections)) {
    timetable[section] = {}
    for (const day of days) {
      timetable[section][day] = Array(slots_per_day).fill(null)
    }
  }

  // Apply time_blocks dynamically - skip Saturday for LUNCH
  for (const [blockName, blockInfo] of Object.entries(time_blocks)) {
    for (const section of blockInfo.sections) {
      for (const day of blockInfo.days) {
        if (day === "Sat") continue  // Saturday is VALUE_ADDED day, no lunch
        for (const slot of blockInfo.slot) {
          timetable[section][day][slot] = blockName
        }
      }
    }
  }

  return { timetable, teacherBusy: {}, roomBusy: {} }
}

// ── Priority Queue ───────────────────────────────────────────
function buildPriorityQueue(request) {
  const sections = Object.keys(request.meta.sections)

  const PRIORITY_ORDER = [
    'value_added',
    'lab',
    'open_elective',
    'professional_elective',
    'core',
    'term_project',
    'student_activities'
  ]

  const queue = []

  for (const courseType of PRIORITY_ORDER) {
    const config = request.course_type[courseType]
    if (!config) continue

    const { slots, is_continuous, is_synchronized, courses } = config

    for (const [courseName, courseInfo] of Object.entries(courses)) {
      const { teachers, room_type, required_teachers } = courseInfo

      if (is_synchronized) {
        queue.push({
          name: courseName,
          courseType,
          slots: slots ?? 1,
          isContinuous: is_continuous,
          isSynchronized: true,
          sections,
          teacherPool: teachers,
          requiredTeachers: required_teachers,
          roomType: room_type
        })
      } else {
        sections.forEach((section) => {
          queue.push({
            name: courseName,
            courseType,
            slots: slots ?? 1,
            isContinuous: is_continuous,
            isSynchronized: false,
            sections: [section],
            teacherPool: teachers,
            requiredTeachers: required_teachers,
            roomType: room_type
          })
        })
      }
    }
  }

  return queue
}

// ── Constraint Checkers ──────────────────────────────────────
function isSlotBlocked(timetable, section, day, slot) {
  return timetable[section][day][slot] !== null
}

function isTeacherFree(teacherBusy, teacher, day, slot) {
  return !teacherBusy[teacher]?.[`${day}-${slot}`]
}

function getAvailableTeachers(teacherPool, requiredCount, teacherBusy, day, slot) {
  if (requiredCount === 0) return []
  const available = teacherPool.filter(teacher =>
    isTeacherFree(teacherBusy, teacher, day, slot)
  )
  if (available.length < requiredCount) return null
  return available.slice(0, requiredCount)
}

function findFreeRoom(roomBusy, rooms, roomType, day, slot, sectionIndex) {
  // Assign a different room per section deterministically
  const allRooms = Object.entries(rooms).filter(([roomId, roomInfo]) =>
    roomInfo.type === roomType && !roomBusy[roomId]?.[`${day}-${slot}`]
  )
  if (!allRooms.length) return null
  // Use sectionIndex to pick a different room for each section
  return allRooms[sectionIndex % allRooms.length][0]
}

function canPlaceBlock(task, state, request, day, startSlot) {
  const { slots_per_day } = request.meta
  const slotsNeeded = task.isContinuous ? task.slots : 1

  for (let i = 0; i < slotsNeeded; i++) {
    const slot = startSlot + i
    if (slot >= slots_per_day) return false

    for (const section of task.sections) {
      if (isSlotBlocked(state.timetable, section, day, slot)) return false
    }

    const teachers = getAvailableTeachers(
      task.teacherPool, task.requiredTeachers, state.teacherBusy, day, slot
    )
    if (teachers === null) return false
  }

  const room = findFreeRoom(state.roomBusy, request.room, task.roomType, day, startSlot, 0)
  if (!room) return false

  return true
}

// ── Assign ───────────────────────────────────────────────────
function assignTask(task, state, request, day, startSlot) {
  const slotsToFill = task.isContinuous
    ? Array.from({ length: task.slots }, (_, i) => startSlot + i)
    : [startSlot]

  const teachers = getAvailableTeachers(
    task.teacherPool, task.requiredTeachers, state.teacherBusy, day, startSlot
  )

  for (let idx = 0; idx < task.sections.length; idx++) {
    const section = task.sections[idx]
    const roomForSection = findFreeRoom(state.roomBusy, request.room, task.roomType, day, startSlot, idx)

    for (const slot of slotsToFill) {
      const key = `${day}-${slot}`
      state.timetable[section][day][slot] = {
        course: task.name,
        teachers: teachers || [],
        room: roomForSection
      }

      // Mark room as busy
      if (!state.roomBusy[roomForSection]) state.roomBusy[roomForSection] = {}
      state.roomBusy[roomForSection][key] = true

      // Mark teacher as busy
      if (teachers) {
        for (const teacher of teachers) {
          if (!state.teacherBusy[teacher]) state.teacherBusy[teacher] = {}
          state.teacherBusy[teacher][key] = true
        }
      }
    }
  }
}

// ── Value Added ──────────────────────────────────────────────
function tryPlaceValueAdded(task, state, request) {
  const { slots_per_day } = request.meta
  const day = "Sat"

  for (let slot = 0; slot < slots_per_day; slot++) {
    for (const section of task.sections) {
      state.timetable[section][day][slot] = {
        course: "VALUE_ADDED",
        teachers: [],
        room: "201"
      }
    }
  }
  return true
}

// ── Greedy Placement ─────────────────────────────────────────
function tryPlace(task, state, request) {
  const { days, slots_per_day } = request.meta

  if (task.name === "VALUE_ADDED") return tryPlaceValueAdded(task, state, request)

  const timesToPlace = task.isContinuous ? 1 : task.slots
  let placed = 0

  for (const day of days) {
    if (day === "Sat") continue
    if (placed >= timesToPlace) break
    for (let slot = 0; slot < slots_per_day; slot++) {
      if (canPlaceBlock(task, state, request, day, slot)) {
        assignTask(task, state, request, day, slot)
        placed++
        break
      }
    }
  }

  return placed === timesToPlace
}

// ── Main Generator ───────────────────────────────────────────
function generateTimetable(request) {
  const state = initState(request)
  const queue = buildPriorityQueue(request)
  const unplaced = []

  for (const task of queue) {
    const success = tryPlace(task, state, request)
    if (!success) {
      console.warn(`Could not place: ${task.name}`)
      unplaced.push(task.name)
    }
  }

  return { timetable: state.timetable, unplaced }
}

module.exports = { generateTimetable }