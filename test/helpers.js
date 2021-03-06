const MongoClient = require('mongodb').MongoClient
const path = require('path')
const config = require(path.join(__dirname, '..', 'config'))

const url = 'mongodb://localhost:27017'
const dbName = 'deck'

module.exports.sinfoCredentials = () => {
  return new Promise((resolve, reject) => {
    // Use connect method to connect to the server
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, client) {
      if (err) {
        reject(err)
      }

      const db = client.db(dbName)

      const member = db.collection('members')

      member.findOne({ $where: 'this.loginCodes && this.loginCodes.length>0' }, (err, results) => {
        if (err) { reject(err); return }
        let user = results
        if (user === null) {
          if (config.DECK.USER !== undefined && config.DECK.TOKEN !== undefined) {
            resolve({
              id: config.DECK.USER,
              token: config.DECK.TOKEN,
              authenticator: `${config.DECK.USER} ${config.DECK.TOKEN}`
            })
            return
          }
          reject(new Error('No user found with login code')); return
        }

        resolve({
          id: user.id,
          token: user.loginCodes[0].code,
          authenticator: `${user.id} ${user.loginCodes[0].code}`
        })
      })

      client.close()
    })
  })
}
