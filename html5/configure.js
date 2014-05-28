var gulp = require('gulp');
var async = require('async');
var path = require('path');
var pkg = require('./package.json');
var fs = require('fs');
var browserify = require('browserify');
var sh = require('shelljs');
var boot = require('loopback-boot');

var buildDir = path.resolve(__dirname, 'build');

exports.global = function(env, global) {
  // routes
  global.routes = {
    '/': {
      controller: 'HomeCtrl',
      templateUrl: '/views/welcome.html'
    },
    '/me': {
      controller: 'UserCtrl',
      templateUrl: '/views/me.html',
    },
    '/my/todos/:status': {
      controller: 'TodoCtrl',
      templateUrl: '/views/todos.html'
    },
    '/my/todos': {
      controller: 'TodoCtrl',
      templateUrl: '/views/todos.html'
    },
    '/login': {
      controller: 'LoginCtrl',
      templateUrl: '/views/login.html'
    },
    '/register': {
      controller: 'RegisterCtrl',
      templateUrl: '/views/register.html'
    },
    '/debug': {
      controller: 'ChangeCtrl',
      templateUrl: '/views/changes.html'
    }
  };

  global.bundle = 'bundle.' + pkg.version;
  if(!isDev(env)) global.bundle += '.min';
  global.bundle += '.js';
  global.html5Views = path.join(__dirname, 'views');
  global.html5Bundle = path.join(buildDir, global.bundle);
  global.bundleURL = '/' + global.bundle;
}

exports.local = function configure(env, global, local) {
  // NOTE: this config will be available in the browser
  local.serverInfo = {
    api: global.api,
    url: global.api.protocol
        + '://'
        + global.api.host
        + ':'
        + global.api.port
        + global.api.root
  };
  local.routes = global.routes;
}

exports.build = function(env, global, local, cb) {
  async.waterfall([
    function createBuildDir(next) {
      fs.exists(buildDir, function(yes) {
        if (yes)
          next();
        else
          fs.mkdir(buildDir, next);
      });
    },
    function(next) {
      createBundle(env, global, next);
    }
  ], cb);
};

function createBundle(env, global, cb) {
  var b = browserify({basedir: __dirname});
  b.add('./' + pkg.main);

  try {
    boot.compileToBrowserify({
      appRootDir: __dirname,
      modelsRootDir: path.resolve(__dirname, '..'),
      env: env
    }, b);
  } catch(err) {
    return cb(err);
  }

  var bundleDir = path.dirname(global.html5Bundle);
  if (!fs.existsSync(bundleDir))
    fs.mkdirSync(bundleDir);

  var out = fs.createWriteStream(global.html5Bundle);

  if(!isDev(env)) {
    b.transform({
      global: true
    }, 'uglifyify');
  }

  b.bundle({
    // TODO(bajtos) debug should be always true, the sourcemaps should be
    // saved to a standalone file when !isDev(env)
    debug: isDev(env)
  }).pipe(out);

  out.on('error', cb);
  out.on('close', cb);
}

function isDev(env) {
  return ~['debug', 'development', 'test'].indexOf(env);
}