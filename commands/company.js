const clear = require('clui').Clear
const Game = require('../lib/game')
const client = require('../')
const {game, vorpal, firebase} = client

module.exports = function() {
  vorpal
    .command('company [command]')
    .description('list available commands')
    .action(function(args, cb) {

      game.listCommands('company').then(choices => {
        choices.push({ name: 'Cancel', value: 'cancel' })

        this.prompt([
          {
            type: 'list',
            name: 'company',
            message: 'Choose a company option',
            choices
          },
          {
            type: 'input',
            name: 'name',
            when(answers) {
              return answers.company === 'create'
            },
            message: 'Company Name: ',
            validate(input) { return input.length > 5 || 'Name is too short!'}
          },
          {
            type: 'input',
            name: 'slogan',
            when(answers) {
              return answers.company === 'create'
            },
            message: 'Company Slogan: ',
            validate(input) { return input.length > 5 || 'Slogan is too short!'}
          },
          {
            type: 'list',
            name: 'faction',
            when(answers) {
              return answers.company === 'create'
            },
            message: 'Choose a faction',
            default: 'UN',
            choices: [
              { name: 'United Nations', value: 'UN' },
              { name: 'Martian Federation', value: 'Mars' },
              { name: 'Outer Planets Alliance', value: 'OPA' }
            ]
          }
        ]).then(({company, name, slogan, faction}) => {
          if (company === 'cancel') {
            clear()
            return cb()
          }
          switch (company) {
            case 'create':
              game.sendCommand({
                type: 'company.create',
                payload: {
                  name,
                  slogan,
                  faction
                }
              })
              break
            case 'view':
              game.sendCommand({
                type: 'company.view'
              })
              break
          }
          cb()
        })
      }).catch(error => {
        vorpal.log(vorpal.chalk.red(error))
        cb()
      })
    })
}
