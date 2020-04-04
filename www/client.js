let server;
var game;
var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");
let position = -1;
let cardx_size = canvas.width / 20;
let cardy_size = cardx_size * 3 / 2;
var positions = [];
var folded_card = new Image(cardx_size, cardy_size);
var leader = false;
var clicked_sit_down_btn = false;
var current_sit_down_btn_clicked = null;
var current_request_btn_clicked = null;
var nickname = "";
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

function delete_sit_down_btns() {
    var body = document.getElementsByTagName("body")[0];
    temp = body.childNodes;
    console.log(temp.length);
    for (let i = 0; i < temp.length; i++) {
        if (temp[i].className == "name-text-box" || temp[i].className == "request-btn" || temp[i].className == "sit-down-btn") {
            body.removeChild(temp[i])
            i--;
        }
    }
}

function create_player_profile(nickname, pos, chips) {
    console.log("creating profile..." + pos)
    var other_user_profile = document.createElement("textBox")
    other_user_profile.className = "other_user_profile"
    other_user_profile.style.position = "absolute";
    if (pos === 0) {
        other_user_profile.style.left = canvas.width / 2 + 'px';
        other_user_profile.style.top = canvas.height / 4 * 3 - 100 + 'px';
    } else {
        other_user_profile.style.left = card_positions[(pos - 1) * 2] + 'px';
        other_user_profile.style.top = card_positions[(pos - 1) * 2 + 1] - 100 + 'px';
    }
    console.log(card_positions[(pos - 1) * 2], card_positions[(pos - 1) * 2 + 1])
    other_user_profile.innerHTML = nickname + "\n" + chips;
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(other_user_profile);
}
my_turn = false;

function create_game_btns() {
    var btn = document.createElement("textBox")
    btn.id = "my_turn"
    btn.className = "my_turn"
    btn.style.position = "absolute";
    btn.style.left = canvas.width / 2 + 'px';
    btn.style.top = canvas.height / 4 - cardy_size + 'px';
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(btn);

    btn = document.createElement("button");
    btn.className = "raise-btn"
    btn.innerHTML = "Raise";
    btn.style.position = "absolute";
    btn.style.left = canvas.width / 2 - 150 + cardx_size + 'px';
    btn.style.top = canvas.height / 4 * 3 + cardy_size + 50 + 'px';
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(btn);
    btn.addEventListener("click", function() {
        if (my_turn) {
            amount = 50; //change this later
            that.socket.emit("raise", amount);
            my_turn = false;
            var btn = document.getElementById("my_turn");
            btn.innerHTML = "";
        }
    })

    btn = document.createElement("button");
    btn.className = "check-btn"
    btn.innerHTML = "Check";
    btn.style.position = "absolute";
    btn.style.left = canvas.width / 2 + cardx_size + 'px';
    btn.style.top = canvas.height / 4 * 3 + cardy_size + 50 + 'px';
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(btn);
    btn.addEventListener("click", function() {
        if (my_turn) {
            that.socket.emit("check")
            my_turn = false;
            var btn = document.getElementById("my_turn");
            btn.innerHTML = "";
        }
    })

    btn = document.createElement("button");
    btn.className = "fold-btn"
    btn.innerHTML = "Fold";
    btn.style.position = "absolute";
    btn.style.left = canvas.width / 2 + 150 + cardx_size + 'px';
    btn.style.top = canvas.height / 4 * 3 + cardy_size + 50 + 'px';
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(btn);
    btn.addEventListener("click", function() {
        if (my_turn) {
            that.socket.emit("fold")
            my_turn = false;
            var btn = document.getElementById("my_turn");
            btn.innerHTML = "";
        }
    })
}
var that = null;
Game.prototype = {
    server: 0,
    init: function() {
        that = this;
        this.socket = io.connect();
        this.socket.on('connect', function() {
            console.log("connected");
            // document.getElementById('info').textContent = 'give yourself a nickname :)';
            // document.getElementById('nickWrapper').style.display = 'block';
            // document.getElementById('nicknameInput').focus();
        });
        this.socket.on("winner", function(winners) {
            console.log("WINNER:")
            console.log(winners)
            for (let i = 0; i < winners.length; i++) {
                console.log(winners[i])
            }
        })
        this.socket.on("my_turn", function() {
            var btn = document.getElementById("my_turn");
            btn.innerHTML = "UR TURN!";
            console.log("UR TURN") //ur turn text box make
            my_turn = true;
            timer = null; //add timer here
        })
        this.socket.on('set_leader', function(GAMESTATE) {
            leader = true;
            if (GAMESTATE === 0) {
                var btn = document.createElement("button");
                btn.className = "start-game-btn"
                btn.innerHTML = "Start Game";
                btn.style.position = "absolute";
                btn.style.left = canvas.width * 4 / 5 + 'px';
                btn.style.top = canvas.height * 4 / 5 + 'px';
                var body = document.getElementsByTagName("body")[0];
                body.appendChild(btn);
                btn.addEventListener("click", function() {
                    that.socket.emit('start_game')
                    btn.parentNode.removeChild(btn);
                });
                //canvas.width / 10, canvas.height / 2 - cardy_size / 2,
            }
        })
        this.socket.on('send_positions', function(sentPositions) {
            console.log(sentPositions)
            var elements = document.getElementsByClassName("sit-down-btn");
            for (let i = 0; i < elements.length; i++) {
                elements[i].parentNode.removeChild(elements[i]);
                i--;
            }
            if (position === -1) {
                console.log(sentPositions)
                console.log("HJERE")
                canvas.style.display = "block"
                positions = sentPositions;
                for (let i = 0; i < 10; i++) {
                    if (positions[i] === 0) {
                        var btn = document.createElement("button");
                        btn.className = "sit-down-btn"
                        btn.innerHTML = "Sit Down";
                        btn.style.position = "absolute";
                        if (i > 2 && i < 6) {
                            console.log(card_positions[(i - 1) * 2 + 1] + cardy_size)
                            btn.style.left = (card_positions[(i - 1) * 2]) + 'px';
                            btn.style.top = (card_positions[(i - 1) * 2 + 1] + cardy_size) + 'px';
                        } else {
                            btn.style.left = card_positions[(i - 1) * 2] + 'px';
                            btn.style.top = card_positions[(i - 1) * 2 + 1] + 'px';
                        }
                        var body = document.getElementsByTagName("body")[0];
                        body.appendChild(btn);
                        btn.addEventListener("click", function() {
                            console.log("clicked on btn:" + i)
                            if (current_sit_down_btn_clicked !== null) {
                                current_sit_down_btn_clicked.parentNode.removeChild(current_sit_down_btn_clicked);
                                current_request_btn_clicked.parentNode.removeChild(current_request_btn_clicked);
                            }
                            var x = document.createElement("input");
                            current_sit_down_btn_clicked = x;
                            x.setAttribute("type", "text");
                            x.setAttribute("placeHolder", "NickName: ");
                            x.className = "name-text-box"
                            x.style.position = 'absolute';
                            if (i > 2 && i < 6) {
                                x.style.left = (card_positions[(i - 1) * 2] - 10) + 'px';
                                x.style.top = (card_positions[(i - 1) * 2 + 1] + 48 + cardy_size) + 'px';
                            } else {
                                x.style.left = card_positions[(i - 1) * 2] - 10 + 'px';
                                x.style.top = card_positions[(i - 1) * 2 + 1] + 48 + 'px';
                            }
                            var body = document.getElementsByTagName("body")[0];
                            body.appendChild(x);
                            var btn = document.createElement("button");
                            btn.className = "request-btn"
                            btn.innerHTML = "Request Spot";
                            btn.style.position = "absolute";
                            if (i > 2 && i < 6) {
                                btn.style.left = (card_positions[(i - 1) * 2] - 10) + 'px';
                                btn.style.top = (card_positions[(i - 1) * 2 + 1] + 70 + cardy_size) + 'px';
                            } else {
                                btn.style.left = card_positions[(i - 1) * 2] - 10 + 'px';
                                btn.style.top = card_positions[(i - 1) * 2 + 1] + 70 + 'px';
                            }
                            var body = document.getElementsByTagName("body")[0];
                            body.appendChild(btn);
                            current_request_btn_clicked = btn
                            btn.addEventListener("click", function() {
                                nickname = x.value;
                                position = i;
                                console.log(nickname);
                                console.log(position);
                                delete_sit_down_btns()
                                var user_profile_box = document.createElement("textBox")
                                user_profile_box.id = "user_profile_box"
                                user_profile_box.className = "user_profile_box"
                                user_profile_box.style.position = "absolute";
                                user_profile_box.style.left = canvas.width / 2 + 'px';
                                user_profile_box.style.top = canvas.height / 4 * 3 - 100 + 'px';
                                var body = document.getElementsByTagName("body")[0];
                                body.appendChild(user_profile_box);
                                create_game_btns();

                                that.socket.emit('login', nickname, 1000, position)
                            })
                        })
                    }
                    if (positions[0] === 0) {
                        var btn = document.createElement("button");
                        btn.className = "sit-down-btn"
                        btn.innerHTML = "Sit Down";
                        btn.style.position = "absolute";
                        btn.style.left = canvas.width / 2 + 'px';
                        btn.style.top = canvas.height / 4 * 3 + 'px';
                        var body = document.getElementsByTagName("body")[0];
                        body.appendChild(btn);
                        btn.addEventListener("click", function() {
                            console.log("clicked on btn:" + -1)
                            if (current_sit_down_btn_clicked !== null) {
                                current_sit_down_btn_clicked.parentNode.removeChild(current_sit_down_btn_clicked);
                                current_request_btn_clicked.parentNode.removeChild(current_request_btn_clicked);
                            }
                            var x = document.createElement("input");
                            current_sit_down_btn_clicked = x;
                            x.setAttribute("type", "text");
                            x.setAttribute("placeHolder", "NickName: ");
                            x.className = "name-text-box"
                            x.style.position = 'absolute';
                            x.style.left = canvas.width / 2 - 10 + 'px';
                            x.style.top = canvas.height / 4 * 3 + 48 + 'px';
                            var body = document.getElementsByTagName("body")[0];
                            body.appendChild(x);
                            var btn = document.createElement("button");
                            btn.className = "request-btn"
                            btn.innerHTML = "Request Spot";
                            btn.style.position = "absolute";
                            btn.style.left = canvas.width / 2 - 10 + 'px';
                            btn.style.top = canvas.height / 4 * 3 + 70 + 'px';
                            var body = document.getElementsByTagName("body")[0];
                            body.appendChild(btn);
                            current_request_btn_clicked = btn;
                            btn.addEventListener("click", function() {
                                nickname = x.value;
                                position = 0;
                                console.log(nickname);
                                console.log(position);
                                delete_sit_down_btns();

                                var user_profile_box = document.createElement("textBox")
                                user_profile_box.id = "user_profile_box"
                                user_profile_box.className = "user_profile_box"
                                user_profile_box.style.position = "absolute";
                                user_profile_box.style.left = canvas.width / 2 + 'px';
                                user_profile_box.style.top = canvas.height / 4 * 3 - 100 + 'px';
                                var body = document.getElementsByTagName("body")[0];
                                body.appendChild(user_profile_box);
                                create_game_btns();
                                that.socket.emit('login', nickname, 1000, position)
                            })
                        })

                    }
                }
            }
        });
        this.socket.on('player_profile', function(chips, cards) {
            console.log("rofile update")
            var user_profile_box = document.getElementById("user_profile_box");
            user_profile_box.innerHTML = nickname + ": " + chips + "\n" + cards;

        });
        this.socket.on('update_other_profiles', function(nicknames, positions, chips) {
                console.log("update_other_profiles")
                var elements = document.getElementsByClassName("other_user_profile");
                for (let i = 0; i < elements.length; i++) {
                    elements[i].parentNode.removeChild(elements[i]);
                    i--;
                }
                console.log(nicknames, positions, chips)
                for (let i = 0; i < nicknames.length; i++) {
                    if (nicknames[i] !== null && i != position) {
                        if (position === -1)
                            create_player_profile(nicknames[i], (i) % 8, chips[i])
                        else
                            create_player_profile(nicknames[i], (i - position + 8) % 8, chips[i])
                    }
                }

            })
            // this.socket.on('hand', function(hand) {
            //     console.log(hand)
            // });
            //this.socket.emit('login', "Thictor", 1000, position)
            //this.socket.emit('start_game');
            //this.socket.emit('request_cards')
        this.socket.on('send_cards', function(cards, foldedPlayers, playingPlayers, board, fold) { //if fold make cards green
            if (board.length == 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
            }
            console.log("DVGJSADJHSDVJDVB")
            console.log(cards, foldedPlayers, playingPlayers, board, fold)
            if (cards !== null) {
                console.log("Cards/" + cards[0].rank + cards[0].suit + ".png");
                console.log("Cards/" + cards[1].rank + cards[1].suit + ".png");
                var img = new Image(cardx_size, cardy_size);
                img.src = "Cards/" + cards[0].rank + cards[0].suit + ".png";
                img2 = new Image(cardx_size, cardy_size);
                img2.src = "Cards/" + cards[1].rank + cards[1].suit + ".png";
                img.onload = function() {
                    console.log("what1")
                    ctx.drawImage(img, canvas.width / 2 + cardx_size / 2, canvas.height / 4 * 3, cardx_size, cardy_size);
                };
                img2.onload = function() {
                    console.log("what2")
                    ctx.drawImage(img2, canvas.width / 2 - cardx_size / 2, canvas.height / 4 * 3, cardx_size, cardy_size);
                };


                for (let index = 0; index < 8; index++) {
                    if (foldedPlayers.indexOf((index + position) % 8) != -1) {
                        ctx.drawImage(folded_card, card_positions[(index - 1) * 2] + cardx_size / 2, card_positions[(index - 1) * 2 + 1], cardx_size, cardy_size);
                        ctx.drawImage(folded_card, card_positions[(index - 1) * 2] - cardx_size / 2, card_positions[(index - 1) * 2 + 1], cardx_size, cardy_size);
                    }
                    if (playingPlayers.indexOf((index + position) % 8) != -1) {
                        console.log("*************")
                        console.log(index)
                        ctx.drawImage(playing_card, card_positions[(index - 1) * 2] + cardx_size / 2, card_positions[(index - 1) * 2 + 1], cardx_size, cardy_size);
                        ctx.drawImage(playing_card, card_positions[(index - 1) * 2] - cardx_size / 2, card_positions[(index - 1) * 2 + 1], cardx_size, cardy_size);
                    }

                }
            } else {
                if (foldedPlayers.indexOf(0) != -1) {
                    ctx.drawImage(folded_card, canvas.width / 2 + cardx_size / 2, canvas.height / 4 * 3, cardx_size, cardy_size);
                    ctx.drawImage(folded_card, canvas.width / 2 - cardx_size / 2, canvas.height / 4 * 3, cardx_size, cardy_size);
                }
                if (playingPlayers.indexOf(0) != -1) {
                    ctx.drawImage(playing_card, canvas.width / 2 + cardx_size / 2, canvas.height / 4 * 3, cardx_size, cardy_size);
                    ctx.drawImage(playing_card, canvas.width / 2 - cardx_size / 2, canvas.height / 4 * 3, cardx_size, cardy_size);
                }

                for (let index = 1; index < 8; index++) {
                    if (foldedPlayers.indexOf(index) != -1) {
                        ctx.drawImage(folded_card, card_positions[(index - 1) * 2] + cardx_size / 2, card_positions[(index - 1) * 2 + 1], cardx_size, cardy_size);
                        ctx.drawImage(folded_card, card_positions[(index - 1) * 2] - cardx_size / 2, card_positions[(index - 1) * 2 + 1], cardx_size, cardy_size);
                    }
                    if (playingPlayers.indexOf(index) != -1) {
                        console.log("*************")
                        console.log(index)
                        ctx.drawImage(playing_card, card_positions[(index - 1) * 2] + cardx_size / 2, card_positions[(index - 1) * 2 + 1], cardx_size, cardy_size);
                        ctx.drawImage(playing_card, card_positions[(index - 1) * 2] - cardx_size / 2, card_positions[(index - 1) * 2 + 1], cardx_size, cardy_size);
                    }

                }
            }
            console.log(board);
            if (board != undefined) {
                i = board.length - 1;
                while (i >= 0) {
                    draw_image(i, board);
                    i--;
                }
            }
        })

    }
}

function draw_image(i, board) {
    var deck = new Image(cardx_size, cardy_size);
    deck.className = "board";
    deck.src = "Cards/" + board[i].rank + board[i].suit + ".png";
    deck.onload = function() {
        console.log(canvas.width / 2 - cardx_size - cardx_size * i)
        ctx.drawImage(deck, canvas.width / 2 - cardx_size * 7 / 3 + cardx_size * i, canvas.height / 2 - cardy_size / 2, cardx_size, cardy_size);

    }
}