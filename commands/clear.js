const clear = require('clui').Clear
const Game = require('../lib/game')
const {vorpal, config, auth, firebase} = require('../')

module.exports = function() {
  vorpal
    .command('clear')
    .hidden()
    .action(function(args, cb) {
      clear()
      cb()
    })
}
