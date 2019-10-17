var Table = require('../../core/models/GameTable');
var telegramBot = require('../../core/lib/telegramBot');

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
    var teleMsg = ''
    if (data.table.status == 'full') {
      teleMsg =  'Game table ' + data.table._id + ' is full now. Please finalize bet within ' + Math.floor(data.table.allowedTime / 60) + 'minutes'
    } else if (data.table.status == 'half') {
      teleMsg = 'Maker is on the game table ' + data.table._id + '.'
    } else {
      teleMsg = 'Bet finalized on game table ' + data.table._id + ': https://ropsten.etherscan.io/tx/' + data.table.recentTx 
    }

    socket.broadcast.emit(data.table.status + 'Table', {
      tableIndex: data.table._id,
      table: JSON.stringify(data.table)
    });

    telegramBot.sendMessage(teleMsg);
  });

};