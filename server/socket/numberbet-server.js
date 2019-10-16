var Table = require('../../core/models/GameTable');

module.exports = function (socket) {
  
  socket.on('pendingTx', async (data) => {
    if (!/^0x([A-Fa-f0-9]{64})$/.exec(data.tx)) {
      return;
    }

    console.log(data)
    const currentData = await Table.findById(data.tableIndex);
    if (currentData.recentTx == data.tx) {
      // Case: evnetFetcher fetches first
      return;
    }

    currentData.pendingTx = data.tx;
    currentData.pendingTime = new Date().getTime();
    console.log(data)
    await currentData.save();

    socket.emit('pendingTx', {
      tableIndex: data.tableIndex,
      tx: data.tx
    });
    socket.broadcast.emit('pendingTx', {
      tableIndex: data.tableIndex,
      tx: data.tx
    });
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