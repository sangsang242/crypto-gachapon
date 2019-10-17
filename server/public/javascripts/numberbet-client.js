$(function () {
  const socket = io('http://localhost:3030/numberbet');

  const contractAddr = $("#contractAddr").val()
  const contractAbi = $("#contractAbi").val()
  var maxCase = $("#maxCase").val()
  var minimumAmt = 0.01

  $('.make-button').on('click', async () => {
    web3BuildUp().then(result => makeBet(result))
  })

  $('.join-button').on('click', () => {
    web3BuildUp().then(result => takeBet(result))
  })

  $('.finalize-button').on('click', () => {
    web3BuildUp().then(result => finalizeBet(result))
  })

  $('.unearned-button').on('click', () => {
    web3BuildUp().then(result => unearnedBet(result))
  })

  $('.cancel-button').on('click', () => {
    web3BuildUp().then(result => cancelBet(result))
  })

  function web3BuildUp() {
    return new Promise(async (resolve, reject) => {
      if (!ethereum.isMetaMask) {
        status = false;
        msg = 'Please install metamask first.'
        resolve({ status, msg })
      }

      if (!web3.eth.coinbase) {
        try {
          await ethereum.enable()
          ethereum.autoRefreshOnNetworkChange = false
        } catch (error) {
          status = false;
          msg = 'Please accept the connection request.'
          resolve({ status, msg })
        }
      }

      web3.version.getNetwork((err, netId) => {
        if (netId != "3") {
          status = false;
          msg = 'Available only in Ropsten test network.'
          resolve({ status, msg })
        } else {
          status = true;
          msg = 'Build Up Complete.'
          const myContract = web3.eth.contract(JSON.parse(contractAbi)).at(contractAddr)
          resolve({ status, msg, myContract })
        }
      })
    })
  }

  function getHashedNum(num, salt) {
    const hashedNum = CryptoJS.SHA256(num + salt);
    return '0x' + hashedNum.toString(CryptoJS.enc.Hex);
  }

  function makeBet(buildUp) {
    return new Promise(async (resolve, reject) => {
      if (!buildUp.status || !buildUp.myContract) {
        alert(buildUp.msg)
        return
      }

      if (!$('#numberButton').val()) {
        alert('Please select the number.')
        return
      }
  
      if ($("#deposit-label").text() < minimumAmt * maxCase) {
        alert('Minimum Payout on Win is ' + minimumAmt + ' ETH')
        return
      }
  
      if (!$("#saltWord").val()) {
        alert('Please type the word.')
        return
      }

      var tableIndex = $("#modalTableIndex").val()
      var hashedNum = getHashedNum($('#numberButton').val(), $("#saltWord").val())
      var duration = $(':radio[name="durationRadio"]:checked').val()
      var option = {
        from: web3.eth.accounts[0],
        to: contractAddr,
        value: (Math.pow(10, 18) * ($("#deposit-label").text())),
        data: buildUp.myContract.makeBet.getData(tableIndex, hashedNum, duration)
      }
  
      try {
        web3.eth.sendTransaction(option, (err, tx) => {
          if (err) {
            alert(err.stack)
          } else {
            socket.emit('pendingTx', {
              tableIndex: tableIndex,
              tx: tx
            });
            alert('Transaction Sent successfully: ' + tx)
            changeStatusView('pending', tableIndex)
            $.fancybox.close()
          }
        })
      } catch (error) {
        console.log(error)
      }
    })
  }

  function takeBet(buildUp) {
    return new Promise(async (resolve, reject) => {
      if (!buildUp.status || !buildUp.myContract) {
        alert(buildUp.msg)
        return
      }

      if (!$('#numberButton-half').val()) {
        alert('Please select the number.')
        return
      }

      var tableIndex = $("#modalTableIndex").val()
      var number = $('#numberButton-half').val()
      var option = {
        from: web3.eth.accounts[0],
        to: contractAddr,
        value: (Math.pow(10, 18) * ($("#bet-stake-half").text())),
        data: buildUp.myContract.takeBet.getData(tableIndex, number)
      }
  
      try {
        web3.eth.sendTransaction(option, (err, tx) => {
          if (err) {
            alert(err.stack)
          } else {
            socket.emit('pendingTx', {
              tableIndex: tableIndex,
              tx: tx
            });
            alert('Transaction Sent successfully: ' + tx)
            changeStatusView('pending', tableIndex)
            $.fancybox.close()
          }
        })
      } catch (error) {
        console.log(error)
      }
    })
  }
  
  function finalizeBet(buildUp) {
    return new Promise(async (resolve, reject) => {
      if (!buildUp.status || !buildUp.myContract) {
        alert(buildUp.msg)
        return
      }

      if (!$('#numberButton-full').val()) {
        alert('Please select the number.')
        return
      }
  
      if (!$("#salt-word").val()) {
        alert('Please type the word.')
        return
      }

      var tableIndex = $("#modalTableIndex").val()
      var realNumber = $('#numberButton-full').val()
      var saltWord = $("#salt-word").val()
      var option = {
        from: web3.eth.accounts[0],
        to: contractAddr,
        data: buildUp.myContract.finalizeBet.getData(tableIndex, realNumber, saltWord)
      }
  
      try {
        web3.eth.sendTransaction(option, (err, tx) => {
          if (err) {
            alert(err.stack)
          } else {
            socket.emit('pendingTx', {
              tableIndex: tableIndex,
              tx: tx
            });
            alert('Transaction Sent successfully: ' + tx)
            changeStatusView('pending', tableIndex)
            $.fancybox.close()
          }
        })
      } catch (error) {
        console.log(error)
      }
    })
  }

  function unearnedBet(buildUp) {
    return new Promise(async (resolve, reject) => {
      if (!buildUp.status || !buildUp.myContract) {
        alert(buildUp.msg)
        return
      }

      var tableIndex = $("#modalTableIndex").val()
      var option = {
        from: web3.eth.accounts[0],
        to: contractAddr,
        data: buildUp.myContract.unearnedBet.getData(tableIndex)
      }

      try {
        web3.eth.sendTransaction(option, (err, tx) => {
          if (err) {
            alert(err.stack)
          } else {
            socket.emit('pendingTx', {
              tableIndex: tableIndex,
              tx: tx
            });
            alert('Transaction Sent successfully: ' + tx)
            changeStatusView('pending', tableIndex)
            $.fancybox.close()
          }
        })
      } catch (error) {
        console.log(error)
      }
    })
  }

  function cancelBet(buildUp) {
    return new Promise(async (resolve, reject) => {
      if (!buildUp.status || !buildUp.myContract) {
        alert(buildUp.msg)
        return
      }

      var tableIndex = $("#modalTableIndex").val()
      var option = {
        from: web3.eth.accounts[0],
        to: contractAddr,
        data: buildUp.myContract.cancelBet.getData(tableIndex)
      }

      try {
        web3.eth.sendTransaction(option, (err, tx) => {
          if (err) {
            alert(err.stack)
          } else {
            socket.emit('pendingTx', {
              tableIndex: tableIndex,
              tx: tx
            });
            alert('Transaction Sent successfully: ' + tx)
            changeStatusView('pending', tableIndex)
            $.fancybox.close()
          }
        })
      } catch (error) {
        console.log(error)
      }
    })
  }

  /** socket event */

  socket.on('pendingTx', (data) => {
    if ($("#modalTableIndex").val() == data.tableIndex) {
      alert('Pending Transaction on this Table Watched')
      $.fancybox.close()
    }
    changeStatusView('pending', data.tableIndex)
  });

  socket.on('halfTable', (data) => {
    if ($("#modalTableIndex").val() == data.tableIndex) {
      alert('Transaction on this Table Confirmed')
      $.fancybox.close()
    }
    changeStatusView('half', data.tableIndex)
    $("#table-data-" + data.tableIndex).text(data.table)
  });

  socket.on('fullTable', (data) => {
    if ($("#modalTableIndex").val() == data.tableIndex) {
      alert('Transaction on this Table Confirmed')
      $.fancybox.close()
    }
    changeStatusView('full', data.tableIndex)
    $("#table-data-" + data.tableIndex).text(data.table)
  });

  socket.on('emptyTable', (data) => {
    if ($("#modalTableIndex").val() == data.tableIndex) {
      alert('Transaction on this Table Confirmed')
      $.fancybox.close()
    }
    changeStatusView('empty', data.tableIndex)
    $("#table-data-" + data.tableIndex).text(data.table)
  });

})


function changeStatusView(status, tableIndex) {
  if (status == 'full') {
    $("#table-front-" + tableIndex).text('Full Table')
    $("#table-pending-" + tableIndex).val('false')
    $("#table-back-" + tableIndex).text('Finalize Bet')
  } else if (status == 'half') {
    const tableData = JSON.parse($("#table-data-" + tableIndex).text())
    bebPot = toEth(tableData.deposit / $("#maxCase").val())
    $("#table-front-" + tableIndex).text('Bet on ' + bebPot + ' ETH')
    $("#table-pending-" + tableIndex).val('false')
    $("#table-back-" + tableIndex).text('Join The Bet')
  } else if (status == 'empty') {
    $("#table-front-" + tableIndex).text('Empty Table')
    $("#table-pending-" + tableIndex).val('false')
    $("#table-back-" + tableIndex).text('Make a Bet')
  } else {
    $("#table-front-" + tableIndex).text('Pending')
    $("#table-pending-" + tableIndex).val('true')
    $("#table-back-" + tableIndex).text('Check Txid')
  }
}