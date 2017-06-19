const utils = require('../lib/utils')

module.exports = (client) => {
  utils.getCommands().forEach(command => {
    if (command === 'index') { return }
    require(`./${command}`)(client)
  })
}
