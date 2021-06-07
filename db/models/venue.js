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
  activities: {
    type: [{
      kind: String,
      slots: {
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
      ret.activities.forEach(activity => {
        delete activity._id
        delete activity.__v
        activity.slots.forEach(slot => {
          delete slot._id
          delete slot.__v
        })
      })
    }
  }
})

venueSchema.methods.getIds = function () {
  return this.stands.map(stand => stand.id)
}

venueSchema.methods.getActivityIds = function (kind) {
  const activity = this.activities.find(a => a.kind === kind)
  return activity.slots.map(a => a.id)
}

venueSchema.methods.getStandsAvailability = function (confirmedStands, pendingStands, duration) {
  let response = {
    venue: this.toJSON(),
    availability: []
  }

  const standsIds = this.getIds()

  for (let day = 1; day <= duration; day++) {
    let stands = []
    let nStands = 0
    let activities = []

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

    confirmedStands.forEach(res => {
      for (let stand of res.stands) {
        if (stand.day === day) {
          nStands++
        }
      }
    })

    for (let activity of this.activities) {
      const res = { kind: activity.kind, slots: [] }

      for (let act of activity.slots.filter(a => a.day === day)) {
        let result = {
          id: act.id,
          free: true,
          start: act.start,
          end: act.end
        }

        let isConfirmed = confirmedStands.filter(confirmed => {
          const a = confirmed.activities.find(a => a.kind === res.kind)
          return a && a.id === act.id
        }).length > 0

        let isPending = pendingStands.filter(confirmed => {
          const a = confirmed.activities.find(a => a.kind === res.kind)
          return a && a.id === act.id
        }).length > 0

        if (isConfirmed || isPending) {
          result.free = false
        }

        res.slots.push(result)
      }

      activities.push(res)
    }

    response.availability.push({
      day: day,
      nStands: nStands,
      stands: stands,
      activities: activities
    })
  }

  return response
}

module.exports = mongoose.model('Venue', venueSchema)
