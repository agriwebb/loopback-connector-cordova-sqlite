/*
 * Global configuration shared by components.
 */

var url = require('url');

var conf = {
//  hostname: 'localhost',
//  port: 3000,
//  hostname: '0.0.0.0',
    hostname: '10.10.1.233',
//	hostname: '192.168.2.3',
//	hostname: '192.168.1.102',
  port: 5100,
  restApiRoot: '/api', // The path where to mount the REST API app
  legacyExplorer: false
};

// The URL where the browser client can access the REST API is available.
// Replace with a full url (including hostname) if your client is being
// served from a different server than your REST API.
conf.restApiUrl = url.format({
  protocol: 'http',
  slashes: true,
  hostname: conf.hostname,
  port: conf.port,
  pathname: conf.restApiRoot
});

module.exports = conf;
