const Client = require('./client');
const LinkModule = require('./model/linkmodule');
const crypto=require("crypto");
const stringRandom = require('string-random');
const allClients = global.allClients;
const db = global.db;

module.exports = (socket)=>{
    let socketId = socket.id;
    let linkId = 0;
    let userId = 0;
    let linkConfigs = {};//存储用户所有的有效link，登录时设置，切换link时检测
    const adminId = 1;


    function getClient() {
        if (!userId) return null;
        if (!linkId) return null;
        if (allClients[linkId]) {
            return allClients[linkId];
        }
        else {
            let client = new Client(new LinkModule.LinkModule(linkConfigs[linkId]));
            client.on('update_config',()=>{
                let config = client.config;
                linkConfigs[config.id] = config;
                db.query('update `link` set config=? where `id`=?',[config.getDbData().config,config.id],(err,result)=>{
                });
            });
            allClients[linkId] = client;
            return client;
        }
    }

    function error(message){
        socket.emit('alert',message);
    }
    function success(message){
        socket.emit('success',message);
    }

    socket.on('login',(username,password)=>{
        if (typeof username !== "string" || typeof password !== "string") {
            return error('请求参数有误');
        }
        db.query('select * from `user` where `username`=?',[username],(err,result)=>{
            if (err){
                console.log(err);
                return error('登录失败，请重试[code=1]');
            }
            if (!result || result.length===0) {
                return error('用户名或密码错误');
            }
            let user = result[0];
            password = password + user.salt;
            password = crypto.createHash("md5").update(password).digest('hex');
            if (password !== user.password) {
                return error('用户名或密码错误');
            }
            userId = user.id;
            success('登录成功');
            socket.emit('onlogin');

            db.query('select id,create_time,end_time,name,config from link where `user_id`=?',[userId],(err,result)=>{
                if (err){
                    return error('查询连接失败，请刷新重试[code=1]');
                }
                let links = [];
                result.forEach((link)=>{
                    let temp = new LinkModule.LinkModule(link);
                    temp.config.userConfig.password = "";
                    links.push(temp);
                    linkConfigs[link.id] = new LinkModule.LinkModule(link);
                });
                socket.emit('links',links);
            });

            if (isAdmin()) {
                socket.emit('isadmin');
            }
        });
    });

    socket.on('register',(username,password)=>{
        if (typeof username !== "string" || typeof password !== "string") {
            return error('请求参数有误');
        }
        if (!username || username.length < 3) {
            return error('帐号长度最少要3位字符');
        }
        if (username.length > 20) {
            return error('帐号长度最多20个字符')
        }
        if (!password || password.length < 6) {
            return error('密码长度最少要6位字符');
        }
        if (password.length > 20) {
            return error('密码长度最多20个字符')
        }
        db.query('select id from `user` where `username`=?',[username],(err,result)=>{
            if (err){
                return error('注册失败，请重试[code=1]');
            }
            if (result && result.length>0) {
                return error('用户名重复，请重试');
            }
            let salt = stringRandom(10);
            password = password + salt;
            password = crypto.createHash("md5").update(password).digest('hex');
            db.query('insert into `user` (username,password,salt,status) values (?,?,?,0)',[username,password,salt],(err,result)=>{
                if (err){
                    return error('注册失败，请重试[code=2]');
                }
                success("注册成功，你现在可以用新注册的帐号登录了");
            });
        });
    });
    socket.on('logout',()=>{
        userId = 0;
    });
    socket.on('changepassword',(old,password)=>{
        if (!password || password.length < 6) {
            return error('密码长度最少要6位字符');
        }
        if (password.length > 20) {
            return error('密码长度最多20个字符')
        }

        let salt = stringRandom(10);
        password = password + salt;
        password = crypto.createHash("md5").update(password).digest('hex');

        db.query('select * from `user` where `id`=?',[userId],(err,result)=>{
            if (err){
                console.log(err);
                return error('查询失败，请重试[code=1]');
            }
            if (!result || result.length===0) {
                return error('用户不存在');
            }
            let user = result[0];
            old = old + user.salt;
            old = crypto.createHash("md5").update(old).digest('hex');
            if (old !== user.password) {
                return error('旧密码错误，无法修改密码');
            }
            db.query('update `user` set password=?, salt=?  where `id`=?',[password,salt,userId],(err,result)=>{
                if (err){
                    return error('修改失败，请重试[code=1]');
                }
                success("修改密码成功");
            });
        });


    });

    socket.on('link',(id)=>{
        if (userId === 0) {
            error('需要登录才可以进行操作');
            return;
        }
        if (!linkConfigs[id]){
            error('无效的连接');
            return;
        }
        socket.emit('link',id);
        let client = getClient();
        if (client){
            client.unloadClientSocket();
        }
        linkId = id;
        client = getClient();
        if (client){
            client.setClientSocket(socket);
        }
    });

    socket.on('chat',(chat)=>{
        let client = getClient();
        if (client){
            if (client.client) {
                client.client.write('chat',{message:chat});
            }
            else {
                error('服务器未登录，无法发送消息');
            }
        }
        else {
            error("未知错误，无法发送消息");
        }
    });

    socket.on('config',(config)=>{
        let oldConfig = linkConfigs[linkId];
        if (!oldConfig) {
            return error('可能没有选择连接，或者连接不存在');
        }
        let newConfig = new LinkModule.LinkModule(config);
        if (oldConfig.config.userConfig.password && newConfig.config.userConfig.username === oldConfig.config.userConfig.username && !newConfig.config.userConfig.password) {
            newConfig.config.userConfig.password = oldConfig.config.userConfig.password;
            newConfig.config.userConfig.session = oldConfig.config.userConfig.session;
        }
        if (config.config.userConfig.offline) {
            newConfig.config.userConfig.password = null;
            newConfig.config.userConfig.session = null;
        }
        newConfig.id = oldConfig.id;
        newConfig.create_time = oldConfig.create_time;
        newConfig.end_time = oldConfig.end_time;
        linkConfigs[linkId] = newConfig;
        db.query('update `link` set name=?,config=? where `id`=?',[config.name,newConfig.getDbData().config,linkId],(err,result)=>{
            if (err) {
                return error('保存失败');
            }
            db.query('select id,create_time,end_time,name,config from link where `id`=?',[linkId],(err,result)=>{
                if (err){
                    return;
                }
                let temp = new LinkModule.LinkModule(result[0]);
                linkConfigs[temp.id] = new LinkModule.LinkModule(result[0]);
                temp.config.userConfig.password = "";
                socket.emit('config',temp);
            });
        });
        let client = getClient();
        if (client){
            client.updateConfig(newConfig);
        }
    });

    socket.on('mclogin',()=>{
        let client = getClient();
        if (client){
            let ret = client.login();
            if (ret !== 'ok') {
                return error(ret);
            }
            let config = linkConfigs[linkId];
            config.config.userConfig.islogin = true;
            // config.end_time = Date.now()/1000+10;
            client.updateConfig(config);
            db.query('update `link` set config=? where `id`=?',[config.getDbData().config,linkId],(err,result)=>{

            });
        }
    });

    socket.on('mclogout',()=>{
        let client = getClient();
        if (client){
            let config = linkConfigs[linkId];
            config.config.userConfig.islogin = false;
            client.updateConfig(config);
            client.logout();
            db.query('update `link` set config=? where `id`=?',[config.getDbData().config,linkId],(err,result)=>{

            });
        }
    });

    socket.on('changepassword',(newpassword)=>{

    });

    socket.on('disconnect',()=>{
        let client = getClient();
        if (client){
            client.unloadClientSocket();
        }
    });

    socket.on('admin:userlist',(username)=>{
        if (!isAdmin()) {
            return error('你不是管理员');
        }
        db.query('select `u`.`id` as `id`,`u`.`username` as `username`,`u`.`status` as `status`,count(`l`.`id`) as `linkcount` from `user` u left join `link` l on `l`.`user_id`=`u`.`id` where `u`.`username`like ? group by `u`.`id`',['%'+username+'%'],(err,result)=>{
            if (err){
                return error('搜索失败，请重试[code=1]');
            }
            socket.emit('admin:userlist',result);
        });
    });
    socket.on('admin:changepassword',(userid,password)=>{
        if (!isAdmin()) {
            return error('你不是管理员');
        }
        if (!password || password.length < 6) {
            return error('密码长度最少要6位字符');
        }
        if (password.length > 20) {
            return error('密码长度最多20个字符')
        }

        let salt = stringRandom(10);
        password = password + salt;
        password = crypto.createHash("md5").update(password).digest('hex');
        db.query('update `user` set password=?, salt=?  where `id`=?',[password,salt,userid],(err,result)=>{
            if (err){
                return error('修改失败，请重试[code=1]');
            }
            success("修改密码成功");
        });
    });
    socket.on('admin:linklist',(userid)=>{
        if (!isAdmin()) {
            return error('你不是管理员');
        }
        db.query('select id,end_time from link where `user_id`=?',[userid],(err,result)=>{
            if (err){
                return error('用户连接数查询失败，请重试[code=1]');
            }
            socket.emit('admin:linklist',result);
        });
    });
    socket.on('admin:editlink',(link_id,time)=>{
        if (!isAdmin()) {
            return error('你不是管理员');
        }
        time = time * 24 * 60 * 60;
        db.query('select * from `link` where `id`=?',[link_id],(err,result)=>{
            if (err){
                return error('操作失败，请重试[code=1]');
            }
            if (result && result.length) {
                db.query('update `link` set end_time=end_time+? where `id`=?',[time,link_id],(err,result)=>{
                    if (err){
                        return error('延时失败，请重试[code=2]');
                    }
                    if (allClients[link_id]) {
                        let client = allClients[link_id];
                        let config = client.config;
                        config.end_time += time;
                        client.updateConfig(config);
                    }
                    success("延时成功");
                });
            }
            else {
                return error('连接不存在');
            }
        });
    });
    socket.on('admin:addlink',(user_id,time)=>{
        if (!isAdmin()) {
            return error('你不是管理员');
        }
        time = time * 24 * 60 * 60;
        let now = Date.now()/1000;
        db.query('insert into `link` (user_id,create_time,end_time,config) values (?,?,?,?)',[user_id,now,now+time,''],(err,result)=>{
            if (err){
                return error('新增失败，请重试[code=2]');
            }
            success("新增连接成功");
        });
    });
    socket.on('admin:setlinkstatus',(linkid,status)=>{

    });

    function isAdmin() {
        return userId === adminId;
    }
};