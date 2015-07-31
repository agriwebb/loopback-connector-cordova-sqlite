var loopback = require('loopback');
var boot = require('loopback-boot');

var client = module.exports = loopback();

client.on('booted', function () {
    console.log("Booted!");
});

boot(client);


var localSQLiteDS = null;

if (window.cordova) {

    // { Create sqlite datasource programatically

    client.sqlite = require('loopback-connector-sqlite');
//    client.connector('sqlite', client.sqlite);
    localSQLiteDS = loopback.createDataSource('localSQLite', {
        connector: client.sqlite,
        debug: true
    });

    // } --

    // {
    // Attach relevant models to the newly created sqite datasource.
    // Need to see if all candidate models can be elegantly attached,
    // without having to name each model separately.

//    client.models.LocalTodo.attachTo(client.dataSources.localSQLite);
    client.models.LocalTodo.attachTo(localSQLiteDS);

    // } --




    // { automigrate or autoupdate, whichever!
    //var localSqlite = client.datasources.localSQLite;
    var localSqlite = localSQLiteDS;
//var db = app.dataSources.db;
//var mysqlDs = app.dataSources.mysqlDs;
//var mongodbDs = app.dataSources.mongodbDs;


    function createSchema(dataSource_a) {
//    dataSource_a.autoupdate(function (error_a) {
        dataSource_a.automigrate(null, function (error_a) {

            if (error_a) {
                console.log("Error in autoupdate!");
            }
            else {
                console.log("Done!");
//            dataSource_a.disconnect();
            }
        });
    }

    createSchema(localSqlite);
    // } --


    // { Close DB on app going into background, need to check for app close as well.
    document.addEventListener("pause", function handleAppClose() {
//        client.datasources.localSQLite.disconnect();
        localSqlite.disconnect();
    }, false);
    // } --

}
else {
    // { In Desktop mode, depend on local storage, instead of sqlite.
    // } --
}





