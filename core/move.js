class Move {
  /**
   * Constructor
   * @param {*} from - The initial position of the move
   * @param {*} to - The destination of the move
   * @param {*} weight - The weight of the move, more the weight is great, more the weight is good
   * @param {*} jumpedPiece - The piece jumped by the move, if it does
   * @param {*} prevMove - The previous move if a move is the sum of some little moves
   */
  constructor(from, to, weight, jumpedPiece, prevMove) {
    this._from = from; // { col, row }
    this._to = to; // { col, row }
    this._weight = weight;
    this._jumpedPiece = jumpedPiece;
    this._prevMove = prevMove;
  }

  isJumpingMove() {
    return this._jumpedPiece !== null;
  }

  isRequiredMove() {
    for (let move of requiredMoves) {
      if (
        move.from.col === this._from.col &&
        move.from.row === this._from.row &&
        move.to.col === this._to.col &&
        move.to.row === this._to.row
      )
        return true;
    }
    return false;
  }

  get from() {
    return this._from;
  }

  set from(from) {
    this._from = from;
  }

  get to() {
    return this._to;
  }

  set to(to) {
    this._to = to;
  }

  get weight() {
    return this._weight;
  }

  set weight(weight) {
    this._weight = weight;
  }

  get jumpedPiece() {
    return this._jumpedPiece;
  }

  set jumpedPiece(jumpedPiece) {
    this._jumpedPiece = jumpedPiece;
  }

  get prevMove() {
    return this._prevMove;
  }

  set prevMove(prevMove) {
    this._prevMove = prevMove;
  }
}
