const Client = require('./client');
const LinkModule = require('./linkmodule');

module.exports = (socket,allClients)=>{
    let socketId = socket.id;
    let linkId = 0;
    let userId = 0;
    let linkConfigs = {};//存储用户所有的有效link，登录时设置，切换link时检测
    const adminId = 1;

    socket.on('login',(data)=>{

        //这里检测登录,登录成功后才绑定事件（link事件），然后返回link列表，如果新增了link或者link时间延长了，需要重新登录才能看到
        //需要绑定chat事件/config事件/login/logout，chat事件世界发送到服务器即可
        //config事件需要更新config，如果帐号密码或服务器地址或服务器端口改变，则需要重新连接
        //client应使用全局储存
    });

    socket.on('register',(data)=>{

    });

    socket.on('link',(id)=>{
        if (userId === 0) {
            socket.emit('alert','需要登录才可以进行操作');
            return;
        }
        if (!linkConfigs[id]){
            socket.emit('alert','无效的线路');
            return;
        }
        linkId = id;
        //登录成功后绑定client/建立client，建立client时应该绑定session事件以便更新session，然后记录linkid，以便
    });

    socket.on('chat',(chat)=>{

    });

    socket.on('config',(config)=>{

    });

    socket.on('mclogin',()=>{

    });

    socket.on('mclogout',()=>{

    });

    socket.on('changepassword',(newpassword)=>{

    });

    socket.on('disconnect',()=>{
        client().unloadClientSocket();
    });

    socket.on('admin:userlist',()=>{

    });
    socket.on('admin:changepassword',(data)=>{

    });
    socket.on('admin:setuserstatus',(userid,status)=>{

    });
    socket.on('admin:linklist',(userid)=>{

    });
    socket.on('admin:newlink',(config)=>{

    });
    socket.on('admin:linktime',(time)=>{

    });
    socket.on('admin:setlinkstatus',(linkid,status)=>{

    });

    function client() {
        if (!userId) return null;
        if (!linkId) return null;
        if (allClients[linkId]) {
            return allClients[linkId];
        }
        else {
            // const link = new LinkModule.LinkModule({
            //     config:{
            //         autologin:true,
            //         host: "127.0.0.1",   // optional
            //         port: 25565,         // optional
            //         username: "travis@sarbin.net",
            //         password: "k4t4t0n1k",
            //     }
            // });
            let client = new Client(new LinkModule.LinkModule(linkConfigs[linkId]));
            allClients[linkId] = client;
            return client;
        }
    }

    function isAdmin() {
        return userId === adminId;
    }
};