const Client = require('./client');
const LinkModule = require('./model/linkmodule');
global.allClients = {};
let clients = global.allClients;
let db = global.db;
let time = Date.now()/1000 + 60;
db.query('select * from link where `end_time`>?',[time],(err,result)=>{
    if (err) return;
    result.forEach((config)=>{
        let module = new LinkModule.LinkModule(config);
        let client = new Client(module);
        client.on('update_config',()=>{
            let config = client.config;
            db.query('update `link` set config=? where `id`=?',[config.getDbData().config,config.id],(err,result)=>{
            });
            //这里要保存到数据库？
        });
        global.allClients[module.id] = client;
    });
});