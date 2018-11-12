var mcp = require('minecraft-protocol');
var Position = require('./lmc/helper/position');

// function Health(health, food) {
//     this.health = health;
//     this.food = food;
// }
// Health.prototype.update = function (health, food) {
//     this.health = health;
//     this.food = food;
// };

function LintxClient() {
    this.client = null;
    this.playerEntityId = 0;
    this.position = new Position();
}

LintxClient.prototype.login = function (option) {
    var that = this;
    client = this.client = mcp.createClient(option);
    bindEvent();
    return client;

    function bindEvent(){
        //记录玩家实体id
        client.once('login', function(packet) {
            that.playerEntityId = packet.entityId;
        });

        //记录玩家坐标
        client.on('position',function (packet) {
            that.position = new Position(packet.x,packet.y,packet.z);
        });

        // //记录玩家生命和饱食度
        // client.on('update_health', function (packet) {
        //     that.health.update(packet.health,packet.food);
        // });
    }
};


module.exports = LintxClient;