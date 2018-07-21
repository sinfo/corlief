let path = require('path')
let Venue = require(path.join(__dirname, '..', 'models', 'venue'))

module.exports.find = async (filter) => {
  return Venue.findOne(filter)
}

module.exports.create = async (edition) => {
  let newVenue = new Venue({ edition: edition })
  return newVenue.save()
}
