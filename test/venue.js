/* eslint-disable no-unused-expressions */

const path = require('path')
const { before, after, afterEach, it, describe } = require('mocha')
const { expect } = require('chai')
const Venue = require(path.join('..', 'db', 'models', 'venue'))
const streamToPromise = require('stream-to-promise')
const FormData = require('form-data')
const fs = require('fs')
const mocks = require('./mocks')
const server = require(path.join(__dirname, '..', 'app')).server
const helpers = require('./helpers')
const { WORKSHOP1 } = require('./mocks')

let sinfoCredentials

before('getting sinfo auth', async function () {
  sinfoCredentials = await helpers.sinfoCredentials()
})

describe('venue', function () {
  this.timeout(0)
  describe('upload image', async function () {
    let payload
    let headers

    before('getting a file', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename
      payload = await streamToPromise(form)
      headers = form.getHeaders()
      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })
    })

    it('should upload an image and create a new venue', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      let venue = res.result
      let venueFromDB = await Venue.findOne({ edition: venue.edition })

      expect(res.statusCode).to.eql(200)

      expect(venueFromDB).to.not.be.null
      expect(venueFromDB.edition).to.eql(venue.edition)
      expect(venueFromDB.image).to.eql(venue.image)
    })

    it('should change an existing venue\'s image', async function () {
      let imageUrl = 'https://yes.anotherImage.png'

      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      let venue = res1.result

      let oldVenue = await Venue.findOneAndUpdate(
        {
          edition: venue.edition
        },
        {
          $set: {
            image: imageUrl
          }
        },
        {
          new: true
        }
      )

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      venue = res2.result
      let newVenue = await Venue.findOne({ edition: venue.edition })

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)

      expect(newVenue).to.not.be.null
      expect(newVenue.edition).to.eql(venue.edition)
      expect(newVenue.image).to.eql(venue.image)
      expect(newVenue.image).to.not.eql(oldVenue.image)
    })

    it('should give an error if no payload is given', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(415)
    })

    it('should give an error if invalid payload format', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: { invalid: payload }
      })

      expect(res.statusCode).to.eql(400)
    })

    afterEach('cleaning up db', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })
  })

  describe('get venue', async function () {
    let venue1, venue2
    before('upload venue', async function () {
      let v1 = new Venue(mocks.VENUE1)
      let v2 = new Venue(mocks.VENUE2)

      venue1 = v1.toJSON()
      venue2 = v2.toJSON()

      await v1.save()
      await v2.save()
    })

    it('should get all venues', async function () {
      let res = await server.inject({
        method: 'GET',
        url: '/venue',
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let venues = res.result

      expect(res.statusCode).to.eql(200)
      expect(venues).to.be.an('array')
      expect(venues.length).to.eql(2)
      expect(venues).to.deep.include(venue1)
      expect(venues).to.deep.include(venue2)
    })

    it('should get a specific venue', async function () {
      let res = await server.inject({
        method: 'GET',
        url: `/venue/${mocks.VENUE1.edition}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let venue = res.result

      expect(res.statusCode).to.eql(200)
      expect(venue).to.eql(venue1)
    })

    it('should give an error if no specific venue found', async function () {
      let res = await server.inject({
        method: 'GET',
        url: `/venue/${mocks.VENUE1.edition}_`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(404)
    })

    after('cleaning up db', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })
  })

  describe('add stand to venue', async function () {
    let venue

    before('create venue with image', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      venue = res.result
    })

    it('should add a new stand', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res.result

      expect(res.statusCode).to.eql(200)
      expect(result.stands.length).to.eql(1)
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND1, { id: 0 }))
    })

    it('should add another stand with incremented id', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res2.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(result.stands.length).to.eql(2)
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND1, { id: 0 }))
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND2, { id: 1 }))
    })

    it('should add a stand with id corresponding to the lowest number available', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.stands = v.stands.filter(stand => stand.id !== 0 && stand.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND5,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res5.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(200)

      expect(result.stands.length).to.eql(3)
      expect(result.stands[0]).to.deep.eql(Object.assign({}, mocks.STAND3, { id: 2 }))
      expect(result.stands[1]).to.deep.eql(Object.assign({}, mocks.STAND4, { id: 0 }))
      expect(result.stands[2]).to.deep.eql(Object.assign({}, mocks.STAND5, { id: 1 }))
    })

    it('should give an error if topleft.x > bottomRight.x', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: {
          topLeft: {
            x: 1,
            y: 1
          },
          bottomRight: {
            x: 0,
            y: 0
          }
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    it('should give an error if topLeft.y < bottomRight.y', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: {
          topLeft: {
            x: 1,
            y: 1
          },
          bottomRight: {
            x: 2,
            y: 2
          }
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete stands from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { stands: [] } }
      )
    })
  })

  describe('delete a stand in venue', async function () {
    let venue

    before('create venue with image', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      venue = res.result
    })

    it('should add a series of stands and try to remove the one with id 3 (which doesn\'t exist)', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.stands = v.stands.filter(stand => stand.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'DELETE',
        url: `/venue/stand/3`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res4.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(422)
      expect(result.stands.length).to.eql(3)
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND1, { id: 0 }))
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND3, { id: 2 }))
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND4, { id: 1 }))
    })

    it('should add a series of stands and remove the one with id 1', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.stands = v.stands.filter(stand => stand.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/stand`,
        payload: mocks.STAND4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'DELETE',
        url: `/venue/stand/1`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res5.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(200)
      expect(result.stands.length).to.eql(2)
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND1, { id: 0 }))
      expect(result.stands).to.deep.include(Object.assign({}, mocks.STAND3, { id: 2 }))
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete stands from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { stands: [] } }
      )
    })
  })

  describe('replace stands in venue', async function () {
    let venue

    before('create venue with image and add a stand', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      let res = await server.inject({
        method: 'POST',
        url: '/venue/stand',
        headers: headers,
        payload: mocks.STAND1
      })

      venue = res.result
    })

    it('should replace the stand with the new stands', async function () {
      let stands = [
        mocks.STAND1,
        mocks.STAND2,
        mocks.STAND3,
        mocks.STAND4
      ]

      let res = await server.inject({
        method: 'PUT',
        url: '/venue/stand',
        payload: stands,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res.result

      expect(res.statusCode).to.eql(200)
      expect(result.stands.length).to.eql(4)

      expect(result.stands.map(stand => {
        delete stand.id
        return stand
      })).to.eql(stands)
    })

    it('should give an error if one of the stands has topleft.x > bottomRight.x', async function () {
      let stands = [
        mocks.STAND1,
        {
          topLeft: {
            x: 1,
            y: 1
          },
          bottomRight: {
            x: 0,
            y: 0
          }
        },
        mocks.STAND2
      ]

      let res = await server.inject({
        method: 'PUT',
        url: `/venue/stand`,
        payload: stands,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete stands from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { stands: [] } }
      )
    })
  })

  describe('add workshop to venue', async function () {
    let venue

    before('create venue with image', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      venue = res.result
    })

    it('should add a new workshop', async function () {
      let res = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res.result
      let expectedRes = Object.assign({}, mocks.WORKSHOP1, { id: 0 })
      delete expectedRes.kind

      expect(res.statusCode).to.eql(200)
      expect(result.activities.length).to.eql(1)
      expect(result.activities[0].kind).to.eql(WORKSHOP1.kind)
      expect(result.activities[0].slots.length).to.eql(1)
      expect(result.activities[0].slots[0]).to.deep.eql(expectedRes)
    })

    it('should add another workshop with incremented id', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res2.result
      let expectedRes1 = Object.assign({}, mocks.WORKSHOP1, { id: 0 })
      delete expectedRes1.kind
      let expectedRes2 = Object.assign({}, mocks.WORKSHOP2, { id: 1 })
      delete expectedRes2.kind

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(result.activities.length).to.eql(1)
      expect(result.activities[0].kind).to.eql(WORKSHOP1.kind)
      expect(result.activities[0].slots.length).to.eql(2)
      expect(result.activities[0].slots[0]).to.deep.eql(expectedRes1)
      expect(result.activities[0].slots[1]).to.deep.eql(expectedRes2)
    })

    it('should add a workshop with id corresponding to the lowest number available', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.activities[0].slots = v.activities[0].slots.filter(ws => ws.id !== 0 && ws.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP5,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res5.result

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(200)

      let expectedRes1 = Object.assign({}, mocks.WORKSHOP3, { id: 2 })
      delete expectedRes1.kind
      let expectedRes2 = Object.assign({}, mocks.WORKSHOP4, { id: 0 })
      delete expectedRes2.kind
      let expectedRes3 = Object.assign({}, mocks.WORKSHOP5, { id: 1 })
      delete expectedRes3.kind

      expect(result.activities.length).to.eql(1)
      expect(result.activities[0].kind).to.eql(WORKSHOP1.kind)
      expect(result.activities[0].slots.length).to.eql(3)
      expect(result.activities[0].slots[0]).to.deep.eql(expectedRes1)
      expect(result.activities[0].slots[1]).to.deep.eql(expectedRes2)
      expect(result.activities[0].slots[2]).to.deep.eql(expectedRes3)
    })

    it('should give an error if start >= end', async function () {
      let date = new Date()
      let res = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: {
          kind: 'workshop',
          day: 1,
          start: date,
          end: date
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete workshops from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { activities: [] } }
      )
    })
  })

  describe('delete a workshop in venue', async function () {
    let venue

    before('create venue with image', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      let res = await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      venue = res.result
    })

    it('should add a series of workshops and try to remove the one with id 3 (which doesn\'t exist)', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.activities[0].slots = v.activities[0].slots.filter(ws => ws.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'DELETE',
        url: `/venue/activity/workshop/3`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res4.result
      let expectedRes1 = Object.assign({}, mocks.WORKSHOP1, { id: 0 })
      delete expectedRes1.kind
      let expectedRes2 = Object.assign({}, mocks.WORKSHOP3, { id: 2 })
      delete expectedRes2.kind
      let expectedRes3 = Object.assign({}, mocks.WORKSHOP4, { id: 1 })
      delete expectedRes3.kind

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(422)
      expect(result.activities[0].slots.length).to.eql(3)
      expect(result.activities[0].slots).to.deep.include(expectedRes1)
      expect(result.activities[0].slots).to.deep.include(expectedRes2)
      expect(result.activities[0].slots).to.deep.include(expectedRes3)
    })

    it('should add a series of workshops and remove the one with id 1', async function () {
      let res1 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP1,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res2 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP2,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res3 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP3,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let v = await Venue.findOne({ edition: venue.edition })
      v.activities[0].slots = v.activities[0].slots.filter(ws => ws.id !== 1)
      await v.save()

      let res4 = await server.inject({
        method: 'POST',
        url: `/venue/activity`,
        payload: mocks.WORKSHOP4,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let res5 = await server.inject({
        method: 'DELETE',
        url: `/venue/activity/workshop/1`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res5.result
      let expectedRes1 = Object.assign({}, mocks.WORKSHOP1, { id: 0 })
      delete expectedRes1.kind
      let expectedRes2 = Object.assign({}, mocks.WORKSHOP3, { id: 2 })
      delete expectedRes2.kind

      expect(res1.statusCode).to.eql(200)
      expect(res2.statusCode).to.eql(200)
      expect(res3.statusCode).to.eql(200)
      expect(res4.statusCode).to.eql(200)
      expect(res5.statusCode).to.eql(200)
      expect(result.activities[0].slots.length).to.eql(2)
      expect(result.activities[0].slots).to.deep.include(expectedRes1)
      expect(result.activities[0].slots).to.deep.include(expectedRes2)
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete workshops from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { activities: [] } }
      )
    })
  })

  describe('replace workshops in venue', async function () {
    let venue

    before('create venue with image and add a workshop', async function () {
      let form = new FormData()
      form.append('file', fs.createReadStream(path.join(__dirname, './venue.js'))) // eslint-disable-line security/detect-non-literal-fs-filename

      let payload = await streamToPromise(form)
      let headers = form.getHeaders()

      Object.assign(headers, { Authorization: sinfoCredentials.authenticator })

      await server.inject({
        method: 'POST',
        url: `/venue/image`,
        headers: headers,
        payload: payload
      })

      let res = await server.inject({
        method: 'POST',
        url: '/venue/activity',
        headers: {
          Authorization: sinfoCredentials.authenticator
        },
        payload: mocks.WORKSHOP1
      })

      venue = res.result
      expect(res.statusCode).to.eql(200)
    })

    it('should replace the workshop with the new workshops', async function () {
      let workshops = [
        mocks.WORKSHOP1,
        mocks.WORKSHOP2,
        mocks.WORKSHOP3,
        mocks.WORKSHOP4
      ]

      let res = await server.inject({
        method: 'PUT',
        url: '/venue/activity/workshop',
        payload: workshops,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let result = res.result

      expect(res.statusCode).to.eql(200)
      expect(result.activities.length).to.eql(1)
      expect(result.activities[0].kind).to.eql(mocks.WORKSHOP1.kind)
      expect(result.activities[0].slots.length).to.eql(4)

      expect(result.activities[0].slots.map(ws => {
        delete ws.id
        ws['kind'] = mocks.WORKSHOP1.kind
        return ws
      })).to.eql(workshops)
    })

    it('should give an error if one of the workshops has start >= end', async function () {
      let date = new Date()
      let workshops = [
        mocks.WORKSHOP1,
        {
          day: 2,
          start: date,
          end: date,
          kind: mocks.WORKSHOP1.kind
        },
        mocks.WORKSHOP3
      ]

      let res = await server.inject({
        method: 'PUT',
        url: `/venue/activity/workshop`,
        payload: workshops,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    it('should give an error if one of the workshops has wrong kind', async function () {
      let workshops = [
        mocks.WORKSHOP1,
        {
          day: 2,
          start: mocks.WORKSHOP2.start,
          end: mocks.WORKSHOP2.end,
          kind: 'wrong'
        },
        mocks.WORKSHOP3
      ]

      let res = await server.inject({
        method: 'PUT',
        url: `/venue/activity/workshop`,
        payload: workshops,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(res.statusCode).to.eql(422)
    })

    after('cleaning up venues', async function () {
      try {
        await Venue.collection.drop()
      } catch (err) {
        // do nothing
      }
    })

    afterEach('delete workshops from venue', async function () {
      await Venue.findOneAndUpdate(
        { edition: venue.edition },
        { $set: { workshops: [] } }
      )
    })
  })
})
