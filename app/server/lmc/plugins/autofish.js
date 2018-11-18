const Position = require('../helper/position');
const AutoModule = require('../../server/model/linkmodule').AutoFishConfig;

//fishing_rod itemId:
//1.13.1-1.13.2:568
//1.13:563
//1.8-1.12:346

class AutoFish {
    constructor(client,config){
        this._config = new AutoModule();
        this.config = config;
        this.fishing = false;
        this.teleportIds = [];
        this.spawnId = 0;
        this.fishEntityId = 0;
        this.client = client;
        this.lastUseTime = 0;
        this.checkEntity = false;

        const self = this;

        function bindEvent() {
            client.on('update_time',function (packet) {
                var time = Date.now();
                if (self.config.open) {
                    if (self.fishing) {
                        if (self.config.timeout > 0 && time - self.lastUseTime > self.config.timeout*1000) {
                            //检测到超过时间依然在钓鱼，收杆
                            self.fishing = false;
                            self.client.emit('lmc:plugin',{plugin:'autofish',message:`检测到超过时间(${self.config.timeout}秒)依然在钓鱼，收杆并重新抛竿`});
                            use_fish_rod();
                        }
                    }
                    else {
                        if (time - self.lastUseTime > self.config.delay*1000) {
                            // self.client.emit('lmc:plugin',{plugin:'autofish',message:`检测到超过时间(${self.delay})没有在钓鱼，重新抛竿`});
                            //检测到超过时间没有在钓鱼，开始钓鱼
                            use_fish_rod();
                        }
                    }
                }
                else{
                    if (self.fishing) {
                        use_fish_rod();
                    }
                }
            });

            client.on('spawn_entity',function (packet) {
                if (!self.fishing && Date.now()-self.lastUseTime<=1500 && packet.entityId && packet.type===90) {
                    self.fishEntityId = packet.entityId;
                    self.fishing = true;
                }
            });
            // client.on('spawn_entity',function (packet) {
            //     console.log('autofish.spawn_entity:',packet)
            //     if (packet.entityId && packet.type===90) {
            //         self.spawnId = packet.entityId;
            //         var entityPosition = new Position(packet.x,packet.y-1.6,packet.z);
            //         if (client.position && client.position instanceof Position) {
            //             var distance = client.position.distanceTo(entityPosition);
            //             if (distance !== -1 && distance < 0.5) {
            //                 checkEntity();
            //             }
            //         }
            //     }
            // });
            client.on('entity_teleport',function (packet) {
                if (packet.entityId) {
                    // var id = packet.entityId;
                    // if (self.teleportIds.indexOf(id)===-1){
                    //     self.teleportIds.push(id);
                    //     checkEntity();
                    // }
                    client.write('teleport_confirm',{teleportId:packet.entityId})
                }
            });
            client.on('entity_move_look',function (packet) {
                if (packet.entityId) {
                    var id = packet.entityId;
                    if (id === self.fishEntityId) {
                        if (packet.dX===0 && packet.dZ===0 && packet.dY < -1000) {
                            use_fish_rod();
                        }
                    }
                }
            });
            client.on('entity_destroy',function (packet) {
                if (packet.entityIds) {
                    var ids = packet.entityIds;
                    if (ids.indexOf(self.fishEntityId)>-1) {
                        self.fishing = false;
                    }
                }
            });
            function checkEntity(){
                if (self.checkEntity && self.teleportIds.length > 0 && self.spawnId > 0){
                    if (self.teleportIds.indexOf(self.spawnId) > -1) {
                        self.fishEntityId = self.spawnId;
                        self.teleportIds = [];
                        self.spawnId = 0;
                        self.fishing = true;
                        self.checkEntity = false;
                    }
                }
            }
            function use_fish_rod(){
                self.lastUseTime = Date.now();
                client.write('use_item',{hand:0});
            }
        }
        bindEvent();
    }

    autoSwitchFishrod (){
        if (this.client && this.client.version && this.client.version.version) {
            let version = this.client.version.version;
            let fishRodItemId = 0;
            if (version < 393) {
                fishRodItemId = 346;
            }
            else if (version === 393) {
                fishRodItemId = 563;
            }
            else if (version <= 404) {
                fishRodItemId = 568;
            }
            if (fishRodItemId === 0) return;
            if (this.client.inventory.getHeldItem().id !== fishRodItemId) {
                this.client.emit('lmc:plugin',{plugin:'autofish',message:'当前选择的物品不是鱼竿，尝试切换到鱼竿'});
                var items = this.client.inventory.getHeldItems();
                for (let i = 0, count = items.length; i < count; i++) {
                    if (items[i].id === fishRodItemId) {
                        this.client.emit('lmc:plugin',{plugin:'autofish',message:'检测到鱼竿，切换到鱼竿'});
                        this.client.inventory.setHeldItem(i);
                        break;
                    }
                }
            }
        }
    }

    set config(_config){
        if (!(_config instanceof AutoModule)) {
            _config = new AutoModule()
        }
        if ((!this._config || !this._config.open) && _config.open){
            this.autoSwitchFishrod();
        }
        this._config = _config;
    }

    get config(){
        return this._config;
    }

    start (){
        this.client.emit('lmc:plugin',{plugin:'autofish',message:'开始自动钓鱼'});
        this.config.open = true;
    }

    stop (){
        this.client.emit('lmc:plugin',{plugin:'autofish',message:'停止自动钓鱼'});
        this.config.open = false;
    }
}
module.exports = AutoFish;