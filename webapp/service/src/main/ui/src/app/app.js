angular.module('missioncontrol', [
    'ngRoute',
    'ngAnimate',
    'ngResource',
    'templates-app',
    'missioncontrol.home'
])
    .config(['$routeProvider', function ($routeProvider) {
        // Configure route provider to transform any undefined hashes to /home.
        $routeProvider.otherwise({redirectTo: '/home'});
    }])

    .constant('appInfo', {
        name: 'missioncontrol',
        title: 'Mission Control',
        company: 'Event Horizon'
    })

    .controller('AppController', ['$scope', 'appInfo', function ($scope, appInfo) {
        $scope.appModel = {
            appName: appInfo.name,
            appTitle: appInfo.title,
            appCompany: appInfo.company
        };
    }]);
