/**
 * Clone an object
 * @param {any} obj - An original object
 */
function clone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  let props = Object.getOwnPropertyDescriptors(obj);
  for (let prop in props) {
    props[prop].value = clone(props[prop].value);
  }
  return Object.create(Object.getPrototypeOf(obj), props);
}

/**
 * Return the number of pieces lost for a player
 * @param {Board} board - A clone board
 * @param {String} player - A player to get the number
 */
function getNumberOfLostPieces(board, player) {
  let numberOfInitialPiece = getNumberOfInitialPieces() / 2;
  return numberOfInitialPiece - getNumberOfPieces(player, board);
}

/**
 * Get the score of a move
 * @param {Board} board - A clone board
 * @param {Number} minimaxScore - The recursive score of the algorithm
 * @param {Move} move - The move to calculate the score
 * @param {Boolean} isMaximizingPlayer - Maximize or not the score
 */
function getScore(board, minimaxScore, move, isMaximizingPlayer) {
  let player = isMaximizingPlayer ? players.AI : players.HUMAN;
  // A move is better according of the weight of the move
  // The weight of a basic move is 0, and 1 if he allows piece to become a king
  // If the move jumped N pieces, the weight of the move i N. We add 1 for the king jumped.
  let weight = LEVEL === levels.EASY ? 0 : move.weight;

  // In the hard level, the AI try to minimize the pieces lost.
  let malus = LEVEL === levels.HARD ? getNumberOfLostPieces(board, player) : 0;

  // For the opponent we invert the variables
  if (!isMaximizingPlayer) {
    weight = -weight;
    malus = -malus;
  }

  return minimaxScore + weight - malus;
}

/*********************************************************************/

/**
 * Get the best move for the AI, depending of the game level selected
 * @param {Number} depth - The depth of the minimax tree
 */
function getBestMove(depth = MINIMAX_MAX_DEPTH) {
  let bestMoves = [];
  let bestScore = -Infinity;

  /**
   * Get the jumping moves for a player
   */
  function getJumpingMoves() {
    let result = [];
    for (let piece of getAllPieces(players.AI)) {
      let moves = getAvailableMoves(piece);
      for (let move of moves) {
        if (isJumpingMove(move)) result.push(move);
      }
    }
    return result;
  }

  function searchMove(moves) {
    for (let move of moves) {
      let boardClone = clone(board);
      let piece = boardClone[move.from.col][move.from.row];
      movePiece(piece, move, boardClone);
      let score = getScore(
        boardClone,
        alphabeta(boardClone, depth, -Infinity, Infinity, false),
        move,
        true
      );
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

  let jumpingMoves = getJumpingMoves();

  // If the AI can play a jumping move, he must play it
  if (jumpingMoves.length > 0) {
    searchMove(jumpingMoves);
  } else {
    let aiPieces = getAllPieces(players.AI);
    for (let piece of aiPieces) {
      searchMove(getAvailableMoves(piece));
    }
  }

  // If we find many moves, we select one of them
  if (bestMoves.length > 1) {
    let rand = floor(random() * bestMoves.length);
    return bestMoves[rand];
  } else {
    return bestMoves[0];
  }
}

/**
 * Alpha beta pruning algorithm
 */
function alphabeta(board, depth, alpha, beta, isMaximizingPlayer) {
  let result = checkWinner();
  if (depth === 0 || result) {
    if (result === players.HUMAN) return -100;
    if (result === players.AI) return 100;
    return getNumberOfPieces(players.AI, board) - getNumberOfPieces(players.HUMAN, board);
  }

  if (isMaximizingPlayer) {
    let bestScore = -Infinity;
    let aiPieces = getAllPieces(players.AI, board);
    for (let piece of aiPieces) {
      for (let move of getAvailableMoves(piece, board)) {
        let boardClone = clone(board);
        let pieceClone = clone(piece);
        movePiece(pieceClone, move, boardClone);
        let score = getScore(
          boardClone,
          alphabeta(boardClone, depth - 1, alpha, beta, false),
          move,
          true
        );
        boardClone = null;
        pieceClone = null;
        bestScore = max(score, bestScore);
        alpha = max(alpha, score);
        if (beta <= alpha) break;
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    let humanPieces = getAllPieces(players.HUMAN, board);
    for (let piece of humanPieces) {
      for (let move of getAvailableMoves(piece, board)) {
        let boardClone = clone(board);
        let pieceClone = clone(piece);
        movePiece(pieceClone, move, boardClone);
        let score = getScore(
          boardClone,
          alphabeta(boardClone, depth - 1, alpha, beta, true),
          move,
          false
        );
        boardClone = null;
        pieceClone = null;
        bestScore = min(score, bestScore);
        beta = min(beta, score);
        if (beta <= alpha) break;
      }
    }
    return bestScore;
  }
}
