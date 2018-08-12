let mongoose = require('mongoose')

let venueSchema = mongoose.Schema({
  edition: {
    type: String,
    unique: true,
    required: true
  },
  image: {
    type: String,
    unique: true
  },
  stands: {
    type: [{
      id: {
        type: Number,
        min: 0,
        required: true,
        unique: true
      },
      topLeft: {
        type: {
          x: {
            type: Number,
            min: 0
          },
          y: {
            type: Number,
            min: 0
          }
        },
        required: true
      },
      bottomRight: {
        type: {
          x: {
            type: Number,
            min: 0
          },
          y: {
            type: Number,
            min: 0
          }
        },
        required: true
      }
    }],
    default: []
  }
}, {
  toJSON: {
    transform: function (doc, ret) {
      delete ret._id
      delete ret.__v
      ret.stands.forEach(stand => {
        delete stand._id
        delete stand.__v
      })
    }
  }
})

venueSchema.methods.getIds = function () {
  return this.stands.map(stand => stand.id)
}

module.exports = mongoose.model('Venue', venueSchema)
