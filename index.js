// Turn off logging
// console.log = function() {}

const MAX_NUMBER_OF_USERS = 5;
const USERNAME_LENGTH = 8;
const HEX = '0123456789ABCDEF';

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var status = {
    ids: [],
    users: [],
    messages: []
}

function generate_user_id() {
    let user_id = '';
    do {
        for (let i = 0; i < USERNAME_LENGTH; i++) {
            user_id += HEX.charAt(Math.floor(Math.random() * HEX.length));
        }
    } while (status.ids.includes(user_id));
    return user_id;
}

class User {
    constructor() {
        this.id = generate_user_id();
        this.username = 'User ' + this.id;
        this.active = true;
    }
}

class Message {
    constructor(text, user) {
        this.text = text;
        this.user = user;
        this.timestamp = new Date();
    }
}

app.use(require('express').static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('new user', () => {
        var user = new User();
        status.users.push(user);

        socket.emit('new user', user);
    });

    socket.on('chat message', (data) => {
        var user = status.users.find(user => user.id === data.id);
        var message = new Message(data.message, user);
        status.messages.push(message);

        io.emit('render', status);
    });

    socket.on('render', () => {
        io.emit('render', status);
    });

    socket.on('disconnect', () => {
        
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});