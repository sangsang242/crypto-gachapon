$(function () {
  const socket = io('http://localhost:3030/numberbet');

  const contractAddr = $("#contractAddr").val()
  const contractAbi = $("#contractAbi").val()
  var maxCase = $("#maxCase").val()
  var minimumAmt = 0.01

  $('.submit-button').on('click', async () => {
    socket.emit('pendingTx', {
      tableIndex: 0,
      tx: '0xtesttesttxtx'
    });
    console.log('pendingTx Sent')

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

    if (!ethereum.isMetaMask) {
      alert('Please install metamask first.')
      return
    }

    if (!web3.eth.coinbase) {
      try {
        await ethereum.enable()
        ethereum.autoRefreshOnNetworkChange = false
      } catch (error) {
        alert('Please accept the connection request.')
      }
    }

    await web3.version.getNetwork((err, netId) => {
      if (netId != "3") {
        alert('Available only in Ropsten test network.')
        return
      }
    })

    const myContract = web3.eth.contract(JSON.parse(contractAbi)).at(contractAddr)
    // makeBet(myContract, contractAddr)

  })

  function getHashedNum(num, salt) {
    const hashedNum = CryptoJS.SHA256(num + salt);
    return '0x' + hashedNum.toString(CryptoJS.enc.Hex);
  }

  function makeBet(myContract, contractAddr) {
    var tableIndex = $("#modalTableIndex").text()
    var hashedNum = getHashedNum($('#numberButton').val(), $("#saltWord").val())
    var duration = $(':radio[name="durationRadio"]:checked').val()
    var option = {
      from: web3.eth.accounts[0],
      to: contractAddr,
      value: (Math.pow(10, 18) * ($("#deposit-label").text())),
      data: myContract.makeBet.getData(tableIndex, hashedNum, duration)
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
  }

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


