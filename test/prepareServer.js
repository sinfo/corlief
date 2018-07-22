const path = require('path')
const { before, after } = require('mocha')
const server = require(path.join(__dirname, '..', 'app')).server

before('starting server', async function () {
  await require(path.join(__dirname, '..', 'app')).start()
})

after('stopping server', async function () {
  await server.stop()
})
