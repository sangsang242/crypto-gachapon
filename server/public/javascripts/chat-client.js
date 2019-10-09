$(function () {

  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms

  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box
  var $chatPage = $('.chat.page'); // The chatroom page

  var username = $(".address").text().trim();

  // Prompt for setting
  var connected = false;
  var typing = false;
  var lastTypingTime;

  var socket = io('/chat');

  /** view */
  //https://www.bypeople.com/bottom-chat-widget/`

  var isChatClosed = false;

  $('#live-chat header').on('click', function () {
    $('.chat').slideToggle(300, 'swing');
    $('.chat-counter').text(0);
    if (isChatClosed) {
      $('.chat-counter').fadeOut(300, 'swing');
    }
    isChatClosed = !isChatClosed;
  });

  const notifyUnread = () => {
    if (connected) {
      var unreadMsg = parseInt($('.chat-counter').text());
      $('.chat-counter').text(unreadMsg + 1);
      $('.chat-counter').fadeIn(300, 'swing');
    }
  }

  $('.chat-close').on('click', function (e) {
    socket.disconnect();
    e.preventDefault();
    $('#live-chat').fadeOut(300);
  });

  // Gets the color of a username through our hash function
  const getUsernameColor = (username) => {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  /** logic */

  // Sets the client's address
  const login = () => {
    // If the address is valid
    // if (web3.utils.isAddress(address)) {
    if (username) {
      if (username == 'Guest') {
        username = username + Math.floor(Math.random() * 1000000)
      }

      // Tell the server your address
      socket.emit('add user', username);
    }
  }

  login();

  // Keyboard events

  $inputMessage.on('input', () => {
    updateTyping();
  });

  // When the client hits ENTER on their keyboard
  $inputMessage.keydown(key => {
    if (key.keyCode == 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      }
    }
  });

  // Sends a chat message
  const sendMessage = () => {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message,
        time: (new Date()).getTime()
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', {
        message: message,
        time: (new Date()).getTime()
      });
    }
  }

  // Log a message
  const log = (message, options) => {
    var $el = $('<div>').addClass('chat-message log clearfix').text(message);
    addMessageElement($el, options);
  }

  const formatTime = (timestamp) => {
    var date = new Date(timestamp);
    var hours = date.getHours();
    var period = (hours >= 12) ? "PM" : "AM";
    var minutes = date.getHours();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    return ' ' + hours % 13 + ':' + minutes + ' ' + period;
  }

  // Adds the visual chat message to the message list
  const addChatMessage = (data, options) => {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if (data.time > 0) {
      options.fade = false;
      $typingMessages.remove();
      var $time = $('<span class="chat-time"/>').text(formatTime(data.time));
    } else {
      var $time = $();
    }

    var $username = $('<h5/>')
      .text(data.username);
    if (data.username == username) {
      $username.css('color', 'lime');
    } else {
      $username.css('color', getUsernameColor(data.username));
    }

    var $message = $('<p>')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<div class="message clearfix"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($time, $username, $message, $('<hr>'));

    addMessageElement($messageDiv, options);
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  const addMessageElement = (el, options) => {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }

    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Updates the typing event
  const updateTyping = () => {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(() => {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Adds the visual chat typing message
  const addChatTyping = (data) => {
    data.typing = true;
    data.message = 'typing..';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  const removeChatTyping = (data) => {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Gets the 'X is typing' messages of a user
  const getTypingMessages = (data) => {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Prevents input from having injected markup
  const cleanInput = (input) => {
    return $('<div/>').text(input).html();
  }

  // Click events

  $chatPage.click(() => {
    $inputMessage.focus();
  });

  $inputMessage.click(() => {
    $inputMessage.focus();
  });

  const showTotalUser = (data) => {
    $('.user-counter').text(data.numUsers);
    // var message = 'Users : ' + data.numUsers;
    // log(message);
  }

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', (data) => {
    connected = true;
    // Display the welcome message
    var message = "Messages will Not be stored in the server";
    log(message, { prepend: true });
    showTotalUser(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', (data) => {
    if (connected && isChatClosed) {
      notifyUnread();
    }
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', (data) => {
    log(data.username + ' joined');
    showTotalUser(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', (data) => {
    log(data.username + ' left');
    showTotalUser(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', (data) => {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', (data) => {
    removeChatTyping(data);
  });

  socket.on('disconnect', () => {
    log('you have been disconnected');
  });

  socket.on('reconnect', () => {
    log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', () => {
    log('attempt to reconnect has failed');
  });

});