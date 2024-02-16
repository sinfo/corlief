let mongoose = require('mongoose')

let contractSchema = mongoose.Schema({
  companyId: {
    type: String
  },
  fileName: {
    type: String
  },
  edition: {
    type: String
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

contractSchema.index({ companyId: 1, edition: 1 }, { unique: true })

contractSchema.methods.confirm = async function (member) {
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

contractSchema.methods.cancel = async function (member) {
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

module.exports = mongoose.model('Contract', contractSchema)
