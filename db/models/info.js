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
  created: Date
}, {
  toJSON: {
    transform: function (doc, ret) {
      delete ret._id
      delete ret.__v
    }
  }
})

infoSchema.index({ companyId: 1, edition: 1 }, { unique: true })

module.exports = mongoose.model('Info', infoSchema)
