# loopback-example-offline-sync

**Note: this example uses `loopback@2.0.0` and `loopback-boot@2.0.0`!**

An example running LoopBack in the browser and server, demonstrating the
following features:

 - offline data access and synchronization
 - routes shared between the AngularJS app and the HTTP server

## Install and Run

0. You must have `node` and `git` installed. It's recommended to have `mongod`
   installed too, so that the data is preserved across app restarts.

1. Clone the repo.

2. `cd loopback-example-offline-sync`

3. `npm install` - install the root package dependencies

4. `npm install grunt-cli -g` - skip if you have grunt-cli already installed

5. `npm install bower -g` - skip if you have bower already installed

6. `bower install` - install front-end scripts

7. `mongod` - make sure mongodb is running if you want to run with
`NODE_ENV=production`

8. `grunt serve` - build and run the entire project in development mode

9. open `http://localhost:3000` - point a browser at the running app

## Project layout

The project is composed from multiple components.

 - `models/` contains definition of models that are shared by both the server
  and the client.

 - `rest/` contains the REST API server, it exposes the shared models via
  REST API.

 - `lbclient/` provides an isomorphic loopback client with offline sync.
  The client needs some client-only models for data synchronization, these
  models are defined in `lbclient/models/`.

 - `ngapp/` is a single-page AngularJS application scaffolded using `yo
  angular`, with few modification to make it work better in the full-stack
  project.

 - `server/` is the main HTTP server that brings together all other components.

## Build

This project uses [Grunt](http://gruntjs.com) for the build, since that's what
`yo angular` creates.

There are three major changes from the vanilla Gruntfile required for this
full-stack example:

 - `grunt serve` uses the `server/` component instead of `grunt connect`.

 - `lbclient` component provides a custom build script (`lbclient/build.js`)
   which runs `browserify` to produce a single js file to be used in the
   browser. The Gruntfile contains a custom task to run this build.

 - The definition of Angular routes is kept in a standalone JSON file
   that is used by the `server/` component too. To make this JSON file
   available in the browser, there is a custom task that builds
   `ngapp/config/bundle.js`.

### Targets

 - `grunt serve` starts the app in development mode, watching for file changes
  and automatically reloading the app.
 - `grunt test` runs automated tests (only the front-end has tests at the
   moment).
 - `grunt build` creates the bundle for deploying to production.
 - `grunt serve:dist` starts the app serving the production bundle of the
   front-end SPA.
 - `grunt jshint` checks consistency of the coding style.

## Adding more features

#### Define a new shared model

The instructions assume the name of the new model is 'MyModel'.

 1. Create a file `models/my-model.json`, put the model definition there.
  Use `models/todo.json` as an example, see
  [loopback-boot docs](http://apidocs.strongloop.com/loopback-boot) for
  more details about the file format.

 2. (Optional) Add `models/my-model.js` and implement your custom model
  methods. See `models/todo.js` for an example.

 3. Add an entry to `rest/models.json` to configure the new model in the REST
  server:

    ```json
    {
      "MyModel": {
        "dataSource": "db"
      }
    }
    ```

 4. Define a client-only model to represent the remote server model in the
  client - create `lbclient/models/my-model.json` with the following content:

    ```json
    {
      "name": "RemoteMyModel",
      "base": "MyModel"
    }
    ```

 5. Add two entries to `lbclient/models.json` to configure the new models
  for the client:

    ```json
    {
      "MyModel": {
        "dataSource": "local"
      },
      "RemoteMyModel": {
        "dataSource": "remote"
      }
    }
    ```

 6. Register the local model with Angular's injector in
  `ngapp/scripts/services/lbclient.js`:

    ```js
      .value('MyModel', app.models.LocalMyModel)
    ```

### Create a new Angular route

Since the full-stack example project shares the routes between the client and
the server, the new route cannot be added using the yeoman generator.

Instructions:

 1. (Optional) Create a new angular controller using yeoman, e.g.

    ```sh
    $ yo angular:controller MyModel
    ```

 2. (Optional) Create a new angular view using yeoman, e.g.

    ```sh
    $ yo angular:view models
    ```

 3. Add a route entry to `ngapp/config/routes.json`, e.g.:

    ```json
    {
      "/models": {
        "controller": "MymodelCtrl",
        "templateUrl": "/views/models.html"
      }
    }
    ```

================================================================================
================================================================================
================================================================================
================================================================================


How to build and run the server
===============================
1) grunt build-src
2) grunt serve



How to debug gruntfile
======================
1) DOUBLY ENSURE THAT YOU DO THIS, npm install -g node-inspector
2) In one terminal window, node-inspector --web-port='YOUR FAVORITE PORT NUMBER :)'
3a) e.g. 1, In another terminal window, node --debug-brk /usr/local/bin/grunt serve
3b) e.g. 2, In another terminal window, node --debug-brk server/bin/autoUpdate.js
4) Use Chrome to navigate to URL mentioned in output of Step 2.


How to debug this project
=========================
1) node-debug -p 'YOUR FAVORITE PORT NUMBER :)' server/server.js


Install a package that is sitting in a folder on the filesystem.
================================================================
1) npm install <folder>:


Uinstall a package
==================
1) npm uninstall <package-name> --save / --save-dev


Add a new connector
==================
1) Add the following to node_modules/loopback/index.js
// { TG1e
//loopback.LocalForage = require('loopback-connector-localForage');
//loopback.iDBH = require('loopback-connector-iDBH');
loopback.sqlite = require('loopback-connector-sqlite');
// } --

2) Add the following to node_modules/loopback/lib/loopback.js -> createApplication()	
// { TG1e
//app.connector('localForage', loopback.LocalForage);
//app.connector('iDBH', loopback.iDBH);
app.connector('sqlite', loopback.sqlite);
// } --



loopback related fixes
======================
1) node_modules/loopback/node_modules/strong-remoting/node_modules/request/request.js 499 -> self.protocol = self.uri.protocol


loopback breakpoint - to track a server REST HTTP request
=========================================================
1) node_modules/loopback/node_modules/strong-remoting/lib/rest-adapter.js 124 -> RestAdapter.prototype.invoke
2) node_modules/loopback/node_modules/strong-remoting/lib/http-invocation.js 226 -> HttpInvocation.prototype.invoke


loopback breakpoint - to track a SQL query execution
====================================================
node_modules/loopback-connector-mysql/lib/mysql.js -> MySQL>prototype.executeSQL
node_modules/loopback-connector-mysql/node_modules/loopback-connector/lib/sql.js


loopback breakpoint - to track PersistedModel
=============================================
node_modules/loopback/lib/persisted-model.js -> PersistedModel.checkpoint


Running server with debug logs enabled
======================================
http://docs.strongloop.com/display/public/LB/Setting+debug+strings
DEBUG=loopback:connector*,loopback:change* node server/server.js

