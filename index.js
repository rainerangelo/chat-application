// Turn off logging
// console.log = function() {}

const max_number_of_users = 5;

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var user_id_counter = 0;

var status = {
    users: [],
    messages: []
}

class User {
    constructor(id) {
        this.id = id;
        this.active = true;
    }
}

class Message {
    constructor(text, user) {
        this.text = text;
        this.user = user;
    }
}

app.use(require('express').static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('new user', () => {
        var user = new User(user_id_counter);
        status.users.push(user);
        user_id_counter++;

        socket.emit('new user', user);
    });

    socket.on('chat message', (data) => {
        var user = status.users.find(user => user.id === Number(data.id));
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