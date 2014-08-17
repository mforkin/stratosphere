angular.module('missioncontrol.home', [])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/home', {
            templateUrl: 'home/home.tpl.html',
            controller: 'HomeController'
        });
    }])

    .controller('HomeController', ['$scope', function($scope) {

    }])

    .directive('ehmcMap', [function (scope) {

        return {
            restrict: 'E',
            replace: true,
            template: '<div class="ehmc-map"></div>',
            link: function (scope, element, attrs) {

                var words = [],
                    osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    osm = new L.TileLayer(osmUrl),
                    //markers = L.markerClusterGroup({maxClusterRadius: 35}),
                    map = L.map(attrs.id, {
                        center: [38.0299, -78.4790],
                        zoom: 8,
                        maxZoom: 14,
                        minZoom: 3,
                        attributionControl: false

                    });
                    /*icon = L.icon({
                        iconUrl: '../assets/spacer.png',
                        shadowUrl: '../assets/markers-shadow.png',
                        shadowSize: L.point(35, 16),
                        className: 'tweet-icon',
                        iconAnchor: L.point(17, 46),
                        shadowAnchor: L.point(10, 16),
                        popupAnchor: L.point(1, -36)
                    }); */

                // map.addLayer(osm);
                L.tileLayer.provider('Stamen.TonerLite').addTo(map);
            }
        };

    }]);
