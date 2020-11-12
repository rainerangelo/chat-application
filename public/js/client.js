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
        let received_message = $('#message').val();

        if (received_message.trim().length) {
            if (received_message.startsWith('/name ')) {
                socket.emit('update name', received_message.split('/name ')[1]);
            }
            else if (received_message.startsWith('/color ')) {
                socket.emit('update color', received_message.split('/color ')[1]);
            }
            else {
                socket.emit('chat message', { message: received_message, id: get_stored_user_id() });
            }
        }

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

            let message_item = $(`<li></li>`);
            let message_item_username = $(`<p></p>`);
            let message_item_message = $(`<p></p>`);

            message_item_username.append(`<span style="color: ${status.messages[i].user.color}">${status.messages[i].user.username}</span><span class="timestamp">${timestamp}</span>`);
            message_item_message.append(status.messages[i].text);

            if (status.messages[i].user.id === get_stored_user_id()) {
                message_item_username.children('span')[0].append(' (You)');
                message_item.addClass('message-main-user');
            }

            message_item.append(message_item_username);
            message_item.append(message_item_message);

            $('#messages').append(message_item);
        }

        let number_of_online_users = 0;

        for (let i = 0; i < status.users.length; i++) {
            if (!status.users[i].active) {
                continue;
            }

            number_of_online_users++;

            let user_item = $(`<li></li>`);
            let user_item_username = $(`<p></p>`);

            user_item_username.append(`<span style="color: ${status.users[i].color}">${status.users[i].username}</span>`);

            if (status.users[i].id === get_stored_user_id()) {
                user_item_username.children('span')[0].append(' (You)');
            }

            user_item.append(user_item_username);

            $('#users').append(user_item);
        }

        $('#number-of-online-users').empty();
        $('#number-of-online-users').append(` (${number_of_online_users}/${status.users.length})`);

        if (auto_scroll) {
            scroll_to_bottom(messages);
        }
    });
});