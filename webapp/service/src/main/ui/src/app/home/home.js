angular.module('missioncontrol.home', [])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/home', {
            templateUrl: 'home/home.tpl.html'
        });
    }])

    .factory('Data', ['$resource', function ($resource) {
        return $resource('rest/data/', {}, {
            query: {method: 'GET', isArray: true}
        });
    }])

    .factory('Images', ['$resource', function ($resource) {
        return $resource('rest/data/images', {}, {
            query: {method: 'GET', isArray: true}
        });
    }])

    .controller('HomeController', ['$scope', 'Data', 'Images', function($scope, Data, Images) {
        var request = {
                url: '/missioncontrol/rest/data/data-stream',
                contentType: 'application/json',
                transport: 'websocket',
                reconnectInterval: 5000,
                timeout: 60000
            },
            socket;

        $scope.stream = {
            data: [],
            images: [],
            connection: 'Disconnected'
        };


        $scope.altitudeViz = {
            dataKey: 'altitude',
            color: 'blue',
            ylabel: 'Altitude (m)'
        };


        request.onMessage = function (response) {
            var message = atmosphere.util.parseJSON(response.responseBody);
            if (message.type === 'image') {
                message.url = '/missioncontrol/rest/data/image/' + message.filename;
                $scope.$apply(function (scope) { scope.stream.images.splice(0, 0, message); });
            } else {
                message.x = new Date(message.timestamp);
                $scope.$apply(function (scope) { scope.stream.data.push(message); });
            }
        };

        request.onOpen = function () {
            $scope.$apply(function () { $scope.stream.connection = 'Connected'; });
        };

        request.onReopen = function () {
            $scope.$apply(function () { $scope.stream.connection = 'Connected'; });
        };

        request.onReconnect = function () {
            $scope.$apply(function () { $scope.stream.connection = 'Connected'; });
        };

        request.onClose = function () {
            $scope.$apply(function () { $scope.stream.connection = 'Disconnected'; });
        };

        socket = atmosphere.subscribe(request);

        Data.query().$promise.then(function (initData) {
            $scope.stream.data = initData.map(function (d) { d.x = new Date(d.timestamp); return d; });
        });

        Images.query().$promise.then(function (initImages) {
            $scope.stream.images = initImages.map(function (d) { d.url = '/missioncontrol/rest/data/image/' + d.filename; return d; });
        });

    }])

    .directive('ehmcMap', [function (scope) {

        return {
            restrict: 'E',
            replace: true,
            template: '<div class="ehmc-map"></div>',
            scope: {
                data: '=',
            },
            link: function (scope, element, attrs) {

                var words = [],
                    osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    osm = new L.TileLayer(osmUrl),
                    //markers = L.markerClusterGroup({maxClusterRadius: 35}),
                    map = L.map(attrs.id, {
                        center: L.latLng(38.0299, -78.4790),
                        zoom: 8,
                        maxZoom: 14,
                        minZoom: 3,
                        attributionControl: false

                    }),
                    icon = L.icon({
                        iconUrl: '/missioncontrol/assets/marker-icon.png',
                        iconAnchor: [11, 47],
                        popupAnchor: [-3, -76],
                        shadowUrl: '/missioncontrol/assets/marker-shadow.png',
                        shadowSize: [68, 95],
                        shadowAnchor: [12, 94]
                    }),
                    marker = L.marker([38.0299, -78.4790], {icon: icon}).bindPopup('<div>Lat, Lon: 38.0299, -78.4790</div> <div>Alt: 0</div>'),
                    path = L.polyline([L.latLng(38.0299, -78.4790), L.latLng(38.0299, -78.4780)]);


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
                path.addTo(map);
                marker.addTo(map);

                scope.$watch('data', function (data) {
                    if (data.length > 0) {
                        var cp = data[data.length - 1];

                        path.setLatLngs(data.map(function (d) {return L.latLng(d.lat, d.lon); }));
                        marker.setLatLng([cp.lat, cp.lon]);

                        map.panTo([cp.lat, cp.lon]);
                    }
                }, true);
            }
        };

    }])

    .directive('linechart', [
        '$window',
        function ($window) {
            return {
                restrict: 'E',
                scope: {
                    datakey: '=',
                    data: '=',
                    ylabel: '=',
                    color: '='
                },
                link: function (scope, element, attrs) {
                    var viz,
                        el = d3.select(element[0])
                            .append('div')
                            .style('position', 'relative')
                            .style('height', '48%')
                            .node();

                    viz = sonic.viz(el, {})
                        .addXAxis({
                            type: 'time',
                            label: {
                                text: 'Time',
                                dx: 10
                            }
                        })
                        .addYAxis({
                            label: {
                                text: scope.ylabel,
                                dx: 10
                            },
                            ticks: {
                                formatFn: function (t) {
                                    if (t >= 100000) {
                                        return t / 1000 + 'K';
                                    }
                                    return t;
                                },
                                showMinor: true
                            },
                            dataKey: 'altitude'
                        })
                        .addLines({
                            id: 'line',
                            stroke: scope.color,
                            tooltip: {
                                renderFn: function (cps) {
                                    return '<p>Time: ' + moment(cps[0].point.x).format('hh:mm:ss') + '</p><p>' + scope.ylabel + ': ' + cps[0].point[scope.datakey] + '</p>';
                                }
                            },
                            yDataKey: 'altitude',
                            definedDataKey: 'x',
                            sort: true
                        });

                    angular.element($window).on('resize', _.debounce(function () {
                        try {
                            viz.update();
                        } catch (err) {}
                    }, 300));

                    scope.$watch('data', function (data) {
                        viz.data(sonic.nest(data));
                    }, true);
                }
            };
        }
    ]);
