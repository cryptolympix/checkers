/**
 * Init a board
 * @returns a board
 */
function initBoard(numCol) {
  let board = new Array(numCol);
  for (let i = 0; i < numCol; i++) {
    board[i] = new Array(numCol);
  }

  for (let j = 0; j < numCol; j++) {
    for (let i = 0; i < numCol; i++) {
      // Only on the black cases
      if (i % 2 === j % 2) {
        // AI at the top
        if (j < numCol / 2 - floor(numCol / 15) - 1) {
          board[i][j] = new Piece(i, j, players.AI);
        }
        // Player at the bottom
        if (j > numCol / 2 + floor(numCol / 15)) {
          board[i][j] = new Piece(i, j, players.HUMAN);
        }
      }
    }
  }

  return board;
}

/**
 * Draw the board
 */
function drawBoard() {
  // Draw the board
  let dim = BOARD_SQUARE_DIM;
  for (let j = 0; j < BOARD_NUM_COL; j++) {
    for (let i = 0; i < BOARD_NUM_COL; i++) {
      fill(i % 2 === j % 2 ? DARK_SQUARE_COLOR : LIGHT_SQUARE_COLOR);
      rect(i * dim, j * dim, dim, dim);
    }
  }

  // Draw the pieces
  for (let j = 0; j < BOARD_NUM_COL; j++) {
    for (let i = 0; i < BOARD_NUM_COL; i++) {
      if (board[i][j]) {
        drawPiece(board[i][j]);
      }
    }
  }

  // Display the required moves
  for (let move of requiredMoves) {
    fill('orange');
    rect(move.to.col * dim, move.to.row * dim, dim, dim);
  }
}

/**
 * Get all the pieces on the board. If a player is specifying, return all
 * the pieces of this player.
 * @param {String} player - One of the player (human or ai)
 * @param {Array<Array>} b - A board (by default the displayed board)
 */
function getAllPieces(player, b = board) {
  let result = [];
  for (let j = 0; j < BOARD_NUM_COL; j++) {
    for (let i = 0; i < BOARD_NUM_COL; i++) {
      if (b[i][j]) {
        if (player && b[i][j].player !== player) {
          continue;
        }
        result.push(b[i][j]);
      }
    }
  }
  return result;
}

/**
 * Get the number of pieces
 * @param {String} player - The player to count the pieces
 * @param {Array<Array>} b - A board (by default the displayed board)
 */
function getNumberOfPieces(player, b = board) {
  return getAllPieces(player, b).length;
}

/**
 * Get the initial number of pieces on the board
 */
function getNumberOfInitialPieces() {
  return (BOARD_NUM_COL / 2 - floor(BOARD_NUM_COL / 15) - 1) * BOARD_NUM_COL;
}

/**
 * Check if the tab of the board contains a square with the colum and the row given
 * @param {Number} col - The column of a square
 * @param {Number} row - The row of a square
 */
function contains(col, row) {
  return col >= 0 && col < BOARD_NUM_COL && row >= 0 && row < BOARD_NUM_COL;
}

/**
 * Check if the given row if the king row for the player
 * @param {Number} row - The row to check
 * @param {String} player - A player
 */
function isKingRow(row, player) {
  if (player === players.HUMAN) {
    return row === 0;
  } else {
    return row === BOARD_NUM_COL - 1;
  }
}
