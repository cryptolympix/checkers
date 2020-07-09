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
          if (j < this.numCol / 2 - floor(this.numCol / 15) - 1) {
            this.addPiece(i, j, players.AI);
          }
          // Player at the bottom
          if (j > this.numCol / 2 + floor(this.numCol / 15)) {
            this.addPiece(i, j, players.HUMAN);
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
   */
  getAllPieces(player) {
    if (player) {
      let result = [];
      for (let piece of this._pieces) {
        if (piece.player === player) {
          result.push(piece);
        }
      }
      return result;
    } else {
      return this._pieces;
    }
  }

  /**
   * Get the number of pieces
   * @param {String} player - The player to count the pieces
   */
  getNumberOfPieces(player) {
    let result = 0;
    for (let piece of this._pieces) {
      if (!player) {
        result++;
      } else {
        if (piece.player === player) result++;
      }
    }
    return result;
  }

  /**
   * Get the piece
   * @param {Number} col - The column to get the piece
   * @param {Number} row - The row to get the piece
   */
  getPiece(col, row) {
    if (this.contains(col, row)) {
      return this._tab[col][row];
    } else {
      return undefined;
    }
  }

  /**
   * Check if a piece is placed on a square
   * @param {Number} col - The column of the square
   * @param {Number} row - The row of the square
   */
  hasPiece(col, row) {
    if (this.contains(col, row)) {
      return this._tab[col][row] !== null && this._tab[col][row] !== undefined;
    } else {
      return false;
    }
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
        if (move.prevMove) {
          let steps = [];
          let current = move;

          // Update the tab
          this._tab[piece.col][piece.row] = null;
          this._tab[toCol][toRow] = piece;

          // Add the step to go the destination position
          while (current.prevMove) {
            steps.unshift({ col: current.to.col, row: current.to.row });
            current = current.prevMove;
          }
          steps.unshift({ col: current.to.col, row: current.to.row });
          steps.unshift({ col: piece.col, row: piece.row }); // Initial position

          // Animation
          piece.animate(steps);
        } else {
          // Update the tab
          this._tab[piece.col][piece.row] = null;
          this._tab[toCol][toRow] = piece;

          // Animation
          piece.animate([
            { col: piece.col, row: piece.row },
            { col: toCol, row: toRow },
          ]);
        }

        // If we add the piece on the opponent king row, it becomes a king
        if (this.isKingRow(toRow, piece.player)) {
          piece.isKing = true;
        }

        // Remove the jumped pieces from the moves
        while (move && move.isJumpingMove()) {
          this.removePiece(move.jumpedPiece);
          move = move.prevMove;
        }
        break;
      }
    }
  }

  /**
   * Add a piece on the board
   * @param {Number} col - The colum where we add the piece
   * @param {Number} row - The row where we add the piece
   * @param {String} player - One of the player
   */
  addPiece(col, row, player) {
    if (this.contains(col, row) && !this.hasPiece(col, row)) {
      let piece = new Piece(col, row, player);
      // If we add the piece on the opponent king row, it becomes a king
      if (this.isKingRow(row, player)) {
        piece.isKing = true;
      }
      this._pieces.push(piece);
      this._tab[col][row] = piece;
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
    piece = null;
  }

  /**
   * Check if the tab of the board contains a square with the colum and the row given
   * @param {Number} col - The column of a square
   * @param {Number} row - The row of a square
   */
  contains(col, row) {
    return col >= 0 && col < this._numCol && row >= 0 && row < this._numCol;
  }

  /**
   * Check if the given row if the king row for the player
   * @param {Number} row - The row to check
   * @param {String} player - A player
   */
  isKingRow(row, player) {
    if (player === players.HUMAN) {
      return row === 0;
    } else {
      return row === this._numCol - 1;
    }
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

  get pieces() {
    return this._pieces;
  }

  set pieces(pieces) {
    this._pieces = pieces;
  }

  get tab() {
    return this._tab;
  }

  set tab(tab) {
    this._tab = tab;
  }
}
