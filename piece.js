let AI_COLOR = '#DEB887';
let HUMAN_COLOR = '#8B0000';
let FOCUS_COLOR = '#6666';

class Piece {
  constructor(col, row, player) {
    this._col = col;
    this._row = row;
    this._player = player;
    this._color = player === players.AI ? AI_COLOR : HUMAN_COLOR;
  }

  draw() {
    let dim = board._pixelDim / board.numCol;
    let centerX = this._col * dim + dim / 2;
    let centerY = this._row * dim + dim / 2;
    fill(this._color);
    circle(centerX, centerY, (5 * dim) / 6);

    if (this === pieceSelected) {
      fill(FOCUS_COLOR);
      rect(this._col * dim, this._row * dim, dim, dim);

      // To debug the moves
      let moves = this.getAvailableMoves();
      for (let move of moves) {
        fill('green');
        rect(move.to.col * dim, move.to.row * dim, dim, dim);
      }
    }
  }

  /**
   * Get all the possible moves from the piece
   */
  getAvailableMoves() {
    let basicMoves = this.getBasicMoves();
    let jumpMoves = this.getJumpMoves();
    return basicMoves.concat(jumpMoves);
  }

  /**
   * Get the moves to a next dark square
   */
  getBasicMoves() {
    let moves = [];
    let col = this._col;
    let row = this._row;
    let from = { col, row };

    // The moves are down of the piece
    if (this._player === players.AI) {
      if (col - 1 >= 0 && row + 1 < board._numCol && !board.hasPiece(col - 1, row + 1)) {
        let to = { col: col - 1, row: row + 1 };
        let move = new Move(from, to, 0, null);
        moves.push(move);
      }
      if (col + 1 < 8 && row + 1 < board._numCol && !board.hasPiece(col + 1, row + 1)) {
        let to = { col: col + 1, row: row + 1 };
        let move = new Move(from, to, 0, null);
        moves.push(move);
      }
    }
    // The moves are up of the piece
    else {
      if (col - 1 >= 0 && row - 1 >= 0 && !board.hasPiece(col - 1, row - 1)) {
        let to = { col: col - 1, row: row - 1 };
        let move = new Move(from, to, 0, null);
        moves.push(move);
      }
      if (col + 1 < board._numCol && row - 1 >= 0 && !board.hasPiece(col + 1, row - 1)) {
        let to = { col: col + 1, row: row - 1 };
        let move = new Move(from, to, 0, null);
        moves.push(move);
      }
    }

    return moves;
  }

  /**
   * Get the moves jumping other opponent's pieces
   */
  getJumpMoves() {
    let moves = [];
    let instance = this;

    // Verify if the move is always in the array of moves
    function isAlreadyVisited(col, row) {
      return moves.some((m) => m.to.col === col && m.to.row === row);
    }

    // Recursive function to search the jumping moves
    function searchMoves(col, row, weight, prevMove) {
      // Get the next black squares
      for (let j = row - 1; j <= row + 1; j += 2) {
        for (let i = col - 1; i <= col + 1; i += 2) {
          // If the square is in the board
          if (board.contains(i, j)) {
            // If the next square is not empty and the piece placed on
            // it belongs to the opponent
            if (
              board.hasPiece(i, j) &&
              board.getPiece(i, j).player !== instance._player
            ) {
              let di = i - col;
              let dj = j - row;
              let destCol = col + 2 * di;
              let destRow = row + 2 * dj;
              // The destination square must be on the board
              if (board.contains(destCol, destRow)) {
                // If the destination square is empty and does not have been visited yet
                // (prevent to get the moves twice in the array of moves)
                if (
                  !board.hasPiece(destCol, destRow) &&
                  !isAlreadyVisited(destCol, destRow)
                ) {
                  let move = new Move(
                    { col, row }, // from
                    { col: destCol, row: destRow }, // to
                    weight + 1,
                    prevMove
                  );
                  moves.push(move);
                  searchMoves(destCol, destRow, weight + 1, move);
                }
              }
            }
          }
        }
      }
    }

    searchMoves(this._col, this._row, 0, null);
    return moves;
  }

  get col() {
    return this._col;
  }

  set col(col) {
    this._col = col;
  }

  get row() {
    return this._row;
  }

  set row(row) {
    this._row = row;
  }

  get player() {
    return this._player;
  }

  set player(player) {
    this._player = player;
  }
}
