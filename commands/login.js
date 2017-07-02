const clear = require('clui').Clear
const Game = require('../lib/game')
const client = require('../')
const {config, vorpal, firebase, auth} = client

module.exports = function() {
  vorpal
    .command('login')
    .option('-c, --no-clear', 'Don\'t clear the screen')
    .description('log the CLI into SpiceTraders API')
    .action(function(args, cb) {
      if (!args.options.clear) {
        clear()
      }
      return auth.googleProvider().then(() => {
        auth.spinner.stop()
        this.log(`  ${vorpal.chalk.cyan.bold(config.user.displayName)}\n`)
        cb()
      }).catch(error => {
        throw new Error(error)
      })
    })
}
