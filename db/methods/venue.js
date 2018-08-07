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
  let newId

  for (newId = 0; newId < standsId.length; newId++) {
    if (newId < standsId[newId]) {
      break
    }
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

module.exports.arrayToJSON = arrayToJSON
module.exports.find = find
module.exports.updateImage = updateImage
module.exports.addStand = addStand
