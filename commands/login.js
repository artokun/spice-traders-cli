const clear = require('clui').Clear
const Game = require('../lib/game')
const client = require('../')
const {config, vorpal, firebase, auth} = client

module.exports = function() {
  vorpal
    .command('login')
    .description('log the CLI into SpiceTraders API')
    .action(function(args, cb) {
      clear()
      return auth.googleProvider().then(() => {
        auth.spinner.stop()
        cb(
          `Successfully logged in as: ${vorpal.chalk.green.bold(config.user.email)}\nType ${vorpal.chalk.bold('help')} to see available commands\n`
        )
      }).catch(error => {
        throw new Error(error)
      })
    })
}
