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
  },
  workshops: {
    type: [{
      id: {
        type: Number,
        min: 0,
        required: true
      },
      day: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      start: {
        type: Date,
        required: true
      },
      end: {
        type: Date,
        required: true
      }
    }],
    default: []
  },
  presentations: {
    type: [{
      id: {
        type: Number,
        min: 0,
        required: true
      },
      day: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      start: {
        type: Date,
        required: true
      },
      end: {
        type: Date,
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
      ret.workshops.forEach(stand => {
        delete stand._id
        delete stand.__v
      })
      ret.presentations.forEach(stand => {
        delete stand._id
        delete stand.__v
      })
    }
  }
})

venueSchema.methods.getIds = function () {
  return this.stands.map(stand => stand.id)
}

venueSchema.methods.getWsIds = function () {
  return this.workshops.map(ws => ws.id)
}

venueSchema.methods.getPresIds = function () {
  return this.presentations.map(pres => pres.id)
}

venueSchema.methods.getStandsAvailability = function (confirmedStands, pendingStands, duration) {
  let response = {
    venue: this.toJSON(),
    availability: []
  }

  const standsIds = this.getIds()

  for (let day = 1; day <= duration; day++) {
    let stands = []
    let ws = []
    let pres = []

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

      let isPending = pendingStands.filter(pending => {
        for (let stand of pending.stands) {
          if (stand.day === day && stand.standId === id) {
            return true
          }
        }
        return false
      }).length > 0

      if (isConfirmed || isPending) {
        result.free = false
      }

      stands.push(result)
    }

    for (let w of this.workshops.filter(ws => ws.day === day)) {
      let result = {
        id: w.id,
        free: true,
        start: w.start,
        end: w.end
      }

      let isConfirmed = confirmedStands.filter(confirmed => {
        for (let wss of confirmed.workshops) {
          if (wss.day === day && wss.id === w.id) {
            return true
          }
        }
        return false
      }).length > 0

      let isPending = pendingStands.filter(confirmed => {
        for (let wss of confirmed.workshops) {
          if (wss.day === day && wss.id === w.id) {
            return true
          }
        }
        return false
      }).length > 0

      if (isConfirmed || isPending) {
        result.free = false
      }

      ws.push(result)
    }

    for (let w of this.presentations.filter(p => p.day === day)) {
      let result = {
        id: w.id,
        free: true,
        start: w.start,
        end: w.end
      }

      let isConfirmed = confirmedStands.filter(confirmed => {
        for (let wss of confirmed.presentations) {
          if (wss.day === day && wss.id === w.id) {
            return true
          }
        }
        return false
      }).length > 0

      let isPending = pendingStands.filter(confirmed => {
        for (let wss of confirmed.presentations) {
          if (wss.day === day && wss.id === w.id) {
            return true
          }
        }
        return false
      }).length > 0

      if (isConfirmed || isPending) {
        result.free = false
      }
      pres.push(result)
    }

    response.availability.push({
      day: day,
      stands: stands,
      workshops: ws,
      presentations: pres
    })
  }

  return response
}

module.exports = mongoose.model('Venue', venueSchema)
