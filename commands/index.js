const utils = require('../lib/utils')

module.exports = () => {
  utils.getCommands().forEach(command => {
    if (command === 'index') { return }
    require(`./${command}`)()
  })
}
