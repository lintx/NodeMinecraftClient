const LClient = require('../lmc');
const LinkModule = require('./model/linkmodule');
const EventEmitter = require('events').EventEmitter;

const MessageType = {
    error : "error",
    chat : "chat",
    info : "info"
};
const maxbuff = 100;

function bindEvent(client) {
    var bot = client.client;
    var buffer = client.message;
    bot.on('error',(error)=>{
        let message = new Message(MessageType.error,(typeof error === "object" && error.message) ? error.message : error);
        buffer.push(message);
        client.emit('message',message);
    });
    bot.on('lmc:error',(error)=>{
        let message = new Message(MessageType.error,(typeof error === "object" && error.message) ? error.message : error);
        buffer.push(message);
        client.emit('message',message);
    });
    bot.on('lmc:plugin',(pluginmessage)=>{
        let message = new Message(MessageType.info,pluginmessage.message);
        buffer.push(message);
        client.emit('message',message);
    });
    bot.on('chat',(packet)=>{
        if (!packet || !packet.message) return;
        var jsonMsg = JSON.parse(packet.message);

        let text = '';
        if (jsonMsg.extra) {
            text = parseExtra(jsonMsg.extra);
        }
        else if (jsonMsg.text) {
            text = jsonMsg.text;
        }
        else if (jsonMsg.translate) {
            text = parseVanilla(jsonMsg);
        }

        if (!text) return;
        text = escapeHtml(text);

        text = text.replace(/§([0-9abcdef])([^§]*)/ig, (regex, color, msg) => {
            msg = msg.replace(/ /g, '&nbsp;');
            return `<span class="color-${color}">${msg}</span>`;
        });

        text = text.replace(/((([A-Za-z]{3,9}:(?:\/\/))(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.))((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\-\.\!\/\\\w]*))?)/gi, (regex) => {
            return `<a href="${regex}" target="_blank">${regex}</a>`;
        });

        let message = new Message(MessageType.chat,text);
        buffer.push(message);
        client.emit('message',message);
    });
    bot.on('update_health', function (packet) {
        //{ health: 19.833332061767578, food: 17, foodSaturation: 0 }
        //生命值，饥饿值，饱和度
        let o = (num)=>Number(Number(num).toFixed(1));
        let data = {
            health:o(packet.health),
            food:o(packet.food),
            foodSaturation:o(packet.foodSaturation)
        };
        client.health = data;
        client.emit('update_health',data);
    });
    bot.on('session',(session)=>{
        client.config.config.userConfig.session = session;
        client.emit('update_config');
    });
    bot.on('login',(packet)=>{
        client.emit('login',packet);
    });

    bot.on('update_time',autoRemove);

    bot.on('connect', function (packet) {
        client.isConnect = true;
        client.emit('lmc:connect');
    });
    bot.on('disconnect', function (packet) {
        // console.log("disconnect")
        client.isConnect = false;
        client.emit('lmc:disconnect');
    });
    bot.on('kick_disconnect', (packet)=>{
        client.isConnect = false;
        client.emit('lmc:disconnect');
    });
    // bot.on('keep_alive',(packet)=>{
    //     lastAliveTime = Date.now();
    // });
    bot.on('end',(packet)=>{
        client.isConnect = false;
        client.emit('lmc:disconnect');
    });

    //keep_alive大约15秒左右一次，用这个来判断是否离线试试
    // bot.on('keep_alive',(packet)=>{
    //     let message = new Message(MessageType.info,'keep_alive');
    //     buffer.push(message);
    //     client.emit('message',message);
    //     // console.log('keep_alive',packet);
    // });

    function autoRemove() {
        if (buffer.length > maxbuff) {
            buffer.shift();
            autoRemove();
        }
    }
}

function parseVanilla(jsonMsg) {
    let username, msg, sender, broadcast, connected, max, usage,
        current, pages, player, victim, killer, achievement;

    let color  = stringToCode(jsonMsg.color);

    switch (jsonMsg.translate) {
        case 'chat.type.text':
            username    = jsonMsg.with[0].text;
            msg         = jsonMsg.with[1];
            return `§${color}<${username}> ${msg}`;
        case 'chat.type.announcement':
            sender      = jsonMsg.with[0];
            broadcast   = parseExtra(jsonMsg.with[1].extra);
            return `§${color}[${sender}] ${broadcast}`;
        case 'commands.generic.notFound':
            return `§${color}Unknown command. Try /help for a list of commands`;
        case 'commands.players.list':
            connected   = jsonMsg.with[0];
            max         = jsonMsg.with[1];
            return `§${color}There are ${connected}/${max} players online:`;
        case 'commands.help.header':
            current     = jsonMsg.with[0];
            pages       = jsonMsg.with[1];
            return `§${color}--- Showing help page ${current} of ${pages} (/help <page>) ---`;
        case 'commands.generic.usage':
            usage = parseCommandUsage(jsonMsg.with[0].translate);
            return `§${color}Usage: ${usage}`;
        case 'multiplayer.player.left':
            player      = jsonMsg.with[0].text;
            return `§${color}${player} 离开了游戏`;
        case 'multiplayer.player.joined':
            player      = jsonMsg.with[0].text;
            return `§${color}${player} 进入了游戏`;
        case 'chat.type.admin':
            sender    = jsonMsg.with[0];
            msg       = parseAdmin(jsonMsg.with[1]);
            return `§${color}[${sender}: ${msg}]`;
        case 'death.attack.mob':
            victim      = jsonMsg.with[0].text;
            killer      = jsonMsg.with[1].translate;
            return `§${color}${victim} 被 ${killer} 杀死了`;
        case 'death.attack.arrow':
            victim      = jsonMsg.with[0].text;
            killer      = jsonMsg.with[1].translate;
            return `§${color}${victim} 被 ${killer} 射杀`;
        case 'death.attack.player':
            victim      = jsonMsg.with[0].text;
            killer      = jsonMsg.with[1].text;
            return `§${color}${victim} 被 ${killer} 杀死了`;
        case 'death.attack.explosion.player':
            victim      = jsonMsg.with[0].text;
            killer      = jsonMsg.with[1].text;
            return `§${color}${victim} 被 ${killer} 炸死了`;
        case 'chat.type.achievement':
            player      = jsonMsg.with[0].text;
            achievement = parseAchievement(jsonMsg.with[1].extra[0].translate);
            return `§${color}${player} 刚刚取得了成就 §a[${achievement}]`;
        case 'chat.type.emote':
            player      = jsonMsg.with[0].text;
            msg         = jsonMsg.with[1];
            return `§${color}* ${player} ${msg}`;
        case 'commands.message.display.incoming':
            player      = jsonMsg.with[0].text;
            msg         = jsonMsg.with[1].text;
            return`§${color}${player}悄悄地对你说:${msg}`;
        case 'commands.message.display.outgoing':
            player      = jsonMsg.with[0].text;
            msg         = jsonMsg.with[1].text;
            return`§${color}你悄悄地对${player}说:${msg}`;
        case 'chat.type.advancement.task':
            player      = jsonMsg.with[0].insertion?jsonMsg.with[0].insertion:'未知玩家';
            return`§${player}取得了未知进度`;

    }

    if (/^commands\..*usage$/.test(jsonMsg.translate)) {
        return '§' + color + parseCommandUsage(jsonMsg.translate);
    }
    return `§${color}未能解析的消息，原始内容：${JSON.stringify(jsonMsg)}`;
}
function parseExtra(extra) {
    let string = '';

    extra.forEach(function each(data) {
        let text = "";
        if (typeof data === "string") {
            text = data;
        }
        else if (typeof data === "object") {
            if (data.text) {
                text = data.text;
            }
            if (data.extra && Array.isArray(data.extra)) {
                data.extra.forEach(each);
            }
        }

        if (text) {
            text = text.replace(/§k/ig, '');
            text = text.replace(/§l/ig, '');
            string += '§' + stringToCode(data.color) + text;
        }
    });
    return string;
}
function stringToCode(string) {
    let dictionary = {
        'black': 0,
        'dark_blue': 1,
        'dark_green': 2,
        'dark_aqua': 3,
        'dark_red': 4,
        'dark_purple': 5,
        'gold': 6,
        'gray': 7,
        'dark_gray': 8,
        'indigo': 9,
        'green': 'a',
        'aqua': 'b',
        'red': 'c',
        'light_purple': 'd',
        'yellow': 'e',
        'white': 'f'
    };

    return dictionary[string] || 'f';
}
function parseAchievement(achievementid) {

    let achievements = {
        'achievement.acquireIron': 'Acquire Hardware',
        'achievement.bakeCake': 'The Lie',
        'achievement.blazeRod': 'Into Fire',
        'achievement.bookcase': 'Librarian',
        'achievement.breedCow': 'Repopulation',
        'achievement.buildBetterPickaxe': 'Getting an Upgrade',
        'achievement.buildFurnace': 'Hot Topic',
        'achievement.buildHoe': 'Time to Farm!',
        'achievement.buildPickaxe': 'Time to Mine!',
        'achievement.buildSword': 'Time to Strike!',
        'achievement.buildWorkBench': 'Benchmarking',
        'achievement.cookFish': 'Delicious Fish',
        'achievement.diamonds': 'DIAMONDS!',
        'achievement.diamondsToYou': 'Diamonds to you!',
        'achievement.enchantments': 'Enchanter',
        'achievement.exploreAllBiomes': 'Adventuring Time',
        'achievement.flyPig': 'When Pigs Fly',
        'achievement.fullBeacon': 'Beaconator',
        'achievement.get': 'Achievement get!',
        'achievement.ghast': 'Return to Sender',
        'achievement.killCow': 'Cow Tipper',
        'achievement.killEnemy': 'Monster Hunter',
        'achievement.killWither': 'The Beginning.',
        'achievement.makeBread': 'Bake Bread',
        'achievement.mineWood': 'Getting Wood',
        'achievement.onARail': 'On A Rail',
        'achievement.openInventory': 'Taking Inventory',
        'achievement.overkill': 'Overkill',
        'achievement.overpowered': 'Overpowered',
        'achievement.portal': 'We Need to Go Deeper',
        'achievement.potion': 'Local Brewery',
        'achievement.snipeSkeleton': 'Sniper Duel',
        'achievement.spawnWither': 'The Beginning?',
        'achievement.taken': 'Taken!',
        'achievement.theEnd': 'The End?',
        'achievement.theEnd2': 'The End.',
        'achievement.unknown': '???'
    };

    return achievements[achievementid] || '???';
}
function parseCommandUsage(commandId) {

    let commands = {
        'commands.achievement.usage': '/achievement <give|take> <stat_name|*> [player]',
        'commands.ban.usage': '/ban <name> [reason ...]',
        'commands.banip.usage': '/ban-ip <address|name> [reason ...]',
        'commands.banlist.usage': '/banlist [ips|players]',
        'commands.blockdata.usage': '/blockdata <x> <y> <z> <dataTag>',
        'commands.chunkinfo.usage': '/chunkinfo [<x> <y> <z>]',
        'commands.clear.usage': '/clear [player] [item] [data] [maxCount] [dataTag]',
        'commands.clone.usage': '/clone <x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z> [mode]',
        'commands.compare.usage': '/testforblocks <x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z> [mode]',
        'commands.defaultgamemode.usage': '/defaultgamemode <mode>',
        'commands.deop.usage': '/deop <player>',
        'commands.difficulty.usage': '/difficulty <new difficulty>',
        'commands.downfall.usage': '/toggledownfall',
        'commands.effect.usage': '/effect <player> <effect> [seconds] [amplifier] [hideParticles]',
        'commands.enchant.usage': '/enchant <player> <enchantment ID> [level]',
        'commands.entitydata.usage': '/entitydata <entity> <dataTag>',
        'commands.execute.usage': '/execute <entity> <x> <y> <z> <command> OR /execute <entity> <x> <y> <z> detect <x> <y> <z> <block> <data> <command>',
        'commands.fill.usage': '/fill <x1> <y1> <z1> <x2> <y2> <z2> <TileName> [dataValue] [oldBlockHandling] [dataTag]',
        'commands.gamemode.usage': '/gamemode <mode> [player]',
        'commands.gamerule.usage': '/gamerule <rule name> [value]',
        'commands.give.usage': '/give <player> <item> [amount] [data] [dataTag]',
        'commands.help.usage': '/help [page|command name]',
        'commands.kick.usage': '/kick <player> [reason ...]',
        'commands.kill.usage': '/kill [player|entity]',
        'commands.me.usage': '/me <action ...>',
        'commands.message.usage': '/tell <player> <private message ...>',
        'commands.op.usage': '/op <player>',
        'commands.particle.usage': '/particle <name> <x> <y> <z> <xd> <yd> <zd> <speed> [count] [mode]',
        'commands.players.usage': '/list',
        'commands.playsound.usage': '/playsound <sound> <player> [x] [y] [z] [volume] [pitch] [minimumVolume]',
        'commands.publish.usage': '/publish',
        'commands.replaceitem.block.usage': '/replaceitem block <x> <y> <z> <slot> <item> [amount] [data] [dataTag]',
        'commands.replaceitem.entity.usage': '/replaceitem entity <selector> <slot> <item> [amount] [data] [dataTag]',
        'commands.replaceitem.usage': '/replaceitem <entity|block> ...',
        'commands.save-off.usage': '/save-off',
        'commands.save-on.usage': '/save-on',
        'commands.save.usage': '/save-all',
        'commands.say.usage': '/say <message ...>',
        'commands.scoreboard.objectives.add.usage': '/scoreboard objectives add <name> <criteriaType> [display name ...]',
        'commands.scoreboard.objectives.remove.usage': '/scoreboard objectives remove <name>',
        'commands.scoreboard.objectives.setdisplay.usage': '/scoreboard objectives setdisplay <slot> [objective]',
        'commands.scoreboard.objectives.usage': '/scoreboard objectives <list|add|remove|setdisplay> ...',
        'commands.scoreboard.players.add.usage': '/scoreboard players add <player> <objective> <count> [dataTag]',
        'commands.scoreboard.players.enable.usage': '/scoreboard players enable <player> <trigger>',
        'commands.scoreboard.players.list.usage': '/scoreboard players list [name]',
        'commands.scoreboard.players.operation.usage': '/scoreboard players operation <targetName> <targetObjective> <operation> <selector> <objective>',
        'commands.scoreboard.players.remove.usage': '/scoreboard players remove <player> <objective> <count> [dataTag]',
        'commands.scoreboard.players.reset.usage': '/scoreboard players reset <player> [objective]',
        'commands.scoreboard.players.set.usage': '/scoreboard players set <player> <objective> <score> [dataTag]',
        'commands.scoreboard.players.test.usage': '/scoreboard players test <player> <objective> <min> <max>',
        'commands.scoreboard.players.usage': '/scoreboard players <set|add|remove|reset|list|enable|test|operation> ...',
        'commands.scoreboard.teams.add.usage': '/scoreboard teams add <name> [display name ...]',
        'commands.scoreboard.teams.empty.usage': '/scoreboard teams empty <team>',
        'commands.scoreboard.teams.join.usage': '/scoreboard teams join <team> [player]',
        'commands.scoreboard.teams.leave.usage': '/scoreboard teams leave [player]',
        'commands.scoreboard.teams.list.usage': '/scoreboard teams list [name]',
        'commands.scoreboard.teams.option.usage': '/scoreboard teams option <team> <friendlyfire|color|seeFriendlyInvisibles|nametagVisibility|deathMessageVisibility> <value>',
        'commands.scoreboard.teams.remove.usage': '/scoreboard teams remove <name>',
        'commands.scoreboard.teams.usage': '/scoreboard teams <list|add|remove|empty|join|leave|option> ...',
        'commands.scoreboard.usage': '/scoreboard <objectives|players|teams> ...',
        'commands.seed.usage': '/seed',
        'commands.setblock.usage': '/setblock <x> <y> <z> <TileName> [dataValue] [oldBlockHandling] [dataTag]',
        'commands.setidletimeout.usage': '/setidletimeout <Minutes until kick>',
        'commands.setworldspawn.usage': '/setworldspawn [<x> <y> <z>]',
        'commands.spawnpoint.usage': '/spawnpoint [player] [<x> <y> <z>]',
        'commands.spreadplayers.usage': '/spreadplayers <x> <z> <spreadDistance> <maxRange> <respectTeams true|false> <player ...>',
        'commands.stats.block.clear.usage': '/stats block <x> <y> <z> clear <stat>',
        'commands.stats.block.set.usage': '/stats block <x> <y> <z> set <stat> <selector> <objective>',
        'commands.stats.block.usage': '/stats block <x> <y> <z> <mode> ...',
        'commands.stats.entity.clear.usage': '/stats entity <selector> clear <stat>',
        'commands.stats.entity.set.usage': '/stats entity <selector> set <stat> <selector> <objective>',
        'commands.stats.entity.usage': '/stats entity <selector> <mode>',
        'commands.stats.usage': '/stats <entity|block> ...',
        'commands.stop.usage': '/stop',
        'commands.summon.usage': '/summon <EntityName> [x] [y] [z] [dataTag]',
        'commands.tellraw.usage': '/tellraw <player> <raw json message>',
        'commands.testfor.usage': '/testfor <player> [dataTag]',
        'commands.testforblock.usage': '/testforblock <x> <y> <z> <TileName> [dataValue] [dataTag]',
        'commands.time.usage': '/time <set|add|query> <value>',
        'commands.title.usage': '/title <player> <title|subtitle|clear|reset|times> ...',
        'commands.title.usage.clear': '/title <player> clear|reset',
        'commands.title.usage.times': '/title <player> times <fadeIn> <stay> <fadeOut>',
        'commands.title.usage.title': '/title <player> title|subtitle <raw json title>',
        'commands.tp.usage': '/tp [target player] <destination player> OR /tp [target player] <x> <y> <z> [<y-rot> <x-rot>]',
        'commands.trigger.usage': '/trigger <objective> <add|set> <value>',
        'commands.unban.usage': '/pardon <name>',
        'commands.unbanip.usage': '/pardon-ip <address>',
        'commands.weather.usage': '/weather <clear|rain|thunder> [duration in seconds]',
        'commands.whitelist.add.usage': '/whitelist add <player>',
        'commands.whitelist.remove.usage': '/whitelist remove <player>',
        'commands.whitelist.usage': '/whitelist <on|off|list|add|remove|reload>',
        'commands.worldborder.add.usage': '/worldborder add <sizeInBlocks> [timeInSeconds]',
        'commands.worldborder.center.usage': '/worldborder centre <x> <z>',
        'commands.worldborder.damage.amount.usage': '/worldborder damage amount <damagePerBlock>',
        'commands.worldborder.damage.buffer.usage': '/worldborder damage buffer <sizeInBlocks>',
        'commands.worldborder.damage.usage': '/worldborder damage <buffer|amount>',
        'commands.worldborder.set.usage': '/worldborder set <sizeInBlocks> [timeInSeconds]',
        'commands.worldborder.usage': '/worldborder <set|center|damage|warning|get> ...',
        'commands.worldborder.warning.distance.usage': '/worldborder warning distance <blocks>',
        'commands.worldborder.warning.time.usage': '/worldborder warning time <seconds>',
        'commands.worldborder.warning.usage': '/worldborder warning <time|distance>',
        'commands.xp.usage': '/xp <amount> [player] OR /xp <amount>L [player]'
    };

    return commands[commandId] || 'Unknown command usage';

}
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

class Message {
    constructor(type,message){
        this.type = type;
        this.message = message;
        this.time = Date.now();
    }
}


function emitMessage(socket,msg) {
    if (socket){
        socket.emit('message',msg);
    }
}

/**
 * 监测的事件：
 * 1.聊天信息
 * 2.死亡信息
 * 3.掉线信息
 * 4.错误信息(有的错误信息有message,没有message的应给出全文)
 * 5.生命及饱食度信息
 * 6.被服务器踢出信息
 */
class Client extends EventEmitter{
    constructor(config){
        super(config);
        this.config = {};
        this.tempMessage = [];
        this.message = [];

        this.client = null;
        this.isConnect = false;
        this.health = {health: 0, food: 0, foodSaturation: 0};

        this.updateConfig(config);

        bindEvent(this);
    }

    updateConfig(config){
        if (!(config instanceof LinkModule.LinkModule)) config = new LinkModule.LinkModule();

        if (this.client === null) {
            let user = config.config.userConfig;
            this.client = new LClient(user);
            upClientConfig(this.client);
            if (user.islogin && user.username && user.host && user.port) {
                this.client.connect();
            }
        }
        else {
            //重新登录
            let oldUser = this.config.config.userConfig;
            let newUser = config.config.userConfig;
            if (newUser.islogin && newUser.username && newUser.host && newUser.port && (oldUser.username !== newUser.username || oldUser.host !== newUser.host || oldUser.port !== newUser.port)) {
                this.client.end();
                upClientConfig(this.client);
                this.client.connect(newUser);
            }
            else {
                upClientConfig(this.client);
            }
        }

        this.config = config;

        function upClientConfig(client) {
            client.autoattack.config = config.config.pluginConfig.autoattack;
            client.autochat.updateConfig(config.config.pluginConfig.autochat);
            client.autoconnect.config = config.config.pluginConfig.autoconnect;
            client.autofish.config = config.config.pluginConfig.autofish;
            client.autofevive.config = config.config.pluginConfig.autofevive;
        }
    }

    logout(){
        this.isConnect = false;
        this.connectListen();
        this.client && this.client.end();
    }

    login(){
        this.client && this.client.connect(this.config.config.userConfig);
    }

    setClientSocket(socket){
        this.unloadClientSocket();
        this.clientSocket = socket;
        const self = this;
        this.tempMessage = [];
        this.on('message',this.messageListen);
        this.on('update_health',this.healthListen);
        this.on('lmc:connect',this.connectListen);
        this.on('lmc:disconnect',this.connectListen);
        this.on('login',this.loginListen);

        this.healthListen(this.health);
        this.connectListen();
        this.loginListen();

        this.tempMessage = this.message.slice();

        while (this.tempMessage.length > 0) {
            emitMessage(this.clientSocket,this.tempMessage.shift());
        }
    }


    messageListen (packet){
        if (this.tempMessage.length === 0) {
            emitMessage(this.clientSocket,packet);
        }
        else {
            this.tempMessage.push(packet);
        }
    }
    healthListen (packet){
        this.clientSocket && this.clientSocket.emit('update_health',packet);
    }
    connectListen(){
        this.clientSocket && this.clientSocket.emit('connectStatus',this.isConnect);
    }
    loginListen(){
        this.clientSocket && this.clientSocket.emit('mclogin',{
            username:this.client.username
        });
    }

    unloadClientSocket(){
        this.clientSocket = null;
        this.removeListener('message',this.messageListen);
        this.removeListener('update_health',this.healthListen);
        this.removeListener('lmc:connect',this.connectListen);
        this.removeListener('lmc:disconnect',this.connectListen);
        this.removeListener('login',this.loginListen);
    }
}

module.exports = Client;