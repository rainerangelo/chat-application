// Turn off logging
// console.log = function() {}

const MAX_NUMBER_OF_USERS = 5;
const USERNAME_LENGTH = 4;
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

function render() {
    io.emit('render', status);
}

class User {
    constructor(socket_id) {
        this.socket_id = socket_id;
        this.id = generate_user_id();
        this.username = 'User ' + this.id;
        this.color = 'white';
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
        var user = new User(socket.id);
        status.users.push(user);

        socket.emit('new user', user);

        render();
    });

    socket.on('previous user', (stored_id) => {
        var user = status.users.find(user => user.id === stored_id);

        if (user) {
            user.socket_id = socket.id;
            user.active = true;
        }
        else {
            var user = new User(socket.id);
            status.users.push(user);

            socket.emit('new user', user);
        }

        render();
    });

    socket.on('chat message', (data) => {
        var user = status.users.find(user => user.id === data.id);

        if (user) {
            var message = new Message(data.message, user);
            status.messages.push(message);
        }

        render();
    });

    socket.on('update name', (name) => {
        var user = status.users.find(user => user.socket_id === socket.id);

        if (user) {
            if (!status.users.some(user => user.username === name)) {
                user.username = name;
            }
        }

        render();
    });

    socket.on('update color', (color) => {
        var user = status.users.find(user => user.socket_id === socket.id);

        if (user) {
            user.color = color;
            console.log(user);
        }

        render();
    });

    socket.on('render', () => {
        render();
    });

    socket.on('disconnect', () => {
        var user = status.users.find(user => user.socket_id === socket.id);

        if (user) {
            user.active = false;
        }

        render();
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});