$(function () {
  const socket = io('http://localhost:3030/numberbet');

  const contractAddr = $("#contractAddr").val()
  const contractAbi = $("#contractAbi").val()
  var maxCase = $("#maxCase").val()
  var minimumAmt = 0.01

  $('.make-button').on('click', async () => {
    socket.emit('pendingTx', {
      tableIndex: 0,
      tx: '0x06eb0df36ae2e00661768195d4c8d4ca7357f4f5801a725f32f27c1fb75c4175'
    });
    console.log('pendingTx Sent')
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

      var tableIndex = $(".modalTableIndex#table-empty").text()
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

      if (!$('#numberButton').val()) {
        alert('Please select the number.')
        return
      }

      var tableIndex = $(".modalTableIndex#table-half").text()
      var number = $('#numberButton').val()
      var option = {
        from: web3.eth.accounts[0],
        to: contractAddr,
        value: (Math.pow(10, 18) * ($("#bet-stake").text())),
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

      var tableIndex = $(".modalTableIndex#table-full").text()
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

      var tableIndex = $(".modalTableIndex#table-full").text()
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

      var tableIndex = $(".modalTableIndex#table-half").text()
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
    console.log(data)

    if ($("#contractAbi").val() == data.tableIndex) {
      $.fancybox.close()
    }
    // pending effect
    data.tableIndex;
    data.tx;
  });

  socket.on('makerIsOn', (data) => {
    if ($("#contractAbi").val() == data.tableIndex) {
      $.fancybox.close()
    }
    // turn into Bet on $$
    data.tableIndex;

  });

  socket.on('takerIsOn', (data) => {
    if ($("#contractAbi").val() == data.tableIndex) {
      $.fancybox.close()
    }
    // Table is full
    data.tableIndex;

  });

  socket.on('emptyTable', (data) => {
    if ($("#contractAbi").val() == data.tableIndex) {
      $.fancybox.close()
    }
    // pending effect
  });

})


