const lmc = require('./lmc');
const client = new lmc();


// var lclient = require('./lintxClient');
// var lclient = new lclient()
//     var client = lclient.login({
//     host: "127.0.0.1",   // optional
//     port: 25565,         // optional
//     username: "travis@sarbin.net",
//     password: "k4t4t0n1k",
// });
client.autoconnect.open = true;
client.autorevive.open = true;
client.autoconnect.tryMaxCount = 30;
client.autoconnect.delay = 3;
client.on('message',(packet)=>{
    // console.log('message:',packet);
});

client.on('chat', function(packet) {
    // Listen for chat messages and echo them back.
    var jsonMsg = JSON.parse(packet.message);
    // console.log('chat:',packet);
    // console.log("on chat",jsonMsg);

    if(jsonMsg.translate == 'chat.type.announcement' || jsonMsg.translate == 'chat.type.text' || jsonMsg.translate == 'commands.message.display.incoming') {
        var username = jsonMsg.with[0].text;
        var msg = jsonMsg.with[1].text;
        // console.log("user:",username,"msg:",msg);
        if(username === client.username) return;
        // client.write('chat', {message: msg});
    }
    // console.log("on chat packet",packet);
    // if ((jsonMsg.hasOwnProperty("extra") && Array.isArray(jsonMsg.extra) && jsonMsg.extra.length>0 && typeof jsonMsg.extra[0] == 'object' && jsonMsg.extra[0].hasOwnProperty("text") && jsonMsg.extra[0].text == '<LinTx> 1')
    // || (jsonMsg.hasOwnProperty("translate") && jsonMsg.translate=='chat.type.announcement' && jsonMsg.with[0].text=="Server" && jsonMsg.with[1].text=="1")) {
    //     client.write('use_item',{hand:0});
    // }
    if (jsonMsg.hasOwnProperty("extra") && Array.isArray(jsonMsg.extra) && jsonMsg.extra.length>0 && typeof jsonMsg.extra[0] == 'object' && jsonMsg.extra[0].hasOwnProperty("text")) {
        var m = jsonMsg.extra[0].text;
        if (m.substr(0, 7) == "<LinTx>") {
            var t = m.substr(8);
            switch (t) {
                case "1":
                    console.log("use_item")
                    if (client.autofish.open) {
                        client.autofish.stop();
                    }
                    else {
                        client.autofish.start();
                    }
                    break;
                case "2":
                    console.log("held_item_slot")
                    client.write('held_item_slot',{slotId:0});
                    break;
                case "3":
                    console.log("arm_animation")
                    client.write('arm_animation', { hand: 0 })
                    client.write('use_entity', {
                        target: 0,
                        mouse: 1
                    })
                    break;
                case "4":
                    client.inventory.setHeldItem(2);
                    break;
                case "5":
                    client.inventory.setHeldItem(0);
                    break;
                case "6":
                    if (client.autoattack.open) {
                        client.autoattack.stop();
                    }
                    else {
                        client.autoattack.start();
                    }
                    break;
                case "7":
                    let entity1 = client.entities.getEntity(48);
                    console.log("yaw:",entity1.calcYaw(client.position));
                    break;
            }
        }
    }
});


client.connect({
    host: "127.0.0.1",   // optional
    port: 25565,         // optional
    username: "travis@sarbin.net",
    password: "k4t4t0n1k",
});
// client.connect({
//     host: "127.0.0.1",   // optional
//     port: 25565,         // optional
//     username: "LinTx11",
//     password: null,
// });