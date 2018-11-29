const config = require('./config')
const Hapi = require('hapi')
const hapiRouter = require('hapi-router')
const Inert = require('inert')
const Vision = require('vision')
const HapiSwagger = require('hapi-swagger')
const Pack = require('./package')
const plugins = require('./plugins')
const auth = require('./auth')

// Create a server with a host and port
const server = Hapi.server({
  host: config.HOST,
  port: config.PORT,
  routes: {
    cors: {
      origin: config.CORS
    }
  }
})

async function register () {
  await server.register(plugins)
  auth(server)
  await server.register([
    {
      plugin: hapiRouter,
      options: {
        routes: './routes/*.js'
      }
    },
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: {
        schemes: [ process.env.NODE_ENV === 'production' ? 'https' : 'http' ],
        host: config.CORLIEF_PATH,
        cors: true,
        info: {
          title: `${Pack.name} API documentation`,
          version: Pack.version
        }
      }
    }
  ])
}

// Start the server
async function start () {
  try {
    config.validate()
    await register()
    await server.start()
  } catch (err) {
    console.error('error', err)
    process.exit(1)
  }
};

module.exports.start = start
module.exports.register = register
module.exports.server = server
