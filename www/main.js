var join_btn = document.getElementById('join_room');
var body = document.getElementsByTagName('body')[0];


join_btn.addEventListener('click', function () {
    join_btn.setAttribute('id', 'join_btn_altered')
});

$(document).ready(function() {
    $('input#input_text, textarea#textarea2').characterCounter();
});
