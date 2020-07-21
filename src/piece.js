/**
 * Piece object
 * @param {Number} col
 * @param {Number} row
 * @param {String} player
 */
function Piece(col, row, player) {
  this.col = col;
  this.row = row;
  this.player = player;
  this.color = player === players.AI ? AI_COLOR : HUMAN_COLOR;
  this.isKing = false;
  this.animations = [];
}

/**
 * Draw a piece on the board
 * @param {Piece} piece
 */
function drawPiece(piece) {
  let dim = BOARD_SQUARE_DIM;
  let centerX = piece.col * dim + dim / 2;
  let centerY = piece.row * dim + dim / 2;
  fill(piece.color);

  if (piece === pieceInAnimation) {
    let currentPosition = piece.animations[0];
    circle(currentPosition.x, currentPosition.y, (5 * dim) / 6);
    if (!piece.isKing) piece.animations.shift(); // We keep the position to display the image
    if (piece.animations.length === 0) {
      pieceInAnimation = null;
    }
  } else {
    circle(centerX, centerY, (5 * dim) / 6);
  }

  if (piece === pieceSelected) {
    fill(FOCUS_COLOR);
    rect(piece.col * dim, piece.row * dim, dim, dim);

    // To debug the moves
    if (SHOW_MOVES) {
      let moves = getAvailableMoves(piece);
      for (let move of moves) {
        fill(SHOW_COLOR);
        rect(move.to.col * dim, move.to.row * dim, dim, dim);

        if (SHOW_MOVES_WEIGHT) {
          fill('white');
          textFont('Roboto');
          textSize(18);
          textAlign(CENTER);
          text(move.weight, move.to.col * dim + dim / 2, move.to.row * dim + dim / 2);
        }
      }
    }
  }

  if (piece.isKing) {
    let imageDim = dim / 2;
    // If the piece is in animation
    if (piece.animations.length > 0) {
      let currentPosition = piece.animations[0];
      image(
        crownImg,
        currentPosition.x - dim / 4,
        currentPosition.y - dim / 4,
        imageDim,
        imageDim
      );
      piece.animations.shift();
      if (piece.animations.length === 0) {
        pieceInAnimation = null;
      }
    } else {
      image(crownImg, centerX - imageDim / 2, centerY - imageDim / 2, imageDim, imageDim);
    }
  }
}

/**
 * Create an animation for the piece
 * @param {Piece} piece - The piece to animate
 * @param {Array<{Number, Number}>} steps - An array of step to go to a position
 */
function createAnimation(piece, steps) {
  // At least an initial position and a destination
  if (steps.length > 1) {
    pieceInAnimation = piece;
    let frameCount = 10 * steps.length;
    let dim = BOARD_SQUARE_DIM;

    for (let i = 1; i < steps.length; i++) {
      let prevPosition = steps[i - 1];
      let nextPosition = steps[i];
      let initialMoveX = prevPosition.col * dim + dim / 2; // Center X
      let initialMoveY = prevPosition.row * dim + dim / 2; // Center Y

      let dx = (nextPosition.col - prevPosition.col) * dim;
      let dy = (nextPosition.row - prevPosition.row) * dim;
      let stepX = dx / frameCount;
      let stepY = dy / frameCount;

      for (let a = 0; a <= frameCount; a++) {
        let x = initialMoveX + a * stepX;
        let y = initialMoveY + a * stepY;
        piece.animations.push({ x, y });
      }
    }

    // Set the final position col and row
    let finalStep = steps[steps.length - 1];
    piece.col = finalStep.col;
    piece.row = finalStep.row;
  }
}

/**
 * Move a piece to a new position
 * @param {Piece} piece - The piece to move
 * @param {Move} move - The move to play
 * @param {Array<Array>} b - A board (by default the displayed board)
 */
function movePiece(piece, move, b = board) {
  if (piece.col !== move.from.col && piece.row !== move.from.row) {
    return;
  }

  let toCol = move.to.col;
  let toRow = move.to.row;
  let moves = getAvailableMoves(piece, b);

  // Check if the square pressed is an available move
  for (let move of moves) {
    if (move.to.col === toCol && move.to.row === toRow) {
      if (move.prevMove) {
        let steps = [];
        let current = move;

        // Update the tab
        b[piece.col][piece.row] = null;
        b[toCol][toRow] = piece;

        // Add the step to go the destination position
        while (current.prevMove) {
          steps.unshift({ col: current.to.col, row: current.to.row });
          current = current.prevMove;
        }
        steps.unshift({ col: current.to.col, row: current.to.row });
        steps.unshift({ col: piece.col, row: piece.row }); // Initial position

        // Animation
        createAnimation(piece, steps);
      } else {
        // Update the tab
        b[piece.col][piece.row] = null;
        b[toCol][toRow] = piece;

        // Animation
        createAnimation(piece, [
          { col: piece.col, row: piece.row },
          { col: toCol, row: toRow },
        ]);
      }

      // If we add the piece on the opponent king row, it becomes a king
      if (isKingRow(toRow, piece.player)) {
        piece.isKing = true;
      }

      // Remove the jumped pieces from the moves
      while (move && isJumpingMove(move)) {
        let jumpedPiece = move.jumpedPiece;
        b[jumpedPiece.col][jumpedPiece.row] = null;
        jumpedPiece = null;
        move = move.prevMove;
      }
      break;
    }
  }
}

/**
 * Get all the possible moves from the piece
 * @param {Piece} piece - A piece to get the available moves
 * @param {Board} b - A board (by default the displayed board)
 */
function getAvailableMoves(piece, b = board) {
  if (!piece.isKing) {
    let basicMoves = getBasicMoves(piece, b);
    let jumpMoves = getJumpMoves(piece, b);
    return basicMoves.concat(jumpMoves);
  } else {
    let basicMoves = getKingBasicMoves(piece, b);
    let jumpMoves = getKingJumpMoves(piece, b);
    return basicMoves.concat(jumpMoves);
  }
}

/**
 * Get the moves to a next dark square
 * @param {Piece} piece - A piece
 * @param {Board} b - A board (by default the displayed board)
 */
function getBasicMoves(piece, b = board) {
  let moves = [];
  let from = { col: piece.col, row: piece.row };
  let directions = [];

  // The moves are down of the piece
  if (piece.player === players.AI) {
    directions.push({ col: -1, row: +1 });
    directions.push({ col: +1, row: +1 });
  }
  // The moves are up of the piece
  if (piece.player === players.HUMAN) {
    directions.push({ col: -1, row: -1 });
    directions.push({ col: +1, row: -1 });
  }

  for (let d of directions) {
    if (
      contains(from.col + d.col, from.row + d.row) &&
      !b[from.col + d.col][from.row + d.row]
    ) {
      let to = { col: from.col + d.col, row: from.row + d.row };
      // We add more weight to the move if this move allows the piece to become a king
      let weight = isKingRow(from.row + d.row, piece.player) && !piece.isKing ? 1 : 0;
      let move = new Move(from, to, weight, null, null);
      moves.push(move);
    }
  }

  return moves;
}

/**
 * Get the moves jumping other opponent's pieces in every direction (recursive move)
 * @param {Piece} piece - A piece
 * @param {Board} b - A board (by default the displayed board)
 */
function getJumpMoves(piece, b = board) {
  let moves = [];
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
      if (contains(i, j)) {
        // If the next square is not empty and the piece placed on
        // it belongs to the opponent
        if (b[i][j] && b[i][j].player !== piece.player) {
          let di = i - col;
          let dj = j - row;
          let destCol = col + 2 * di;
          let destRow = row + 2 * dj;
          let jumpedPiece = b[i][j];
          // The destination square must be on the board
          if (contains(destCol, destRow)) {
            // If the destination square is empty and does not have been visited yet
            // (prevent to get the moves twice in the array of moves)
            if (!b[destCol][destRow] && !isAlreadyVisited(destCol, destRow)) {
              // We add more weight to the move if this move allows the piece to become a king,
              // otherwise we just increment it
              let moveWeight =
                isKingRow(destRow, piece.player) && !piece.isKing
                  ? weight + 2
                  : weight + 1;
              if (jumpedPiece.isKing) moveWeight += 2;
              let move = new Move(
                { col: piece.col, row: piece.row }, // from
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

  searchMoves(piece.col, piece.row, 0, null);
  return moves;
}

/**
 * Get the basic move for a king : on diagonals in every direction until another piece
 * @param {Piece} piece - A piece
 * @param {Board} board - A board (by default the displayed board)
 */
function getKingBasicMoves(piece, b = board) {
  let moves = [];
  let directions = [
    { col: -1, row: -1 },
    { col: +1, row: -1 },
    { col: -1, row: +1 },
    { col: +1, row: +1 },
  ];

  for (let d of directions) {
    let col = piece.col + d.col;
    let row = piece.row + d.row;
    while (contains(col, row) && !b[col][row]) {
      let move = new Move(
        { col: piece.col, row: piece.row },
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
 * @param {Piece} piece - A piece
 * @param {Board} board - A board (by default the displayed board)
 */
function getKingJumpMoves(piece, b = board) {
  let moves = [];
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
      while (contains(i, j) && !b[i][j]) {
        slideSquares.push({ col: i, row: j });
        i += d.col;
        j += d.row;
      }

      // If the square is in the board
      if (contains(i, j)) {
        // If the square is not empty and the piece placed on it belongs to the opponent
        if (b[i][j] && b[i][j].player !== piece.player) {
          let destCol = i + d.col;
          let destRow = j + d.row;
          let jumpedPiece = b[i][j];
          // The destination square must be on the board
          if (contains(destCol, destRow)) {
            // If the destination square is empty and does not have been visited yet
            // (prevent to get the moves twice in the array of moves)
            if (
              !b[destCol][destRow] &&
              !isAlreadyVisited(destCol, destRow) &&
              !isSlideSquare(destCol, destRow)
            ) {
              // if the jumped piece is a king, we add an important weight to the move
              let moveWeight = jumpedPiece.isKing ? weight + 2 : weight + 1;
              let move = new Move(
                { col: piece.col, row: piece.row }, // from
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

  searchMoves(piece.col, piece.row, 0, null);
  return moves;
}
