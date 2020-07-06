let CANVAS_WIDTH = 1200;
let CANVAS_HEIGHT = 1000;
let BOARD_DIM = 800;

let board;
let pieces = []; // The current pieces in the board
let players = { HUMAN: 'human', AI: 'ai' };
let currentPlayer;
let pieceSelected = null;

function setup() {
  createCanvas(BOARD_DIM, BOARD_DIM);
  board = new Board(BOARD_DIM, 8);
  currentPlayer = players.HUMAN;
}

function draw() {
  background(255);
  board.draw();
}

function mouseReleased() {
  if (mouseX < 0 || mouseX > BOARD_DIM || mouseY < 0 || mouseY > BOARD_DIM) return;

  if (currentPlayer === players.HUMAN) {
    let i = floor(mouseX / board.squareDim);
    let j = floor(mouseY / board.squareDim);
    // If we don't have selected a piece to move
    if (!pieceSelected && board.hasPiece(i, j)) {
      pieceSelected = board.getPiece(i, j);
    }
    // If we have selected a piece and press on a free case
    if (pieceSelected && !board.hasPiece(i, j)) {
      board.movePiece(pieceSelected, i, j);
      pieceSelected = null;
    }
    // If we change the selected piece to move
    if (pieceSelected && board.hasPiece(i, j)) {
      let piece = board.getPiece(i, j);
      let player = piece.player;
      if (player === players.HUMAN) {
        pieceSelected = board.getPiece(i, j);
      }
    }
  }
}

function checkWinner() {
  let winner = null;
  let pieceCount = [0, 0];

  for (let p of board.getAllPieces()) {
    if (p.player === players.HUMAN) pieceCount[0]++;
    if (p.player === players.AI) pieceCount[1]++;
  }

  if (pieceCount[0] === 0) winner = players.AI;
  if (pieceCount[1] === 0) winner = players.HUMAN;
  return winner;
}
