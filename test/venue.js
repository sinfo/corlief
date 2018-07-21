const path = require('path')
const { before, after, it, describe } = require('mocha')
const {expect} = require('chai')
// const Venue = require(path.join('..', 'db', 'models', 'venue'))
// const mocks = require('./mocks')
const streamToPromise = require('stream-to-promise')
const FormData = require('form-data')
const fs = require('fs')
const server = require(path.join(__dirname, '..', 'app')).server

describe('venue', function () {
  describe('upload image', async function () {
    let form

    before('getting a file', function () {
      form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js')))
    })

    it('should be able to upload an image and create a new venue', async function () {
      let payload = await streamToPromise(form)

      let response = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: form.getHeaders(),
        payload: payload
      })

      expect(response.statusCode).to.eql(200)
    })

    after('removing link to db', async function () {
      // await Link.findOneAndRemove(mocks.LINK)
    })
  })
})
