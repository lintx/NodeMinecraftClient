(function () {
    var app = angular.module('lmc',['ngMessages']);
    app.controller('lmcCtrl',['$scope',lmcCtrl]);
    app.filter('unsafe', ['$sce', function ($sce) {
        return function (val) {
            return $sce.trustAsHtml(val);
        };
    }]).filter('int2date',function () {
        return function (val) {
            return moment(val).format('YYYY-MM-DD hh:mm:ss');
        }
    });
    function lmcCtrl($scope) {
        $scope.showTime = true;
        $scope.isLogin = false;
        $scope.message = [
            {time:1541663086091,message:'<span class="color-f">ffff</span>',type:'error'},
            {time:1541663087091,message:'<span class="color-a">ffff</span>',type:'chat'},
            {time:1541663088091,message:'<span class="color-b">ffff</span>',type:'info'}
        ];

        $scope.loginMode = true;
        $scope.loginData = {
            username:"",
            password:""
        };
        $scope.registerData = {
            username:"",
            password:"",
            repassword:""
        };
        $scope.login = function () {
            console.log($scope.loginData);
        };
        $scope.register = function () {
            console.log($scope.registerData);
        };
    }
    app.directive('equals',function(){
        return{
            require:'ngModel',
            link:function(scope,elm,attrs,ngModelCtrl){
                function validateEqual(myValue){
                    var valid = (myValue === scope.$eval(attrs.equals));
                    ngModelCtrl.$setValidity('equals',valid);
                    return valid ? myValue : undefined;
                }
                ngModelCtrl.$parsers.push(validateEqual);
                ngModelCtrl.$formatters.push(validateEqual);
                scope.$watch(attrs.equals,function(){
                    ngModelCtrl.$setViewValue(ngModelCtrl.$viewValue);
                })
            }
        }
    });
})();