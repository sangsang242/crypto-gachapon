var io = require('socket.io')();

const chat = io.of('/chat');
chat.on('connection', function(socket){
    console.log('chat Connected!');
    require('./chat-server')(socket);
});

const numberBet = io.of('/numberbet');
numberBet.on('connection', function(socket){
    console.log('numberbet Connected!');
    require('./numberbet-server')(socket);
});

module.exports = io;
