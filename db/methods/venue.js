let path = require('path')
let Venue = require(path.join(__dirname, '..', 'models', 'venue'))

const ommitedFields = { _id: 0, __v: 0 }

module.exports.find = async (filter) => {
  return filter ? Venue.findOne(filter, ommitedFields) : Venue.find({}, ommitedFields)
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
      upsert: true,
      fields: ommitedFields
    }
  )
}
