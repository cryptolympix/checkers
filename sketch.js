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
  if (mouseX < 0 || mouseX > board.pixelDim || mouseY < 0 || mouseY > board.pixelDim)
    return;

  function findMove(toCol, toRow, moves) {
    for (let move of moves) {
      if (move.to.col === toCol && move.to.row === toRow) {
        return move;
      }
    }
  }

  /**
   * Check if the moves contain at least one jumping move
   * @param {Array<Move>} moves - An array of moves
   */
  function containsJumpingMove(moves) {
    for (let move of moves) {
      if (move.isJumpingMove()) return true;
    }
    return false;
  }

  /**
   * Return true if the player can play a jumping move
   */
  function canPlayJumpingMove(player) {
    let moves = [];
    for (let piece of board.getAllPieces()) {
      if (piece.player === player) {
        moves = moves.concat(piece.getAvailableMoves());
      }
    }
    return containsJumpingMove(moves);
  }

  if (currentPlayer === players.HUMAN) {
    let i = floor(mouseX / board.squareDim);
    let j = floor(mouseY / board.squareDim);

    if (board.hasPiece(i, j)) {
      // If we don't have selected a piece to move
      if (!pieceSelected) {
        pieceSelected = board.getPiece(i, j);
      }
      // If we change the selected piece to move
      else {
        let piece = board.getPiece(i, j);
        let player = piece.player;
        if (player === players.HUMAN) {
          pieceSelected = board.getPiece(i, j);
        } else {
          pieceSelected = null;
        }
      }
    }
    // If we have selected a piece and press on a free case
    else if (pieceSelected) {
      let moves = pieceSelected.getAvailableMoves();
      let wishedMove = findMove(i, j, moves);

      if (!wishedMove) {
        pieceSelected = null;
        return;
      }

      if (wishedMove.isJumpingMove()) {
        board.movePiece(pieceSelected, i, j);
        pieceSelected = null;
      } else {
        // If the player wants to play a basic move but a jumping move
        // is available, he must plays it instead of the basic one.
        if (canPlayJumpingMove(players.HUMAN)) {
          // Display that a jumping move is required
          console.log('You must plays the jumping move !');
        } else {
          board.movePiece(pieceSelected, i, j);
          pieceSelected = null;
        }
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
