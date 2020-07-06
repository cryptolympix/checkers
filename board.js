let DARK_SQUARE_COLOR = 'black';
let LIGHT_SQUARE_COLOR = 'white';

class Board {
  /**
   * @param {Number} pixelDim - The dimension in pixels
   * @param {Number} numCol - The number of column
   * @param {Array<Piece>} pieces - The current pieces on the board
   */
  constructor(pixelDim, numCol) {
    this._pixelDim = pixelDim;
    this._numCol = numCol;
    this._squareDim = pixelDim / numCol;
    this._pieces = [];
    this._tab = [];
    this.reset();
  }

  reset() {
    this._tab = new Array(this._numCol);
    for (let i = 0; i < this._numCol; i++) {
      this._tab[i] = new Array(this._numCol);
    }

    for (let j = 0; j < this._numCol; j++) {
      for (let i = 0; i < this._numCol; i++) {
        // Only on the black cases
        if (i % 2 === j % 2) {
          // AI at the top
          if (j < 3) {
            let p = new Piece(i, j, players.AI);
            this._pieces.push(p);
            this._tab[i][j] = p;
          }
          // Player at the bottom
          if (j > this._numCol - 4) {
            let p = new Piece(i, j, players.HUMAN);
            this._pieces.push(p);
            this._tab[i][j] = p;
          }
        }
      }
    }
  }

  draw() {
    // Draw the board
    let dim = this._squareDim;
    for (let j = 0; j < this._numCol; j++) {
      for (let i = 0; i < this._numCol; i++) {
        fill(i % 2 === j % 2 ? DARK_SQUARE_COLOR : LIGHT_SQUARE_COLOR);
        rect(i * dim, j * dim, dim, dim);
      }
    }

    // Draw the pieces
    for (let p of this._pieces) {
      p.draw();
    }
  }

  /**
   * Get all the pieces on the board
   */
  getAllPieces() {
    return this._pieces;
  }

  /**
   * Get the piece
   * @param {Number} col - The column to get the piece
   * @param {Number} row - The row to get the piece
   */
  getPiece(col, row) {
    return this._tab[col][row];
  }

  /**
   * Check if a piece is placed on a square
   * @param {Number} col - The column of the square
   * @param {Number} row - The row of the square
   */
  hasPiece(col, row) {
    return this._tab[col][row] !== null && this._tab[col][row] !== undefined;
  }

  /**
   * Move a piece to a new position
   * @param {Piece} piece - The piece to move
   * @param {Number} toCol - The destination column
   * @param {Number} toRow - The destination row
   */
  movePiece(piece, toCol, toRow) {
    let moves = piece.getAvailableMoves();
    // Check if the square pressed is an available move
    for (let move of moves) {
      if (move.to.col === toCol && move.to.row === toRow) {
        // Update the tab
        this._tab[piece.col][piece.row] = null;
        this._tab[toCol][toRow] = piece;

        // Update the data of the piece
        piece.col = toCol;
        piece.row = toRow;

        // Remove the jumped pieces from the moves
        while (move && move.isJumpingMove()) {
          this.removePiece(move.getJumpedPiece());
          move = move.prevMove;
        }
        break;
      }
    }
  }

  /**
   * Remove a piece from the board and the array of pieces
   * @param {Piece} piece - The piece to remove
   */
  removePiece(piece) {
    for (let i = 0; i < this._pieces.length; i++) {
      if (this._pieces[i].col === piece.col && this._pieces[i].row === piece.row) {
        this._pieces.splice(i, 1);
        break;
      }
    }
    this._tab[piece.col][piece.row] = null;
  }

  /**
   * Check if the tab of the board contains a square with the colum and the row given
   * @param {Number} col - The column of a square
   * @param {Number} row - The row of a square
   */
  contains(col, row) {
    return col >= 0 && col < this._numCol && row >= 0 && row < this._numCol;
  }

  get pixelDim() {
    return this._pixelDim;
  }

  set pixelDim(pixelDim) {
    this._pixelDim = pixelDim;
  }

  get numCol() {
    return this._numCol;
  }

  set numCol(numCol) {
    this._numCol = numCol;
  }

  get squareDim() {
    return this._squareDim;
  }

  set squareDim(squareDim) {
    this._squareDim = squareDim;
  }

  get tab() {
    return this._tab;
  }

  set tab(tab) {
    this._tab = tab;
  }
}
