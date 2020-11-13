/**
 * This file includes code for the client of the chat application.
 *
 * Author: Rainer Lim
 */

// Turn off logging
// console.log = function() {}

// This is for converting timestamp differences from milliseconds to hours
const NUMBER_OF_MILLISECONDS_IN_AN_HOUR = 1000 * 60 * 60;

/**
 * This function gets the stored user ID from localStorage
 */
function get_stored_user_id() {
    return localStorage.getItem('user_id');
}

/**
 * This function scrolls down to the bottom of the messages HTMLElement
 * @param {HTMLElement} messages
 */
function scroll_to_bottom(messages) {
    messages.scrollTop = messages.scrollHeight;
}

/**
 * This function is the start of the client code for the chat application
 */
$(function () {
    var socket = io();                      // Create the socket and connect to the server
    var stored_id = get_stored_user_id();   // Get stored user ID

    // If user ID is found, emit a 'previous user' event, otherwise, emit a 'new user' event
    if (stored_id) {
        console.log("Found stored user ID in local storage");
        socket.emit('previous user', stored_id);
    }
    else {
        console.log("Did not find stored user ID in local storage");
        socket.emit('new user');
    }

    // This handles messages being sent (or submitted) to the chat application
    $('form').submit(function (e) {
        e.preventDefault();
        let received_message = $('#message').val();

        // Process message only when there is at least one non-whitespace character
        if (received_message.trim().length) {

            // Handle username customization command
            if (received_message.startsWith('/name ')) {
                socket.emit('update name', received_message.split('/name ')[1]);
            }

            // Handle username color customization command
            else if (received_message.startsWith('/color ')) {
                socket.emit('update color', received_message.split('/color ')[1]);
            }

            // Handle non-command messages
            else {
                received_message = received_message.replace(':)', '&#128578;'); // Happy face emoji conversion
                received_message = received_message.replace(':(', '&#128577;'); // Sad face emoji conversion
                received_message = received_message.replace(':o', '&#128558;'); // Open-mouth face emoji conversion
                socket.emit('chat message', { message: received_message, id: get_stored_user_id() });
            }
        }

        // Clear message input
        $('#message').val('');
        return false;
    })

    // The 'new user' event occurs when a new user, who has not joined the application before, joins
    socket.on('new user', (user) => {
        console.log("Store user ID to local storage");

        // Once the server has assigned a user ID to the new user, store into localStorage
        localStorage.setItem('user_id', user.id);
    })

    // The 'render' event occurs when a client is requesting an update to their chat application
    socket.on('render', (status) => {
        console.log("In render");

        var messages = document.getElementById('grid-item-messages');

        // Determine whether or not the list of messages will scroll down automatically
        // Only scroll down when the user is at the very bottom of the list of messages
        auto_scroll = messages.scrollTop + messages.clientHeight >= messages.scrollHeight;

        $('#messages').empty();
        $('#users').empty();

        // Loop through and display all messages in web page
        for (let i = 0; i < status.messages.length; i++) {
            let timestamp = new Date(status.messages[i].timestamp);
            let difference_in_hours = Math.abs(new Date() - timestamp) / NUMBER_OF_MILLISECONDS_IN_AN_HOUR;

            // If message timestamp is less than a day old, display time only, otherwise, display date only
            if (difference_in_hours < 24) {
                timestamp = timestamp.toLocaleTimeString('en-US', { hour: "numeric", minute: "numeric" });
            }
            else {
                timestamp = timestamp.toLocaleDateString('en-US', { year: "numeric", month: "numeric", day: 'numeric' });
            }

            let message_item = $(`<li></li>`);                              // List item for entire message
            let message_item_username = $(`<p></p>`);                       // Paragraph for username portion
            let message_item_message = $(`<p class="message-text"></p>`);   // Paragraph for message text portion

            message_item_username.append(`<span style="color: ${status.messages[i].user.color}">${status.messages[i].user.username}</span><span class="timestamp">${timestamp}</span>`);
            message_item_message.append(status.messages[i].text);

            // If message is from main user (i.e., the main user for that chat application instance)
            if (status.messages[i].user.id === get_stored_user_id()) {
                message_item_username.children('span')[0].append(' (You)');
                message_item.addClass('message-main-user');
                message_item_message.addClass('message-text-main-user');
            }

            message_item.append(message_item_username);
            message_item.append(message_item_message);

            $('#messages').append(message_item);
        }

        let number_of_online_users = 0;

        // Loop through and display all users in web page
        for (let i = 0; i < status.users.length; i++) {

            // If user is not active (i.e., offline), continue
            if (!status.users[i].active) {
                continue;
            }

            // Count number of online users
            number_of_online_users++;

            let user_item = $(`<li></li>`);         // List item for entire user
            let user_item_username = $(`<p></p>`);  // Paragraph for username portion

            user_item_username.append(`<span style="color: ${status.users[i].color}">${status.users[i].username}</span>`);

            // If user is main user (i.e., the main user for that chat application instance)
            if (status.users[i].id === get_stored_user_id()) {
                user_item_username.children('span')[0].append(' (You)');
            }

            user_item.append(user_item_username);

            $('#users').append(user_item);
        }

        // Display number of online users
        $('#number-of-online-users').empty();
        $('#number-of-online-users').append(` (${number_of_online_users}/${status.users.length})`);

        // If true, automatically scroll down to the bottom of the list of messages
        if (auto_scroll) {
            scroll_to_bottom(messages);
        }
    });
});