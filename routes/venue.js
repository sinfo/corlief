const logger = require('logger').getLogger()
const Boom = require('boom')
const Joi = require('joi')
const path = require('path')
const helpers = require(path.join(__dirname, '..', 'helpers'))

module.exports = [
  {
    method: 'GET',
    path: '/venue',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Gets all venues',
      handler: async (request, h) => {
        try {
          let venues = await request.server.methods.venue.find()
          let result = await request.server.methods.venue.arrayToJSON(venues)
          return result
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown()
      },
      response: {
        schema: helpers.joi.venues
      }
    }
  },
  {
    method: 'GET',
    path: '/venue/current',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Gets venue from the current edition',
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          const edition = request.pre.edition
          let venue = await request.server.methods.venue.find({ edition: edition })
          return venue === null ? Boom.notFound('No venue found') : venue.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown()
      },
      response: {
        schema: helpers.joi.venue
      }
    }
  },
  {
    method: 'GET',
    path: '/venue/{edition}',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Gets a venue or all editions\' venues',
      handler: async (request, h) => {
        try {
          let venue = await request.server.methods.venue.find(request.params)
          return venue === null ? Boom.notFound('No venue associated') : venue.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        params: {
          edition: Joi.string().min(1)
            .max(30)
            .description('Edition Number')
        }
      },
      response: {
        schema: helpers.joi.venue
      }
    }
  },
  {
    method: 'POST',
    path: '/venue/image',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Uploads a venue\'s image to the latest edition',
      pre: [
        helpers.pre.edition,
        helpers.pre.file
      ],
      handler: async (request, h) => {
        try {
          let edition = request.pre.edition
          let file = request.pre.file

          let imageLocation = await request.server.methods.files.venue.upload(
            file.data,
            `venue${file.extension}`,
            edition)

          if (imageLocation === null) {
            return Boom.expectationFailed('Could not upload image')
          }

          let venue = await request.server.methods.venue.updateImage(edition, imageLocation)

          return venue === null ? Boom.badData('Invalid data for the venue') : venue.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form'
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        payload: {
          file: Joi.any()
            .meta({ swaggerType: 'file' })
            .required()
            .description('image file')
        }
      },
      payload: {
        maxBytes: 1024 * 1024 * 100, // 100MB
        parse: true,
        output: 'stream',
        allow: 'multipart/form-data'
      },
      response: {
        schema: helpers.joi.venue
      }
    }
  },
  {
    method: 'POST',
    path: '/venue/stand',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Adds a stand to the venue corresponding to the latest edition',
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          let topLeft = request.payload.topLeft
          let bottomRight = request.payload.bottomRight

          if (topLeft.x > bottomRight.x) {
            return Boom.badData('topLeft should have an \'x value lower than bottomRight\'s')
          }

          if (topLeft.y < bottomRight.y) {
            return Boom.badData('topLeft should have an \'y value lower than bottomRight\'s')
          }

          let venue = await request.server.methods.venue.addStand(request.pre.edition, topLeft, bottomRight)
          return venue === null
            ? Boom.badData('No venue associated with this event or with image')
            : venue.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        payload: helpers.joi.standPayload
          .description('Stand')
      },
      response: {
        schema: helpers.joi.venue
      }
    }
  },
  {
    method: 'DELETE',
    path: '/venue/stand/{id}',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Removes stand with id from the venue corresponding to the latest edition',
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          let venue = await request.server.methods.venue.removeStand(request.pre.edition, request.params.id)
          return venue === null
            ? Boom.badData('No stand with this id in the venue')
            : venue.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        params: {
          id: Joi.number().min(0)
        }
      },
      response: {
        schema: helpers.joi.venue
      }
    }
  },
  {
    method: 'PUT',
    path: '/venue/stand',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Replaces all stands on the venue corresponding to the latest edition',
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          let stands = request.payload

          for (let stand of stands) {
            if (stand.topLeft.x > stand.bottomRight.x) {
              return Boom.badData('topLeft should have an \'x value lower than bottomRight\'s')
            }

            if (stand.topLeft.y < stand.bottomRight.y) {
              return Boom.badData('topLeft should have an \'y value lower than bottomRight\'s')
            }
          }

          let venue = await request.server.methods.venue.replaceStands(request.pre.edition, stands)

          return venue === null
            ? Boom.badData('No venue associated with this event or with image')
            : venue.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        payload: helpers.joi.standsPayload
          .description('Stands')
      },
      response: {
        schema: helpers.joi.venue
      }
    }
  },
  {
    method: 'POST',
    path: '/venue/workshop',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Adds a workshop to the venue corresponding to the latest edition',
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          let start = request.payload.start
          let end = request.payload.end
          let day = request.payload.day

          if (start >= end) {
            return Boom.badData('Start date must be before end date')
          }

          let venue = await request.server.methods.venue.addWorkshop(request.pre.edition, day, start, end)
          return venue === null
            ? Boom.badData('No venue associated with this event or with image')
            : venue.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        payload: helpers.joi.activityPayload
          .description('Workshop')
      },
      response: {
        schema: helpers.joi.venue
      }
    }
  },
  {
    method: 'DELETE',
    path: '/venue/workshop/{id}',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Removes workshop with id from the venue corresponding to the latest edition',
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          let venue = await request.server.methods.venue.removeWorkshop(request.pre.edition, request.params.id)
          return venue === null
            ? Boom.badData('No workshop with this id in the venue')
            : venue.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        params: {
          id: Joi.number().min(0)
        }
      },
      response: {
        schema: helpers.joi.venue
      }
    }
  },
  {
    method: 'PUT',
    path: '/venue/workshop',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Replaces all workshops on the venue corresponding to the latest edition',
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          let workshops = request.payload

          for (let workshop of workshops) {
            if (workshop.start >= workshop.end) {
              return Boom.badData('Start date must be before end date')
            }
          }

          let venue = await request.server.methods.venue.replaceWorkshops(request.pre.edition, workshops)

          return venue === null
            ? Boom.badData('No venue associated with this event or with image')
            : venue.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        payload: helpers.joi.activitiesPayload
          .description('Workshops')
      },
      response: {
        schema: helpers.joi.venue
      }
    }
  },
  {
    method: 'POST',
    path: '/venue/presentation',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Adds a presentation to the venue corresponding to the latest edition',
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          let start = request.payload.start
          let end = request.payload.end

          if (start >= end) {
            return Boom.badData('Start date must be before end date')
          }

          let venue = await request.server.methods.venue.addPresentation(request.pre.edition, request.payload.day, start, end)
          return venue === null
            ? Boom.badData('No venue associated with this event or with image')
            : venue.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        payload: helpers.joi.activityPayload
          .description('Presentation')
      },
      response: {
        schema: helpers.joi.venue
      }
    }
  },
  {
    method: 'DELETE',
    path: '/venue/presentation/{id}',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Removes presentaion with id from the venue corresponding to the latest edition',
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          let venue = await request.server.methods.venue.removePresentation(request.pre.edition, request.params.id)
          return venue === null
            ? Boom.badData('No presentation with this id in the venue')
            : venue.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        params: {
          id: Joi.number().min(0)
        }
      },
      response: {
        schema: helpers.joi.venue
      }
    }
  },
  {
    method: 'PUT',
    path: '/venue/presentation',
    config: {
      auth: 'sinfo',
      tags: ['api'],
      description: 'Replaces all presentations on the venue corresponding to the latest edition',
      pre: [
        helpers.pre.edition
      ],
      handler: async (request, h) => {
        try {
          let presentations = request.payload

          for (let presentation of presentations) {
            if (presentation.start >= presentation.end) {
              return Boom.badData('Start date must be before end date')
            }
          }

          let venue = await request.server.methods.venue.replacePresentations(request.pre.edition, presentations)

          return venue === null
            ? Boom.badData('No venue associated with this event or with image')
            : venue.toJSON()
        } catch (err) {
          logger.error({ info: request.info, error: err })
          return Boom.boomify(err)
        }
      },
      validate: {
        headers: Joi.object({
          'Authorization': Joi.string()
        }).unknown(),
        payload: helpers.joi.activitiesPayload
          .description('Presentations')
      },
      response: {
        schema: helpers.joi.venue
      }
    }
  }
]
