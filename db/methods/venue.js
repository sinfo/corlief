let path = require('path')
let Venue = require(path.join(__dirname, '..', 'models', 'venue'))

module.exports.arrayToJSON = (venues) => {
  return venues.map(venue => venue.toJSON())
}

module.exports.find = async (filter) => {
  return filter ? Venue.findOne(filter) : Venue.find()
}

module.exports.updateImage = async (edition, image) => {
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
