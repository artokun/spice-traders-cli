const clear = require('clui').Clear
const Game = require('../lib/game')
const {vorpal, config, auth, firebase} = require('../')

module.exports = function() {
  vorpal
    .command('login')
    .description('log the CLI into SpiceTraders API')
    .action(function(args, cb) {
      clear()
      return auth.googleProvider().then(() => {
        this.log(vorpal.chalk.green('Successfully logged in as: ') + vorpal.chalk.bold(config.user.email) + '\n')
        new Game(config, this, firebase, cb)
      }).catch(error => {throw new Error(error)})
    })
}
