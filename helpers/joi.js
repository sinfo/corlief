const Joi = require('joi')

/** ========================================
 *  VENUE
 *  ========================================
 */

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
  kind: Joi.string().required(),

  day: Joi.number().min(1).max(5).required(),

  start: Joi.date().required(),

  end: Joi.date().required()
})

let activities = Joi.object().keys({
  kind: Joi.string().required(),
  slots: Joi.array().items(
    activity
  )
})

let activityAvailability = Joi.object().keys({
  id: Joi.number().integer().min(0),
  free: Joi.boolean(),
  start: Joi.date(),
  end: Joi.date()
})

let activitiesAvailability = Joi.object().keys({
  kind: Joi.string(),
  slots: Joi.array().items(activityAvailability).unique((s1, s2) => {
    return s1.id === s2.id
  })
})

let activitiesPayload = Joi.array().items(activityPayload)

let venue = Joi.object().keys({
  edition: Joi.string().required(),
  image: Joi.string(),
  stands: Joi.array().items(
    stand.optional()
  ).label('stand'),
  activities: Joi.array().items(activities.optional())
}).label('venue')

let venues = Joi.array().items(venue).min(0)

let venueAvailability = Joi.object().keys({
  venue: venue,
  availability: Joi.array().items(
    Joi.object().keys({
      day: Joi.number().integer().min(1).max(5).required(),
      nStands: Joi.number().integer(),
      stands: Joi.array().items(
        Joi.object().keys({
          id: Joi.number().integer().min(0),
          free: Joi.boolean()
        })
      ).unique((s1, s2) => {
        return s1.id === s2.id
      }),
      activities: Joi.array().items(activitiesAvailability)

    })
  )
})

module.exports.venueAvailability = venueAvailability

module.exports.standPayload = standPayload
module.exports.standsPayload = standsPayload
module.exports.activityPayload = activityPayload
module.exports.activitiesPayload = activitiesPayload
module.exports.stand = stand

module.exports.venue = venue
module.exports.venues = venues

/** ========================================
 *  LINK
 *  ========================================
 */

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
  participationDays: Joi.number().min(0),
  activities: Joi.array()
    .items(Joi.string()
      .min(1).max(30)
      .description('Type of activity')),
  advertisementKind: Joi.string().required(),
  workshop: Joi.bool(),
  presentation: Joi.bool(),
  lunchTalk: Joi.bool()
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
    .required().min(0)
    .description('Amount of days company will participate in edition'),
  advertisementKind: Joi.string()
    .required().min(1).max(100)
    .description('Company advertisement package in edition'),
  activities: Joi.array()
    .items(Joi.string()
      .min(1).max(30)
      .description('Type of activity')).default([]),
  expirationDate: Joi.date()
    .required().min(new Date())
    .description('Date of link expiration')
})

module.exports.link = link
module.exports.links = links
module.exports.linkPayload = linkPayload

/** ========================================
 *  CONFIG
 *  ========================================
 */

let config = Joi.object().keys({
  edition: Joi.string().required(),
  mandatory_info_before_reservations: Joi.boolean().required(),
  consecutive_days_reservations: Joi.boolean().required()
}).label('config')

let configs = Joi.array().items(config).min(0)

module.exports.config = config
module.exports.configs = configs

/** ========================================
 *  CREDENTIALS
 *  ========================================
 */

let credentials = Joi.object().keys({
  exp: Joi.number().required(),
  company: Joi.string().required(),
  companyName: Joi.string(),
  edition: Joi.string().required(),
  iat: Joi.number(),
  participationDays: Joi.number().required(),
  activities: Joi.array().items(Joi.string())
})

module.exports.credentials = credentials

let sinfoCredentials = Joi.object().keys({
  user: Joi.string().required(),
  token: Joi.string().required()
})

module.exports.sinfoCredentials = sinfoCredentials

/** ========================================
 *  RESERVATIONS
 *  ========================================
 */

let standReservation = Joi.object().keys({
  day: Joi.number().required().min(1),
  standId: Joi.number().min(0).max(100)
})

let standsReservation = Joi.object().keys({
  stands: Joi.array().items(standReservation)
    .min(0).unique((s1, s2) => {
      return s1.day === s2.day
    }),
  activities: Joi.array().items(
    Joi.object().keys({
      kind: Joi.string().min(0),
      id: Joi.number().min(0)
    })
  ).default([])
})

let reservation = Joi.object().keys({
  id: Joi.number().required(),
  companyId: Joi.string().required(),
  edition: Joi.string().required(),
  issued: Joi.date().required(),
  stands: Joi.array().items(standReservation)
    .min(0).unique((s1, s2) => {
      return s1.day === s2.day
    }),
  activities: Joi.array().items(
    Joi.object().keys({
      kind: Joi.string().min(0),
      id: Joi.number().min(0)
    })
  ),
  feedback: Joi.object().keys({
    status: Joi.string().required(),
    member: Joi.string().optional()
  })
})
let reservations = Joi.array().items(reservation).min(0)

module.exports.reservation = reservation
module.exports.reservations = reservations

module.exports.standReservation = standReservation
module.exports.standsReservation = standsReservation

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

let companyInfo = Joi.object().keys({
  companyId: Joi.string().required(),
  info: Joi.object().keys({
    numberOfPeople: Joi.number().min(0),
    licensePlates: Joi.array().items(Joi.string()).min(0)
  }),
  edition: Joi.string(),
  titles: Joi.object().keys({
    presentation: Joi.string(),
    lunchTalk: Joi.string(),
    workshop: Joi.string()
  }),
  feedback: Joi.object().keys({
    status: Joi.string().required(),
    member: Joi.string().optional()
  }),
  created: Joi.date().required()
})

module.exports.companyInfo = companyInfo
