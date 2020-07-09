let CANVAS_DIM = 800;
if (window.innerWidth <= 800) CANVAS_DIM = (9 * window.innerWidth) / 10;

let BOARD_COLUMN = 10;

let SHOW_MOVES = false;
let SHOW_MOVES_WEIGHT = false;

let levels = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' };
let LEVEL = levels.MEDIUM;
let MINIMAX_MAX_DEPTH = 2;

let AI_COLOR = '#DEB887';
let HUMAN_COLOR = '#8B0000';
let FOCUS_COLOR = '#6666';
let INFO_COLOR = '#4682B4';
let SHOW_COLOR = '#3CB371';
let DARK_SQUARE_COLOR = 'black';
let LIGHT_SQUARE_COLOR = 'white';

let infoView;
let helperButton;
let levelButton;
let resetButton;

let gameMsg = "It's your turn";
let gameMsgColor = HUMAN_COLOR;

let end;
let board;
let players = { HUMAN: 'human', AI: 'ai' };
let currentPlayer;

let pieceSelected = null;
let pieceInAnimation = null;
let requiredMoves = [];

function setup() {
  infoView = createDiv();
  createCanvas(CANVAS_DIM, CANVAS_DIM);

  helperButton = createButton();
  helperButton.mousePressed(() => (SHOW_MOVES = !SHOW_MOVES));
  levelButton = createSelect();
  levelButton.option(levels.EASY);
  levelButton.option(levels.MEDIUM);
  levelButton.option(levels.HARD);
  levelButton.changed(onLevelChange);
  resetButton = createButton();
  resetButton.mousePressed(() => reset());

  reset();
}

function reset() {
  board = new Board(CANVAS_DIM, BOARD_COLUMN);
  currentPlayer = players.HUMAN;
  end = false;
  loop();
}

function draw() {
  background(255);

  drawGameInfo();
  board.draw();
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
        <p class="count">${board.getNumberOfPieces(players.HUMAN)}</p>
      </div>
      <div class="count-block">
        <span class="circle brown"></span>
        <p class="count">${board.getNumberOfPieces(players.AI)}</p>
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

  if (window.innerWidth <= 800) {
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
  if (
    end ||
    mouseX < 0 ||
    mouseX > board.pixelDim ||
    mouseY < 0 ||
    mouseY > board.pixelDim
  )
    return;

  /**
   * Find a mose specifying a destination
   * @param {Number} toCol - The column of the destination
   * @param {Number} toRow - The row of the destination
   * @param {Number} moves - An array of moves
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
    for (let piece of board.getAllPieces(players.HUMAN)) {
      let moves = piece.getAvailableMoves();
      for (let move of moves) {
        if (move.isJumpingMove()) result.push(move);
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
    let i = floor(mouseX / board.squareDim);
    let j = floor(mouseY / board.squareDim);

    requiredMoves = [];

    if (board.hasPiece(i, j)) {
      // If we don't have selected a piece to move
      if (!pieceSelected) {
        if (board.getPiece(i, j).player === players.HUMAN)
          pieceSelected = board.getPiece(i, j);
      }
      // If we change the selected piece to move
      else {
        let piece = board.getPiece(i, j);
        if (piece.player === players.HUMAN) {
          pieceSelected = board.getPiece(i, j);
        } else {
          pieceSelected = null;
        }
      }
    }
    // If we have selected a piece and press on a free case
    else if (pieceSelected) {
      let moves = pieceSelected.getAvailableMoves();
      let wishedMove = findMove(i, j, moves);

      if (!wishedMove) {
        pieceSelected = null;
        return;
      }

      if (wishedMove.isJumpingMove()) {
        board.movePiece(pieceSelected, i, j);
        pieceSelected = null;
        let result = checkWinner();
        if (result) {
          end = true;
        } else {
          currentPlayer = players.AI;
        }
      } else {
        // If the player wants to play a basic move but a jumping move
        // is available, he must plays it instead of the basic one.
        if (canPlayJumpingMove()) {
          // Add the jumping moves to the required moves
          for (let move of getJumpingMoves()) {
            if (move.isJumpingMove()) {
              requiredMoves.push(move);
            }
          }
        } else {
          board.movePiece(pieceSelected, i, j);
          pieceSelected = null;
          let result = checkWinner();
          if (result) {
            end = true;
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
    let pieces = board.getAllPieces(player);
    for (let piece of pieces) {
      total += piece.getAvailableMoves().length;
    }
    return total > 0;
  }

  if (currentPlayer === players.AI) {
    if (hasAvailableMove(players.AI)) {
      let bestMove = getBestMove();
      let pieceToMove = board.getPiece(bestMove.from.col, bestMove.from.row);
      board.movePiece(pieceToMove, bestMove.to.col, bestMove.to.row);
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
  let piecePlayerCount = [0, 0];

  for (let p of board.getAllPieces()) {
    if (p.player === players.HUMAN) piecePlayerCount[0]++;
    if (p.player === players.AI) piecePlayerCount[1]++;
  }

  if (piecePlayerCount[0] === 0) winner = players.AI;
  if (piecePlayerCount[1] === 0) winner = players.HUMAN;

  if (winner) {
    gameMsg =
      winner === players.HUMAN ? 'Congratulation !' : 'AI is too strong for you...';
    gameMsgColor = winner === players.HUMAN ? 'green' : 'firebrick';
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
