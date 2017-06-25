const clear = require('clui').Clear
const Game = require('../lib/game')
const {vorpal, config, auth, firebase} = require('../')

module.exports = function() {
  vorpal
    .command('logout')
    .description('Logout of SpiceTraders API')
    .action(function(args, cb) {
      clear()
      return auth.signOut().then(() => {
        this.log(vorpal.chalk.yellow('Successfully logged out'))
      }).catch(error => {
        throw new Error(error)
      })
    })
}
