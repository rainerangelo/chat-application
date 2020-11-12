// Turn off logging
// console.log = function() {}

const NUMBER_OF_MILLISECONDS_IN_AN_HOUR = 1000 * 60 * 60;

function get_stored_user_id() {
    return localStorage.getItem('user_id');
}

function scroll_to_bottom(messages) {
    messages.scrollTop = messages.scrollHeight;
}

$(function () {
    var socket = io();
    var stored_id = get_stored_user_id();

    if (stored_id) {
        console.log("Found stored user ID in local storage");
        socket.emit('previous user', stored_id);
    }
    else {
        console.log("Did not find stored user ID in local storage");
        socket.emit('new user');
    }

    $('form').submit(function (e) {
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

        var messages = document.getElementById('grid-item-messages');

        auto_scroll = messages.scrollTop + messages.clientHeight >= messages.scrollHeight;

        $('#messages').empty();
        $('#users').empty();

        for (let i = 0; i < status.messages.length; i++) {
            let timestamp = new Date(status.messages[i].timestamp);
            let difference_in_hours = Math.abs(new Date() - timestamp) / NUMBER_OF_MILLISECONDS_IN_AN_HOUR;

            if (difference_in_hours < 24) {
                timestamp = timestamp.toLocaleTimeString('en-US', { hour: "numeric", minute: "numeric" });
            }
            else {
                timestamp = timestamp.toLocaleDateString('en-US', { year: "numeric", month: "numeric", day: 'numeric' });
            }

            let message_html = '';

            if (status.messages[i].user.id === get_stored_user_id()) {
                message_html = `<li class="message-main-user"><p><span class="highlight-main-user">` + status.messages[i].user.username + ` (You) </span><span class="timestamp">` + timestamp + `</span></p><p>` + status.messages[i].text + `</p></li>`;
            }
            else {
                message_html = `<li><p>` + status.messages[i].user.username + ` <span class="timestamp">` + timestamp + `</span></p><p>` + status.messages[i].text + `</p></li>`;
            }

            $('#messages').append($(message_html));
        }

        for (let i = 0; i < status.users.length; i++) {
            if (!status.users[i].active) {
                continue;
            }

            let user_html = '';

            if (status.users[i].id === get_stored_user_id()) {
                user_html = `<li><p><span class="highlight-main-user">` + status.users[i].username + ` (You)</span></p></li>`;
            }
            else {
                user_html = `<li><p>` + status.users[i].username + `</p></li>`;
            }

            $('#users').append($(user_html));
        }

        if (auto_scroll) {
            scroll_to_bottom(messages);
        }
    });
});