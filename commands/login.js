const clear = require('clear')
const Game = require('../lib/game')

module.exports = function(client) {
  const {vorpal, config, auth, firebase} = client

  vorpal
    .command('login')
    .description('log the CLI into SpiceTraders API')
    .action(function(args, cb) {
      clear()
      return auth.googleProvider()
        .then(() => {
          this.log(vorpal.chalk.green('Successfully logged in as: ') + vorpal.chalk.bold(config.user.email) + '\n');
          client.game = new Game(config, vorpal, firebase)
        }).catch(error => {
          switch (error.code) {
            case 'auth/user-not-found':
              return auth.createUserWithEmailAndPassword()
              break;
            case 'auth/wrong-password':
              this.log(vorpal.chalk.bold('Invalid Password') + ' please try again.\n');
              return auth.emailProvider({passwordOnly: true}).then(user => {
                this.log(vorpal.chalk.green('Successfully logged in as: ') + vorpal.chalk.bold(user ? user.email : config.user.email) + '\n');
              })
              break;
            default:
              this.log('Sign In Error: ', error.code)
              throw new Error(error)
          }
        })
    })
}
