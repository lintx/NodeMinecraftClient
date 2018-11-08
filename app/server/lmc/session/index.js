var request = require('request');

var host = 'https://authserver.mojang.com/';
var data = {
    token:'90fa36e9d50c4a6b8b728998ebb1e750',
    id:'',
    name:'',
    // clientToken:newGuid()
    clientToken:'a69a42fbc876823d62ab2a173bd2dd3e'
};
function get(option) {
    // login(option);
    signout();
}

function login(option) {
    var body = {
        agent:{
            name:'Minecraft',
            version:1
        },
        username:option.username,
        password:option.password,
        clientToken: data.clientToken
    };
    request.post(host+'authenticate',{json:body,proxy:null},function (err, response, body) {
        if (!err && response.statusCode===200 && typeof body.selectedProfile === "object"){
            data.token = body.accessToken;
            data.name = body.selectedProfile.name;
            data.id = body.selectedProfile.id;
            console.log(data);
        }
        // console.log(err);
        // console.log(response)
        // console.log(body)
    });
}

function refresh() {
    var body = {
        accessToken:data.token,
        clientToken:data.clientToken
    };
    request.post(host+'refresh',{json:body,proxy:null},function (err, response, body) {
        if (!err && response.statusCode===200){
            data.token = body.accessToken;
        }
        // console.log(err);
        // console.log(response)
        // console.log(body)
    });
}

function validate() {
    var body = {
        accessToken:data.token
    };
    request.post(host+'validate',{json:body,proxy:null},function (err, response, body) {
        // if (!err && response.statusCode===200){
        //     data.token = body.accessToken;
        // }
        console.log(err);
        // console.log(response)
        console.log(body)
        /**
         * { error: 'ForbiddenOperationException',
  errorMessage: 'Invalid token' }
         */
    });
}

function signout() {
    var body = {
        username:option.username,
        password:option.password
    };
    request.post(host+'signout',{json:body,proxy:null},function (err, response, body) {
        // if (!err && response.statusCode===200){
        //     data.token = body.accessToken;
        // }
        console.log(err);
        // console.log(response)
        console.log(body)
    });
}

function newGuid() {
    var guid = "";
    for (var i = 1; i <= 32; i++){
        guid += Math.floor(Math.random()*16.0).toString(16);
    }
    return guid;
}


module.exports = {
    data:data,
    get:get
};