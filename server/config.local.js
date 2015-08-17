var GLOBAL_CONFIG = require('../global-config');

var isDevEnv = (process.env.NODE_ENV || 'development') === 'development';

module.exports = {
  hostname: GLOBAL_CONFIG.hostname,
  restApiRoot: GLOBAL_CONFIG.restApiRoot,
  livereload: process.env.LIVE_RELOAD,
  isDevEnv: isDevEnv,
  //indexFile.strongloop: require.resolve(isDevEnv ? '../client/ngapp/index.html' : '../client/dist/index.html'),
//	indexFile.boss.cordova: require.resolve(isDevEnv ? '../client/ionicApp/www/preIndex.html' : '../client/dist/preIndex.html'),
//  indexFile.boss: require.resolve(isDevEnv ? '../client/ionicApp/www/index.html' : '../client/dist/index.html'),
    indexFile: require.resolve(isDevEnv ? '../client/ionicApp/www/index.html' : '../client/dist/index.html'),
  port: GLOBAL_CONFIG.port,
  legacyExplorer: GLOBAL_CONFIG.legacyExplorer
};
