var join_btn = document.getElementById('join_room');
var create_btn = document.getElementById('create_room');
var body = document.getElementsByTagName('body')[0];
var clicked = 0;

socket = io.connect();
socket.on('connect', function() {})

join_btn.addEventListener('click', function() {
    if (clicked === 0) {
        clicked = 1;
        roomid = document.getElementById("input_text").value;
        console.log(roomid)
        socket.emit('request_to_join_room', roomid)
        socket.on('joined_room', function(roomid) {
                window.location.href = window.location.href + "game/" + roomid;
            })
            //join_btn.setAttribute('id', 'join_btn_altered')
    }
});
create_btn.addEventListener('click', function() {
    if (clicked === 0) {
        clicked = 1;
        socket.emit('request_to_create_room')
            //join_btn.setAttribute('id', 'join_btn_altered')
    }
});

socket.on('room_doesnt_exist', function() {
    console.log("sorry this room doesn't exist")
    clicked = 0;
})