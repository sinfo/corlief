module.exports = server => {
  server.auth.strategy('company', 'bearer-access-token', {
    validate: async (request, token) => {
      try {
        const link = await request.server.methods.link.findByToken(token)
        if (!link || !link.valid) return { isValid: false }

        const decoded = await request.server.methods.jwt.verify(token)
        if (!decoded) return { isValid: false }

        return { isValid: true, credentials: decoded, artifacts: token }
      } catch (err) {
        return { isValid: false }
      }
    }
  })
}
