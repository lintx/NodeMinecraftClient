var express = require('express');
var socketio = require('socket.io');
var http = require('http');
var path = require('path');
var config = require('../config/config');
require('./server/db');
require('./server/loadallclient');
process.env.READABLE_STREAM = 'disable';
// const easyMonitor = require("easy-monitor");
// easyMonitor("backend");

var app = express();
var server = http.createServer(app);
var io = socketio(server,{
    pingTimeout: 6000//6秒接收不到客户端消息则断开连接
});
// require('./test');


//服务器重新启动时应该读取links并建立client
//延长时间时应检测client是否存在，存在则增加时间，不存在时需要用户重新登录并选择这个link后自动建立client

io.on('connect',function (socket) {
    require('./server')(socket);
});


app.get('/',function (req, res) {
    res.sendFile(path.join(__dirname,'../public/template/index.html'));
});

app.use('/',express.static(path.join(__dirname,'../public')));

app.get('/socket.io.js',function (req, res) {
    res.sendFile(path.join(__dirname,'../../node_modules/socket.io/lib/client.js'));
});

app.set('port',config.serverListen);
app.get('*', function(req, res){
    res.send('what???', 404);
});

server.listen(config.serverListen,function () {
    console.log('服务器已经运行，端口：'+config.serverListen);
});


/*
* 流程：
* 1.客户端登录（使用帐号密码或邀请码等，还在考虑中），使用socket发送lmc:login，并附带数据登录
* 2.服务器校验数据，返回是否登录成功
* 3.服务器返回已保存的帐号列表（用户名，是否已登录），客户端选择一个帐号或新增一个帐号
* 4.服务器新增帐号：接收帐号密码、服务器地址及端口、游戏版本、是否自动重连，是否立即登录，保存，返回新的帐号列表
* 5.客户端选择一个帐号，如果已连接并有历史记录则下发历史记录，已连接时可以断开连接，未连接时可以手动连接*/