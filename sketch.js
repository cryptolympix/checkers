let BOARD_DIM = 800;

let AI_COLOR = '#DEB887';
let HUMAN_COLOR = '#8B0000';
let FOCUS_COLOR = '#6666';

let board = [];
let pieces = []; // The current pieces in the board
let players = { HUMAN: 'human', AI: 'ai' };
let currentPlayer;
let pieceSelected = null;

function setup() {
  createCanvas(BOARD_DIM, BOARD_DIM);
  initBoard();
  currentPlayer = players.HUMAN;
}

function initBoard() {
  board = new Array(8);
  for (let i = 0; i < 8; i++) {
    board[i] = new Array(8);
  }
  for (let j = 0; j < 8; j++) {
    for (let i = 0; i < 8; i++) {
      // Only on the black cases
      if (i % 2 === j % 2) {
        // AI at the top
        if (j < 3) {
          let p = { i, j, color: AI_COLOR, player: players.AI };
          pieces.push(p);
          board[i][j] = p;
        }
        // Player at the bottom
        if (j > 4) {
          let p = { i, j, color: HUMAN_COLOR, player: players.HUMAN };
          pieces.push(p);
          board[i][j] = p;
        }
      }
    }
  }
}

function draw() {
  background(255);
  drawBoard();
  drawPieces();

  if (pieceSelected) {
    let dim = BOARD_DIM / 8;
    fill(FOCUS_COLOR);
    rect(pieceSelected.i * dim, pieceSelected.j * dim, dim, dim);

    // To debug the moves
    let moves = getAvailableMoves(pieceSelected);
    for (let m of moves) {
      fill('green');
      rect(m.i * dim, m.j * dim, dim, dim);
    }
  }
}

function drawBoard() {
  let dim = BOARD_DIM / 8;
  for (let j = 0; j < 8; j++) {
    for (let i = 0; i < 8; i++) {
      fill(i % 2 === j % 2 ? 'black' : 'white');
      rect(i * dim, j * dim, dim, dim);
    }
  }
}

function drawPieces() {
  let dim = BOARD_DIM / 8;
  for (let p of pieces) {
    let centerX = p.i * dim + dim / 2;
    let centerY = p.j * dim + dim / 2;
    fill(p.color);
    circle(centerX, centerY, (5 * dim) / 6);
  }
}

function mouseReleased() {
  if (mouseX < 0 || mouseX > BOARD_DIM || mouseY < 0 || mouseY > BOARD_DIM) return;

  let dim = BOARD_DIM / 8;
  if (currentPlayer === players.HUMAN) {
    let i = floor(mouseX / dim);
    let j = floor(mouseY / dim);
    // If we don't have selected a piece to move
    if (!pieceSelected && board[i][j]) {
      pieceSelected = board[i][j];
    }
    // If we have selected a piece and press on a free case
    if (pieceSelected && !board[i][j]) {
      movePiece(pieceSelected, i, j);
      pieceSelected = null;
    }
    // If we change the selected piece to move
    if (pieceSelected && board[i][j]) {
      let player = board[i][j].player;
      if (player === players.HUMAN) {
        pieceSelected = board[i][j];
      }
    }
  }
}

function movePiece(piece, i, j) {
  let moves = getAvailableMoves(piece);
  let isAvailableMove = moves.some((m) => m.i == i && m.j == j);
  if (isAvailableMove) {
    board[piece.i][piece.j] = null;
    board[i][j] = piece;
    piece.i = i;
    piece.j = j;
  }
}

function getAvailableMoves(piece) {
  let basicMoves = getBasicMoves(piece);
  let jumpMoves = getJumpMoves(piece);
  return basicMoves.concat(jumpMoves);
}

// Get the moves to a next dark square
function getBasicMoves(p) {
  let moves = [];

  // The moves are down of the piece
  if (p.player === players.AI) {
    if (p.i - 1 >= 0 && p.j + 1 < 8 && !board[p.i - 1][p.j + 1])
      moves.push({ i: p.i - 1, j: p.j + 1, weight: 0 });
    if (p.i + 1 < 8 && p.j + 1 < 8 && !board[p.i + 1][p.j + 1])
      moves.push({ i: p.i + 1, j: p.j + 1 });
  }
  // The moves are up of the piece
  else {
    if (p.i - 1 >= 0 && p.j - 1 >= 0 && !board[p.i - 1][p.j - 1])
      moves.push({ i: p.i - 1, j: p.j - 1, weight: 0 });
    if (p.i + 1 < 8 && p.j - 1 >= 0 && !board[p.i + 1][p.j - 1])
      moves.push({ i: p.i + 1, j: p.j - 1, weight: 0 });
  }

  return moves;
}

// Get the moves jumping other opponent's pieces
function getJumpMoves(piece) {
  let moves = [];

  // Verify if the move is always in the array of moves
  function isAlreadyVisited(i, j) {
    return moves.some((m) => m.i === i && m.j === j);
  }

  // Check if the square with the position (i, j) is on the board
  function isOnTheBoard(i, j) {
    return i >= 0 && i < 8 && j >= 0 && j < 8;
  }

  // Recursive function to search the jumping moves
  function searchMoves(col, row, weight) {
    // Get the next black squares
    for (let j = row - 1; j <= row + 1; j += 2) {
      for (let i = col - 1; i <= col + 1; i += 2) {
        // If the square is in the board
        if (isOnTheBoard(i, j)) {
          // If the next square is not empty and the piece placed on
          // it belongs to the opponent
          if (board[i][j] && board[i][j].player !== piece.player) {
            let di = i - col;
            let dj = j - row;
            let destCol = col + 2 * di;
            let destRow = row + 2 * dj;
            // The destination square must be on the board
            if (isOnTheBoard(destCol, destRow)) {
              // If the destination square is empty and does not have been visited yet
              // (prevent to get the moves twice in the array of moves)
              if (!board[destCol][destRow] && !isAlreadyVisited(destCol, destRow)) {
                moves.push({ i: destCol, j: destRow, weight: weight + 1 });
                searchMoves(destCol, destRow, weight + 1);
              }
            }
          }
        }
      }
    }
  }

  searchMoves(piece.i, piece.j, 0);
  return moves;
}

function checkWinner() {
  let winner = null;
  let pieceCount = [0, 0];

  for (let p of pieces) {
    if (p.player === players.HUMAN) pieceCount[0]++;
    if (p.player === players.AI) pieceCount[1]++;
  }

  if (pieceCount[0] === 0) winner = players.AI;
  if (pieceCount[1] === 0) winner = players.HUMAN;
  return winner;
}
