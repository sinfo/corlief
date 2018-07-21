let path = require('path')
let Venue = require(path.join(__dirname, '..', 'models', 'venue'))

const ommit = { _id: 0, __v: 0 }

module.exports.find = async (filter) => {
  return filter ? Venue.findOne(filter, ommit).lean() : Venue.find({}, ommit).lean()
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
      projection: ommit
    }
  ).lean()
}
