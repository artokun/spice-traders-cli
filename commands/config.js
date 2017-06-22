const clear = require('clui').Clear
const {vorpal, config, auth} = require('../')

module.exports = function() {
  vorpal
    .command('config [key] [value]')
    .option('--reset', 'Resets [key]')
    .hidden()
    .action(function(args, cb) {
      clear()
      if (args.options.reset) {
        if (args.key) {
          const deleteKey = args.key
          delete config[args.key]
          return cb('deleted ', deleteKey)
        }
        for ( var key in config) {
          delete config[key]
        }
        return cb('Config reset')
      }
      if (args.key) {
        if (args.value) {
          config[args.key] = args.value
          return cb(JSON.stringify(config[args.key], null, 2))
        }
        config[args.key] = {}
        cb('created new object: ', args.key)
      }
      cb(JSON.stringify(config, null, 2))
    })
}
