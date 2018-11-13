(function () {
    var isConnected = false;
    var socket = io();
    var notyf = new Notyf({delay:3000});
    socket.on('connect',function () {
        isConnected = true;
        notyf.confirm('成功与服务器建立连接，你现在可以登录到服务器了');
    });
    socket.on('disconnect',function () {
        isConnected = false;
        notyf.alert('与服务器断开连接，你已经退出登录');
    });
    socket.on('alert',function (message) {
        notyf.alert(message);
    });
    socket.on('success',function (message) {
        notyf.confirm(message);
    });

    function socketEmit(){
        if (!isConnected) {
            notyf.alert('你必须等待与服务器建立连接后才可以操作');
            return;
        }
        // var args = Array.prototype.slice.call(arguments,1),newArgs = [event].concat(args);
        socket.emit.apply(socket,arguments);
    }


    var app = angular.module('app',['ngMessages','luegg.directives']);
    app.controller('lmcCtrl',['$scope','ModalService',lmcCtrl]);
    app.filter('unsafe', ['$sce', function ($sce) {
        return function (val) {
            return $sce.trustAsHtml(val);
        };
    }]).filter('int2date',function () {
        return function (val) {
            return moment(val).format('YYYY-MM-DD HH:mm:ss');
        }
    });
    function lmcCtrl($scope,ModalService) {
        $scope.showTime = true;
        $scope.isLogin = false;
        $scope.isAdmin = false;
        $scope.links = [];
        $scope.select_link = {};
        $scope.link_id = 0;
        $scope.chat = {message:""};
        $scope.message = [];
        $scope.health = {health: 0, food: 0, foodSaturation: 0};
        $scope.status = {
            username:''
        };
        socket.on('message',function (message) {
            $scope.$apply(function () {
                $scope.message.push(message);
            });
        });
        $scope.onchat = function(){
            socketEmit('chat',$scope.chat.message);
            $scope.chat.message = "";
        };

        socket.on('disconnect',function () {
            $scope.$apply(function () {
                $scope.isLogin = false;
                $scope.message = [];
            });
            $('modal').each(function(i,o){
                $scope.$apply(function () {
                    $scope.closeModal(o.id);
                });
            });
        });
        socket.on('update_health',function (health) {
            $scope.$apply(function () {
                $scope.health.health = health.health;
                $scope.health.food = health.food;
                $scope.health.foodSaturation = health.foodSaturation;
            });
        });
        socket.on('onlogin',function () {
            $scope.$apply(function () {
                $scope.isLogin = true;
            });
        });
        socket.on('connectStatus',function (status) {
            $scope.$apply(function () {
                if ($scope.select_link && $scope.select_link.userConfig) {
                    $scope.select_link.userConfig.islogin = status;
                }
            });
        });
        socket.on('mclogin',function (data) {
            $scope.$apply(function () {
                // $scope.isLogin = status;
                $scope.status.username = data.username;
            });
        });
        socket.on('links',function (links) {
            $scope.$apply(function () {
                $scope.links = links;
                $scope.openModal('my_links');
            });
        });
        socket.on('isadmin',function () {
            $scope.$apply(function () {
                $scope.isAdmin = true;
            });
        });

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
            socketEmit('login',$scope.loginData.username,$scope.loginData.password);
        };
        $scope.register = function () {
            socketEmit('register',$scope.registerData.username,$scope.registerData.password);
        };

        $scope.selectlink = function(link){
            $scope.message = [];
            socketEmit('link',link.id);
        };
        socket.on('link',function (linkid) {
            $scope.$apply(function () {
                $scope.link_id = linkid;

                $scope.links.forEach(function (link) {
                    if (link.id === linkid) {
                        $scope.select_link = link.config;
                    }
                });
                $scope.closeModal('my_links');
            });
        });
        $scope.loginAndLogout = function(){
            if ($scope.select_link.userConfig.islogin) {
                socket.emit('mclogout');
            }
            else {
                socket.emit('mclogin');
            }
            // $scope.links.forEach(function (link) {
            //     if (link.id === $scope.link_id) {
            //         link.config.userConfig.islogin = !link.config.userConfig.islogin;
            //         $scope.select_link = link.config;
            //     }
            // });
        };
        /**
         * 以下为link设置
         */
        $scope.linkSettingSelectIndex = 0;
        $scope.link_setting = function(){
            if (!$scope.link_id) {
                return notyf.alert('没有选择连接，无法设置');
            }

            // $scope.links.forEach(function (link) {
            //     if (link.id === $scope.link_id) {
            //         $scope.setting_link = angular.copy(link.config);
            //     }
            // });
            $scope.setting_link = angular.copy($scope.select_link);
            $scope.openModal('my_links_setting');
        };
        $scope.saveLinkSetting = function(){
            $scope.select_link = $scope.setting_link;
            socket.emit('config',$scope.setting_link);
            $scope.closeModal('my_links_setting');
        };
        socket.on('config',function (config) {
            $scope.$apply(function () {
                $scope.links.forEach(function (link,index) {
                    if (link.id === config.id) {
                        $scope.links[index] = config;
                        $scope.select_link = $scope.links[index].config;
                        console.log(config,link,index,$scope.links[index],$scope.select_link)
                    }
                });
            });
        });

        $scope.openModal = function(id){
            if ($scope.isLogin === false) {
                return notyf.alert('你必须登录后才可以操作')
            }
            ModalService.Open(id);
        };

        $scope.closeModal = function(id){
            ModalService.Close(id);
        };


        /**
         * 以下为管理员查看用户列表相关
         */
        $scope.manage = {
            username:'',
            userlist:[],
            userlinks:[],
            user:{},
            changepassword:{
                old:'',
                new:'',
            },
            changelink:{},
            linkday:31
        };
        $scope.manage_searchuser = function () {
            socketEmit('admin:userlist',$scope.manage.username);
        };
        socket.on('admin:userlist',function (users) {
            $scope.$apply(function () {
                $scope.manage.userlist = users;
            });
        });
        $scope.manage_changepassword = function (user) {
            $scope.manage.user = user;
            $scope.openModal('modal_users_changepassword');
        };
        $scope.mange_dochangepassword = function () {
            var password = $scope.manage.changepassword.new;
            if (password !== $scope.manage.changepassword.old) {
                return notyf.alert('两次密码输入不一致');
            }
            socketEmit('admin:changepassword',$scope.manage.user.id,password);
            $scope.manage.changepassword.new = "";
            $scope.manage.changepassword.old = "";
            $scope.closeModal('modal_users_changepassword')
        };
        $scope.manage_showlinks = function (user) {
            $scope.manage.user = user;
            socketEmit('admin:linklist',user.id);
            $scope.openModal('modal_users_links_manage');
        };
        socket.on('admin:linklist',function (links) {
            $scope.$apply(function () {
                $scope.manage.userlinks = links;
            });
        });
        $scope.mange_editlink = function (link) {
            $scope.manage.changelink = link;
            $scope.openModal('modal_users_links_manage_edit');
        };
        $scope.mange_addlink = function (link) {
            $scope.openModal('modal_users_links_manage_add');
        };
        $scope.mange_doeditlink = function () {
            $scope.closeModal('modal_users_links_manage_edit');
            socketEmit('admin:editlink',$scope.manage.changelink.id,$scope.manage.linkday);
        };
        $scope.mange_doaddlink = function () {
            $scope.closeModal('modal_users_links_manage_add');
            socketEmit('admin:addlink',$scope.manage.user.id,$scope.manage.linkday);
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
    app.directive('convertToNumber', function() {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function(val) {
                    return parseInt(val, 10);
                });
                ngModel.$formatters.push(function(val) {
                    return '' + val;
                });
            }
        };
    });
})();