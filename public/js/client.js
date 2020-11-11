// Turn off logging
// console.log = function() {}

const NUMBER_OF_MILLISECONDS_IN_AN_HOUR = 1000 * 60 * 60;

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
            let timestamp = new Date(status.messages[i].timestamp);
            let difference_in_hours = Math.abs(new Date() - timestamp) / NUMBER_OF_MILLISECONDS_IN_AN_HOUR;

            if (difference_in_hours < 24) {
                timestamp = timestamp.toLocaleTimeString('en-US', { hour: "numeric", minute: "numeric" });
            }
            else {
                timestamp = timestamp.toLocaleDateString('en-US', { year: "numeric", month: "numeric", day: 'numeric' });
            }

            let message_html = `<li><p>` + status.messages[i].user.id + ` <span class='timestamp'>` + timestamp + `</span></p><p>` + status.messages[i].text + `</p></li>`;

            $('#messages').append($(message_html));
        }
    });
});