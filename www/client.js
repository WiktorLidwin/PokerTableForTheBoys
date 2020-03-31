let server;
var game;
var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");
let position = 0;
let cardx_size = canvas.width / 15;
let cardy_size = cardx_size * 3 / 2;
var positions = [];
var folded_card = new Image(cardx_size, cardy_size);
var leader = false;
folded_card.src = "Cards/" + "gray_back" + ".png";
var playing_card = new Image(cardx_size, cardy_size);
playing_card.src = "Cards/" + "red_back" + ".png";
var card_positions = [canvas.width / 4, canvas.height / 4 * 3, canvas.width / 10, canvas.height / 2 - cardy_size / 2, canvas.width / 4, canvas.height / 4 - cardy_size, canvas.width / 2, canvas.height / 4 - cardy_size, canvas.width / 4 * 3, canvas.height / 4 - cardy_size, canvas.width / 10 * 9, canvas.height / 2 - cardy_size / 2, canvas.width / 4 * 3, canvas.height / 4 * 3]
console.log(card_positions)
window.onload = function() {
    game = new Game();
    game.init();
};
var Game = function() {
    this.socket = null;
};

function noScroll() {
    window.scrollTo(0, 0);
}



// add listener to disable scroll
window.addEventListener('scroll', noScroll);


Game.prototype = {
    server: 0,
    init: function() {
        var that = this;
        this.socket = io.connect();
        this.socket.on('connect', function() {
            console.log("connected");
            // document.getElementById('info').textContent = 'give yourself a nickname :)';
            // document.getElementById('nickWrapper').style.display = 'block';
            // document.getElementById('nicknameInput').focus();
        });
        this.socket.on('send_positions', function(sentPositions) {
            console.log("HJERE")
            canvas.style.display = "block"
            positions = sentPositions;
            for (let i = 0; i < 10; i++) {
                var btn = document.createElement("button");
                btn.innerHTML = "Sit Down";
                btn.style.position = "absolute";
                btn.style.left = card_positions[(i - 1) * 2] + 'px';
                btn.style.top = card_positions[(i - 1) * 2 + 1] + 'px';
                var body = document.getElementsByTagName("body")[0];
                body.appendChild(btn);
                btn.addEventListener("click", function() {
                    //pop up or some shit?
                })
            }
            var btn = document.createElement("button");
            btn.innerHTML = "Sit Down";
            btn.style.position = "absolute";
            btn.style.left = canvas.width / 2 + 'px';
            btn.style.top = canvas.height / 4 * 3 + 'px';
            var body = document.getElementsByTagName("body")[0];
            body.appendChild(btn);
        })

        //this.socket.emit('login', "Thictor", 1000, position)
        //this.socket.emit('start_game');
        //this.socket.emit('request_cards')
        this.socket.on('send_cards', function(cards, foldedPlayers, playingPlayers, board, fold) { //if fold make cards grey
            console.log("Cards/" + cards[0].rank + cards[0].suit + ".png");
            console.log("Cards/" + cards[1].rank + cards[1].suit + ".png");
            var img = new Image(cardx_size, cardy_size);
            img.src = "Cards/" + cards[0].rank + cards[0].suit + ".png";
            img2 = new Image(cardx_size, cardy_size);
            img2.src = "Cards/" + cards[1].rank + cards[1].suit + ".png";
            img.onload = function() {
                console.log("what1")
                ctx.drawImage(img, canvas.width / 2, canvas.height / 4 * 3, cardx_size, cardy_size);
            };
            img2.onload = function() {
                console.log("what2")
                ctx.drawImage(img2, canvas.width / 2 - cardx_size, canvas.height / 4 * 3, cardx_size, cardy_size);
            };
            foldedPlayers = [1, 2, 3, 4, 5, 6, 7]
                //ctx.drawImage(folded_card, canvas.width / 2 + 400, canvas.height / 4 * 3, 200, 300);
            for (let index = 0; index < 10; index++) {
                if (foldedPlayers.indexOf((index + position) % 10) != -1) {
                    // console.log((index - 1) * 2 + 1)
                    // console.log("x: " + card_positions[(index - 1) * 2] + ",y: " + card_positions[(index - 1) * 2 + 1])
                    // console.log("index:" + index)
                    ctx.drawImage(folded_card, card_positions[(index - 1) * 2], card_positions[(index - 1) * 2 + 1], cardx_size, cardy_size);
                    ctx.drawImage(folded_card, card_positions[(index - 1) * 2] - cardx_size, card_positions[(index - 1) * 2 + 1], cardx_size, cardy_size);
                }
                if (playingPlayers.indexOf((index + position) % 10) != -1) {

                }

            }
            console.log(board);
            if (board != undefined) {
                i = 0
                while (i < board.length) {
                    console.log(i)
                    draw_image(i, board);
                    i++;
                }
            }

            //ctx.fillRect(0, 0, 100, 299)
            //ctx.drawImage("Cards/" + cards[1].rank + cards[1].suit + ".png", canvas.width / 2 + 100, canvas.height / 4 * 3, 200, 300);

            // show_image("Cards/" + cards[0].rank + cards[0].suit + ".png", 200, 300, 0)
            // show_image("Cards/" + cards[1].rank + cards[0].suit + ".png", 200, 300, 0)

            console.log(cards);
        })

    }
}

function draw_image(i, board) {
    var deck = new Image(cardx_size, cardy_size);
    deck.src = "Cards/" + board[i].rank + board[i].suit + ".png";
    deck.onload = function() {
        console.log(canvas.width / 2 - cardx_size - cardx_size * i)
        ctx.drawImage(deck, canvas.width / 2 - cardx_size - cardx_size * i, canvas.height / 2 - cardy_size / 2, cardx_size, cardy_size);

    }
}