const Joi = require('joi')

let venue = Joi.object().keys({
  edition: Joi.string().required(),
  image: Joi.string(),
  stands: Joi.array().items(
    Joi.object().keys({
      id: Joi.number().min(0).required(),
      pos1: Joi.object().keys({
        x: Joi.number().min(0).required(),
        y: Joi.number().min(0).required()
      }).required(),
      pos2: Joi.object().keys({
        x: Joi.number().min(0).required(),
        y: Joi.number().min(0).required()
      }).required()
    }).optional()
  ).label('stand')
}).label('venue')

let venues = Joi.array().items(venue).min(0)

module.exports.venue = venue
module.exports.venues = venues

let link = Joi.object().keys({
  companyId: Joi.string().required(),
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
  advertisementKind: Joi.string().required()
}).label('link')

let links = Joi.array().items(link).min(0)

module.exports.link = link
module.exports.links = links
