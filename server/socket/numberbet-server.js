var EventLog = require('../../core/models/EventLog');
var Table = require('../../core/models/GameTable');

module.exports = function (socket) {
  
  socket.on('pendingTx', async (data) => {
    const currentData = await Table.findById(data.tableIndex);

    if (currentData.recentTx != data.tx) {
      currentData.status = 'pending';
      currentData.recentTx = data.tx;
      currentData.recentTime = new Date().getTime();
      await currentData.save();

      socket.emit('pendingTx', {
        tableIndex: data.tableIndex,
        tx: data.tx
      });
      socket.broadcast.emit('pendingTx', {
        tableIndex: data.tableIndex,
        tx: data.tx
      });
    }
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('fetcherConnect', () => {
    socket.emit('fetcherConnect', {
      msg: ' hell o '
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

};