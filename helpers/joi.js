const Joi = require('joi')

let stand = Joi.object().keys({
  id: Joi.number().min(0).required(),

  topLeft: Joi.object().keys({
    x: Joi.number().min(0).required(),
    y: Joi.number().min(0).required()
  }).required(),

  bottomRight: Joi.object().keys({
    x: Joi.number().min(0).required(),
    y: Joi.number().min(0).required()
  }).required()
})

let standPayload = Joi.object().keys({
  topLeft: Joi.object().keys({
    x: Joi.number().min(0).required(),
    y: Joi.number().min(0).required()
  }).required(),

  bottomRight: Joi.object().keys({
    x: Joi.number().min(0).required(),
    y: Joi.number().min(0).required()
  }).required()
})

let standsPayload = Joi.array().items(standPayload)

let activity = Joi.object().keys({
  id: Joi.number().min(0).required(),

  day: Joi.number().min(1).max(5).required(),

  start: Joi.date().required(),

  end: Joi.date().required()
})

let activityPayload = Joi.object().keys({

  day: Joi.number().min(1).max(5).required(),

  start: Joi.date().required(),

  end: Joi.date().required()
})

let activitiesPayload = Joi.array().items(activityPayload)

let venue = Joi.object().keys({
  edition: Joi.string().required(),
  image: Joi.string(),
  stands: Joi.array().items(
    stand.optional()
  ).label('stand'),
  workshops: Joi.array().items(activity.optional()).label('workshop'),
  presentations: Joi.array().items(activity.optional()).label('presentation')
}).label('venue')

let venues = Joi.array().items(venue).min(0)

module.exports.standPayload = standPayload
module.exports.standsPayload = standsPayload
module.exports.activityPayload = activityPayload
module.exports.activitiesPayload = activitiesPayload
module.exports.stand = stand

module.exports.venue = venue
module.exports.venues = venues

let link = Joi.object().keys({
  companyId: Joi.string().required(),
  companyName: Joi.string(),
  contacts: Joi.object().keys({
    company: Joi.string(),
    member: Joi.string().required()
  }),
  edition: Joi.string().required(),
  created: Joi.date().required(),
  token: Joi.string().required(),
  valid: Joi.boolean().required(),
  participationDays: Joi.number().min(1),
  activities: Joi.array().items(
    Joi.object().keys({
      kind: Joi.string().required(),
      date: Joi.date().required()
    }).label('activities')
  ),
  advertisementKind: Joi.string().required(),
  workshop: Joi.bool(),
  presentation: Joi.bool()
}).label('link')

let links = Joi.array().items(link).min(0)

let linkPayload = Joi.object().keys({
  companyId: Joi.string()
    .required().min(1).max(50)
    .description('Company identifier'),
  companyEmail: Joi.string()
    .optional().min(1).max(50)
    .description('Email contact of the company\'s employer'),
  participationDays: Joi.number()
    .required().min(1).max(5)
    .description('Amount of days company will participate in edition'),
  advertisementKind: Joi.string()
    .required().min(1).max(100)
    .description('Company advertisement package in edition'),
  activities: Joi.array()
    .items(Joi.object({
      kind: Joi.string()
        .min(1).max(30)
        .description('Type of activity'),
      date: Joi.date()
        .description('Date of realization of such activity')
    })),
  expirationDate: Joi.date()
    .required().min(new Date())
    .description('Date of link expiration'),
  workshop: Joi.bool().description('Company has workshop'),
  presentation: Joi.bool().description('Company has presentation')
})

module.exports.link = link
module.exports.links = links
module.exports.linkPayload = linkPayload

let config = Joi.object().keys({
  edition: Joi.string().required(),
  mandatory_info_before_reservations: Joi.boolean().required(),
  consecutive_days_reservations: Joi.boolean().required()
}).label('config')

let configs = Joi.array().items(config).min(0)

module.exports.config = config
module.exports.configs = configs

let credentials = Joi.object().keys({
  exp: Joi.number().required(),
  company: Joi.string().required(),
  companyName: Joi.string(),
  edition: Joi.string().required(),
  iat: Joi.number(),
  participationDays: Joi.number().required()
})

module.exports.credentials = credentials

let sinfoCredentials = Joi.object().keys({
  user: Joi.string().required(),
  token: Joi.string().required()
})

module.exports.sinfoCredentials = sinfoCredentials

let standReservation = Joi.object().keys({
  day: Joi.number().required().min(1).max(5),
  standId: Joi.number().required().min(0).max(100)
})

let standsReservation = Joi.object().keys({
  stands: Joi.array().items(standReservation)
    .min(1).unique((s1, s2) => {
      return s1.day === s2.day
    }),
  workshop: Joi.number().min(0),
  presentation: Joi.number().min(0)
})

module.exports.standReservation = standReservation
module.exports.standsReservation = standsReservation

let reservation = Joi.object().keys({
  id: Joi.number().required(),
  companyId: Joi.string().required(),
  edition: Joi.string().required(),
  issued: Joi.date().required(),
  stands: Joi.array().items(standReservation)
    .min(1).unique((s1, s2) => {
      return s1.day === s2.day
    }),
  workshop: Joi.number().min(0),
  presentation: Joi.number().min(0),
  feedback: Joi.object().keys({
    status: Joi.string().required(),
    member: Joi.string().optional()
  })
})
let reservations = Joi.array().items(reservation).min(0)

module.exports.reservation = reservation
module.exports.reservations = reservations

let venueAvailability = Joi.object().keys({
  venue: venue,
  availability: Joi.array().items(
    Joi.object().keys({
      day: Joi.number().integer().min(1).max(5).required(),
      stands: Joi.array().items(
        Joi.object().keys({
          id: Joi.number().integer().min(0),
          free: Joi.boolean()
        })
      ).unique((s1, s2) => {
        return s1.id === s2.id
      })
    })
  )
})

module.exports.venueAvailability = venueAvailability

let company = Joi.object().keys({
  id: Joi.string().required(),
  name: Joi.string().required(),
  img: Joi.string()
})

let companies = Joi.array().items(company).min(0)

module.exports.companies = companies

let expirationDate = Joi.object().keys({
  expirationDate: Joi.date().required()
})

module.exports.expirationDate = expirationDate
