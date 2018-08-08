let mongoose = require('mongoose')

let configSchema = mongoose.Schema({
  edition: {
    type: String,
    unique: true,
    required: true
  },
  mandatory_info_before_reservations: {
    type: Boolean,
    default: false
  },
  consecutive_days_reservations: {
    type: Boolean,
    default: false
  }
}, {
  toJSON: {
    transform: function (doc, ret) {
      delete ret._id
      delete ret.__v
    }
  }
})

module.exports = mongoose.model('Config', configSchema)
