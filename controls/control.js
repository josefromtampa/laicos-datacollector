
(function () {

    var module = null;

    try {
        module = angular.module('laicos.datacollector.controls');
    } catch (e) { }

    if (module == null) {
        module = angular.module('laicos.datacollector.controls', ['ngSanitize']);
    }// if


    module.directive('datacollectorControl', ['$http', '$templateCache', function ($http, $templateCache) {

        return {
            restrict: 'EA',
            require: '?^form',
            scope: {
                question: '=',
                disable: '=',
                mode: '=',
                onChange: "&",
                actionEvent: '=',
                resolveRemoteUrl: '='
            },
            template: '<ng-include src="template"></ng-include>',
            link: function ($scope, $element, $attrs, ngForm) {

                $scope.template = '/components/laicos-datacollector/controls/templates/' + $scope.question.type.key + '.html';

                switch ($scope.question.type.key) {

                    case 'counter':
                    case 'slider':
                        $scope.decrementCounter = function (question) {

                            if (!$scope.disable) {
                                var val = question.answer || 0;
                                val = typeof (val) == 'string' ? parseInt(val) : val;
                                var newVal = val - 1;

                                if (newVal >= question.type.min) {
                                    question.answer = newVal;
                                }// if
                                updateNgForm()
                            }// if
                        };

                        $scope.incrementCounter = function (question) {

                            if (!$scope.disable) {
                                var val = question.answer || 0;
                                val = typeof (val) == 'string' ? parseInt(val) : val;
                                var newVal = val + 1;

                                if (newVal <= question.type.max) {
                                    question.answer = newVal;
                                }// if
                                updateNgForm()
                            }// if
                        };


                        break;

                }; // switch

                $scope.clear = function () {
                    $scope.question.answer = null;
                };


                $scope.setAnswer = function (value) {
                    $scope.question.answer = value
                    $scope.changed()
                }

                $scope.changed = function () {
                    if (angular.isFunction($scope.onChange)) {
                        $scope.onChange({ "$question": $scope.question })
                    }
                }

                if (ngForm)
                    $scope.updateNgForm = updateNgForm

                function updateNgForm() {
                    if (ngForm) {
                        console.log('updateNgForm', ngForm.$dirty)
                        if (ngForm) {
                            ngForm.$setDirty()
                        }
                    }
                }

            }
        }
    }])
    .directive('ngMin', function () {
        return {
            restrict: 'A',
            require: ['ngModel'],
            compile: function ($element, $attr) {
                return function linkDateTimeSelect(scope, element, attrs, controllers) {
                    var ngModelController = controllers[0];
                    scope.$watch($attr.ngMin, function watchNgMin(value) {
                        element.attr('min', value);
                        ngModelController.$render();
                    })
                }
            }
        }
    })
    .directive('ngMax', function () {
        return {
            restrict: 'A',
            require: ['ngModel'],
            compile: function ($element, $attr) {
                return function linkDateTimeSelect(scope, element, attrs, controllers) {
                    var ngModelController = controllers[0];
                    scope.$watch($attr.ngMax, function watchNgMax(value) {
                        element.attr('max', value);
                        ngModelController.$render();
                    })
                }
            }
        }
    });




})();