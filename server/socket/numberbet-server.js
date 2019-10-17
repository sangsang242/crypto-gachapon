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
    currentData.pendingTime = Math.ceil(new Date().getTime() / 1000);
    // console.log(currentData)
    await currentData.save();

    socket.broadcast.emit('pendingTx', {
      tableIndex: data.tableIndex,
      tx: data.tx
    });
  });

  socket.on('tableWebhook', (data) => {
    console.log(data.table)
    console.log(data.table.status)
    if (data.table.status == 'full') {
      console.log(1)
    } else if (data.table.status == 'half') {
      console.log(2)
    } else {
      console.log(3)
    }

    socket.broadcast.emit(data.table.status + 'Table', {
      tableIndex: data.table._id,
      table: JSON.stringify(data.table)
    });
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

};