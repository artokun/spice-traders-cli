'use strict';

var SpaceTradersError = require('./error');
var cjson = require('cjson');

module.exports = function(path) {
  try {
    return cjson.load(path);
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new SpaceTradersError('File ' + path + ' does not exist', {exit: 1});
    }
    throw new SpaceTradersError('Parse Error in ' + path + ':\n\n' + e.message);
  }
};
