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


    var app = angular.module('app',['ngMessages']);
    app.controller('lmcCtrl',['$scope','$element','ModalService',lmcCtrl]);
    app.filter('unsafe', ['$sce', function ($sce) {
        return function (val) {
            return $sce.trustAsHtml(val);
        };
    }]).filter('int2date',function () {
        return function (val) {
            return moment(val).format('YYYY-MM-DD HH:mm:ss');
        }
    });
    function lmcCtrl($scope,$element,ModalService) {
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
        $scope.historyMessage = [];
        $scope.historyMessageIndex = 0;

        $scope.change_password_data = {
            old:'',
            new:'',
            re:''
        };
        socket.on('insert_message',function (message) {
            $scope.$apply(function () {
                $scope.message.splice(0,0,message);
            });
        });
        socket.on('message',function (message) {
            $scope.$apply(function () {
                $scope.message.push(message);
            });
        });
        $scope.onchat = function(){
            socketEmit('chat',$scope.chat.message);
            $scope.historyMessage.push($scope.chat.message);
            if ($scope.historyMessage.length > 100) {
                $scope.historyMessage.shift();
            }
            $scope.historyMessageIndex = $scope.historyMessage.length;
            $scope.chat.message = "";
        };
        $scope.chatKeyUp = function(ev){
            if (ev.ctrlKey || ev.shiftKey || ev.altKey) {
                return;
            }
            if (ev.which === 38) {
                if ($scope.historyMessageIndex > $scope.historyMessage.length) {
                    $scope.historyMessageIndex = $scope.historyMessage.length;
                }
                $scope.historyMessageIndex -= 1;
                $scope.chat.message = $scope.historyMessage[$scope.historyMessageIndex];
            }
            else if (ev.which === 40) {
                if ($scope.historyMessageIndex < -1) {
                    $scope.historyMessageIndex = -1;
                }
                $scope.historyMessageIndex += 1;
                $scope.chat.message = $scope.historyMessage[$scope.historyMessageIndex];
            }
        };

        socket.on('disconnect',function () {
            $scope.$apply(function () {
                $scope.isLogin = false;
                $scope.message = [];
                $scope.historyMessage = [];
            });
            $('modal').each(function(i,o){
                $scope.$apply(function () {
                    $scope.closeModal(o.id);
                });
            });
        });
        $scope.logout = function(){
            socketEmit('logout');
            $scope.isLogin = false;
            $scope.message = [];
            $scope.historyMessage = [];
            $('modal').each(function(i,o){
                $scope.closeModal(o.id);
            });
        };
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
                if ($scope.select_link && $scope.select_link.config.userConfig) {
                    $scope.select_link.config.userConfig.islogin = status;
                }
            });
        });
        socket.on('mclogin',function (data) {
            $scope.$apply(function () {
                // $scope.isLogin = status;
                $scope.status.username = data.username;
                $scope.loginData.username = '';
                $scope.loginData.password = '';
                $scope.registerData.username = '';
                $scope.registerData.password = '';
                $scope.registerData.repassword = '';
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
        $scope.dochangepassword = function () {
            var password = $scope.change_password_data.new;
            if (password === $scope.change_password_data.old) {
                return notyf.alert('新密码和新密码不能一样');
            }
            if (password !== $scope.change_password_data.re) {
                return notyf.alert('两次密码输入不一致');
            }
            socketEmit('changepassword',$scope.change_password_data.old,password);
            $scope.change_password_data.old = "";
            $scope.change_password_data.new = "";
            $scope.change_password_data.re = "";
            $scope.closeModal('change_my_password');
        };

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
                $scope.historyMessage = [];

                $scope.links.forEach(function (link) {
                    if (link.id === linkid) {
                        $scope.select_link = link;
                    }
                });
                $scope.closeModal('my_links');
            });
        });
        $scope.loginAndLogout = function(){
            if (!$scope.link_id) {
                return notyf.alert('没有选择连接，无法设置');
            }

            if ($scope.select_link.config.userConfig.islogin) {
                socketEmit('mclogout');
            }
            else {
                socketEmit('mclogin');
            }
        };
        /**
         * 以下为link设置
         */
        $scope.linkSettingSelectIndex = 0;
        $scope.link_setting = function(){
            if (!$scope.link_id) {
                return notyf.alert('没有选择连接，无法设置');
            }

            $scope.setting_link = angular.copy($scope.select_link);
            $scope.openModal('my_links_setting');
        };
        $scope.saveLinkSetting = function(){
            $scope.select_link = $scope.setting_link;
            $scope.setting_link.create_time = 0;
            socketEmit('config',$scope.setting_link);
            $scope.closeModal('my_links_setting');
        };
        socket.on('config',function (config) {
            $scope.$apply(function () {
                $scope.links.forEach(function (link,index) {
                    if (link.id === config.id) {
                        $scope.links[index] = config;
                        $scope.select_link = $scope.links[index];
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
    app.directive('repeatHack', function($rootScope) {
        return {
            link: function(scope, element, attrs) {
                var _window = angular.element(window);
                var _document = angular.element(document);
                var _html = angular.element('html');
                if (!$rootScope.__repeatHackIsInit) {
                    $rootScope.__repeatHackIsInit = true;
                    $rootScope.__repeatHackIsBottom = true;
                    _window.on('scroll',function () {
                        $rootScope.__repeatHackIsBottom = _document.height() - _window.height() - _html.scrollTop() <= 50;
                    })
                }
                if ((scope.$last || scope.$first) && $rootScope.__repeatHackIsBottom){
                    _html.animate({scrollTop:_document.height() - _window.height()},100);
                }
            }
        };
    });
})();