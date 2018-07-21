let path = require('path')
let Venue = require(path.join(__dirname, '..', 'models', 'venue'))

module.exports.find = async (filter) => {
  return filter ? Venue.findOne(filter) : Venue.find()
}

module.exports.create = async (edition) => {
  let newVenue = new Venue({ edition: edition })
  return newVenue.save()
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
      new: true
    }
  )
}
