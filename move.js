class Move {
  constructor(from, to, weight, prevMove) {
    this._from = from; // { col, row }
    this._to = to; // { col, row }
    this._weight = weight;
    this._prevMove = prevMove;
  }

  get from() {
    return this.from;
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

  get prevMove() {
    return this._prevMove;
  }

  set prevMove(prevMove) {
    this._prevMove = prevMove;
  }

  isJumpingMove() {
    let dcol = this._to.col - this._from.col;
    let drow = this._to.row - this._from.row;
    return abs(dcol) === 2 && abs(drow) === 2;
  }

  getJumpedPiece() {
    let dcol = this._to.col - this._from.col;
    let drow = this._to.row - this._from.row;
    if (abs(dcol) === 2 && abs(drow) === 2) {
      return board.getPiece(this._from.col + dcol / 2, this._from.row + drow / 2);
    }
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
}
