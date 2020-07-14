let mongoose = require('mongoose')

let reservationSchema = mongoose.Schema({
  id: {
    type: Number,
    min: 0,
    required: true
  },
  companyId: {
    type: String,
    required: true
  },
  edition: {
    type: String,
    required: true
  },
  issued: {
    type: Date,
    required: true,
    default: Date.now
  },
  stands: {
    type: [{
      day: {
        type: Number,
        min: 1,
        required: true
      },
      standId: {
        type: Number,
        min: 0,
        required: true
      }
    }],
    required: true,
    default: []
  },
  workshop: {
    type: Number,
    min: 0
  },
  presentation: {
    type: Number,
    min: 0
  },
  feedback: {
    type: {
      status: {
        type: String,
        enum: ['CONFIRMED', 'CANCELLED', 'PENDING'],
        required: true
      },
      member: {
        type: String
      }
    },
    default: {
      status: 'PENDING'
    },
    required: true
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

reservationSchema.index({ id: 1, companyId: 1, edition: 1 }, { unique: true })

reservationSchema.methods.addStand = function (stand) {
  let stands = this.stands.filter(s => s.day !== stand.day)

  stands.push(stand)

  return stands
}

reservationSchema.methods.addStands = function (stands, workshop, presentation) {
  for (let s of stands) {
    this.stands = this.addStand(s)
  }

  if (workshop) { this.workshop = workshop }
  if (presentation) { this.presentation = presentation }

  return this.save()
}

reservationSchema.methods.confirm = async function (member) {
  if (member) {
    this.set({
      feedback: {
        status: 'CONFIRMED',
        member: member
      }
    })
  } else {
    this.set({ feedback: { status: 'CONFIRMED' } })
  }

  return this.save()
}

reservationSchema.methods.cancel = async function (member) {
  if (this.feedback.status === 'CANCELLED') {
    return null
  }

  if (member) {
    this.set({
      feedback: {
        status: 'CANCELLED',
        member: member
      }
    })
  } else {
    this.set({ feedback: { status: 'CANCELLED' } })
  }

  return this.save()
}

reservationSchema.static('getLatest', async function (companyId, edition) {
  let reservations = await this.find({ companyId: companyId, edition: edition }).sort('-id')
  return reservations.length > 0
    ? reservations[0]
    : null
})

reservationSchema.static('getAllLatest', async function (edition) {
  let companies = await this.distinct('companyId', { edition: edition })
  let allLatest = []

  for (let companyId of companies) {
    let latest = await this.getLatest(companyId, edition)
    if (latest !== null) {
      allLatest.push(latest)
    }
  }

  return allLatest
})

reservationSchema.static('getConfirmedReservations', async function (edition) {
  return this.find({ edition: edition, 'feedback.status': 'CONFIRMED' })
})

reservationSchema.static('getPendingReservations', async function (edition) {
  return this.find({ edition: edition, 'feedback.status': 'PENDING' })
})

module.exports = mongoose.model('Reservation', reservationSchema)
