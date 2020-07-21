/**
 * Move object
 * @param {{ col: Number, row: Numbe r}} from - The initial position of the move
 * @param {{ col: Number, row: Number }} to - The destination of the move
 * @param {Number} weight - The weight of the move, more the weight is great, more the weight is good
 * @param {Piece} jumpedPiece - The piece jumped by the move, if it does
 * @param {Move} prevMove - The previous move if a move is the sum of some little moves
 */
function Move(from, to, weight, jumpedPiece, prevMove) {
  this.from = from;
  this.to = to;
  this.weight = weight;
  this.jumpedPiece = jumpedPiece;
  this.prevMove = prevMove;
}

/**
 * Return true if the move jumped a piece
 * @param {Move} move
 */
function isJumpingMove(move) {
  return move.jumpedPiece !== null && move.weight > 0;
}

/**
 * Return true if the move is required
 * @param {Move} move
 */
function isRequiredMove(move) {
  let {
    from: { fromCol, fromRow },
    row: { toCol, toRow },
  } = move;
  for (let move of requiredMoves) {
    if (
      move.from.col === fromCol &&
      move.from.row === fromRow &&
      move.to.col === toCol &&
      move.to.row === toRow
    )
      return true;
  }
  return false;
}
