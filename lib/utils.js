const fs = require('fs')
const path = require('path')

/**
 * Crawls commands directory and returns all command names
 * @return {Array} filename array without filetypes
 */
module.exports.getCommands = function () {
  const srcpath = './commands'
  return fs.readdirSync(srcpath)
    .filter(file => fs.lstatSync(path.join(srcpath, file)))
    .map(filename => filename.split('.')[0])
}
