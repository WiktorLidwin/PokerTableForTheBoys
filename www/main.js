var join_btn = document.getElementById('join_room');
var create_btn = document.getElementById('create_room');

var small_btn = document.getElementById('small_blind');
var big_btn = document.getElementById('big_blind');

small_btn.placeholder = "25";
big_btn.placeholder = "50";

var body = document.getElementsByTagName('body')[0];
var clicked = 0;

socket = io.connect();
socket.on('connect', function() {});

join_btn.addEventListener('click', function() {
    if (clicked === 0) {
        clicked = 1;
        roomid = document.getElementById("input_text").value;
        console.log(roomid);
        socket.emit('request_to_join_room', roomid);
        socket.on('joined_room', function(roomid) {
                window.location.href = window.location.href + "game/" + roomid;
            })
            //join_btn.setAttribute('id', 'join_btn_altered')
    }
});
create_btn.addEventListener('click', function() {
    if (clicked === 0) {
        clicked = 1;
        socket.emit('create_room', small_btn.value != "" ? parseInt(small_btn.value) : parseInt(small_btn.placeholder), big_btn.value != "" ? parseInt(big_btn.value) : parseInt(big_btn.placeholder));
        console.log('request to create room')
            //join_btn.setAttribute('id', 'join_btn_altered')

    }
});

socket.on('room_doesnt_exist', function() {
    alert("Sorry, room " + document.getElementById("input_text").value + " doesn't exist.");
    clicked = 0;
});

socket.on('join_room', function(key) {
    console.log("??")
    window.location.href = window.location.href + "game/" + key;
})