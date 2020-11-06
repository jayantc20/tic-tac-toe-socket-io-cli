const server = require('http').createServer();
const io = require('socket.io')(server);
server.listen(5050, () => {
  console.log('Listening on 5050');
});

let players = {}, unmatched;

//Initialize Tic-tac-Toe Game board
let board = {
  1: ' ',
  2: ' ',
  3: ' ',
  4: ' ',
  5: ' ',
  6: ' ',
  7: ' ',
  8: ' ',
  9: ' '
};

function joinGame(socket) {
  // Add the player to our object of players
  players[socket.id] = {

    // The opponent will either be the socket that is
    // currently unmatched, or it will be null if no
    // players are unmatched
    opponent: unmatched,

    // The symbol will become 'O' if the player is unmatched
    symbol: 'X',

    // The socket that is associated with this player
    socket: socket
  };

  // Every other player is marked as 'unmatched', which means
  // there is no another player to pair them with yet. As soon
  // as the next socket joins, the unmatched player is paired with
  // the new socket and the unmatched variable is set back to null
  if (unmatched) {
    players[socket.id].symbol = 'O';
    players[unmatched].opponent = socket.id;
    unmatched = null;
  } else {
    unmatched = socket.id;
  }
}

// Returns the opponent socket
function getOpponent(socket) {
  if (!players[socket.id].opponent) {
    return;
  }
  return players[
    players[socket.id].opponent
  ].socket;
}

function getOpponentSymbol(symbol) {
  if (symbol === 'X') {
    return 'O';
  } else {
    return 'X';
  }
}

function emptyBoard() {
  board = {
    1: ' ',
    2: ' ',
    3: ' ',
    4: ' ',
    5: ' ',
    6: ' ',
    7: ' ',
    8: ' ',
    9: ' '
  };
}

io.on('connection', function (socket) {
  console.log("Connection established...", socket.id);
  joinGame(socket);

  // Once the socket has an opponent, we can begin the game
  if (getOpponent(socket)) {
    socket.emit('game.begin', {
      symbol: players[socket.id].symbol
    });
    getOpponent(socket).emit('game.begin', {
      symbol: players[getOpponent(socket).id].symbol
    });
  }
  else {
    socket.emit('game.wait');
    console.log("Waiting for other player to join the game....");
  }

  // Listens for a move to be made and emits an event to both
  // players after the move is completed
  socket.on('make.move', function (data) {
    //Checking if games is ended by any player or not
    if (data.endFlag) {
      //Emit the Game Resigned Message to Clients
      socket.emit('move.made', {
        board,
        msg: `Game Resigned by You. \nGame Won By ${getOpponentSymbol(data.symbol)} player.`,
        endFlag: true
      });
      getOpponent(socket).emit('move.made', {
        board,
        msg: `Game Resigned by ${data.symbol}. \nGame Won By ${getOpponentSymbol(data.symbol)} player.`,
        endFlag: true
      });
      emptyBoard();
      return;
    }
    //Checking Validation of input from player
    if (validateMove(data.position) === true) {
      board[data.position] = data.symbol;
      //Checking The Winner
      if (checkWin(data.symbol) === true) {
        console.log('Winner Winner!');
        //Emit the Game Won Message to Clients
        socket.emit('move.made', { board, msg: `Game Won By ${data.symbol} player.`, endFlag: true });
        getOpponent(socket).emit('move.made', { board, msg: `Game Won By ${data.symbol} player.`, endFlag: true });
        emptyBoard()
        return;
      }
      //Checking The Game Tie
      if (checkTie() === true) {
        console.log('Tie Game');
        //Emit the Game Tie Message to Clients
        socket.emit('move.made', { board, msg: 'Game Tie', endFlag: true });
        getOpponent(socket).emit('move.made', { board, msg: 'Game Tie', endFlag: true });
        emptyBoard()
        return;
      }
      socket.emit('move.made', { board, symbol: data.symbol, turn: false, endFlag: false });
      console.log("Move made by : ", data);
      if (!getOpponent(socket)) {
        return;
      }
      if (data.symbol === 'X') {
        getOpponent(socket).emit('move.made', { board, symbol: 'O', turn: true, endFlag: false });
      } else {
        getOpponent(socket).emit('move.made', { board, symbol: 'X', turn: true, endFlag: false });
      }
    }
    //Emit the Incorrect input Message to Client
    else {
      console.log('Incorrect input please try again...');
      socket.emit('move.made', {
        board,
        msg: 'Incorrect input please try again...',
        symbol: data.symbol,
        turn: true,
        endFlag: false
      });
    }
  });

  // Emit an event to the opponent when the player leaves
  socket.on('disconnect', function () {
    if (getOpponent(socket)) {
      getOpponent(socket).emit('opponent.left');
    }
  });
});

//Initialize the Win Combinations
var winCombinations = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 4, 7],
[2, 5, 8], [3, 6, 9], [1, 5, 9], [3, 5, 7]];

function isInt(value) {
  var x;
  if (isNaN(value)) {
    return false;
  }
  x = parseFloat(value);
  return (x | 0) === x;
}

//This method will ensure the correct input from players
function validateMove(position) {
  return (isInt(position) && board[position] === ' ')
}

// Determines if the passed in player has three in a row
function checkWin(player) {
  let i, j, markCount
  for (i = 0; i < winCombinations.length; i++) {
    markCount = 0;
    for (j = 0; j < winCombinations[i].length; j++) {
      if (board[winCombinations[i][j]] === player) {
        markCount++;
      }
      if (markCount === 3) {
        return true;
      }
    }
  }
  return false;
}

//Determines if the Game is Tie
function checkTie() {
  for (let i = 1; i <= Object.keys(board).length; i++) {
    if (board[i] === ' ') {
      return false;
    }
  }
  return true;
}
