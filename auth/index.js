module.exports = server => {
  require('./company')(server)
  require('./sinfo')(server)
}
