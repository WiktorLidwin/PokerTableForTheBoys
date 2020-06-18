let server;
var dealer = document.createElement("IMG");
dealer.style.visibility = 'hidden';
var game;
var canvas = document.querySelector('canvas');
var delete_sit_down = false;
canvas.style.backgroundColor = "RGB(188, 225, 245)";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext("2d");
let position = -1;
let cardx_size = canvas.width / 20;
let cardy_size = cardx_size * 3 / 2;
var positions = [];
var folded_card = new Image(cardx_size, cardy_size);
var leader = false;
var current_sit_down_btn_clicked = null;
var current_request_btn_clicked = null;
var nickname = "";
folded_card.src = "Cards/" + "gray_back" + ".png";
var playing_card = new Image(cardx_size, cardy_size);
playing_card.src = "Cards/" + "red_back" + ".png";
var card_positions = [canvas.width / 4, canvas.height / 4 * 3, canvas.width / 10, canvas.height / 2 - cardy_size / 2, canvas.width / 4, canvas.height / 4 - cardy_size, canvas.width / 2, canvas.height / 4 - cardy_size, canvas.width / 4 * 3, canvas.height / 4 - cardy_size, canvas.width / 10 * 9, canvas.height / 2 - cardy_size / 2, canvas.width / 4 * 3, canvas.height / 4 * 3]
var betting_positions = [canvas.width / 2, canvas.height / 4 * 3 + cardy_size / 2, canvas.width / 4, canvas.height / 4 * 3 + cardy_size / 2, canvas.width / 10 + cardx_size / 2, canvas.height / 2 - cardy_size / 2, canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 4, canvas.width / 4 * 3, canvas.height / 4, canvas.width / 10 * 9 - cardx_size / 2, canvas.height / 2 - cardy_size / 2, canvas.width / 4 * 3, canvas.height / 4 * 3 - cardy_size / 2]
var stack_size = null;

console.log(card_positions);
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

canvas.addEventListener("pointerover", function() {
    if (current_sit_down_btn_clicked !== null && delete_sit_down === false) {
        current_sit_down_btn_clicked.parentNode.removeChild(current_sit_down_btn_clicked);
        current_request_btn_clicked.parentNode.removeChild(current_request_btn_clicked);
    }

    current_sit_down_btn_clicked = null;
    current_request_btn_clicked = null;
});

function make_bets(raise_arry, current_pos) {
    count = 0;
    for (let i = 0; i < 8; i++) {
        if (raise_arry[i] != null && (count < current_pos || raise_arry[i] !== 0)) { // && count < current_pos
            count++;
            var btn = document.createElement("textBox");
            btn.className = "betting_text";
            btn.style.position = "absolute";
            if (raise_arry[i] !== 0)
                btn.innerHTML = raise_arry[i];
            else
                btn.innerHTML = "Check";
            console.log("*&&&(*&(*");
            console.log(((i - position + 8) % 8) * 2);
            if (position !== -1) {
                btn.style.left = betting_positions[((i - position + 8) % 8) * 2] - 50 + 'px';
                btn.style.top = canvas.height / 4 * 3 - 200 + 'px';
            } else {
                btn.style.left = betting_positions[i * 2] + 'px';
                btn.style.top = canvas.height / 4 * 3 - 200 + 'px';
            }
            var body = document.getElementsByTagName("body")[0];
            body.appendChild(btn);
            //betting_text
        }
    }
}
// add listener to disable scroll
window.addEventListener('scroll', noScroll);

function delete_sit_down_btns() {
    delete_sit_down = true;
    var body = document.getElementsByTagName("body")[0];
    temp = body.childNodes;
    console.log(temp.length);
    for (let i = 0; i < temp.length; i++) {
        if (temp[i].className == "name-text-box" || temp[i].className == "request-btn" || temp[i].className == "sit-down-btn") {
            body.removeChild(temp[i]);
            i--;
        }
    }
}

function create_player_profile(nickname, pos, chips) {
    console.log("creating profile..." + pos)
    var other_user_profile = document.createElement("textBox")
    other_user_profile.className = "other_user_profile"
    other_user_profile.style.position = "absolute";
    other_user_profile.style.textAlign = "center";
    if (pos === 0) {
        other_user_profile.style.left = canvas.width / 2 - (document.getElementById("user_profile_box").offsetWidth) + 'px';
        other_user_profile.style.top = canvas.height / 4 * 3 - 150 + 'px';
    } else {
        other_user_profile.style.left = card_positions[(pos - 1) * 2] + 'px';
        other_user_profile.style.top = card_positions[(pos - 1) * 2 + 1] - 125 + 'px';
    }
    console.log(card_positions[(pos - 1) * 2], card_positions[(pos - 1) * 2 + 1]);
    other_user_profile.innerHTML = nickname + ": " + chips;
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(other_user_profile);
}
my_turn = false;
pot = 0;
MIN_RAISE = 0;
BETS = [];

function create_game_btns() {
    var body = document.getElementsByTagName("body")[0];
    var btn = document.createElement("textBox");
    btn.id = "my_turn";
    btn.className = "my_turn";
    btn.style.position = "absolute";
    btn.style.left = "70%";
    btn.style.top = "2%";
    body.appendChild(btn);

    btn = document.createElement("button");
    btn.id = "raise-btn";
    btn.className = "group-buttons";
    btn.innerHTML = "Raise";
    btn.style.position = "absolute";
    btn.style.left = canvas.width / 2 - 200 + cardx_size + 'px';
    btn.style.top = canvas.height / 4.5 * 3 + cardy_size + 100 + 'px';
    body.appendChild(btn);


    btn.addEventListener("click", function() {
        if (my_turn) {
            // var amt = document.createElement('input');
            // amt.setAttribute('value', '50');
            // amt.setAttribute('max', '100');
            // amt.setAttribute('type', 'range');
            // amt.style.top = '50%';
            // amt.style.left = '50%';
            // body.appendChild(amt);
            amount = prompt("Raise amount: ");

            that.socket.emit("raise", amount);
            my_turn = false;
            var btn = document.getElementById("my_turn");
            btn.innerHTML = "";
        }
    });

    btn = document.createElement("button");
    btn.id = "check-btn";
    btn.className = "group-buttons";
    btn.innerHTML = "Check";
    btn.style.position = "absolute";
    btn.style.left = canvas.width / 2 + cardx_size - 50 + 'px';
    btn.style.top = canvas.height / 4.5 * 3 + cardy_size + 100 + 'px';
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(btn);
    btn.addEventListener("click", function() {
        if (my_turn) {
            that.socket.emit("check");
            my_turn = false;
            var btn = document.getElementById("my_turn");
            btn.innerHTML = "";
            btn = document.getElementById("check-btn");
            btn.innerHTML = "Check";

        }
    });

    btn = document.createElement("button");
    btn.id = "fold-btn";
    btn.className = "group-buttons";
    btn.innerHTML = "Fold";
    btn.style.position = "absolute";
    btn.style.left = canvas.width / 2 + 100 + cardx_size + 'px';
    btn.style.top = canvas.height / 4.5 * 3 + cardy_size + 100 + 'px';
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(btn);
    btn.addEventListener("click", function() {
        if (my_turn) {
            that.socket.emit("fold");
            my_turn = false;
            var btn = document.getElementById("my_turn");
            btn.innerHTML = "";
        }
    })
}
global_raise = 0;
var that = null;
Game.prototype = {
    server: 0,
    init: function() {
        that = this;
        this.socket = io.connect();
        this.socket.on('connect', function() {
            console.log("connected");
            temp = window.location.href.split('/');
            roomid = temp[temp.length - 2];
            console.log(roomid);
            console.log("hi")
            that.socket.emit('in_game_room', roomid)
                // document.getElementById('info').textContent = 'give yourself a nickname :)';
                // document.getElementById('nickWrapper').style.display = 'block';
                // document.getElementById('nicknameInput').focus();
        });
        this.socket.on('room_doesnt_exist', function() {
            ctx.font = "100px Verdana";
            ctx.fillText("Room Doesnt Exist", canvas.width / 4, canvas.height / 3);

        })
        this.socket.on("pot_update", function(new_pot) {
            pot = new_pot;
            btn = document.getElementById("pot_box")
            btn.innerHTML = "Pot: " + new_pot;
        })
        this.socket.on("winner", function(winners, players_hands) {
            console.log("WINNER:")
            console.log(winners)
            console.log(players_hands)
            for (let i = 0; i < winners.length; i++) {
                console.log(winners[i])
            }

            for (let i = 0; i < 8; i++) {
                if (players_hands[i] != null) {
                    console.log("i: " + i)
                    var img = new Image(cardx_size, cardy_size);
                    img.src = "Cards/" + players_hands[i][0].rank + players_hands[i][0].suit + ".png";
                    img.className = "cards";
                    img2 = new Image(cardx_size, cardy_size);
                    img2.src = "Cards/" + players_hands[i][1].rank + players_hands[i][1].suit + ".png";
                    img2.className = "cards";
                    // if (position != -1) {
                    //     btn.style.left = betting_positions[((i - position + 8) % 8) * 2] + 'px'
                    //     btn.style.top = betting_positions[((i - position + 8) % 8) * 2 + 1] + 'px';
                    // } else {
                    //     btn.style.left = betting_positions[i * 2] + 'px'
                    //     btn.style.top = betting_positions[i * 2 + 1] + 'px';
                    // }
                    // if (foldedPlayers.indexOf((index + position) % 8) != -1) {
                    //     ctx.drawImage(folded_card, card_positions[(index - 1) * 2] + cardx_size / 2, card_positions[(index - 1) * 2 + 1], cardx_size, cardy_size);
                    //     ctx.drawImage(folded_card, card_positions[(index - 1) * 2] - cardx_size / 2, card_positions[(index - 1) * 2 + 1], cardx_size, cardy_size);
                    // }
                    img.onload = function() {
                        // else if (position == 0) {
                        //     ctx.drawImage(img, card_positions[((i - position - 1)) * 2], card_positions[((i - position - 1)) * 2 + 1], cardx_size, cardy_size);
                        // }
                        if (position == -1) {
                            console.log("bruh")
                            if (i == 0) {
                                ctx.drawImage(img, canvas.width / 2 + cardx_size / 2, canvas.height / 4 * 3, cardx_size, cardy_size);
                            } else
                                ctx.drawImage(img, card_positions[(i - 1) * 2] + cardx_size / 2, card_positions[(i - 1) * 2 + 1], cardx_size, cardy_size);
                        } else {
                            console.log(card_positions[((i - position + 7) % 8) * 2] + cardx_size / 2, card_positions[((i - position + 7) % 8) * 2 + 1])
                            if (i - position === 0) {
                                console.log("bruh1")
                                    //ctx.drawImage(img, canvas.width / 2 + cardx_size / 2, canvas.height / 4 * 3, cardx_size, cardy_size);
                            } else
                                ctx.drawImage(img, card_positions[((i - position + 7) % 8) * 2] + cardx_size / 2, card_positions[((i - position + 7) % 8) * 2 + 1], cardx_size, cardy_size);
                        }
                        //ctx.drawImage(img, canvas.width / 2 + cardx_size / 2, canvas.height / 4 * 3, cardx_size, cardy_size);
                    };
                    img2.onload = function() {
                        if (position == -1) {
                            if (i == 0) {
                                ctx.drawImage(img2, canvas.width / 2 - cardx_size / 2, canvas.height / 4 * 3, cardx_size, cardy_size);
                            } else
                                ctx.drawImage(img2, card_positions[(i - 1) * 2] - cardx_size / 2, card_positions[(i - 1) * 2 + 1], cardx_size, cardy_size);
                        } else {
                            if (i - position === 0) {
                                //ctx.drawImage(img2, canvas.width / 2 - cardx_size / 2, canvas.height / 4 * 3, cardx_size, cardy_size);
                            } else
                                ctx.drawImage(img2, card_positions[((i - position + 7) % 8) * 2] - cardx_size / 2, card_positions[((i - position + 7) % 8) * 2 + 1], cardx_size, cardy_size);
                        }
                    };

                }
            }
        });

        this.socket.on("my_turn", function(pos, nicknames, raise, min_raise) {
            if (pos === position) {
                MIN_RAISE = min_raise;
                console.log(raise);
                var btn = document.getElementById("check-btn");
                if (raise != 0)
                    btn.innerHTML = "Call " + raise;
                else
                    btn.innerHTML = "Check";
                btn = document.getElementById("my_turn");
                btn.innerHTML = nickname + "'s turn";
                console.log("UR TURN"); //ur turn text box make
                my_turn = true;
                timer = null; //add timer here
            } else {
                console.log("next_player's turn")
                console.log(nicknames)
                var btn = document.getElementById("my_turn");
                btn.innerHTML = nicknames[pos] + "'s turn";
            }
        });

        this.socket.on("update_bets", function(raise_arry, current_pos) {
            console.log("test123")
            console.log(raise_arry)
            BETS = raise_arry;

            var elements = document.getElementsByClassName("betting_text");
            for (let i = 0; i < elements.length; i++) {
                elements[i].parentNode.removeChild(elements[i]);
                i--;
            }
            make_bets(raise_arry, current_pos);
        });
        this.socket.on('set_leader', function(GAMESTATE) {
            leader = true;
            if (GAMESTATE === 0) {
                var btn = document.createElement("button");
                btn.className = "start-game-btn";
                btn.innerHTML = "Start Game";
                btn.style.position = "absolute";
                btn.style.left = canvas.width * 4 / 5 + 'px';
                btn.style.top = canvas.height * 4 / 5 + 'px';
                var body = document.getElementsByTagName("body")[0];
                body.appendChild(btn);
                btn.addEventListener("click", function() {
                    that.socket.emit('start_game');
                    btn.parentNode.removeChild(btn);
                });
                //canvas.width / 10, canvas.height / 2 - cardy_size / 2,
            }
        });
        this.socket.on('send_positions', function(sentPositions) {

            var btn = document.createElement("textBox")
            btn.className = "pot_box"
            btn.id = "pot_box"
            btn.style.position = "absolute";
            btn.style.left = canvas.width / 2 + 'px';
            btn.style.top = canvas.height / 4 + 'px';
            var body = document.getElementsByTagName("body")[0];
            body.appendChild(btn);

            console.log(sentPositions)
            var elements = document.getElementsByClassName("sit-down-btn");
            for (let i = 0; i < elements.length; i++) {
                elements[i].parentNode.removeChild(elements[i]);
                i--;
            }
            if (position === -1) {
                console.log(sentPositions)
                console.log("HERE")
                canvas.style.display = "block"
                positions = sentPositions;
                for (let i = 0; i < 8; i++) {
                    if (positions[i] === 0) {
                        var btn = document.createElement("button");
                        btn.className = "sit-down-btn";
                        btn.innerHTML = "Sit Down";
                        btn.style.position = "absolute";
                        if (i > 2 && i < 6) {
                            console.log(card_positions[(i - 1) * 2 + 1] + cardy_size);
                            btn.style.left = (card_positions[(i - 1) * 2]) + 'px';
                            btn.style.top = (card_positions[(i - 1) * 2 + 1] + cardy_size) + 'px';
                        } else {
                            btn.style.left = card_positions[(i - 1) * 2] + 'px';
                            btn.style.top = card_positions[(i - 1) * 2 + 1] + 'px';
                        }
                        var body = document.getElementsByTagName("body")[0];
                        body.appendChild(btn);
                        btn.addEventListener("pointerover", function() {
                            console.log("clicked on btn:" + i)
                            if (current_sit_down_btn_clicked !== null) {
                                current_sit_down_btn_clicked.parentNode.removeChild(current_sit_down_btn_clicked);
                                current_request_btn_clicked.parentNode.removeChild(current_request_btn_clicked);
                            }
                            var x = document.createElement("input");
                            current_sit_down_btn_clicked = x;
                            x.setAttribute("type", "text");
                            x.setAttribute("placeHolder", "NickName: ");
                            x.className = "name-text-box";
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
                            btn.className = "request-btn";
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
                            current_request_btn_clicked = btn;
                            btn.addEventListener("click", function() {
                                nickname = x.value;
                                position = i;
                                console.log(nickname);
                                console.log(position);
                                delete_sit_down_btns();
                                var user_profile_box = document.createElement("textBox");
                                user_profile_box.id = "user_profile_box";
                                user_profile_box.className = "user_profile_box";
                                user_profile_box.style.position = "absolute";
                                user_profile_box.style.left = canvas.width / 2 + 'px';
                                user_profile_box.style.top = canvas.height / 4 * 3 - 150 + 'px';
                                user_profile_box.style.textAlign = "center";

                                var body = document.getElementsByTagName("body")[0];
                                body.appendChild(user_profile_box);
                                if (i > 2 && i < 6)
                                    document.getElementById('dealer').style.top = canvas.height / 4.8 * 3 / 11 + 'px';
                                //tried to fix positioning but it won't work unless our table is circular :/
                                create_game_btns();
                                stack_size = prompt("Stack Size: ");
                                that.socket.emit('login', nickname, stack_size, position)
                            })
                        })
                    }
                    if (positions[0] === 0) {
                        dealer.setAttribute("src", "https://i.ya-webdesign.com/images/transparent-visor-poker-dealer-10.png");
                        dealer.setAttribute("width", "20%");
                        dealer.setAttribute("height", "30%");
                        dealer.setAttribute("alt", "dealer");
                        dealer.setAttribute('id', 'dealer');
                        dealer.style.position = "absolute";
                        dealer.style.left = canvas.width / 2.2 + 'px';
                        dealer.style.top = canvas.height / 4.8 * 3 + 'px';
                        dealer.style.visibility = 'visible';
                        var body = document.getElementsByTagName("body")[0];
                        body.appendChild(dealer);

                    }
                }
            }
        });

        this.socket.on('player_profile', function(chips, cards) {
            console.log("Profile update");
            var user_profile_box = document.getElementById("user_profile_box");
            user_profile_box.innerHTML = nickname + ": " + chips + "<br>" + cards;

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
                            create_player_profile(nicknames[i], (i) % 8, chips[i]);
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

$('input[type=range]').wrap("<div class='range'></div>");
var i = 1;

$('.range').each(function() {
    var n = this.getElementsByTagName('input')[0].value;
    var x = (n / 100) * (this.getElementsByTagName('input')[0].offsetWidth - 8) - 12;
    this.id = 'range' + i;
    if (this.getElementsByTagName('input')[0].value == 0) {
        this.className = "range"
    } else {
        this.className = "range rangeM"
    }
    this.innerHTML += "<style>#" + this.id + " input[type=range]::-webkit-slider-runnable-track {background:linear-gradient(to right, #3f51b5 0%, #3f51b5 " + n + "%, #515151 " + n + "%)} #" + this.id + ":hover input[type=range]:before{content:'" + n + "'!important;left: " + x + "px;} #" + this.id + ":hover input[type=range]:after{left: " + x + "px}</style>";
    i++
});

$('input[type=range]').on("input", function() {
    var a = this.value;
    var p = (a / 100) * (this.offsetWidth - 8) - 12;
    if (a == 0) {
        this.parentNode.className = "range"
    } else {
        this.parentNode.className = "range rangeM"
    }
    this.parentNode.getElementsByTagName('style')[0].innerHTML += "#" + this.parentNode.id + " input[type=range]::-webkit-slider-runnable-track {background:linear-gradient(to right, #3f51b5 0%, #3f51b5 " + a + "%, #515151 " + a + "%)} #" + this.parentNode.id + ":hover input[type=range]:before{content:'" + a + "'!important;left: " + p + "px;} #" + this.parentNode.id + ":hover input[type=range]:after{left: " + p + "px}";
})