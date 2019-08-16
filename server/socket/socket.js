var io = require('socket.io')();

const chat = io.of('/chat');
chat.on('connection', function(socket){
    console.log('chat Connected!');
    require('./chat-server')(socket);
});

module.exports = io;
