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
      if (DEBUG) {
        let moves = this.getAvailableMoves();
        for (let move of moves) {
          fill('green');
          rect(move.to.col * dim, move.to.row * dim, dim, dim);

          fill('white');
          textFont('Roboto');
          textSize(18);
          textAlign(CENTER);
          text(move.weight, move.to.col * dim + dim / 2, move.to.row * dim + dim / 2);
        }
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
   * @param {Board} b - A board (by default the displayed board)
   */
  getAvailableMoves(b = board) {
    if (!this._isKing) {
      let basicMoves = this.getBasicMoves(b);
      let jumpMoves = this.getJumpMoves(b);
      return basicMoves.concat(jumpMoves);
    } else {
      let basicMoves = this.getKingBasicMoves(b);
      let jumpMoves = this.getKingJumpMoves(b);
      return basicMoves.concat(jumpMoves);
    }
  }

  /**
   * Get the moves to a next dark square
   * @param {Board} b - A board  (by default the displayed board)
   */
  getBasicMoves(b = board) {
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
    if (this._player === players.HUMAN) {
      translations.push({ col: -1, row: -1 });
      translations.push({ col: +1, row: -1 });
    }

    for (let t of translations) {
      if (
        col + t.col >= 0 &&
        col + t.col < b.numCol &&
        row + t.row >= 0 &&
        row + t.row < b.numCol &&
        !b.hasPiece(col + t.col, row + t.row)
      ) {
        let to = { col: col + t.col, row: row + t.row };
        // We add an important weight to the move if this move allows the piece to become a king
        let weight = b.isKingRow(row + t.row, this._player) && !this._isKing ? 10 : 0;
        let move = new Move(from, to, weight, null, null);
        moves.push(move);
      }
    }

    return moves;
  }

  /**
   * Get the moves jumping other opponent's pieces in every direction (recursive move)
   * @param {Board} b - A board (by default the displayed board)
   */
  getJumpMoves(b = board) {
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
        if (b.contains(i, j)) {
          // If the next square is not empty and the piece placed on
          // it belongs to the opponent
          if (b.hasPiece(i, j) && b.getPiece(i, j).player !== instance._player) {
            let di = i - col;
            let dj = j - row;
            let destCol = col + 2 * di;
            let destRow = row + 2 * dj;
            let jumpedPiece = b.getPiece(i, j);
            // The destination square must be on the board
            if (b.contains(destCol, destRow)) {
              // If the destination square is empty and does not have been visited yet
              // (prevent to get the moves twice in the array of moves)
              if (!b.hasPiece(destCol, destRow) && !isAlreadyVisited(destCol, destRow)) {
                // We add an important weight to the move if this move allows the piece to become a king,
                // otherwise we just increment it
                let moveWeight =
                  b.isKingRow(destRow, instance._player) && !instance._isKing
                    ? weight + 10
                    : weight + 1;
                if (jumpedPiece.isKing) moveWeight += 10;
                let move = new Move(
                  { col: instance._col, row: instance._row }, // from
                  { col: destCol, row: destRow }, // to
                  moveWeight,
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

  /**
   * Get the basic move for a king : on diagonals in every direction until another piece
   * @param {Board} board - A board (by default the displayed board)
   */
  getKingBasicMoves(b = board) {
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
      while (b.contains(col, row) && !b.hasPiece(col, row)) {
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
   * @param {Board} board - A board (by default the displayed board)
   */
  getKingJumpMoves(b = board) {
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
        while (b.contains(i, j) && !b.hasPiece(i, j)) {
          slideSquares.push({ col: i, row: j });
          i += d.col;
          j += d.row;
        }

        // If the square is in the board
        if (b.contains(i, j)) {
          // If the square is not empty and the piece placed on it belongs to the opponent
          if (b.hasPiece(i, j) && b.getPiece(i, j).player !== instance._player) {
            let destCol = i + d.col;
            let destRow = j + d.row;
            let jumpedPiece = b.getPiece(i, j);
            // The destination square must be on the board
            if (b.contains(destCol, destRow)) {
              // If the destination square is empty and does not have been visited yet
              // (prevent to get the moves twice in the array of moves)
              if (
                !b.hasPiece(destCol, destRow) &&
                !isAlreadyVisited(destCol, destRow) &&
                !isSlideSquare(destCol, destRow)
              ) {
                // if the jumped piece is a king, we add an important weight to the move
                let moveWeight = jumpedPiece.isKing ? weight + 10 : weight + 1;
                let move = new Move(
                  { col: instance._col, row: instance._row }, // from
                  { col: destCol, row: destRow }, // to
                  moveWeight,
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
