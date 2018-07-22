let mongoose = require('mongoose')

let linkSchema = mongoose.Schema({
  companyId: {
    type: String
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
})

module.exports = mongoose.model('Link', linkSchema)
