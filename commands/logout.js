const clear = require('clear')

module.exports = function(client) {
  const {vorpal, config, auth} = client

  vorpal
    .command('logout')
    .description('log the CLI out of SpaceTraders API')
    .action(function(args, cb) {
      clear()
      return new Promise((resolve, reject) => {
        if (auth.user) {
          return auth.signOut().then(() => resolve())
        }
        cb(vorpal.chalk.yellow('You are not logged in.\n'))
      }).then(() => {
        cb(vorpal.chalk.green('You have successfully logged out.\n'))
      }).catch(error => {
        switch (error.code) {
          default:
            this.log('Sign Out Error: ', error.code)
            throw new Error(error)
        }
      })
    })
}
