/**
 * This file includes code for the server of the chat application.
 *
 * Author: Rainer Lim
 */

// Turn off logging
// console.log = function() {}

// These are for restricting the number of messages and users kept in the server
const MAX_NUMBER_OF_MESSAGES = 200;
// const MAX_NUMBER_OF_USERS = 5; // TODO: Restrict number of users

// These are for generating 4-digit hexadecimal user IDs for users
const USERNAME_LENGTH = 4;
const HEX = '0123456789ABCDEF';

// These are for creating the express application, HTTP server, and Socket IO server
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

// This keeps track of the status of the chat application
var status = {
    ids: [],
    users: [],
    messages: []
}

/**
 * This function generates a user ID for a user who has just joined the chat application
 */
function generate_user_id() {
    let user_id = '';
    do {
        for (let i = 0; i < USERNAME_LENGTH; i++) {
            user_id += HEX.charAt(Math.floor(Math.random() * HEX.length));
        }
    } while (status.ids.includes(user_id));
    return user_id;
}

/**
 * This function uses usernames to alphabetically sort users in the chat application
 */
function sort_users() {
    status.users.sort((first, second) => {
        if (first.username < second.username) {
            return -1;
        }
        if (first.username > second.username) {
            return 1;
        }
        return 0;
    })
}

/**
 * This function emits a 'render' event to all sockets so that all instances of the chat
 * application is updated with the latest status
 */
function render() {
    io.emit('render', status);
}

/**
 * This is the User class, which holds all information related to a user
 */
class User {
    constructor(socket_id) {
        this.socket_id = socket_id;         // Socket ID
        this.id = generate_user_id();       // User ID
        this.username = 'User ' + this.id;  // Username
        this.color = 'white';               // Username color
        this.active = true;                 // Activity (i.e., online or offline)
    }
}

/**
 * This is the Message class, which holds all information related to a message
 */
class Message {
    constructor(text, user) {
        this.text = text;               // Message text
        this.user = user;               // User from whom message was sent
        this.timestamp = new Date();    // Message timestamp
    }
}

// Allow express application to use static files in '/public' directory
app.use(require('express').static(__dirname + '/public'));

// Use '/index.html' as the main page of express application
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// The 'connection' event occurs when a client connects to the server
io.on('connection', (socket) => {

    // The 'new user' event occurs when a new user, who has not used the application before, joins
    socket.on('new user', () => {

        // Create new user and add to the array of users in status
        var user = new User(socket.id);
        status.users.push(user);
        sort_users();

        socket.emit('new user', user);

        render();
    });

    // The 'previous user' event occurs when a user, who has used the application before, rejoins
    socket.on('previous user', (stored_id) => {
        var user = status.users.find(user => user.id === stored_id);

        if (user) {
            user.socket_id = socket.id;
            user.active = true;
        }
        else {
            // Server must have restarted and user's ID is old, so create new user
            var user = new User(socket.id);
            status.users.push(user);
            sort_users();

            socket.emit('new user', user);
        }

        render();
    });

    // The 'chat message' event occurs when a new message is sent to the chat application
    socket.on('chat message', (data) => {
        var user = status.users.find(user => user.id === data.id);

        if (user) {

            // Create new message and add to the array of messages in status
            var message = new Message(data.message, user);
            status.messages.push(message);

            // Restrict the number of messages kept in the server to MAX_NUMBER_OF_MESSAGES
            if (status.messages.length > MAX_NUMBER_OF_MESSAGES) {
                status.messages.shift();
            }
        }

        render();
    });

    // The 'update name' event occurs when a user sends the command to change their username
    socket.on('update name', (name) => {
        var user = status.users.find(user => user.socket_id === socket.id);

        if (user) {
            if (!status.users.some(user => user.username === name)) {
                user.username = name;
            }
        }

        sort_users()

        render();
    });

    // The 'update color' event occurs when a user sends the command to change their username color
    socket.on('update color', (color) => {
        var user = status.users.find(user => user.socket_id === socket.id);

        if (user) {
            user.color = '#' + color;
        }

        render();
    });

    // The 'render' event occurs when a client is requesting an update to their chat application
    socket.on('render', () => {
        render();
    });

    // The 'disconnect' event occurs when a user disconnects from the chat application
    socket.on('disconnect', () => {
        var user = status.users.find(user => user.socket_id === socket.id);

        if (user) {
            user.active = false;
        }

        render();
    });
});

// If available, use value stored in PORT environment variable, otherwise, use port 3000
const PORT = process.env.PORT || 3000;

// Create listener on specified port
http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});
