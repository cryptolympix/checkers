function clone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  let props = Object.getOwnPropertyDescriptors(obj);
  for (let prop in props) {
    props[prop].value = clone(props[prop].value);
  }
  return Object.create(Object.getPrototypeOf(obj), props);
}

function getBestMove() {
  let bestMoves = [];
  let bestScore = -Infinity;

  /**
   * Get the jumping moves for a player
   */
  function getJumpingMoves() {
    let result = [];
    for (let piece of board.getAllPieces(players.AI)) {
      let moves = piece.getAvailableMoves();
      for (let move of moves) {
        if (move.isJumpingMove()) result.push(move);
      }
    }
    return result;
  }

  let jumpingMoves = getJumpingMoves();

  if (jumpingMoves.length > 0) {
    for (let move of jumpingMoves) {
      let boardClone = clone(board);
      let piece = boardClone.getPiece(move.from.col, move.from.row);
      boardClone.movePiece(piece, move.to.col, move.to.row);
      let weight = LEVEL === levels.EASY ? 0 : move.weight;
      let score =
        minimax(boardClone, MINIMAX_MAX_DEPTH, -Infinity, Infinity, false) + weight;
      boardClone = null;
      if (score > bestScore) {
        bestMoves = [];
        bestScore = score;
      }
      if (score === bestScore) {
        bestMoves.push(move);
      }
    }
  } else {
    let aiPieces = board.getAllPieces(players.AI);
    for (let piece of aiPieces) {
      for (let move of piece.getAvailableMoves()) {
        let boardClone = clone(board);
        let pieceClone = clone(piece);
        boardClone.movePiece(pieceClone, move.to.col, move.to.row);
        let weight = LEVEL === levels.EASY ? 0 : move.weight;
        let score =
          minimax(boardClone, MINIMAX_MAX_DEPTH, -Infinity, Infinity, false) + weight;
        boardClone = null;
        if (score > bestScore) {
          bestMoves = [];
          bestScore = score;
        }
        if (score === bestScore) {
          bestMoves.push(move);
        }
      }
    }
  }

  if (bestMoves.length > 1) {
    let rand = floor(random() * bestMoves.length);
    return bestMoves[rand];
  } else {
    return bestMoves[0];
  }
}

function minimax(board, depth, alpha, beta, isMaximizingPlayer) {
  let result = checkWinner();
  if (depth === 0 || result) {
    if (result === players.HUMAN) return -100;
    if (result === players.AI) return 100;
    return board.getNumberOfPieces(players.AI) - board.getNumberOfPieces(players.HUMAN);
  }

  if (isMaximizingPlayer) {
    let bestScore = -Infinity;
    let aiPieces = board.getAllPieces(players.AI);
    for (let piece of aiPieces) {
      for (let move of piece.getAvailableMoves(board)) {
        let boardClone = clone(board);
        let pieceClone = clone(piece);
        boardClone.movePiece(pieceClone, move.to.col, move.to.row);
        let weight = LEVEL === levels.EASY ? 0 : move.weight;
        let score = minimax(boardClone, depth - 1, alpha, beta, false) + weight;
        boardClone = null;
        bestScore = max(score, bestScore);
        alpha = max(alpha, score);
        if (beta <= alpha) break;
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    let humanPieces = board.getAllPieces(players.HUMAN);
    for (let piece of humanPieces) {
      for (let move of piece.getAvailableMoves(board)) {
        let boardClone = clone(board);
        let pieceClone = clone(piece);
        boardClone.movePiece(pieceClone, move.to.col, move.to.row);
        let weight = LEVEL === levels.EASY ? 0 : move.weight;
        let score = minimax(boardClone, depth - 1, alpha, beta, true) - weight;
        boardClone = null;
        bestScore = min(score, bestScore);
        beta = min(beta, score);
        if (beta <= alpha) break;
      }
    }
    return bestScore;
  }
}
