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
        required: true
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

venueSchema.methods.getStandsAvailability = function (confirmedStands, duration) {
  let response = []
  const standsIds = this.getIds()

  for (let day = 1; day <= duration; day++) {
    let stands = []

    for (let id of standsIds) {
      let result = {
        id: id,
        free: true
      }

      let isConfirmed = confirmedStands.filter(confirmed => {
        for (let stand of confirmed.stands) {
          if (stand.day === day && stand.standId === id) {
            return true
          }
        }
        return false
      }).length > 0

      if (isConfirmed) {
        result.free = false
      }

      stands.push(result)
    }

    response.push({
      day: day,
      stands: stands
    })
  }

  return response
}

module.exports = mongoose.model('Venue', venueSchema)
