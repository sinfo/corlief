module.exports = server => {
  server.auth.strategy('company', 'bearer-access-token', {
    validate: async (request, token, h) => {
      try {
        let link = await request.server.methods.link.findByToken(token)

        if (link === null || link.valid === false) {
          return { isValid: false, credentials: token }
        }

        let decoded = await request.server.methods.jwt.verify(token)

        return { isValid: true, credentials: decoded }
      } catch (err) {
        return { isValid: false, credentials: token }
      }
    }
  })
}
