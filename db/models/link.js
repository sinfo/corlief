let mongoose = require('mongoose')

let linkSchema = mongoose.Schema({
  companyId: {
    type: String,
    unique: true
  },
  edition: {
    type: String,
    unique: true
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

linkSchema.options.toJSON = {
  transform: function (doc, ret, options) {
    delete ret._id
    delete ret.__v
    return ret
  }
}

module.exports = mongoose.model('Link', linkSchema)
