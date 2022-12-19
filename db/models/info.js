let mongoose = require('mongoose')

let infoSchema = mongoose.Schema({
  companyId: {
    type: String
  },
  info: {
    numberOfPeople: {
        type: Number,
        required: true
    },
    licensePlates: {
        type: [String],
        required: true
    }
  },
  edition: {
    type: String
  },
  titles: {
    presentation: {
      type: String
    },
    lunchTalk: {
      type: String
    },
    workshop: {
      type: String
    }
  },
  created: Date,
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
    }
  }
})

infoSchema.index({ companyId: 1, edition: 1 }, { unique: true })

infoSchema.methods.confirm = async function (member) {
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

infoSchema.methods.cancel = async function (member) {
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

module.exports = mongoose.model('Info', infoSchema)
