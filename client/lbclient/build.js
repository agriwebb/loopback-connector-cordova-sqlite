var path = require('path');
var pkg = require('./package.json');
var fs = require('fs');
var browserify = require('browserify');
var boot = require('loopback-boot');

module.exports = function buildBrowserBundle(env, callback) {
  var b = browserify({ basedir: __dirname });
  b.require('./' + pkg.main, { expose: 'lbclient' });

    console.log("******************** DIRECTORY NAME: " + __dirname);
    console.log("******************** PKG MAIN: " + pkg.main);
  try {
    boot.compileToBrowserify({
      appRootDir: __dirname,
      env: env
    }, b);
  } catch(err) {
    return callback(err);
  }

//    var bundlePath = path.resolve(__dirname, 'browser.bundle.js');
    var bundlePath = path.resolve(__dirname + path.sep + '../ngapp', 'browser.bundle.js');
  var out = fs.createWriteStream(bundlePath);
  var isDevEnv = ~['debug', 'development', 'test'].indexOf(env);

  b.bundle({
    // TODO(bajtos) debug should be always true, the sourcemaps should be
    // saved to a standalone file when !isDev(env)
    debug: isDevEnv
  })
    .on('error', callback)
    .pipe(out);

    var bundlePath2 = path.resolve(__dirname + path.sep + '../ionicApp/www', 'browser.bundle.js');
    var out2 = fs.createWriteStream(bundlePath2);
    b.bundle({
        // TODO(bajtos) debug should be always true, the sourcemaps should be
        // saved to a standalone file when !isDev(env)
        debug: isDevEnv
    })
//        .on('error', callback)
        .pipe(out2);
  out.on('error', callback);
  out.on('close', callback);
//    var bundlePath2 = path.resolve(__dirname + path.sep + '../ionicApp/www', 'browser.bundle.js');
//    var out2 = fs.createWriteStream(bundlePath2);
//    var isDevEnv2 = ~['debug', 'development', 'test'].indexOf(env);
//
//    b.bundle({
//        // TODO(bajtos) debug should be always true, the sourcemaps should be
//        // saved to a standalone file when !isDev(env)
//        debug: isDevEnv2
//    })
//        .on('error', callback)
//        .pipe(out2);
//
//    out2.on('error', callback);
//    out2.on('close', callback);
};
