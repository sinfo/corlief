let mongoose = require('mongoose')

let venueSchema = mongoose.Schema({
  edition: {
    type: String,
    unique: true
  },
  image: {
    type: String,
    unique: true
  },
  stands: [{
    id: {
      type: Number,
      min: 0,
      required: true
    },
    pos1: {
      type: {
        x: Number,
        y: Number
      },
      required: true
    },
    pos2: {
      type: {
        x: Number,
        y: Number
      },
      required: true
    }
  }]
})

module.exports = mongoose.model('Venue', venueSchema)
