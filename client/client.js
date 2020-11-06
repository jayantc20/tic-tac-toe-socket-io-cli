const rc = require('readcommand');
const io = require('socket.io-client');

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
  if (key.name === 'r') {
    socket.emit('make.move', {
      symbol,
      endFlag: true
    });
  }
});


const socket = io.connect(process.argv.slice(2)[0]);
let myTurn = true, symbol;
// Set up the initial state when the game begins
// This method is called from the server
socket.on('game.begin', function (data) {
  // The server will assign X or O to the player
  console.log('Symbol Assigned ' + data.symbol);
  symbol = data.symbol;

  // Give X the first turn
  myTurn = (data.symbol === 'X');

  //This method will print which player Turn it is. 
  renderTurnMessage(symbol);
});

socket.on('game.wait', function (data) {
  console.log('Waiting for other player to join the game....');
});


// This method is called from the server
socket.on('move.made', function (data) {
  printBoard(data.board);
  if (data.endFlag) {
    console.log(data.msg);
    console.log('Exiting the game.....');
    process.exit();
    return;
  }
  if (data.turn === true) {
    if (data.msg !== undefined) {
      console.log(data.msg);
    }
    playTurn(data.symbol);
  }
});

function markBoard(position, symbol) {
  // Emit the move to the server
  socket.emit('make.move', {
    symbol,
    position,
    endGame: false
  });
}


//To show message for which player turn is after every move
function renderTurnMessage(symbol, position) {
  //Checking the condition for myTurn is true or not
  if (!myTurn) {
    console.log("Opponents Turn")
  } else {
    console.log("Your Turn");
    //This method will take input from player
    playTurn(symbol);
  }
}

//To print the tic-tac-toe game board on CLI
function printBoard(board) {
  console.log('\n' +
    ' ' + board[1] + ' | ' + board[2] + ' | ' + board[3] + '\n' +
    ' ---------\n' +
    ' ' + board[4] + ' | ' + board[5] + ' | ' + board[6] + '\n' +
    ' ---------\n' +
    ' ' + board[7] + ' | ' + board[8] + ' | ' + board[9] + '\n');
}

function playTurn(player) {
  console.log('Your turn player: ', player);
  rc.read((err, args) => {
    //This method will emit position and symbol to the server.
    markBoard(args[0], player);
  });
}
