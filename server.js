const e = require('express');

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = [];
nicknames = [null, null, null, null, null, null, null, null];
players = [];
positions = [0, 0, 0, 0, 0, 0, 0, 0]
players_chips = [0, 0, 0, 0, 0, 0, 0, 0]
GAMESTATE = 0;
pot = 0;
boardState = 0; //0 = preflop 1 = flop ...
folded = [];
stillPlaying = [];
raised_by = 0;
current_pos = 0;
var currect_deck = [];
app.use('/', express.static(__dirname + '/www'));
server.listen(3001); //local
//server.listen(process.env.PORT); //publish to heroku
console.log('server started on port ' /*+process.env.PORT ||*/ + 3001);
io.sockets.on('connection', function(socket) {
    users.push(socket.id);
    socket.emit("send_positions", positions);
    socket.emit('update_other_profiles', nicknames, positions, players_chips);
    socket.on('login', function(nickname, chips, position) {
        //users.push(socket.id)
        players[players.length] = new PLAYER();
        players[players.length - 1].hand = [null, null, null, null, null, null, null, null, null, null];
        players[players.length - 1].name = nickname;
        players[players.length - 1].socketid = socket.id;
        players[players.length - 1].chips = chips;
        players[players.length - 1].position = position;
        positions[position] = socket.id;
        nicknames[position] = nickname;
        players_chips[position] = chips;
        console.log(chips)
        socket.leader = false;
        socket.emit('player_profile', chips)
        io.emit('update_other_profiles', nicknames, positions, players_chips);
        socket.broadcast.emit("send_positions", positions);
        if (players.length === 1) {
            socket.emit('set_leader', GAMESTATE);
            socket.leader = true;
        }
    });

    socket.on("check", function() {
        current_pos++
        for (let i = 0; i < players.length; i++) {
            if (players[i].socketid == socket.id) {
                players[i].chips = players[i].chips - raised_by + players[i].chipsInPot;
                players[i].chipsInPot = raised_by;
            }
        }
        round()
    })
    socket.on("fold", function() {
        for (let i = 0; i < players.length; i++) {
            if (players[i].socketid == socket.id) {
                players[i].folded = true;
            }
        }
        round()
    })
    socket.on("raise", function(amount) {
        current_pos++;
        everyone_called = false;
        for (let i = 0; i < players.length; i++) {
            if (players[i].socketid == socket.id) {
                players[i].chipsInPot += amount + raised_by;
                players[i].chips -= amount + raised_by;
                raised_by += amount;
            }
        }
        console.log("raised to:" + raised_by);
        //update the profiles 
        round()
    })

    socket.on('start_game', function() {
        GAMESTATE = 1;
        for (let i = 0; i < players.length; i++) {
            players[i].folded = false;
        }
        make_preflop();
        round()
    });
    socket.on('flop', function() {
        make_flop();
    });
    socket.on('turn', function() {
        make_turn();
    });
    socket.on('river', function() {
        make_river();
    });
    socket.on('next_round', function() {
        flop = [];
        turn = null;
        river = null;
        currect_deck = [];
        for (let i = 0; i < players.length; i++) {
            players[i].folded = false;
        }
        make_preflop();
    });
    socket.on('request_cards', function() {
        folded = [];
        stillPlaying = [];
        for (let i = 0; i < players.length; i++) {
            if (socket.id !== players[i].socketid) {
                if (players[i].folded)
                    folded.push(players[i].position)
                else
                    stillPlaying.push(players[i].position)
            }
        }

        for (let i = 0; i < players.length; i++) {
            if (socket.id === players[i].socketid) {
                console.log("sent cards to: " + i)
                console.log(currect_deck)
                socket.emit('send_cards', players[i].cards, folded, stillPlaying, currect_deck)
            }
        }
    });
    socket.on('disconnect', function() {
        console.log("dc")
        console.log(users)
        for (let i = 0; i < players.length; i++) {
            if (socket.id === players[i].socketid) {
                positions[players[i].position] = 0;
                nicknames[players[i].position] = null;
                players_chips[players[i].position] = 0;
                players.splice(i, 1);
            }
        }
        for (let i = 0; i < users.length; i++) {
            if (socket.id === users[i]) {
                users.splice(i, 1);
            }
        }
        if (socket.leader && players.length !== 0) {
            players[0].leader = true;
            console.log("new leader"); //test this
            io.to(players[0].socketid).emit('set_leader', GAMESTATE);
        }
        if (users.length === 0) {
            GAMESTATE = 0;
        }
    })

})
var everyone_called; //false

function round() {
    folded = [];
    stillPlaying = [];
    for (let i = 0; i < players.length; i++) {
        if (players[i].folded)
            folded.push(players[i].position)
        else
            stillPlaying.push(players[i].position)

    }
    stillPlaying.sort((a, b) => a - b);
    console.log("*****")
    console.log(stillPlaying)
    console.log(folded)
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
    if (raised_by != 0) {
        for (let z = 0; z < players.length; z++) {
            if (stillPlaying[current_pos % stillPlaying.length] === players[z].position) {
                if (players[z].chipsInPot != raised_by) {
                    console.log("bruh1  " + current_pos)
                    console.log(players[z].chipsInPot)
                    current_pos = current_pos % stillPlaying.length;
                } else {
                    console.log("bruh2")
                    current_pos = stillPlaying.length;
                }
            }
        }

    }

    if (stillPlaying.length === 1) {
        console.log("FOLDED")
        for (let z = 0; z < players.length; z++) {
            pot += players[z].chipsInPot;
        }
        winner = stillPlaying[0]; //do something with this
        for (let i = 0; i < players.length; i++) {
            if (players[i].position === winner) {
                io.emit("winner", [players[i].name]);
                players[i].chips += pot;
                //add chips
            }
        }
        flop = [];
        turn = null;
        river = null;
        currect_deck = [];
        for (let i = 0; i < players.length; i++) {
            players[i].folded = false;
        }
        for (let z = 0; z < players.length; z++) {
            players[z].chipsInPot = 0;
        }
        pot = 0;
        raised_by = 0;
        make_preflop();
        current_pos = 0;
        boardState = 0;
        round();

    } else if (stillPlaying.length != current_pos) {
        for (let z = 0; z < players.length; z++) {
            if (stillPlaying[current_pos] === players[z].position) {
                io.to(players[z].socketid).emit("my_turn")
            }
        }
    } else {
        for (let z = 0; z < players.length; z++) {
            pot += players[z].chipsInPot;
        }
        for (let z = 0; z < players.length; z++) {
            players[z].chipsInPot = 0;
        }
        console.log("round over")
        console.log(current_pos);
        console.log(stillPlaying);

        raised_by = 0;
        current_pos = 0;
        if (boardState == 0) {
            make_flop();
        }
        if (boardState == 1) {
            make_turn();
        }
        if (boardState == 2) {
            make_river();
        }
        if (boardState == 3) {
            possible_winners = check_winner();
            console.log("GHGJJ")
            console.log(possible_winners);
            winners = [];
            for (let i = 0; i < possible_winners.length; i++) {
                console.log(players[possible_winners[i]].name)
                winners.push(players[possible_winners[i]].name);
            }
            console.log(winners);
            io.emit("winner", winners);
            pot = 0;
            flop = [];
            turn = null;
            river = null;
            currect_deck = [];
            for (let i = 0; i < players.length; i++) {
                players[i].folded = false;
            }
            make_preflop();
        }
        boardState = (boardState + 1) % 4;
        round();
    }
}

function make_preflop() {
    refill_deck();
    shuffle(deck);
    give_cards()
    send_cards()
}

function send_cards() {
    console.log(1)
    folded = [];
    stillPlaying = [];
    for (let i = 0; i < players.length; i++) {
        if (players[i].folded)
            folded.push(players[i].position)
        else
            stillPlaying.push(players[i].position)

    }
    // for (let i = 0; i < players.length; i++) {
    //     console.log("sent cards to: " + i)
    //     console.log(currect_deck)
    //     io.to(players[i].socketid).emit('send_cards', players[i].cards, folded, stillPlaying, currect_deck)
    //     check_hands(currect_deck.concat(players[i].cards), i)
    //     io.to(players[i].socketid).emit('player_profile', players[i].chips, players[i].winning_hand)
    // }
    for (let i = 0; i < users.length; i++) {
        temp = false;
        for (let z = 0; z < players.length; z++) {
            if (users[i] === players[z].socketid) {
                temp = true;
                io.to(players[z].socketid).emit('send_cards', players[z].cards, folded, stillPlaying, currect_deck)
                check_hands(currect_deck.concat(players[z].cards), z)
                io.to(players[z].socketid).emit('player_profile', players[z].chips, players[z].winning_hand)
            }
        }
        if (!temp) {
            io.to(users[i]).emit('send_cards', null, folded, stillPlaying, currect_deck);
        }
    }
}

function make_flop() {
    pick_flop();
    currect_deck = flop;
    send_cards()
}

function make_turn() {
    pick_turn();
    currect_deck = currect_deck.concat(turn);
    send_cards()
}

function make_river() {
    pick_river();
    currect_deck = currect_deck.concat(river);
    send_cards()
}
suits = ["D", "C", "S", "H"];
ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K", "A"];
deck = [];


flop = [];
turn = null;
river = null;
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

function refill_deck() {
    for (let i = 0; i < suits.length; i++) {
        for (let z = 0; z < ranks.length; z++) {
            temp = new CARD();
            temp.rank = ranks[z];
            temp.suit = suits[i];
            // console.log("z: " + z + " i: " + i)
            // console.log(temp.rank + "  " + temp.suit)
            deck[i * 13 + z] = temp;
        }
    }
}


function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}

function pick_flop() {
    for (let index = 0; index < 3; index++) {
        flop[index] = deck[0];
        deck.shift();
    }
}

function pick_turn() {
    turn = deck[0];
    deck.shift();
}

function pick_river() {
    river = deck[0];
    deck.shift();
}

function give_cards() {
    for (let i = 0; i < players.length; i++) {
        cards = [];
        cards[0] = deck[0];
        deck.shift();
        cards[1] = deck[0];
        deck.shift();
        console.log("Player " + i + " cards:")
        console.log(cards)
        players[i].cards = cards;
    }
}

function run_game() {

    for (let i = 0; i < 3; i++) {
        players[i] = new PLAYER();
        players[i].hand = [null, null, null, null, null, null, null, null, null, null];
    }

    refill_deck();
    shuffle(deck);
    //console.log(deck)
    //testing_deck = [];
    // for (let i = 0; i < 5; i++) { //straight flush Checker
    //     testing_deck.push(deck[i + 7]);
    // }
    // for (let i = 0; i < 3; i++) { //quads
    //     testing_deck.push(deck[i * 13 + 4]);
    // }
    // testing_deck.push(deck[1]);
    // for (let i = 0; i < 3; i++) { //full
    //     testing_deck.push(deck[i * 13 + 5]);
    // }
    // for (let i = 0; i < 2; i++) { //full
    //     testing_deck.push(deck[i * 13 + 1]);
    // }
    // for (let i = 0; i < 5; i++) { //flush
    //     console.log(deck[i * 2 + 26])
    //     testing_deck.push(deck[i * 2 + 26]);
    // }
    // for (let i = 0; i < 4; i++) { //straight 
    //     testing_deck.push(deck[i * 13 + i]);
    // }
    // for (let i = 0; i < 3; i++) { //3s
    //     testing_deck.push(deck[i * 13 + 5]);
    // }
    // testing_deck.push(deck[4]);
    // testing_deck.push(deck[8]);
    // for (let i = 0; i < 2; i++) { //2s
    //     testing_deck.push(deck[i * 13 + 5]);
    // }
    // for (let i = 0; i < 2; i++) {
    //     testing_deck.push(deck[i * 13 + 3]);
    // }
    // testing_deck.push(deck[8]);
    // for (let i = 0; i < 2; i++) { //1s
    //     testing_deck.push(deck[i * 13 + 5]);
    // }
    // testing_deck.push(deck[8]);
    // testing_deck.push(deck[10]);
    // testing_deck.push(deck[11]);
    // console.log("(((((")
    //console.log(testing_deck);
    //check_hands(testing_deck);
    give_cards();
    // for (let i = 0; i < players.length; i++) {
    //     check_hands(players[i].cards.concat(currect_deck), i);
    // }
    pick_flop();
    currect_deck = flop;
    console.log("flop:")
    console.log(flop)
        // for (let i = 0; i < players.length; i++) {
        //     check_hands(players[i].cards.concat(currect_deck), i);
        // }
    pick_turn();
    currect_deck = flop.concat(turn);
    console.log("turn:")
    console.log(currect_deck)
        // for (let i = 0; i < players.length; i++) {
        //     check_hands(players[i].cards.concat(currect_deck), i);
        // }
    pick_river();
    console.log("river:")
    console.log(currect_deck)
    currect_deck = currect_deck.concat(river);
    for (let i = 0; i < players.length; i++) {
        check_hands(players[i].cards.concat(currect_deck), i);
    }
    console.log(players[0].hand)
    console.log(players[1].hand)
    console.log(players[2].hand)

    check_winner();
}

function check_hands(cards, player) {
    sort_cards(cards);
    //console.log("???????????????")
    //console.log(cards);
    if (royalFlush(cards)) {
        console.log("POGGERS")
        players[player].winning_hand = "POGGERS";
        players[player].hand[0] = [1];
    } else if (staightFlush(cards)) {
        console.log("less poggers" + staightFlush(cards))
        players[player].winning_hand = "staightFlush";
        players[player].hand[1] = [staightFlush(cards)];
    } else if (quads(cards)) {
        console.log("Quads" + quads(cards))
        players[player].winning_hand = "quads";
        players[player].hand[2] = quads(cards);
    } else if (fullHouse(cards)) {
        console.log("fullHouse" + fullHouse(cards))
        players[player].winning_hand = "fullHouse";
        players[player].hand[3] = fullHouse(cards);
    } else if (flush(cards)) {
        console.log("Flush" + flush(cards))
        players[player].winning_hand = "flush";
        players[player].hand[4] = flush(cards);
    } else if (straight(cards)) {
        console.log("straight" + straight(cards))
        players[player].winning_hand = "straight";
        players[player].hand[5] = [straight(cards)];
    } else if (threeOfAKind(cards)) {
        console.log("threeOfAKind" + threeOfAKind(cards))
        players[player].winning_hand = "threeOfAKind";
        players[player].hand[6] = threeOfAKind(cards);
    } else if (twoPair(cards)) {
        console.log("twoPair" + twoPair(cards))
        players[player].winning_hand = "twoPair";
        players[player].hand[7] = twoPair(cards);
    } else if (onePair(cards)) {
        console.log("onePair" + onePair(cards))
        players[player].winning_hand = "onePair";
        players[player].hand[8] = onePair(cards);
    } else if (highCard(cards)) {
        console.log("highCard" + highCard(cards))
        players[player].winning_hand = "highCard";
        players[player].hand[9] = highCard(cards);
    } else {
        console.log("retard")
    }
}
possible_winners = [];

function check_winner() {
    best_hand = 10;
    for (let i = 0; i < players.length; i++) {
        for (let z = 0; z < players[i].hand.length; z++) {
            //console.log("Test: " + players[i].hand[z])
            if (players[i].hand[z] != null && z < best_hand && players[i].folded == false)
                best_hand = z;
        }
    }
    possible_winners = []
    for (let i = 0; i < players.length; i++) {
        if (players[i].hand[best_hand] != null) {
            possible_winners.push(i);
        }
    }

    if (possible_winners.length > 1) {
        for (let i = 0; i < players[possible_winners[0]].hand[best_hand].length; i++) {
            highest = 0;
            for (let z = 0; z < possible_winners.length; z++) {
                if (ranks.indexOf(players[possible_winners[z]].hand[best_hand][i]) > ranks.indexOf(players[possible_winners[highest]].hand[best_hand][i])) {
                    possible_winners.splice(highest, 1);
                    highest = z - 1;
                } else if (ranks.indexOf(players[possible_winners[z]].hand[best_hand][i]) === ranks.indexOf(players[possible_winners[highest]].hand[best_hand][i])) {

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
                if (temp != -1 && cards[i].rank != cards[x].rank) {
                    temp = cards[x].rank;
                }
            }
            temp2[0] = ranks.indexOf(cards[i].rank) + 2
            temp2[1] = temp;
            return temp2;
        }
    }
    return 0;
}

function fullHouse(cards) {
    if (twoPair(cards) && threeOfAKind(cards)) {
        temp4 = [];
        temp4[0] = threeOfAKind(cards)[0];
        if (twoPair(cards)[0] == temp4[0])
            temp4[1] = twoPair(cards)[1]
        else
            temp4[1] = twoPair(cards)[0]
        return temp4;
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