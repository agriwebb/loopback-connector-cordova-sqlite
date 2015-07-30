var path = require('path');
var app = require(path.resolve(__dirname, '../server'));

console.log('App: ' + app);

var db = app.dataSources.db;
//var mysqlDs = app.dataSources.mysqlDs;
//var mongodbDs = app.dataSources.mongodbDs;

//var coffeeShops = [
//    {name: 'Bel Cafe', city: 'Vancouver'},
//    {name: 'Three Bees Coffee House', city: 'San Mateo'},
//    {name: 'Caffe Artigiano', city: 'Vancouver'}
//];
//
//function autoMigrateCoffeeShop(dataSource_a, modelName_a, dataArray_a) {
//    dataSource_a.autoupdate(modelName_a, function (error_a) {
//        if (error_a) {
//            throw error_a;
//        }
//
//        var count = dataArray_a.length;
//
//        dataArray_a.forEach(function (data_a) {
//            app.models[modelName_a].create(data_a, function (err, record) {
//                if (err) {
//                    return console.log(err);
//                }
//
//                console.log('Record created:', record);
//
//                count--;
//
//                if (count === 0) {
//                    console.log(dataSource_a.name + ' ' + modelName_a + ' array done!');
//                    dataSource_a.disconnect();
//                }
//            });
//        });
//    });
//}
//
//
//autoMigrateCoffeeShop(db, 'CoffeeShop', coffeeShops);
////autoMigrateCoffeeShop(mongodbDs, 'CoffeeShop', coffeeShops);

function createSchema(dataSource_a) {
//    dataSource_a.autoupdate(function (error_a) {
        dataSource_a.automigrate(null, function (error_a) {

        if(error_a) {
            console.log("Error in autoupdate!");
        }
        else {
            console.log("Done!");
            dataSource_a.disconnect();
        }


    });
//    dataSource_a.autoupdate('Todo', function (error_a) {
//
//        if(error_a) {
//            console.log("Error in autoupdate!");
//        }
//    });

//    dataSource_a.autoupdate('Todo', function (error_a) {
//
//        if(error_a) {
//            console.log("Error in autoupdate!");
//        }
//
////        models_a.forEach(function(model_a) {
////            dataSource_a.discoverModelProperties('Todo', function (error_a, props) {
////                if(error_a) {
////                    console.log("Errored!");
////                }
////                else {
////                    console.log(model_a + 'done!');
////                }
////            });
////        });
//
////        dataSource_a.disconnect();
//    });

//    dataSource_a.discoverModelProperties('Todo', function (err, props) {
//        console.log(props);
//    });

//    dataSource_a.disconnect();
}

createSchema(db);