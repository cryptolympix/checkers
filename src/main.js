let CANVAS_DIM = 800;
if (window.innerWidth <= 800) CANVAS_DIM = (9 * window.innerWidth) / 10;

let SHOW_MOVES = false;
let SHOW_MOVES_WEIGHT = false;

// Level of the game
let levels = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' };
let LEVEL = levels.MEDIUM;
let MINIMAX_MAX_DEPTH = 2;

// Board
let board;
let BOARD_NUM_COL = 10;
let BOARD_PXL_DIM = CANVAS_DIM;
let BOARD_SQUARE_DIM = CANVAS_DIM / BOARD_NUM_COL;

// Colors
let AI_COLOR = '#DEB887';
let HUMAN_COLOR = '#8B0000';
let FOCUS_COLOR = '#6666';
let INFO_COLOR = '#4682B4';
let SHOW_COLOR = '#3CB371';
let DARK_SQUARE_COLOR = 'black';
let LIGHT_SQUARE_COLOR = 'white';

// Containers
let infoView;
let helperButton;
let levelButton;
let resetButton;

// Assets
let crownImg;

// Messages
let gameMsg;
let gameMsgColor;

// Gameplay
let end;
let requiredMoves = [];

// Player
let players = { HUMAN: 'human', AI: 'ai' };
let currentPlayer;

// Piece
let pieceSelected = null;
let pieceInAnimation = null;

// ================================================================= //

function preload() {
  crownImg = loadImage('assets/crown.svg');
}

function setup() {
  infoView = createDiv();
  createCanvas(CANVAS_DIM, CANVAS_DIM);
  helperButton = createButton();
  levelButton = createSelect();
  resetButton = createButton();

  levelButton.option(levels.EASY);
  levelButton.option(levels.MEDIUM);
  levelButton.option(levels.HARD);
  levelButton.changed(onLevelChange);

  initEventListeners();
  reset();
}

function reset() {
  loop();
  board = initBoard(BOARD_NUM_COL);
  end = false;
  currentPlayer = players.HUMAN;
  gameMsg = "It's your turn";
  gameMsgColor = HUMAN_COLOR;
}

function initEventListeners() {
  helperButton.mousePressed(() => {
    helperButton.style('opacity', 0.7);
    SHOW_MOVES = !SHOW_MOVES;
  });
  resetButton.mousePressed(() => {
    reset();
    resetButton.style('opacity', 0.7);
  });
  helperButton.mouseReleased(() => helperButton.style('opacity', 1));
  resetButton.mouseReleased(() => resetButton.style('opacity', 1));
}

function draw() {
  background(255);

  drawGameInfo();
  drawBoard();
  drawButtons();

  if (end && !pieceInAnimation) {
    noLoop();
  }

  // The AI plays when it's his turn and when the move animation of the human is end
  if (currentPlayer === players.AI && !pieceInAnimation) {
    gameMsg = 'AI is searching a move...';
    gameMsgColor = AI_COLOR;
    setTimeout(() => {
      AI();
    }, 500);
  }
}

function drawGameInfo() {
  infoView.html(
    `<div class="info-block">
      <div class="count-block">
        <span class="circle red"></span>
        <p class="count">${getNumberOfPieces(players.HUMAN)}</p>
      </div>
      <div class="count-block">
        <span class="circle brown"></span>
        <p class="count">${getNumberOfPieces(players.AI)}</p>
      </div>
    </div>
    <div class="info-block">
      <p class="game-msg" style="color:${gameMsgColor}">${gameMsg}</p>
    </div>`
  );
  infoView.id('info');
}

function drawButtons() {
  helperButton.html(`<span>${SHOW_MOVES ? 'Hide moves' : 'Show moves'}</span>`);
  resetButton.html(`<span>Reset</span>`);
  helperButton.class('button');
  levelButton.class('button');
  resetButton.class('button');

  if (window.innerWidth <= 600) {
    let width = (4 * CANVAS_DIM) / 10;
    helperButton.size(width);
    helperButton.position(0, 0, 'relative');
    levelButton.size(width);
    levelButton.position(0, 0, 'relative');
    resetButton.size(width);
    resetButton.position(0, 0, 'relative');
  } else {
    let width = (3 * CANVAS_DIM) / 10;
    helperButton.size(width);
    helperButton.position(-CANVAS_DIM / 2 + width / 2, 0, 'relative');
    levelButton.size(width);
    levelButton.position(0, -51, 'relative');
    resetButton.size(width);
    resetButton.position(CANVAS_DIM / 2 - width / 2, -101, 'relative');
  }
}

function mouseReleased() {
  if (end) return;
  if (mouseX < 0 || mouseX > BOARD_PXL_DIM || mouseY < 0 || mouseY > BOARD_PXL_DIM) {
    if (pieceSelected) pieceSelected = null;
    return;
  }

  /**
   * Find a mose specifying a destination
   * @param {Number} toCol - The column of the destination
   * @param {Number} toRow - The row of the destination
   * @param {Array<Move>} moves - An array of moves
   */
  function findMove(toCol, toRow, moves) {
    for (let move of moves) {
      if (move.to.col === toCol && move.to.row === toRow) {
        return move;
      }
    }
  }

  /**
   * Get the jumping moves for a player
   */
  function getJumpingMoves() {
    let result = [];
    for (let piece of getAllPieces(players.HUMAN)) {
      let moves = getAvailableMoves(piece);
      for (let move of moves) {
        if (isJumpingMove(move)) result.push(move);
      }
    }
    return result;
  }

  /**
   * Return true if the player can play a jumping move
   */
  function canPlayJumpingMove() {
    return getJumpingMoves().length > 0;
  }

  if (currentPlayer === players.HUMAN) {
    let i = floor(mouseX / BOARD_SQUARE_DIM);
    let j = floor(mouseY / BOARD_SQUARE_DIM);

    requiredMoves = [];

    if (board[i][j]) {
      // If we don't have selected a piece to move
      if (!pieceSelected) {
        if (board[i][j].player === players.HUMAN) {
          pieceSelected = board[i][j];
        }
      }
      // If we change the selected piece to move
      else {
        let piece = board[i][j];
        if (piece.player === players.HUMAN) {
          pieceSelected = board[i][j];
        } else {
          pieceSelected = null;
        }
      }
    }
    // If we have selected a piece and press on a free case
    else if (pieceSelected) {
      let moves = getAvailableMoves(pieceSelected);
      let wishedMove = findMove(i, j, moves);

      if (!wishedMove) {
        pieceSelected = null;
        return;
      }

      if (isJumpingMove(wishedMove)) {
        movePiece(pieceSelected, wishedMove);
        pieceSelected = null;
        let result = checkWinner();
        if (result) {
          end = true;
          currentPlayer = null;
        } else {
          currentPlayer = players.AI;
        }
      } else {
        // If the player wants to play a basic move but a jumping move
        // is available, he must plays it instead of the basic one.
        if (canPlayJumpingMove()) {
          // Add the jumping moves to the required moves
          for (let move of getJumpingMoves()) {
            if (isJumpingMove(move)) {
              requiredMoves.push(move);
            }
          }
        } else {
          movePiece(pieceSelected, wishedMove);
          pieceSelected = null;
          let result = checkWinner();
          if (result) {
            end = true;
            currentPlayer = null;
          } else {
            currentPlayer = players.AI;
          }
        }
      }
    }
  }
}

function AI() {
  /**
   * Check if the player can play
   * @param {String} player
   */
  function hasAvailableMove(player) {
    let total = 0;
    let pieces = getAllPieces(player);
    for (let piece of pieces) {
      total += getAvailableMoves(piece).length;
    }
    return total > 0;
  }

  if (currentPlayer === players.AI) {
    if (hasAvailableMove(players.AI)) {
      let bestMove = getBestMove();
      let pieceToMove = board[bestMove.from.col][bestMove.from.row];
      movePiece(pieceToMove, bestMove);
      let result = checkWinner();
      if (result) {
        currentPlayer = null;
        end = true;
      } else {
        if (hasAvailableMove(players.HUMAN)) {
          currentPlayer = players.HUMAN;
          gameMsg = "It's your turn";
          gameMsgColor = HUMAN_COLOR;
        } else {
          end = true;
          currentPlayer = null;
          gameMsg = 'You can no longer play';
          gameMsgColor = INFO_COLOR;
        }
      }
    }
    // Ai cannot plays anymore because there are no available moves
    else {
      end = true;
      currentPlayer = null;
      gameMsg = 'The AI can no longer play';
      gameMsgColor = INFO_COLOR;
    }
  }
}

function checkWinner() {
  let winner = null;

  if (getNumberOfPieces(players.AI) === 0) {
    winner = players.HUMAN;
    gameMsg = 'Congratulation !';
    gameMsgColor = 'green';
  }

  if (getNumberOfPieces(players.HUMAN) === 0) {
    winner = players.AI;
    gameMsg = 'AI is too strong for you...';
    gameMsgColor = 'firebrick';
  }

  return winner;
}

function onLevelChange() {
  let level = levelButton.value();
  switch (level) {
    case levels.EASY:
      MINIMAX_MAX_DEPTH = 1;
      break;
    case levels.MEDIUM:
      MINIMAX_MAX_DEPTH = 2;
      break;
    case levels.HARD:
      MINIMAX_MAX_DEPTH = 3;
      break;
    default:
      break;
  }
}
