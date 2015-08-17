'use strict';

/**
 * @ngdoc overview
 * @name loopbackExampleFullStackApp
 * @description
 * # loopbackExampleFullStackApp
 *
 * Main module of the application.
 */

//var lefsApp = angular.module('loopbackExampleFullStackApp', ['ngRoute', 'ionic']);
var lefsApp = angular.module('loopbackExampleFullStackApp', ['ngRoute']);

//angular.element(document).ready(function() {
//    angular.bootstrap(document, ['loopbackExampleFullStackApp']);
//});

lefsApp.config(function ($routeProvider /*, $locationProvider */) {
    Object.keys(window.CONFIG.routes)
        .forEach(function (route) {
            var routeDef = window.CONFIG.routes[route];
            $routeProvider.when(route, routeDef);
        });

    $routeProvider
        .otherwise({
            redirectTo: '/'
        });

//        $locationProvider.html5Mode(true);
//    $locationProvider.html5Mode({ enabled: true, requireBase: false });

}).config(function ($compileProvider){
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
});


lefsApp.run(function() {
	document.addEventListener("deviceready", function() {
		// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
		// for form inputs)
		if (window.cordova && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		if (window.StatusBar) {
			StatusBar.styleDefault();
		}
	});
});
