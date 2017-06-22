const clear = require('clear')
const Game = require('../lib/game')

module.exports = function(client) {
  const {vorpal, config, auth, firebase} = client

  vorpal
    .command('login')
    .description('log the CLI into SpiceTraders API')
    // .option('-r, --reauth', 'force reauthentication even if already logged in')
    // .option('-v, --resend-verification', 'resends verification email')
    // .option('-u, --update-usage-collection', 'changes usage collection preferences')
    .action(function(args, cb) {
      clear()
      return new Promise((resolve, reject) => {
        if (auth.user) {
          if (!auth.user.emailVerified) {
            cb(vorpal.chalk.yellow('Please verify your email by clicking the\nverification link sent to: ') + vorpal.chalk.bold(auth.user.email) + '\n') 
          }
          cb(vorpal.chalk.green('Currently logged in as: ') + vorpal.chalk.bold(auth.user.email) + '\n')
          return
        }
        resolve()
      }).then(() => {
        return this.prompt([
          {
            type: 'confirm',
            name: 'collectUsage',
            message: 'Allow SpiceTraders to collect anonymous CLI usage information?',
            when() {
              return typeof config.usage === 'undefined' || args.options['update-usage-collection']
            }
          },
          {
            type: 'confirm',
            name: 'reauth',
            message: `Log in with ${vorpal.chalk.bold(config.credentials.email)}?`,
            when(answers) {
              if (config.credentials) {
                return config.credentials.email
              } else if (config.user) {
                if (config.user.provider === 'google') {
                  answers.google = true
                  return config.user.stsTokenManager.accessToken
                }
              }
              return false
            }
          },
          {
            type: 'list',
            name: 'provider',
            message: 'Choose authentication method',
            when(answers) {
              return !args.options['update-usage-collection'] && !answers.reauth
            },
            choices: [
              { value: 'email', name: 'Email and Password' },
              { value: 'google', name: 'Google'},
              { value: 'facebook', name: 'Facebook (disabled)', disabled: true },
              { value: 'phone', name: 'Phone Number (disabled)', disabled: true }
            ]
          }
        ])
      }).then(({collectUsage, provider, reauth, google}) => {
        clear()
        if (collectUsage) {
          config.usage = collectUsage
          this.log(vorpal.chalk.green('CLI usage preference saved.\n'))
        }
        if (reauth) {
          if (!google) {
            return auth.signInWithEmailAndPassword()
          } else if (google) {
            return auth.signInWithGoogle(config.user.stsTokenManager.accessToken)
          }
        }

        config.provider = provider
        return auth.login(provider)
      }).then((user) => {
        if (user.emailVerified) {
          config.user = user
          this.log(vorpal.chalk.green('Successfully logged in as: ') + vorpal.chalk.bold(user.email) + '\n');
          client.game = new Game(config, vorpal, firebase)
          cb()
          return
        }
        cb()
        return
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
