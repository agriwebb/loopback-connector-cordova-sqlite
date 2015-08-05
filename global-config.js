/*
 * Global configuration shared by components.
 */

var url = require('url');

var conf = {
//  hostname.strongloop: 'localhost',
//  port.strongloop: 3000,
//  hostname.boss: 'IP or domain name',
//  port.boss: 5100
    hostname: '10.10.1.233',
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
