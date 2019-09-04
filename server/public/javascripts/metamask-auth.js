$(function () {

  $('.checker').on('click', async () => {
    if (!ethereum.isMetaMask) {
      alert('Please install metamask first.')
      return
    }
    console.log(window.web3)
    
    if (!web3.eth.coinbase) {
      try {
        await ethereum.enable()
      } catch (error) {
        alert('Please accept the connection request.')
      }
    }

    const pubAddress = web3.eth.coinbase

    getUserInfo(pubAddress)
    .then(signMessage)
    .then(sendSignature)
    .then(authenticate)
    .catch(errorFunction)

  })

  function getUserInfo(pubAddress) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: '/api/users/' + pubAddress,
        type: 'get',
        dataType: 'json',
        success: function (result) {
          // Registration for new address
          if (!result) {
            result = newAddress(pubAddress)
          }
          resolve(result)
        }
      })
    })
  }

  function newAddress(pubAddress) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: '/api/users',
        data: { 'pubAddress': pubAddress },
        type: 'post',
        dataType: 'json',
        success: function (result) {
          resolve(result)
        }
      })
    })
  }

  function signMessage(result) {
    return new Promise(function (resolve, reject) {
      const pubAddress = result._id
      const nonce = result.nonce

      $.ajax({
        url: '/api/signmsg',
        type: 'get',
        dataType: 'json',
        success: function (signMsg) {
          web3.personal.sign(
            web3.fromUtf8(signMsg.replace('${pubAddress}', pubAddress).replace('${nonce}', nonce)),
            pubAddress,
            (err, signature) => {
              if (err) return reject('Please accept the signature request.')
              return resolve({ pubAddress, signature })
            }
          )
        }
      })
    })
  }

  function sendSignature({ pubAddress, signature }) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: '/api/auth',
        data: {'pubAddress': pubAddress, 'signature': signature },
        type: 'post',
        dataType: 'json',
        success: function (result) {
          resolve(result)
        }
      })
    })
  }

  function authenticate(result) {
    alert('Auth Success')
    console.log(result)
  }

  function errorFunction(result) {
    alert(result)
    return false
  }


})