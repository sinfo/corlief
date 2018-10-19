let mongoose = require('mongoose')

let linkSchema = mongoose.Schema({
  companyId: {
    type: String
  },
  companyName: {
    type: String,
    required: false
  },
  contacts: {
    company: {
      type: String,
      required: false
    },
    member: {
      type: String,
      required: true
    }
  },
  edition: {
    type: String
  },
  created: Date,
  token: {
    type: String,
    unique: true
  },
  valid: Boolean,
  participationDays: Number,
  activities: [{
    kind: String,
    date: Date
  }],
  advertisementKind: String
}, {
  toJSON: {
    transform: function (doc, ret) {
      delete ret._id
      delete ret.__v
    }
  }
})

linkSchema.index({ companyId: 1, edition: 1 }, { unique: true })

module.exports = mongoose.model('Link', linkSchema)
