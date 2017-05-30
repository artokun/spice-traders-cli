'use strict';

var _ = require('lodash');
var chalk = require('chalk');
var cjson = require('cjson');
var fs = require('fs-extra');
var path = require('path');

var detectProjectRoot = require('./detectProjectRoot');
var SpaceTradersError = require('./error');
var fsutils = require('./fsutils');
var loadCJSON = require('./loadCJSON');
var prompt = require('./prompt');
var resolveProjectPath = require('./resolveProjectPath');
var utils = require('./utils');
var validateJsonRules = require('./validateJsonRules');
var logger = require('./logger');

var Config = function(src, options) {
  this.options = options || {};
  this.projectDir = options.projectDir || detectProjectRoot(options.cwd);

  this._src = src;
  this.data = {};
  this.defaults = {};
  this.notes = {};
};

Config.FILENAME = 'spacetraders.json';

Config.prototype._hasDeepKey = function(obj, key) {
  if (_.has(obj, key)) {
    return true;
  }

  for (var k in obj) {
    if (_.isPlainObject(obj[k]) && this._hasDeepKey(obj[k], key)) {
      return true;
    }
  }
  return false;
};

Config.prototype._parseFile = function(target, filePath) {
  var fullPath = resolveProjectPath(this.options.cwd, filePath);
  var ext = path.extname(filePath);
  if (!fsutils.fileExistsSync(fullPath)) {
    throw new SpaceTradersError('Parse Error: Imported file ' + filePath + ' does not exist', {exit: 1});
  }

  switch (ext) {
  case '.json':
    return loadCJSON(fullPath);
  default:
    throw new SpaceTradersError('Parse Error: ' + filePath + ' is not of a supported config file type', {exit: 1});
  }
};

Config.prototype.get = function(key, fallback) {
  return _.get(this.data, key, fallback);
};

Config.prototype.set = function(key, value) {
  return _.set(this.data, key, value);
};

Config.prototype.has = function(key) {
  return _.has(this.data, key);
};

Config.prototype.path = function(pathName) {
  var outPath = path.normalize(path.join(this.projectDir, pathName));
  if (_.includes(path.relative(this.projectDir, outPath), '..')) {
    throw new SpaceTradersError(chalk.bold(pathName) + ' is outside of project directory', {exit: 1});
  }
  return outPath;
};

Config.prototype.readProjectFile = function(p, options) {
  try {
    var content = fs.readFileSync(this.path(p), 'utf8');
    if (options.json) {
      return JSON.parse(content);
    }
    return content;
  } catch (e) {
    if (options.fallback) {
      return options.fallback;
    }
    throw e;
  }
};

Config.prototype.writeProjectFile = function(p, content) {
  if (typeof content !== 'string') {
    content = JSON.stringify(content, null, 2) + '\n';
  }

  fs.ensureFileSync(this.path(p));
  fs.writeFileSync(this.path(p), content, 'utf8');
};

Config.prototype.askWriteProjectFile = function(p, content) {
  var writeTo = this.path(p);
  var next;
  if (fsutils.fileExistsSync(writeTo)) {
    next = prompt.once({
      type: 'confirm',
      message: 'File ' + chalk.underline(p) + ' already exists. Overwrite?',
      default: false
    });
  } else {
    next = Promise.resolve(true);
  }

  var self = this;
  return next.then(function(result) {
    if (result) {
      self.writeProjectFile(p, content);
      utils.logSuccess('Wrote ' + chalk.bold(p));
    } else {
      utils.logBullet('Skipping write of ' + chalk.bold(p));
    }
  });
};

Config.load = function(options, allowMissing) {
  var pd = detectProjectRoot(options.cwd);
  if (pd) {
    try {
      var data = cjson.load(path.join(pd, Config.FILENAME));
      return new Config(data, options);
    } catch (e) {
      throw new SpaceTradersError('There was an error loading spacetraders.json:\n\n' + e.message, {
        exit: 1
      });
    }
  }

  if (allowMissing) {
    return null;
  }

  throw new SpaceTradersError('Not in a Spacetraders app directory (could not locate spacetraders.json)', {exit: 1});
};

module.exports = Config;
