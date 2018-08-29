const path = require('path')
const { before, after, it, describe } = require('mocha')
const {expect} = require('chai')
const Link = require(path.join('..', 'db', 'models', 'link'))
const mocks = require('./mocks')
const server = require(path.join(__dirname, '..', 'app')).server
const helpers = require('./helpers')

let sinfoCredentials

before('getting sinfo auth', async function () {
  sinfoCredentials = await helpers.sinfoCredentials()
})

describe('link', async function () {
  describe('get', async function () {
    before('adding link to db', async function () {
      await new Link(mocks.LINK11).save()
      await new Link(mocks.LINK12).save()
      await new Link(mocks.LINK21).save()
    })

    it('should get a list of all links if no parameters are given', async function () {
      const response = await server.inject({
        method: 'GET',
        url: `/link`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(3)
      expectToContain(response.result, mocks.LINK11)
      expectToContain(response.result, mocks.LINK12)
      expectToContain(response.result, mocks.LINK21)
    })

    it('should give a list of links when one parameter is given', async function () {
      // companyId
      let response = await server.inject({
        method: 'GET',
        url: `/link?companyId=${mocks.LINK11.companyId}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(2)
      expectToContain(response.result, mocks.LINK11)
      expectToContain(response.result, mocks.LINK12)

      // edition
      response = await server.inject({
        method: 'GET',
        url: `/link?edition=${mocks.LINK11.edition}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(2)
      expectToContain(response.result, mocks.LINK11)
      expectToContain(response.result, mocks.LINK21)

      // token
      response = await server.inject({
        method: 'GET',
        url: `/link?token=${mocks.LINK11.token}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, mocks.LINK11)
    })

    it('should give a list of links when all parameters are given', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/link?companyId=${mocks.LINK21.companyId}&edition=${mocks.LINK21.edition}&token=${mocks.LINK21.token}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, mocks.LINK21)

      // different order
      response = await server.inject({
        method: 'GET',
        url: `/link?token=${mocks.LINK12.token}&edition=${mocks.LINK12.edition}&companyId=${mocks.LINK12.companyId}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(1)
      expectToContain(response.result, mocks.LINK12)
    })

    it('should give an empty list if no match is found', async function () {
      const response = await server.inject({
        method: 'GET',
        url: `/link?token=null`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.length).to.eql(0)
    })

    after('removing links from db', async function () {
      await Link.collection.drop()
    })
  })

  describe('create', async function () {
    const EXPIRATION = new Date().getTime() + 1000 * 60 * 60 * 24 * 31 * 5 // 5 months
    const MARGIN = 1000 * 5 // 5 seconds

    it('should return return the new link', async function () {
      const now = new Date().getTime()
      const response = await server.inject({
        method: 'POST',
        url: `/link`,
        payload: {
          companyId: mocks.LINK.companyId,
          participationDays: mocks.LINK.participationDays,
          activities: mocks.LINK.activities,
          advertisementKind: mocks.LINK.advertisementKind,
          expirationDate: EXPIRATION
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      const link = response.result

      expect(response.statusCode).to.eql(200)
      expect(link.companyId).to.eql(mocks.LINK.companyId)
      expect(link.edition).to.not.be.null
      expect(link.created.getTime() > now).to.be.true
      expect((link.created.getTime() - now) < MARGIN).to.be.true
      expect(link.valid).to.be.true
      expect(link.participationDays).to.eql(mocks.LINK.participationDays)
      expect(link.activities).to.eql(mocks.LINK.activities)
      expect(link.advertisementKind).to.eql(mocks.LINK.advertisementKind)
    })

    describe('validation fails', async function () {
      it('should return a 400 error if companyId param is missing', async function () {
        const response = await server.inject({
          method: 'POST',
          url: `/link`,
          payload: {
            // missing companyId
            participationDays: mocks.LINK.participationDays,
            activities: mocks.LINK.activities,
            advertisementKind: mocks.LINK.advertisementKind,
            expirationDate: EXPIRATION
          },
          headers: {
            Authorization: sinfoCredentials.authenticator
          }
        })

        expect(response.statusCode).to.eql(400)
        expect(response.result.error).to.eql('Bad Request')
        expect(response.result.message).to.eql('Invalid request payload input')
      })

      it('should return a 400 error if participationDays param is missing', async function () {
        const response = await server.inject({
          method: 'POST',
          url: `/link`,
          payload: {
            companyId: mocks.LINK.companyId,
            // missing participationDays
            activities: mocks.LINK.activities,
            advertisementKind: mocks.LINK.advertisementKind,
            expirationDate: EXPIRATION
          },
          headers: {
            Authorization: sinfoCredentials.authenticator
          }
        })

        expect(response.statusCode).to.eql(400)
        expect(response.result.error).to.eql('Bad Request')
        expect(response.result.message).to.eql('Invalid request payload input')
      })

      it('should return a 400 error if advertisementKind param is missing', async function () {
        const response = await server.inject({
          method: 'POST',
          url: `/link`,
          payload: {
            companyId: mocks.LINK.companyId,
            participationDays: mocks.LINK.participationDays,
            activities: mocks.LINK.activities,
            // missing advertisementKind
            expirationDate: EXPIRATION
          },
          headers: {
            Authorization: sinfoCredentials.authenticator
          }
        })

        expect(response.statusCode).to.eql(400)
        expect(response.result.error).to.eql('Bad Request')
        expect(response.result.message).to.eql('Invalid request payload input')
      })

      it('should return a 400 error if expirationDate param is missing', async function () {
        const response = await server.inject({
          method: 'POST',
          url: `/link`,
          payload: {
            companyId: mocks.LINK.companyId,
            participationDays: mocks.LINK.participationDays,
            activities: mocks.LINK.activities,
            advertisementKind: mocks.LINK.advertisementKind
            // missing expirationDate
          },
          headers: {
            Authorization: sinfoCredentials.authenticator
          }
        })

        expect(response.statusCode).to.eql(400)
        expect(response.result.error).to.eql('Bad Request')
        expect(response.result.message).to.eql('Invalid request payload input')
      })

      it('should return a 400 error if expirationDate is before current date', async function () {
        const pastExpirationDate = new Date().getTime() - 1000 * 60 * 60 * 24 * 31 * 2 // 2 months before
        const response = await server.inject({
          method: 'POST',
          url: `/link`,
          payload: {
            companyId: mocks.LINK.companyId,
            participationDays: mocks.LINK.participationDays,
            activities: mocks.LINK.activities,
            advertisementKind: mocks.LINK.advertisementKind,
            expirationDate: pastExpirationDate
          },
          headers: {
            Authorization: sinfoCredentials.authenticator
          }
        })

        expect(response.statusCode).to.eql(400)
        expect(response.result.error).to.eql('Bad Request')
        expect(response.result.message).to.eql('Invalid request payload input')
      })

      it('should return a 422 error if company does not exist', async function () {
        const response = await server.inject({
          method: 'POST',
          url: `/link`,
          payload: {
            companyId: 'nonExistingCompany',
            participationDays: mocks.LINK.participationDays,
            activities: mocks.LINK.activities,
            advertisementKind: mocks.LINK.advertisementKind,
            expirationDate: EXPIRATION
          },
          headers: {
            Authorization: sinfoCredentials.authenticator
          }
        })

        expect(response.statusCode).to.eql(422)
        expect(response.result.error).to.eql('Unprocessable Entity')
        expect(response.result.message).to.eql('CompanyId does not exist')
      })
    })

    after('removing link from db', async function () {
      await Link.collection.drop()
    })
  })

  describe('delete', async function () {
    before('adding link to db', async function () {
      await new Link(mocks.LINK).save()
    })

    it('should be able to delete an existing link', async function () {
      const response = await server.inject({
        method: 'DELETE',
        url: `/link/company/${mocks.LINK.companyId}/edition/${mocks.LINK.edition}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      const link = await Link.findOne(mocks.LINK)

      expect(response.statusCode).to.eql(200)

      Object.keys(mocks.LINK).forEach(key => {
        expect(response.result[key]).to.eql(mocks.LINK[key])
      })

      expect(link).to.be.null
    })

    it('should give an error when trying to delete a nonexisting link', async function () {
      const response = await server.inject({
        method: 'DELETE',
        url: `/link/company/${mocks.LINK.companyId}_nonexistent/edition/${mocks.LINK.edition}`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(422)
    })

    after('removing link from db', async function () {
      await Link.collection.drop()
    })
  })

  describe('revoke', async function () {
    before('adding link to db', async function () {
      await new Link(mocks.LINK).save()
    })

    it('should be able to revoke an existing link', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/link/company/${mocks.LINK.companyId}/edition/${mocks.LINK.edition}/revoke`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      let link = await Link.findOne({
        companyId: mocks.LINK.companyId,
        edition: mocks.LINK.edition
      })

      expect(response.statusCode).to.eql(200)
      expect(response.result.valid).to.eql(false)

      expect(link.valid).to.eql(false)
    })

    it('should give an error when trying to revoke a nonexisting link', async function () {
      let response = await server.inject({
        method: 'GET',
        url: `/link/company/nonexistent/edition/noEdition/revoke`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(422)
    })

    after('removing link from db', async function () {
      await Link.collection.drop()
    })
  })

  describe('update', async function () {
    const payload = {
      participationDays: 5,
      advertisementKind: 'someAdv2'
    }
    before('adding link to db', async function () {
      await new Link(mocks.LINK).save()
    })

    it('should be able to update an existing link', async function () {
      const response = await server.inject({
        method: 'PUT',
        url: `/link/company/${mocks.LINK.companyId}/edition/${mocks.LINK.edition}`,
        payload: payload,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      const link = await Link.findOne({
        companyId: mocks.LINK.companyId,
        edition: mocks.LINK.edition
      })

      expect(response).to.not.be.null

      expect(response.statusCode).to.eql(200)

      expect(response.result.participationDays).to.eql(5)
      expect(response.result.advertisementKind).to.eql('someAdv2')
      expect(link.participationDays).to.eql(5)
      expect(link.advertisementKind).to.eql('someAdv2')
    })

    it('should give an error when trying to update a nonexisting link', async function () {
      const response = await server.inject({
        method: 'PUT',
        url: `/link/company/sinfo/edition/2018`,
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(400)
    })

    it('should do nothing when payload is empty', async function () {
      const response = await server.inject({
        method: 'PUT',
        url: `/link/company/${mocks.LINK.companyId}/edition/${mocks.LINK.edition}`,
        payload: {},
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)

      const link = await Link.findOne({
        companyId: mocks.LINK.companyId,
        edition: mocks.LINK.edition
      })

      expect(link.participationDays).to.eql(5)
    })

    after('removing link from db', async function () {
      await Link.collection.drop()
    })
  })

  describe('extend-token-validity', async function () {
    before('adding link to db', async function () {
      await new Link(mocks.LINK).save()
    })

    it('should extend the validity of the token', async function () {
      const expirationDate = new Date().getTime() + 1000 * 60 * 60 * 24 // 1 day
      const response = await server.inject({
        method: 'PUT',
        url: `/link/company/${mocks.LINK.companyId}/edition/${mocks.LINK.edition}/extend`,
        payload: {
          expirationDate: expirationDate
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(200)

      // check if response token is correct (exp is in seconds)
      const token = await server.methods.jwt.verify(response.result.token)
      expect(token.exp).to.eql(Math.floor(expirationDate / 1000))

      // apart from the token link should remain the same
      Object.keys(response.result).forEach(key => {
        if (key !== 'token') {
          expect(response.result[key]).to.eql(mocks.LINK[key])
        }
      })

      // check if database equals response
      const databaseLink = await Link.findOne({ companyId: mocks.LINK.companyId, edition: mocks.LINK.edition })

      Object.keys(response.result).forEach(key => {
        expect(response.result[key]).to.eql(databaseLink[key])
      })
    })

    it('should give an error if the company does not exist', async function () {
      const response = await server.inject({
        method: 'PUT',
        url: `/link/company/null/edition/${mocks.LINK.edition}/extend`,
        payload: {
          expirationDate: new Date().getTime() + 1000 * 60 * 60 * 24 // 1 day
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(422)
    })

    it('should give an error if the edition does not exist', async function () {
      const response = await server.inject({
        method: 'PUT',
        url: `/link/company/${mocks.LINK.companyId}/edition/null/extend`,
        payload: {
          expirationDate: new Date().getTime() + 1000 * 60 * 60 * 24 // 1 day
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(422)
    })

    it('should an error if the new date is not valid', async function () {
      const response = await server.inject({
        method: 'PUT',
        url: `/link/company/${mocks.LINK.companyId}/edition/${mocks.LINK.edition}/extend`,
        payload: {
          expirationDate: new Date().getTime() - 1000 * 60 // past time by 1m
        },
        headers: {
          Authorization: sinfoCredentials.authenticator
        }
      })

      expect(response.statusCode).to.eql(400)
    })

    after('removing link from db', async function () {
      await Link.collection.drop()
    })
  })

  function expectToContain (list, obj) {
    const element = list.find((element) => (element.token === obj.token))
    expect(element).to.not.eql(undefined)
    Object.keys(obj).forEach(key => {
      expect(element[key]).to.eql(element[key])
    })
  }
})
