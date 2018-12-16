const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const _ = require('lodash')

let users = [];
let messages = [];


// Default images
let imageUrlBase = 'https://loremflickr.com/320/240/person?lock='

// return url example: https://loremflickr.com/320/240/person?lock=5
const getRandomImage = function() {
    return imageUrlBase + (Math.floor(Math.random() * 10) + 1) 
}

io.on('connection', function(socket){

    console.log('connected')    
    _user = _.find(users, {id: socket.id});
    if(!_user) {
        users.push({
            id: socket.id, 
            userName: 'Anonymous', 
            avatar: getRandomImage(),
            connectedAt: Date.now()    
        });
        socket.broadcast.emit('users', users);
    }

    // Recive chat message
    socket.on('user:message', function(msg) {
        _user = _.find(users, {id: socket.id});
        _message = {
            userId: _user.id, 
            userName: _user.userName, 
            userAvatar: _user.avatar,
            message: msg, 
            createdAt: Date.now()
        }
        messages.push(_message);
        socket.broadcast.emit('user:message', _message);
    });

    socket.on('get:users', function() {
        socket.emit('users', users);
    });

    socket.on('get:messages', function() {
        socket.emit('messages', messages);
    });

    // Set Username value
    socket.on('set:username', function(userName) {
        _userIndex = _.findIndex(users, {id: socket.id});
        users[_userIndex].userName = userName

        // find messages by socket.id and change name prop
        messages.forEach((message) => {
            if (message.userId === socket.id) {
                message.userName = userName;
            }
        })

        console.log(messages);
        io.sockets.emit('username:changed', {
            messages: messages,
            users: users
        });
    });

    // User is typing
    socket.on('is:typing', function() {
        _user = _.find(users, {id: socket.id});
        socket.broadcast.emit('user:is:typing', _user);
    });

    // User stop typing
    socket.on('stop:typing', function() {
        _user = _.find(users, {id: socket.id});
        socket.broadcast.emit('user:stop:typing', _user);
    });

    // user disconnect
    socket.on('disconnect', function() {
        // remove user from store/array
        _user = _.find(users, {id: socket.id});
        _.remove(users, _user)
        
        // delete all messages
        if (!users.length) {
            messages = [];
        }

        // Emit refresh users
        socket.broadcast.emit('users', users);
    });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});