let AI_COLOR = '#DEB887';
let HUMAN_COLOR = '#8B0000';
let FOCUS_COLOR = '#6666';

class Piece {
  constructor(col, row, player) {
    this._col = col;
    this._row = row;
    this._player = player;
    this._color = player === players.AI ? AI_COLOR : HUMAN_COLOR;
    this._isKing = false;
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

    if (this._isKing) {
      let imageDim = dim / 2;
      tint(0, 100); // Set transparency
      image(kingImg, centerX - imageDim / 2, centerY - imageDim / 2, imageDim, imageDim);
    }
  }

  /**
   * Get all the possible moves from the piece
   */
  getAvailableMoves() {
    if (!this._isKing) {
      let basicMoves = this.getBasicMoves();
      let jumpMoves = this.getJumpMoves();
      return basicMoves.concat(jumpMoves);
    } else {
      let basicMoves = this.getKingBasicMoves();
      let jumpMoves = this.getKingJumpMoves();
      return basicMoves.concat(jumpMoves);
    }
  }

  /**
   * Get the moves to a next dark square
   */
  getBasicMoves() {
    let moves = [];
    let col = this._col;
    let row = this._row;
    let from = { col, row };
    let translations = [];

    // The moves are down of the piece
    if (this._player === players.AI) {
      translations.push({ col: -1, row: +1 });
      translations.push({ col: +1, row: +1 });
    }
    // The moves are up of the piece
    else {
      translations.push({ col: -1, row: -1 });
      translations.push({ col: +1, row: -1 });
    }

    for (let t of translations) {
      if (
        col + t.col >= 0 &&
        col + t.col < board.numCol &&
        row + t.row >= 0 &&
        row + t.row < board.numCol &&
        !board.hasPiece(col + t.col, row + t.row)
      ) {
        let to = { col: col + t.col, row: row + t.row };
        let move = new Move(from, to, 0, null, null);
        moves.push(move);
      }
    }

    return moves;
  }

  /**
   * Get the moves jumping other opponent's pieces in every direction (recursive move)
   */
  getJumpMoves() {
    let moves = [];
    let instance = this;
    let directions = [
      { col: -1, row: -1 },
      { col: 1, row: -1 },
      { col: -1, row: 1 },
      { col: 1, row: 1 },
    ];

    // Verify if the move is always in the array of moves
    function isAlreadyVisited(col, row) {
      return moves.some((m) => m.to.col === col && m.to.row === row);
    }

    // Recursive function to search the jumping moves
    function searchMoves(col, row, weight, prevMove) {
      for (let d of directions) {
        let i = col + d.col;
        let j = row + d.row;
        // If the square is in the board
        if (board.contains(i, j)) {
          // If the next square is not empty and the piece placed on
          // it belongs to the opponent
          if (board.hasPiece(i, j) && board.getPiece(i, j).player !== instance._player) {
            let di = i - col;
            let dj = j - row;
            let destCol = col + 2 * di;
            let destRow = row + 2 * dj;
            let jumpedPiece = board.getPiece(i, j);
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
                  jumpedPiece,
                  prevMove
                );
                moves.push(move);
                searchMoves(destCol, destRow, weight + 1, move);
              }
            }
          }
        }
      }

      // Get the next black squares
      for (let j = row - 1; j <= row + 1; j += 2) {
        for (let i = col - 1; i <= col + 1; i += 2) {}
      }
    }

    searchMoves(this._col, this._row, 0, null);
    return moves;
  }

  /**
   * Get the basic move for a king : on diagonals in every direction until another piece
   */
  getKingBasicMoves() {
    let moves = [];
    let directions = [
      { col: -1, row: -1 },
      { col: +1, row: -1 },
      { col: -1, row: +1 },
      { col: +1, row: +1 },
    ];

    for (let d of directions) {
      let col = this._col + d.col;
      let row = this._row + d.row;
      while (board.contains(col, row) && !board.hasPiece(col, row)) {
        let move = new Move(
          { col: this._col, row: this._row },
          { col, row },
          0,
          null,
          null
        );
        moves.push(move);
        col += d.col;
        row += d.row;
      }
    }

    return moves;
  }

  /**
   * Get the jump move for a king : basic king move + jump move (recursive move)
   */
  getKingJumpMoves() {
    let moves = [];
    let instance = this;
    let directions = [
      { col: -1, row: -1 },
      { col: 1, row: -1 },
      { col: -1, row: 1 },
      { col: 1, row: 1 },
    ];
    let slideSquares = []; // Where the king slided to make jump moves

    // Verify if the move is always in the array of moves
    function isAlreadyVisited(col, row) {
      return moves.some((m) => m.to.col === col && m.to.row === row);
    }

    // Verify if the square is a square where the king slided on
    function isSlideSquare(col, row) {
      return slideSquares.some((s) => s.col === col && s.row === row);
    }

    // Recursive function to search the jumping moves
    function searchMoves(col, row, weight, prevMove) {
      for (let d of directions) {
        // We slide until the farther square that could be reach by a basic move on the same diagonale
        let i = col + d.col;
        let j = row + d.row;
        while (board.contains(i, j) && !board.hasPiece(i, j)) {
          slideSquares.push({ col: i, row: j });
          i += d.col;
          j += d.row;
        }

        // If the square is in the board
        if (board.contains(i, j)) {
          // If the square is not empty and the piece placed on it belongs to the opponent
          if (board.hasPiece(i, j) && board.getPiece(i, j).player !== instance._player) {
            let destCol = i + d.col;
            let destRow = j + d.row;
            let jumpedPiece = board.getPiece(i, j);
            // The destination square must be on the board
            if (board.contains(destCol, destRow)) {
              // If the destination square is empty and does not have been visited yet
              // (prevent to get the moves twice in the array of moves)
              if (
                !board.hasPiece(destCol, destRow) &&
                !isAlreadyVisited(destCol, destRow) &&
                !isSlideSquare(destCol, destRow)
              ) {
                let move = new Move(
                  { col, row }, // from
                  { col: destCol, row: destRow }, // to
                  weight + 1,
                  jumpedPiece,
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

  get isKing() {
    return this._isKing;
  }

  set isKing(king) {
    this._isKing = king;
  }
}
