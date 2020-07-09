let BOARD_DIM = 800;

let DEBUG = true;

let kingImg;
let countView;

let board;
let pieces = []; // The current pieces in the board
let players = { HUMAN: 'human', AI: 'ai' };
let currentPlayer;

let pieceSelected = null;
let requiredMoves = [];

function preload() {
  kingImg = loadImage('assets/crown.png');
}

function setup() {
  countView = createP();
  createCanvas(BOARD_DIM, BOARD_DIM);
  board = new Board(BOARD_DIM, 10);
  currentPlayer = players.HUMAN;
}

function draw() {
  background(255);
  drawCountInfo();
  board.draw();

  // Display the required moves
  let dim = board.squareDim;
  for (let move of requiredMoves) {
    fill('orange');
    rect(move.to.col * dim, move.to.row * dim, dim, dim);
  }
}

function drawCountInfo() {
  countView.html(
    `Human : ${board.getNumberOfPieces(players.HUMAN)}<br/>AI : ${board.getNumberOfPieces(
      players.AI
    )}`
  );
  countView.style('font-family', 'Nunito');
  countView.style('width', `${BOARD_DIM}px`);
}

function mouseReleased() {
  if (mouseX < 0 || mouseX > board.pixelDim || mouseY < 0 || mouseY > board.pixelDim)
    return;

  /**
   * Find a mose specifying a destination
   * @param {Number} toCol - The column of the destination
   * @param {Number} toRow - The row of the destination
   * @param {Number} moves - An array of moves
   */
  function findMove(toCol, toRow, moves) {
    for (let move of moves) {
      if (move.to.col === toCol && move.to.row === toRow) {
        return move;
      }
    }
  }

  /**
   * Get the jumping moves for a player
   */
  function getJumpingMoves() {
    let result = [];
    for (let piece of board.getAllPieces(players.HUMAN)) {
      let moves = piece.getAvailableMoves();
      for (let move of moves) {
        if (move.isJumpingMove()) result.push(move);
      }
    }
    return result;
  }

  /**
   * Return true if the player can play a jumping move
   */
  function canPlayJumpingMove() {
    return getJumpingMoves().length > 0;
  }

  if (currentPlayer === players.HUMAN) {
    let i = floor(mouseX / board.squareDim);
    let j = floor(mouseY / board.squareDim);

    requiredMoves = [];

    if (board.hasPiece(i, j)) {
      // If we don't have selected a piece to move
      if (!pieceSelected) {
        if (board.getPiece(i, j).player === players.HUMAN)
          pieceSelected = board.getPiece(i, j);
      }
      // If we change the selected piece to move
      else {
        let piece = board.getPiece(i, j);
        if (piece.player === players.HUMAN) {
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
        setTimeout(function () {
          currentPlayer = players.AI;
          AI();
        }, 500);
      } else {
        // If the player wants to play a basic move but a jumping move
        // is available, he must plays it instead of the basic one.
        if (canPlayJumpingMove()) {
          // Add the jumping moves to the required moves
          for (let move of getJumpingMoves()) {
            if (move.isJumpingMove()) {
              requiredMoves.push(move);
            }
          }
        } else {
          board.movePiece(pieceSelected, i, j);
          pieceSelected = null;
          setTimeout(function () {
            currentPlayer = players.AI;
            AI();
          }, 500);
        }
      }
    }
  }
}

function AI() {
  /**
   * Check if the player can play
   * @param {String} player
   */
  function hasAvailableMove(player) {
    let total = 0;
    let pieces = board.getAllPieces(player);
    for (let piece of pieces) {
      total += piece.getAvailableMoves().length;
    }
    return total > 0;
  }

  if (currentPlayer === players.AI) {
    let bestMove = getBestMove();
    if (bestMove) {
      let pieceToMove = board.getPiece(bestMove.from.col, bestMove.from.row);
      board.movePiece(pieceToMove, bestMove.to.col, bestMove.to.row);
      if (hasAvailableMove(players.HUMAN)) {
        currentPlayer = players.HUMAN;
      }
    }
    // Ai cannot plays anymore because there are no available moves
    else {
    }
  }
}

function checkWinner() {
  let winner = null;
  let piecePlayerCount = [0, 0];

  for (let p of board.getAllPieces()) {
    if (p.player === players.HUMAN) piecePlayerCount[0]++;
    if (p.player === players.AI) piecePlayerCount[1]++;
  }

  if (piecePlayerCount[0] === 0) winner = players.AI;
  if (piecePlayerCount[1] === 0) winner = players.HUMAN;
  return winner;
}
