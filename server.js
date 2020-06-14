const e = require('express');

var express = require('express'),
    path = require('path')
app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = [];

rooms = [];


var Room = function() {

};

function create_room(roomid) {
    var x = new Room();
    x.id = roomid;
    x.nicknames = [null, null, null, null, null, null, null, null];
    x.players = [];
    x.positions = [0, 0, 0, 0, 0, 0, 0, 0]
    x.players_chips = [0, 0, 0, 0, 0, 0, 0, 0]
    x.GAMESTATE = 0;
    x.pot = 0;
    x.boardState = 0; //0 = preflop 1 = flop ...
    x.folded = [];
    x.stillPlaying = [];
    x.raised_by = 0;
    x.current_pos = 0;
    x.past_time = 0;
    x.time_to_choose = 2000;
    x.big_blind = 50;
    x.small_blind = 25;
    x.made_move = false;
    x.currect_deck = [];
    x.deck = [];
    x.flop = [];
    x.turn = null;
    x.river = null;
    x.users = [];
    rooms.push(x);
}

Room.prototype = {
    users: [],
    deck: [],
    flop: [],
    turn: null,
    river: null,
    id: 0,
    nicknames: [],
    players: [],
    positions: [],
    players_chips: [],
    GAMESTATE: 0,
    pot: 0,
    boardState: 0, //0 = preflop 1 = flop ...
    folded: [],
    stillPlaying: [],
    raised_by: 0,
    current_pos: 0,
    past_time: 0,
    time_to_choose: 0,
    big_blind: 0,
    small_blind: 0,
    made_move: false,
    currect_deck: [],
};


// nicknames = [null, null, null, null, null, null, null, null];
// players = [];
// positions = [0, 0, 0, 0, 0, 0, 0, 0]
// players_chips = [0, 0, 0, 0, 0, 0, 0, 0]
// GAMESTATE = 0;
// pot = 0;
// boardState = 0; //0 = preflop 1 = flop ...
// folded = [];
// stillPlaying = [];
// raised_by = 0;
// current_pos = 0;
// past_time = 0;
// time_to_choose = 2000;
// big_blind = 50;
// small_blind = 25;
// made_move = false;
// var currect_deck = [];
const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
    }
    // var router = express.Router();
    // router.get('/', function(req, res) {
    //     res.send(__dirname + '/www');
    // });
    //var htmlPath = path.join(__dirname + 'www.', 'html');
app.use('/', express.static(__dirname + '/www'));
app.use('/game/:room', express.static(__dirname + '/game'));
//app.use('/', express.static(__dirname + '/www/'));
server.listen(3001); //local
create_room(100);
//server.listen(process.env.PORT); //publish to heroku
console.log('server started on port ' /*+process.env.PORT ||*/ + 3001);

function findroomwithid(id) {
    for (let i = 0; i < rooms.length; i++) {
        if (rooms[i].id == id) {
            return i;
        }
    }
    return -1;
}

io.sockets.on('connection', function(socket) {


    socket.on('in_game_room', function(roomid) {

        socket.roomid = roomid;
        socket.join(roomid);
        roomIndex = findroomwithid(socket.roomid);
        rooms[roomIndex].users.push(socket.id);
        socket.emit("send_positions", rooms[roomIndex].positions);
        socket.emit('update_other_profiles', rooms[roomIndex].nicknames, rooms[roomIndex].positions, rooms[roomIndex].players_chips);
    })

    //socket.emit("send_positions", positions);
    //socket.emit('update_other_profiles', nicknames, positions, players_chips);

    socket.on('request_to_join_room', function(roomid) {
        console.log('request_to_join_room')
        roomIndex = findroomwithid(roomid)
        if (roomIndex != -1) {
            console.log("found")
            socket.emit('joined_room', roomid)
        } else {
            socket.emit('room_doesnt_exist')
        }


    });

    socket.on('login', function(nickname, chips, position) {
        //users.push(socket.id)
        roomIndex = findroomwithid(socket.roomid);
        rooms[roomIndex].players[rooms[roomIndex].players.length] = new PLAYER();
        rooms[roomIndex].players[rooms[roomIndex].players.length - 1].hand = [null, null, null, null, null, null, null, null, null, null];
        rooms[roomIndex].players[rooms[roomIndex].players.length - 1].name = nickname;
        rooms[roomIndex].players[rooms[roomIndex].players.length - 1].socketid = socket.id;
        rooms[roomIndex].players[rooms[roomIndex].players.length - 1].chips = chips;
        rooms[roomIndex].players[rooms[roomIndex].players.length - 1].position = position;
        rooms[roomIndex].positions[position] = socket.id;
        rooms[roomIndex].nicknames[position] = nickname;
        rooms[roomIndex].players_chips[position] = chips;
        console.log(chips)
        socket.leader = false;
        socket.emit('player_profile', chips)
        io.emit('update_other_profiles', rooms[roomIndex].nicknames, rooms[roomIndex].positions, rooms[roomIndex].players_chips);
        socket.broadcast.emit("send_positions", rooms[roomIndex].positions);
        if (rooms[roomIndex].players.length === 1) {
            socket.emit('set_leader', rooms[roomIndex].GAMESTATE);
            socket.leader = true;
        }
    });

    socket.on("check", function() {
        roomIndex = findroomwithid(socket.roomid);
        rooms[roomIndex].current_pos++
            for (let i = 0; i < rooms[roomIndex].players.length; i++) {
                if (rooms[roomIndex].players[i].socketid == socket.id) {
                    rooms[roomIndex].players[i].chips = rooms[roomIndex].players[i].chips - rooms[roomIndex].raised_by + rooms[roomIndex].players[i].chipsInPot;
                    rooms[roomIndex].players[i].chipsInPot = rooms[roomIndex].raised_by;
                }
            }
        round(roomIndex)
    })
    socket.on("fold", function() {
        roomIndex = findroomwithid(socket.roomid);
        for (let i = 0; i < players.length; i++) {
            if (rooms[roomIndex].players[i].socketid == socket.id) {
                rooms[roomIndex].players[i].folded = true;
                rooms[roomIndex].pot += rooms[roomIndex].players[i].chipsInPot;
                rooms[roomIndex].players[i].chipsInPot = 0;
            }
        }
        io.emit("pot_update", rooms[roomIndex].pot);
        round(roomIndex)
    });
    socket.on("raise", function(amount) {
        roomIndex = findroomwithid(socket.roomid);
        rooms[roomIndex].current_pos++;
        rooms[roomIndex].everyone_called = false;
        for (let i = 0; i < rooms[roomIndex].players.length; i++) {
            if (rooms[roomIndex].players[i].socketid == socket.id) {
                rooms[roomIndex].players[i].chipsInPot += amount + rooms[roomIndex].raised_by;
                rooms[roomIndex].players[i].chips -= amount + rooms[roomIndex].raised_by;
                rooms[roomIndex].raised_by += amount;
            }
        }
        //console.log("raised to:" + raised_by);
        //update the profiles 
        round(roomIndex)
    })

    socket.on('start_game', function() {
        roomIndex = findroomwithid(socket.roomid);
        GAMESTATE = 1;
        for (let i = 0; i < rooms[roomIndex].players.length; i++) {
            rooms[roomIndex].players[i].folded = false;
        }
        make_preflop(roomIndex);
        round(roomIndex)
    });
    socket.on('flop', function() {
        make_flop(roomIndex);
    });
    socket.on('turn', function() {
        make_turn(roomIndex);
    });
    socket.on('river', function() {
        make_river(roomIndex);
    });
    socket.on('next_round', function() {
        roomIndex = findroomwithid(socket.roomid);
        rooms[roomIndex].flop = [];
        rooms[roomIndex].turn = null;
        rooms[roomIndex].river = null;
        rooms[roomIndex].currect_deck = [];
        for (let i = 0; i < rooms[roomIndex].players.length; i++) {
            rooms[roomIndex].players[i].folded = false;
        }
        make_preflop(roomIndex);
    });
    socket.on('request_cards', function() {
        roomIndex = findroomwithid(socket.roomid);
        rooms[roomIndex].folded = [];
        rooms[roomIndex].stillPlaying = [];
        for (let i = 0; i < rooms[roomIndex].players.length; i++) {
            if (socket.id !== rooms[roomIndex].players[i].socketid) {
                if (rooms[roomIndex].players[i].folded)
                    rooms[roomIndex].folded.push(rooms[roomIndex].players[i].position)
                else
                    rooms[roomIndex].stillPlaying.push(rooms[roomIndex].players[i].position)
            }
        }

        for (let i = 0; i < rooms[roomIndex].players.length; i++) {
            if (socket.id === rooms[roomIndex].players[i].socketid) {
                console.log("sent cards to: " + i)
                console.log(rooms[roomIndex].currect_deck)
                socket.emit('send_cards', rooms[roomIndex].players[i].cards, rooms[roomIndex].folded, rooms[roomIndex].stillPlaying, rooms[roomIndex].currect_deck)
            }
        }
    });
    socket.on('disconnect', function() {
        roomIndex = findroomwithid(socket.roomid);
        console.log("dc")
        if (roomIndex != -1) {
            console.log(rooms[roomIndex].users)
            for (let i = 0; i < rooms[roomIndex].players.length; i++) {
                if (socket.id === rooms[roomIndex].players[i].socketid) {
                    rooms[roomIndex].positions[players[i].position] = 0;
                    rooms[roomIndex].nicknames[players[i].position] = null;
                    rooms[roomIndex].players_chips[players[i].position] = 0;
                    rooms[roomIndex].players.splice(i, 1);
                }
            }
            for (let i = 0; i < rooms[roomIndex].users.length; i++) {
                if (socket.id === rooms[roomIndex].users[i]) {
                    rooms[roomIndex].users.splice(i, 1);
                }
            }
            if (socket.leader && players.length !== 0) {
                rooms[roomIndex].players[0].leader = true;
                console.log("new leader"); //test this
                io.to(rooms[roomIndex].players[0].socketid).emit('set_leader', rooms[roomIndex].GAMESTATE);
            }
            if (rooms[roomIndex].users.length === 0) {
                rooms.splice(roomIndex, 1);
                //rooms[roomIndex].GAMESTATE = 0; //delete room?

            }
        }
    })

});
var everyone_called; //false

function round(roomIndex) {
    rooms[roomIndex].folded = [];
    rooms[roomIndex].stillPlaying = [];
    for (let i = 0; i < rooms[roomIndex].players.length; i++) {
        if (rooms[roomIndex].players[i].folded)
            rooms[roomIndex].folded.push(rooms[roomIndex].players[i].position)
        else
            rooms[roomIndex].stillPlaying.push(rooms[roomIndex].players[i].position)

    }
    rooms[roomIndex].stillPlaying.sort((a, b) => a - b);
    console.log("*****")
    console.log(rooms[roomIndex].stillPlaying)
    console.log(rooms[roomIndex].folded)
        // if (raised_by != 0) {
        //     everyone_called = true;
        //     for (let i = 0; i < stillPlaying.length; i++) {
        //         if (!(players[i].folded === true || players[i].chipsInPot === raised_by) && everyone_called) {
        //             console.log("here?")
        //             everyone_called = false;
        //             current_pos = (current_pos + 1) % stillPlaying.length
        //             for (let z = 0; z < players.length; z++) {
        //                 if (stillPlaying[current_pos] === players[z].position) {
        //                     io.to(players[z].socketid).emit("my_turn")
        //                 }
        //             }
        //         }
        //     }
        //     if (everyone_called) {
        //         console.log("everyone_called")
        //         raised_by = 0;
        //         round();
        //     }
        // } else
    if (rooms[roomIndex].raised_by != 0) {
        for (let z = 0; z < rooms[roomIndex].players.length; z++) {
            if (rooms[roomIndex].stillPlaying[rooms[roomIndex].current_pos % rooms[roomIndex].stillPlaying.length] === rooms[roomIndex].players[z].position) {
                if (rooms[roomIndex].players[z].chipsInPot != rooms[roomIndex].raised_by) {
                    console.log("bruh1  " + rooms[roomIndex].current_pos)
                    console.log(rooms[roomIndex].players[z].chipsInPot)
                    rooms[roomIndex].current_pos = rooms[roomIndex].current_pos % rooms[roomIndex].stillPlaying.length;
                } else {
                    console.log("bruh2")
                    rooms[roomIndex].current_pos = rooms[roomIndex].stillPlaying.length;
                }
            }
        }

    }

    if (rooms[roomIndex].stillPlaying.length === 1) {
        console.log("FOLDED")
        for (let z = 0; z < rooms[roomIndex].players.length; z++) {
            rooms[roomIndex].pot += rooms[roomIndex].players[z].chipsInPot;
        }

        rooms[roomIndex].winner = rooms[roomIndex].stillPlaying[0]; //do something with this
        for (let i = 0; i < rooms[roomIndex].players.length; i++) {
            if (rooms[roomIndex].players[i].position === rooms[roomIndex].winner) {
                io.emit("winner", [rooms[roomIndex].players[i].name]);
                rooms[roomIndex].players[i].chips += rooms[roomIndex].pot;
                //add chips
            }
        }
        rooms[roomIndex].flop = [];
        rooms[roomIndex].turn = null;
        rooms[roomIndex].river = null;
        rooms[roomIndex].currect_deck = [];
        for (let i = 0; i < rooms[roomIndex].players.length; i++) {
            rooms[roomIndex].players[i].folded = false;
        }
        for (let z = 0; z < rooms[roomIndex].players.length; z++) {
            rooms[roomIndex].players[z].chipsInPot = 0;
        }
        rooms[roomIndex].pot = 0;
        io.emit("pot_update", rooms[roomIndex].pot);
        rooms[roomIndex].raised_by = 0;
        make_preflop(roomIndex);
        rooms[roomIndex].current_pos = 0;
        rooms[roomIndex].boardState = 0;
        round(roomIndex);

    } else if (rooms[roomIndex].stillPlaying.length != rooms[roomIndex].current_pos) {
        rooms[roomIndex].raise_arry = []; //HERE
        for (let i = 0; i < rooms[roomIndex].stillPlaying.length; i++) {
            for (let z = 0; z < rooms[roomIndex].players.length; z++) {
                if (rooms[roomIndex].players[z].position === rooms[roomIndex].stillPlaying[i]) {
                    rooms[roomIndex].raise_arry[rooms[roomIndex].stillPlaying[i]] = (rooms[roomIndex].players[z].chipsInPot);
                    rooms[roomIndex].players_chips[rooms[roomIndex].stillPlaying[i]] = rooms[roomIndex].players[z].chips;
                }
            }
        }

        for (let z = 0; z < rooms[roomIndex].players.length; z++) {
            if (rooms[roomIndex].stillPlaying[rooms[roomIndex].current_pos] === rooms[roomIndex].players[z].position) {
                io.emit('update_other_profiles', rooms[roomIndex].nicknames, rooms[roomIndex].positions, rooms[roomIndex].players_chips);
                io.emit('update_bets', rooms[roomIndex].raise_arry, rooms[roomIndex].current_pos);
                rooms[roomIndex].time = new Date();
                rooms[roomIndex].past_time = rooms[roomIndex].time.getTime();
                rooms[roomIndex].made_move = false;
                //io.to(players[z].socketid).emit("my_turn")
                io.emit("my_turn", rooms[roomIndex].players[z].position)
            }
        }
    } else {
        for (let z = 0; z < rooms[roomIndex].players.length; z++) {
            rooms[roomIndex].pot += rooms[roomIndex].players[z].chipsInPot;
        }
        io.emit("pot_update", rooms[roomIndex].pot);
        for (let z = 0; z < rooms[roomIndex].players.length; z++) {
            rooms[roomIndex].players[z].chipsInPot = 0;
        }
        console.log("round over")
        console.log(rooms[roomIndex].current_pos);
        console.log(rooms[roomIndex].stillPlaying);

        rooms[roomIndex].raised_by = 0;
        rooms[roomIndex].current_pos = 0;
        if (rooms[roomIndex].boardState == 0) {
            make_flop(roomIndex);
        }
        if (rooms[roomIndex].boardState == 1) {
            make_turn(roomIndex);
        }
        if (rooms[roomIndex].boardState == 2) {
            make_river(roomIndex);
        }
        if (rooms[roomIndex].boardState == 3) {
            rooms[roomIndex].possible_winners = check_winner(roomIndex);
            console.log("GHGJJ")
            console.log(rooms[roomIndex].possible_winners);
            rooms[roomIndex].winners = [];
            rooms[roomIndex].players_hands = [];
            for (let i = 0; i < rooms[roomIndex].possible_winners.length; i++) {
                console.log(rooms[roomIndex].players[rooms[roomIndex].possible_winners[i]].name)
                rooms[roomIndex].winners.push(rooms[roomIndex].players[rooms[roomIndex].possible_winners[i]].name);
                rooms[roomIndex].players_hands[rooms[roomIndex].players[rooms[roomIndex].possible_winners[i]].position] = rooms[roomIndex].players[rooms[roomIndex].possible_winners[i]].cards;
            }

            // for (let i = 0; i < stillPlaying.length; i++) {
            //     for (let z = 0; z < players.length; z++) {
            //         if (players[z].position == stillPlaying[i]) {
            //             players_hands[stillPlaying[i]] = (players[possible_winners[i]].cards);
            //         }
            //     }
            // }

            console.log(rooms[roomIndex].winners);
            io.emit("winner", rooms[roomIndex].winners, rooms[roomIndex].players_hands);
            for (let i = 0; i < rooms[roomIndex].possible_winners.length; i++) {
                rooms[roomIndex].players[rooms[roomIndex].possible_winners[i]].chips += rooms[roomIndex].pot / rooms[roomIndex].possible_winners.length; //side pot here
            }
            rooms[roomIndex].pot = 0;
            io.emit("pot_update", rooms[roomIndex].pot);
            rooms[roomIndex].flop = [];
            rooms[roomIndex].turn = null;
            rooms[roomIndex].river = null;
            rooms[roomIndex].currect_deck = [];
            for (let i = 0; i < rooms[roomIndex].players.length; i++) {
                rooms[roomIndex].players[i].folded = false;
            }
            sleep(5000).then(() => {
                make_preflop(roomIndex);
            })
        }
        rooms[roomIndex].boardState = (rooms[roomIndex].boardState + 1) % 4;
        round(roomIndex);
    }
}

function make_preflop(roomIndex) {
    refill_deck(roomIndex);
    shuffle(rooms[roomIndex].deck);
    give_cards(roomIndex)
    send_cards(roomIndex)
}

function send_cards(roomIndex) {
    console.log(1)
    rooms[roomIndex].folded = [];
    rooms[roomIndex].stillPlaying = [];
    for (let i = 0; i < rooms[roomIndex].players.length; i++) {
        if (rooms[roomIndex].players[i].folded)
            rooms[roomIndex].folded.push(rooms[roomIndex].players[i].position)
        else
            rooms[roomIndex].stillPlaying.push(rooms[roomIndex].players[i].position)

    }
    //stopped here

    // for (let i = 0; i < players.length; i++) {
    //     console.log("sent cards to: " + i)
    //     console.log(currect_deck)
    //     io.to(players[i].socketid).emit('send_cards', players[i].cards, folded, stillPlaying, currect_deck)
    //     check_hands(currect_deck.concat(players[i].cards), i)
    //     io.to(players[i].socketid).emit('player_profile', players[i].chips, players[i].winning_hand)
    // }
    for (let i = 0; i < rooms[roomIndex].users.length; i++) {
        temp = false;
        for (let z = 0; z < rooms[roomIndex].players.length; z++) {
            if (rooms[roomIndex].users[i] === rooms[roomIndex].players[z].socketid) {
                temp = true;
                io.to(rooms[roomIndex].players[z].socketid).emit('send_cards', rooms[roomIndex].players[z].cards, rooms[roomIndex].folded, rooms[roomIndex].stillPlaying, rooms[roomIndex].currect_deck)
                check_hands(rooms[roomIndex].currect_deck.concat(rooms[roomIndex].players[z].cards), z, roomIndex)
                io.to(rooms[roomIndex].players[z].socketid).emit('player_profile', rooms[roomIndex].players[z].chips, rooms[roomIndex].players[z].winning_hand)
            }
        }
        if (!temp) {
            io.to(rooms[roomIndex].users[i]).emit('send_cards', null, rooms[roomIndex].folded, rooms[roomIndex].stillPlaying, rooms[roomIndex].currect_deck);
        }
    }
}

function make_flop(roomIndex) {
    pick_flop(roomIndex);
    rooms[roomIndex].currect_deck = rooms[roomIndex].flop;
    send_cards(roomIndex)
}

function make_turn(roomIndex) {
    pick_turn(roomIndex);
    rooms[roomIndex].currect_deck = rooms[roomIndex].currect_deck.concat(rooms[roomIndex].turn);
    send_cards(roomIndex)
}

function make_river(roomIndex) {
    pick_river(roomIndex);
    rooms[roomIndex].currect_deck = rooms[roomIndex].currect_deck.concat(rooms[roomIndex].river);
    send_cards(roomIndex)
}
suits = ["D", "C", "S", "H"];
ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];
// deck = [];


// flop = [];
// turn = null;
// river = null;
hands = [
    "royalFlush",
    "straightFlush",
    "quads",
    "fullhouse",
    "flush",
    "straight",
    "threeOfAKind",
    "twoPair",
    "onePair",
    "highCard"
]

var PLAYER = function() {};
PLAYER.prototype = {
    leader: false,
    position: -1,
    socketid: 0,
    name: "temp",
    cards: [],
    chips: 0,
    folded: false,
    chipsInPot: 0,
    winning_hand: "",
    hand: []
}
var CARD = function() {};
CARD.prototype = {
    rank: 0,
    suit: "",
}

function refill_deck(roomIndex) {
    for (let i = 0; i < suits.length; i++) {
        for (let z = 0; z < ranks.length; z++) {
            temp = new CARD();
            temp.rank = ranks[z];
            temp.suit = suits[i];
            // console.log("z: " + z + " i: " + i)
            // console.log(temp.rank + "  " + temp.suit)
            rooms[roomIndex].deck[i * 13 + z] = temp;
        }
    }
}


function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}

function pick_flop(roomIndex) {
    for (let index = 0; index < 3; index++) {
        rooms[roomIndex].flop[index] = rooms[roomIndex].deck[0];
        rooms[roomIndex].deck.shift();
    }
}

function pick_turn(roomIndex) {
    rooms[roomIndex].turn = rooms[roomIndex].deck[0];
    rooms[roomIndex].deck.shift();
}

function pick_river(roomIndex) {
    rooms[roomIndex].river = rooms[roomIndex].deck[0];
    rooms[roomIndex].deck.shift();
}

function give_cards(roomIndex) {
    for (let i = 0; i < rooms[roomIndex].players.length; i++) {
        cards = [];
        cards[0] = rooms[roomIndex].deck[0];
        rooms[roomIndex].deck.shift();
        cards[1] = rooms[roomIndex].deck[0];
        rooms[roomIndex].deck.shift();
        console.log("Player " + i + " cards:")
        console.log(cards)
        rooms[roomIndex].players[i].cards = cards;
    }
}


function check_hands(cards, player, roomIndex) {
    sort_cards(cards);
    //console.log("???????????????")
    //console.log(cards);
    if (royalFlush(cards)) {
        console.log("POGGERS")
        rooms[roomIndex].players[player].winning_hand = "POGGERS";
        rooms[roomIndex].players[player].hand[0] = [1];
    } else if (staightFlush(cards)) {
        console.log("less poggers" + staightFlush(cards))
        rooms[roomIndex].players[player].winning_hand = "staightFlush";
        rooms[roomIndex].players[player].hand[1] = [staightFlush(cards)];
    } else if (quads(cards)) {
        console.log("Quads" + quads(cards))
        rooms[roomIndex].players[player].winning_hand = "quads";
        rooms[roomIndex].players[player].hand[2] = quads(cards);
    } else if (fullHouse(cards)) {
        console.log("fullHouse" + fullHouse(cards))
        rooms[roomIndex].players[player].winning_hand = "fullHouse";
        rooms[roomIndex].players[player].hand[3] = fullHouse(cards);
    } else if (flush(cards)) {
        console.log("Flush" + flush(cards))
        rooms[roomIndex].players[player].winning_hand = "flush";
        rooms[roomIndex].players[player].hand[4] = flush(cards);
    } else if (straight(cards)) {
        console.log("straight" + straight(cards))
        rooms[roomIndex].players[player].winning_hand = "straight";
        rooms[roomIndex].players[player].hand[5] = [straight(cards)];
    } else if (threeOfAKind(cards)) {
        console.log("threeOfAKind" + threeOfAKind(cards))
        rooms[roomIndex].players[player].winning_hand = "threeOfAKind";
        rooms[roomIndex].players[player].hand[6] = threeOfAKind(cards);
    } else if (twoPair(cards)) {
        console.log("twoPair" + twoPair(cards))
        rooms[roomIndex].players[player].winning_hand = "twoPair";
        rooms[roomIndex].players[player].hand[7] = twoPair(cards);
    } else if (onePair(cards)) {
        console.log("onePair" + onePair(cards))
        rooms[roomIndex].players[player].winning_hand = "onePair";
        rooms[roomIndex].players[player].hand[8] = onePair(cards);
    } else if (highCard(cards)) {
        console.log("highCard" + highCard(cards))
        rooms[roomIndex].players[player].winning_hand = "highCard";
        rooms[roomIndex].players[player].hand[9] = highCard(cards);
    } else {
        console.log("retard")
    }
}
//possible_winners = [];

function check_winner(roomIndex) {
    best_hand = 10;
    for (let i = 0; i < rooms[roomIndex].players.length; i++) {
        for (let z = 0; z < rooms[roomIndex].players[i].hand.length; z++) {
            //console.log("Test: " + players[i].hand[z])
            if (rooms[roomIndex].players[i].hand[z] != null && z < best_hand && rooms[roomIndex].players[i].folded == false)
                best_hand = z;
        }
    }
    possible_winners = []
    for (let i = 0; i < rooms[roomIndex].players.length; i++) {
        if (rooms[roomIndex].players[i].hand[best_hand] != null) {
            possible_winners.push(i);
        }
    }

    if (possible_winners.length > 1) {
        for (let i = 0; i < rooms[roomIndex].players[possible_winners[0]].hand[best_hand].length; i++) {
            highest = 0;
            for (let z = 0; z < possible_winners.length; z++) {
                if (ranks.indexOf(rooms[roomIndex].players[possible_winners[z]].hand[best_hand][i]) > ranks.indexOf(rooms[roomIndex].players[possible_winners[highest]].hand[best_hand][i])) {
                    possible_winners.splice(highest, 1);
                    highest = z - 1;
                } else if (ranks.indexOf(rooms[roomIndex].players[possible_winners[z]].hand[best_hand][i]) === ranks.indexOf(rooms[roomIndex].players[possible_winners[highest]].hand[best_hand][i])) {

                } else {
                    possible_winners.splice(z, 1);
                }
            }
        }
    }
    //console.log("best_hand: " + best_hand);
    console.log("Winners: " + possible_winners);
    return possible_winners;
}

function sort_cards(cards) {
    for (let i = 0; i < cards.length; i++) {
        for (let z = i + 1; z < cards.length; z++) {
            if (ranks.indexOf(cards[z].rank) > ranks.indexOf(cards[i].rank)) {
                temp = cards[z];
                cards[z] = cards[i];
                cards[i] = temp;
            }
        }
    }
}

function royalFlush(cards) {
    if (cards.length < 5) {
        return 0;
    }
    for (let i = 0; i < cards.length - 4; i++) {
        if (cards[i].rank == "A" && cards[i + 1].rank == "K" && cards[i + 2].rank == "Q" && cards[i + 3].rank == "J" && cards[i + 4].rank == "10" && cards[i].suit == cards[i + 1].suit && cards[i + 1].suit == cards[i + 2].suit && cards[i + 2].suit == cards[i + 3].suit && cards[i + 3].suit == cards[i + 4].suit) {
            return 1;
        }
    }
    return 0;

}

function staightFlush(cards) {
    if (cards.length < 5) {
        return 0;
    }
    for (let i = 0; i < cards.length - 4; i++) {
        if (ranks.indexOf(cards[i + 1].rank) == ranks.indexOf(cards[i].rank) - 1 && ranks.indexOf(cards[i + 2].rank) == ranks.indexOf(cards[i].rank) - 2 && ranks.indexOf(cards[i + 3].rank) == ranks.indexOf(cards[i].rank) - 3 && ranks.indexOf(cards[i + 4].rank) == ranks.indexOf(cards[i].rank) - 4 && cards[i].suit == cards[i + 1].suit && cards[i + 1].suit == cards[i + 2].suit && cards[i + 2].suit == cards[i + 3].suit && cards[i + 3].suit == cards[i + 4].suit) {
            return ranks.indexOf(cards[i].rank);
        }
    }
    if (ranks.indexOf(cards[cards.length - 1].rank) == 12 && ranks.indexOf(cards[cards.length - 2].rank) == 0 && ranks.indexOf(cards[cards.length - 3].rank) == 1 && ranks.indexOf(cards[cards.length - 4].rank) == 2 && ranks.indexOf(cards[cards.length - 5].rank) == 3 && cards[cards.length - 1].suit == cards[cards.length - 2].suit && cards[cards.length - 1].suit == cards[cards.length - 3].suit && cards[cards.length - 1].suit == cards[cards.length - 4].suit && cards[cards.length - 1].suit == cards[cards.length - 5].suit) {
        return 3;
    }
    return 0;

}

function quads(cards) {

    for (let i = 0; i < cards.length; i++) {
        count = 0;
        for (let z = i; z < cards.length; z++) {
            if (cards[i].rank === cards[z].rank)
                count++;
        }
        if (count === 4) {
            temp2 = [];
            temp = -1;
            for (let x = 0; x < cards.length; x++) {
                if (temp < ranks.indexOf(cards[x].rank) && cards[i].rank != cards[x].rank) {
                    temp = ranks.indexOf(cards[x].rank);
                }
            }
            temp2[0] = cards[i].rank;
            temp2[1] = ranks[temp];
            return temp2;
        }
    }
    return 0;
}

function fullHouse(cards) {
    temp5 = threeOfAKind(cards)
    if (temp5) {
        temp4 = [];
        for (let x = 0; x < cards.length; x++) {
            if (temp5[0] != cards[x].rank) {
                temp4.push(cards[x]);
            }
        }
        z = onePair(temp4)
        if (z) {
            temp6 = [];
            temp6.push(temp5[0])
            temp6.push(z[0])
            return temp6;
        }

    }
    return 0;
}

function flush(cards) {
    for (let i = 0; i < cards.length; i++) {
        temp = []
        for (let z = i; z < cards.length; z++) {
            if (cards[i].suit === cards[z].suit)
                temp.push(cards[z])
        }
        if (temp.length >= 5)
            return highCard(temp);
    }
    return 0;
}

function straight(cards) {
    for (let i = 0; i < cards.length - 4; i++) {
        if (ranks.indexOf(cards[i + 1].rank) == ranks.indexOf(cards[i].rank) - 1 && ranks.indexOf(cards[i + 2].rank) == ranks.indexOf(cards[i].rank) - 2 && ranks.indexOf(cards[i + 3].rank) == ranks.indexOf(cards[i].rank) - 3 && ranks.indexOf(cards[i + 4].rank) == ranks.indexOf(cards[i].rank) - 4) {
            return ranks.indexOf(cards[i].rank);
        }
    }
    if (ranks.indexOf(cards[cards.length - 1].rank) == 12 && ranks.indexOf(cards[cards.length - 2].rank) == 0 && ranks.indexOf(cards[cards.length - 3].rank) == 1 && ranks.indexOf(cards[cards.length - 4].rank) == 2 && ranks.indexOf(cards[cards.length - 5].rank) == 3) {
        return 3;
    }
    return 0;
}

function threeOfAKind(cards) {
    for (let i = 0; i < cards.length; i++) {
        count = 0;
        for (let z = i; z < cards.length; z++) {
            if (cards[i].rank === cards[z].rank)
                count++;
        }
        if (count === 3) {
            temp = []
            for (let x = 0; x < cards.length; x++) {
                if (temp.length != 2 && cards[x].rank != cards[i].rank) {
                    temp.push(cards[x].rank);
                }
            }
            temp2 = [];
            temp2.push(cards[i].rank);
            temp2 = temp2.concat(temp)
            return temp2;
        }
    }
    return 0;
}

function twoPair(cards) {
    if (onePair(cards) !== null && onePair(cards).length == 3) {
        return onePair(cards)
    }
    return 0;
}

function onePair(cards) {
    pairs = [];
    for (let i = 0; i < cards.length; i++) {
        count = 0;
        for (let z = i; z < cards.length; z++) {
            if (cards[i].rank === cards[z].rank)
                count++;
        }
        if (count == 2 & pairs.length != 2)
            pairs.push(cards[i].rank);
    }
    if (pairs.length == 0)
        return null
    if (pairs.length == 1) {
        temp = []
        for (let i = 0; i < cards.length; i++) {
            if (temp.length != 3 && cards[i].rank != pairs) {
                temp.push(cards[i].rank);
            }
        }
        return pairs.concat(temp);
    }
    if (pairs.length == 2) {
        temp = []
        for (let i = 0; i < cards.length; i++) {
            if (temp.length != 1 && cards[i].rank != pairs[0] && cards[i].rank != pairs[1]) {
                temp.push(cards[i].rank);
            }
        }
        return pairs.concat(temp);
    }
}

function highCard(cards) {
    if (cards.length < 5)
        return cards;
    //temp = cards.splice(cards.length - 3, 2);
    temp = [];
    for (let i = 0; i < 5; i++) {
        temp[i] = cards[i].rank;
    }
    return temp

}