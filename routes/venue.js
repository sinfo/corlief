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
      tags: ['api'],
      description: 'Gets all venues',
      handler: async (request, h) => {
        try {
          let venues = await request.server.methods.venue.find()
          let result = await request.server.methods.venue.arrayToJSON(venues)
          return result
        } catch (err) {
          logger.error(err)
          return Boom.boomify(err)
        }
      },
      response: {
        schema: helpers.responses.venues
      }
    }
  },
  {
    method: 'GET',
    path: '/venue/{edition}',
    config: {
      tags: ['api'],
      description: 'Gets a venue or all editions\' venues',
      notes: 'based on the edition and/or token in the query',
      handler: async (request, h) => {
        try {
          let venue = await request.server.methods.venue.find(request.params)
          return venue === null ? Boom.notFound('No venue associated') : venue.toJSON()
        } catch (err) {
          logger.error(err)
          return Boom.boomify(err)
        }
      },
      validate: {
        params: {
          edition: Joi.string().min(1)
            .max(30)
            .description('Edition Number')
        }
      },
      response: {
        schema: helpers.responses.venue
      }
    }
  },
  {
    method: 'POST',
    path: '/venue/image',
    config: {
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
          console.error(err)
          logger.error(err)
          return Boom.boomify(err)
        }
      },
      plugins: {
        'hapi-swagger': {
          payloadType: 'form'
        }
      },
      validate: {
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
        schema: helpers.responses.venue
      }
    }
  }
]
