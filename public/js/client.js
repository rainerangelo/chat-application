// Turn off logging
// console.log = function() {}

function get_stored_user_id() {
    return localStorage.getItem('user_id');
}

$(function () {
    var socket = io();

    if (get_stored_user_id()) {
        console.log("Found stored user ID in local storage");
    }
    else {
        console.log("Did not find stored user ID in local storage");
        socket.emit('new user');
    }

    socket.emit('render');

    $('form').submit(function (e) {
        console.log("In submit, message is " + $('#message').val() + " from " + get_stored_user_id());
        e.preventDefault();
        socket.emit('chat message', { message: $('#message').val(), id: get_stored_user_id() });
        $('#message').val('');
        return false;
    })

    socket.on('new user', (user) => {
        console.log("Store user ID to local storage");
        localStorage.setItem('user_id', user.id);
    })

    socket.on('render', (status) => {
        console.log("In render");

        $('#participants').empty();
        $('#messages').empty();

        for (let i = 0; i < status.users.length; i++) {
            $('#participants').append($('<li>').text(status.users[i].id));
        }

        for (let i = 0; i < status.messages.length; i++) {
            $('#messages').append($('<li>').text(status.messages[i].user.id + ": " + status.messages[i].text));
        }
    });
});