/* eslint-disable space-before-function-paren */
let path = require('path')
let Venue = require(path.join(__dirname, '..', 'models', 'venue'))

function arrayToJSON(venues) {
  return venues.map(venue => venue.toJSON())
}

async function find(filter) {
  return filter ? Venue.findOne(filter) : Venue.find()
}

async function updateImage(edition, image) {
  return Venue.findOneAndUpdate(
    {
      edition: edition
    },
    {
      $set: {
        image: image
      }
    },
    {
      new: true,
      upsert: true
    }
  )
}

async function addStand(edition, topLeft, bottomRight) {
  let venue = await find({ edition: edition })

  if (venue === null || venue.image.length === 0) {
    return null
  }

  let standsId = venue.stands.map(stand => +stand.id).sort((a, b) => a - b)
  let newId = 0
  let prevId = -1

  for (let standId of standsId) {
    newId = prevId + 1
    if (newId < standId) {
      break
    }
    prevId = standId
    newId += 1
  }

  venue.stands.push({
    id: newId,
    topLeft: {
      x: topLeft.x,
      y: topLeft.y
    },
    bottomRight: {
      x: bottomRight.x,
      y: bottomRight.y
    }
  })

  return venue.save()
}

async function removeStand(edition, id) {
  let venue = await find({ edition: edition })

  if (venue === null || venue.image.length === 0) {
    return null
  }

  // find stand with stand.id == id
  let index = 0
  let found = false
  for (index = 0; !found && index < venue.stands.length; index++) {
    if (venue.stands[index].id === id) {
      found = true
    }
  }

  if (!found) {
    return null
  }

  // remove element
  venue.stands.splice(index - 1, 1)

  return venue.save()
}

async function replaceStands(edition, stands) {
  let venue = await find({ edition: edition })

  if (venue === null || venue.image.length === 0) {
    return null
  }

  venue.stands = []
  let id = 0

  for (let stand of stands) {
    let standWithId = Object.assign(stand, { id: id })
    venue.stands.push(standWithId)
    id += 1
  }

  return venue.save()
}

async function addActivity(edition, day, start, end, kind) {
  let venue = await find({ edition: edition })

  if (venue === null) {
    return null
  }

  let activityKind = venue.activities.find(a => a.kind === kind)
  if (!activityKind) {
    activityKind = { kind: kind, slots: [] }
    venue.activities.push(activityKind)
  }

  let ids = activityKind.slots.map(slot => +slot.id).sort((a, b) => a - b)
  let newId = 0
  let prevId = -1

  for (let currId of ids) {
    newId = prevId + 1
    if (newId < currId) {
      break
    }
    prevId = currId
    newId += 1
  }

  let a = {
    id: newId,
    day: day,
    start: start,
    end: end
  }

  venue.activities.find(a => a.kind === kind).slots.push(a)

  return venue.save()
}

async function removeActivity(edition, id, kind) {
  let venue = await find({ edition: edition })

  if (venue === null) {
    return null
  }

  const activityKind = venue.activities.find(a => a.kind === kind)
  if (!activityKind) {
    return null
  }

  const index = activityKind.slots.findIndex(act => act.id === id)
  let found = index !== -1

  if (!found) {
    return null
  }

  // remove element
  activityKind.slots.splice(index, 1)

  return venue.save()
}

async function replaceActivitySlots(edition, slots, kind) {
  let venue = await find({ edition: edition })

  if (venue === null) {
    return null
  }

  const activityKind = venue.activities.find(a => a.kind === kind)
  if (!activityKind) {
    return null
  }

  activityKind.slots = []
  let id = 0

  for (let slot of slots) {
    let slotWithId = Object.assign(slot, { id: id })
    delete slotWithId.kind
    activityKind.slots.push(slotWithId)
    id += 1
  }

  return venue.save()
}

module.exports.arrayToJSON = arrayToJSON
module.exports.find = find
module.exports.updateImage = updateImage
module.exports.addStand = addStand
module.exports.removeStand = removeStand
module.exports.replaceStands = replaceStands
module.exports.addActivity = addActivity
module.exports.removeActivity = removeActivity
module.exports.replaceActivitySlots = replaceActivitySlots
