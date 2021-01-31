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

async function addWorkshop(edition, day, start, end) {
  let venue = await find({ edition: edition })

  if (venue === null) {
    return null
  }

  let wsId = venue.workshops.map(workshop => +workshop.id).sort((a, b) => a - b)
  let newId = 0
  let prevId = -1

  for (let currId of wsId) {
    newId = prevId + 1
    if (newId < currId) {
      break
    }
    prevId = currId
    newId += 1
  }

  venue.workshops.push({
    id: newId,
    day: day,
    start: start,
    end: end
  })

  return venue.save()
}

async function removeWorkshop(edition, id) {
  let venue = await find({ edition: edition })

  if (venue === null) {
    return null
  }

  // find stand with stand.id == id
  let index = 0
  let found = false
  for (index = 0; !found && index < venue.workshops.length; index++) {
    if (venue.workshops[index].id === id) {
      found = true
    }
  }

  if (!found) {
    return null
  }

  // remove element
  venue.workshops.splice(index - 1, 1)

  return venue.save()
}

async function replaceWorkshops(edition, workshops) {
  let venue = await find({ edition: edition })

  if (venue === null) {
    return null
  }

  venue.workshops = []
  let id = 0

  for (let ws of workshops) {
    let wsWithId = Object.assign(ws, { id: id })
    venue.workshops.push(wsWithId)
    id += 1
  }

  return venue.save()
}

async function addPresentation(edition, day, start, end) {
  let venue = await find({ edition: edition })

  if (venue === null) {
    return null
  }

  let presId = venue.presentations.map(pres => +pres.id).sort((a, b) => a - b)
  let newId = 0
  let prevId = -1

  for (let currId of presId) {
    newId = prevId + 1
    if (newId < currId) {
      break
    }
    prevId = currId
    newId += 1
  }

  venue.presentations.push({
    id: newId,
    day: day,
    start: start,
    end: end
  })

  return venue.save()
}

async function removePresentation(edition, id) {
  let venue = await find({ edition: edition })

  if (venue === null) {
    return null
  }

  // find presentation with presentation.id == id
  let index = 0
  let found = false
  for (index = 0; !found && index < venue.presentations.length; index++) {
    if (venue.presentations[index].id === id) {
      found = true
    }
  }

  if (!found) {
    return null
  }

  // remove element
  venue.presentations.splice(index - 1, 1)

  return venue.save()
}

async function replacePresentations(edition, presentations) {
  let venue = await find({ edition: edition })

  if (venue === null) {
    return null
  }

  venue.presentations = []
  let id = 0

  for (let pres of presentations) {
    let presWithId = Object.assign(pres, { id: id })
    venue.presentations.push(presWithId)
    id += 1
  }

  return venue.save()
}

async function addLunchTalk(edition, day, start, end) {
  let venue = await find({ edition: edition })

  if (venue === null) {
    return null
  }

  let ltId = venue.lunchTalks.map(lt => +lt.id).sort((a, b) => a - b)
  let newId = 0
  let prevId = -1

  for (let currId of ltId) {
    newId = prevId + 1
    if (newId < currId) {
      break
    }
    prevId = currId
    newId += 1
  }

  venue.lunchTalks.push({
    id: newId,
    day: day,
    start: start,
    end: end
  })

  return venue.save()
}

async function removeLunchTalk(edition, id) {
  let venue = await find({ edition: edition })

  if (venue === null) {
    return null
  }

  // find lunch talk with lunchTalk.id == id
  let index = 0
  let found = false
  for (index = 0; !found && index < venue.lunchTalks.length; index++) {
    if (venue.lunchTalks[index].id === id) {
      found = true
    }
  }

  if (!found) {
    return null
  }

  // remove element
  venue.lunchTalks.splice(index - 1, 1)

  return venue.save()
}

async function replaceLunchTalks(edition, lunchTalks) {
  let venue = await find({ edition: edition })

  if (venue === null) {
    return null
  }

  venue.lunchTalks = []
  let id = 0

  for (let lt of lunchTalks) {
    let ltWithId = Object.assign(lt, { id: id })
    venue.lunchTalks.push(ltWithId)
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
module.exports.addWorkshop = addWorkshop
module.exports.removeWorkshop = removeWorkshop
module.exports.replaceWorkshops = replaceWorkshops
module.exports.addPresentation = addPresentation
module.exports.removePresentation = removePresentation
module.exports.replacePresentations = replacePresentations
module.exports.addLunchTalk = addLunchTalk
module.exports.removeLunchTalk = removeLunchTalk
module.exports.replaceLunchTalks = replaceLunchTalks
