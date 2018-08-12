let path = require('path')
let Venue = require(path.join(__dirname, '..', 'models', 'venue'))

function arrayToJSON (venues) {
  return venues.map(venue => venue.toJSON())
}

async function find (filter) {
  return filter ? Venue.findOne(filter) : Venue.find()
}

async function updateImage (edition, image) {
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

async function addStand (edition, topLeft, bottomRight) {
  let venue = await find({ edition: edition })

  if (venue === null || venue.image.length === 0) {
    return null
  }

  let standsId = venue.stands.map(stand => stand.id).sort()
  let newId = 0

  for (let standId of standsId) {
    if (newId < standId) {
      break
    }
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

async function removeStand (edition, id) {
  let venue = await find({ edition: edition })

  if (venue === null || venue.image.length === 0) {
    return null
  }

  // find stand with stand.id == id
  let i = 0
  for (; i < venue.stands.length && venue.stands[i].id !== id; i++);
  if (i === venue.stands[i].length) {
    return -1 // stand not found
  }

  // remove element
  venue.stands.splice(i, 1)

  return venue.save()
}

async function replaceStands (edition, stands) {
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

module.exports.arrayToJSON = arrayToJSON
module.exports.find = find
module.exports.updateImage = updateImage
module.exports.addStand = addStand
module.exports.removeStand = removeStand
module.exports.replaceStands = replaceStands
